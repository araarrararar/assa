import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import mongoose from "mongoose";
import RedisCache from "../../utils/RedisCache";
import { getRedisInstance } from "../../utils/RedisManager";
import { criticalPrefix } from "../../json/en.json";
import log from "../../utils/log";
import { logError } from "../../utils/ErrorLogger";
import { ResponseStatus } from "../../utils/ResponseStatus";
import { UserPromptModel } from "../../models/Thread";
import { constants } from "../../utils/Constants";
import 'dotenv/config';


const CHANNEL_NAME_TO_PUBLISH_SSE_MESSAGES = "sse-messages";
const CHANNEL_NAME_TO_PUBLISH_SOCKET_MESSAGES = "socket-messages";
let redisClientToPublishMessages;
let redisClientToSubscribeChannel;
const tableRegex = /<<TABULAR DATA>>\s+(\S+)/g;

const maxRegenerationAttempts = constants.maxRegenerationAttempts;

const createConnectionAndSubscribeRedis = async () => {
  try {
    log("createConnectionAndSubscribeRedis", "", "create pub/sub connection");

    if (!redisClientToSubscribeChannel) {
      redisClientToPublishMessages = await getRedisInstance();
      redisClientToSubscribeChannel = await getRedisInstance();
    }

    redisClientToSubscribeChannel.on("connect", () => {
      log(
        "createConnectionAndSubscribeRedis",
        "sub",
        "Connected to Redis for subscription"
      );
    });

    redisClientToSubscribeChannel.on("error", (error) => {
      logError(
        ResponseStatus.INTERNAL_SERVER_ERROR,
        `${criticalPrefix} ${error.message}`,
        "redisClientToSubscribeChannel"
      );
      console.error("Error connecting to Redis for subscription:", error);
    });

    redisClientToPublishMessages.on("connect", () => {
      log(
        "createConnectionAndSubscribeRedis",
        "sub",
        "Connected to Redis for publishing"
      );
    });

    redisClientToPublishMessages.on("error", (error) => {
      logError(
        ResponseStatus.INTERNAL_SERVER_ERROR,
        `${criticalPrefix} ${error.message}`,
        "redisClientToPublishMessages"
      );
      console.error("Error connecting to Redis for publishing:", error);
    });

    if (process.env.STAGE === "local") {
      redisClientToSubscribeChannel.subscribe(
        CHANNEL_NAME_TO_PUBLISH_SSE_MESSAGES,
        onReceiveMessageFromRedis
      );
    } else {
      redisClientToSubscribeChannel.v4.subscribe(
        CHANNEL_NAME_TO_PUBLISH_SSE_MESSAGES,
        onReceiveMessageFromRedis
      );
      redisClientToSubscribeChannel.v4.subscribe(
        CHANNEL_NAME_TO_PUBLISH_SOCKET_MESSAGES,
        onSockerMessageRevice
      );
    }
  } catch (error) {
    logError(
      ResponseStatus.INTERNAL_SERVER_ERROR,
      `${criticalPrefix} ${error.message}`,
      "createConnectionAndSubscribeRedis"
    );
    console.error(error);
  }
};

const publishMessageToConnectedClients = async (
  data,
  { role = "", userId = "", isStreamEnd = false, isError = false } = {}
) => {
  log(
    "publishMessageToConnectedClients",
    "publish data to common channel",
    data
  );
  try {
    if (process.env.STAGE === "local") {
      redisClientToPublishMessages.publish(
        CHANNEL_NAME_TO_PUBLISH_SSE_MESSAGES,
        JSON.stringify({ data, role, userId, isStreamEnd, isError })
      );
    } else {
      redisClientToPublishMessages.v4.publish(
        CHANNEL_NAME_TO_PUBLISH_SSE_MESSAGES,
        JSON.stringify({ data, role, userId, isStreamEnd, isError })
      );
    }
  } catch (error) {
    logError(
      ResponseStatus.INTERNAL_SERVER_ERROR,
      `${criticalPrefix} ${error.message}`,
      "publishMessageToConnectedClients"
    );
    console.error("Error publishing to Redis channel:", error);
  }
};

const publishMessageToConnectedClientsByRole = (data, role) => {
  publishMessageToConnectedClients(data, { role });
};

const publishMessageToConnectedClientsByUserId = (data, userId) => {
  publishMessageToConnectedClients(data, { userId });
};

// Set of current connections
const userStreams = new Map();

const socketConnectionRequest = (req, res) => {
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  };
  res.writeHead(200, headers);

  const user = req.user;

  const socketId = uuidv4();
  const socket = {
    socketId,
    res,
    ...user,
  };
  log(
    "socketConnectionRequest",
    `New connection established for user id=${req.user.llmSessionId} of connection Id=${socketId}`,
    ""
  );
  res.write(
    `data: Connection Established for user id=${req.user.llmSessionId} \n`
  );
  userStreams.set(socketId, socket);

  req.on("close", () => {
    log(
      "socketConnectionRequest",
      `Connection closed for connection Id=${socketId}`,
      ""
    );
    userStreams.delete(socketId);
  });
};

const onReceiveMessageFromRedis = (message) => {
  if (!message) {
    return;
  }
  try {
    log(
      "onReceiveMessageFromRedis",
      "send message to specific socket connection",
      message.userSid
    );
    const { data, userId: userSid, isStreamEnd, isError } = JSON.parse(message);

    // Iterate over Map entries
    for (const [_socketId, socket] of userStreams) {
      if (userSid && socket.llmSessionId !== userSid) {
        continue;
      }
      const { res } = socket;

      if (isError) {
        try {
          res.write("event: error\ndata: Something went wrong!\n\n");
        } catch (e) {
          logError(
            ResponseStatus.INTERNAL_SERVER_ERROR,
            `${criticalPrefix} ${e.message} WRITE AFTER END`,
            "onReceiveMessageFromRedis"
          );
        }
      }
      if (isStreamEnd) {
        res.end();
      } else {
        try {
          res.write(`data: ${data}\n`);
        } catch (e) {
          logError(
            ResponseStatus.INTERNAL_SERVER_ERROR,
            `${criticalPrefix} ${e.message} WRITE AFTER END`,
            "onReceiveMessageFromRedis"
          );
        }
      }
    }
  } catch (error) {
    logError(
      ResponseStatus.INTERNAL_SERVER_ERROR,
      `${criticalPrefix} ${error.message}`,
      "onReceiveMessageFromRedis"
    );
    console.error(error);
  }
};

const onSockerMessageRevice = (message) => {
  const { userSid, prompt, response } = JSON.parse(message);
  endResponseStream(userSid, prompt, response, false);
};

const storeLLMResponse = async (promptId, responseText, tableKeys) => {
  if (!responseText) {
    log("storeLLMResponse", "", "no LLM response");
    return;
  }

  log("storeLLMResponse", "", "store LLM response");
  const session = await mongoose.startSession();

  try {
    const tableData = [];
    if (tableKeys.length) {
      const redisCache = new RedisCache();
      for (const key of tableKeys) {
        const data = await redisCache.get(key);
        if (data) {
          tableData.push({
            key,
            tables: data,
          });
        }
      }
    }
    session.startTransaction();
    const prompt = await UserPromptModel.findById(promptId);
    if (prompt?.responses?.length <= maxRegenerationAttempts) {
      const attempts = Number(prompt?.responses?.length?.toString()) || 0;
      prompt.responses.push({
        tableData,
        regenerationAttempt: attempts as any,
        responseFeedback: null,
        regenerationFeedback: null,
        writtenFeedback: "",
        answerText: responseText,
        suggestedPrompts: [],
      });
      await prompt.save({ session });
      await session.commitTransaction();
    }
    await session.endSession();
  } catch (e) {
    console.error(e);
    await session.abortTransaction();
    await session.endSession();
  }
};

const getLLMStream = (
  promptId,
  promptText,
  sid,
  conversationType,
  chatHistory,
  clientId,
  access_level = "admin",
  user_id
) => {
  log(
    "getLLMStream",
    "request for LLM response generation initiated",
    JSON.stringify({
      promptId,
      promptText,
      sid,
      conversationType,
      chatHistory,
      clientId,
      access_level,
      user_id,
    })
  );

  const url =
    conversationType === "intelligence"
      ? `${process.env.LLM_URL}/risk-copilot/stream`
      : `${process.env.LLM_URL}/operational-copilot/stream`;

  
  const payloadForUserLevelResponse = {
    input: {
      chat_history: chatHistory || [],
      question: promptText,
      client_id: clientId,
      user_id: user_id,
      access_level: access_level,
      requester: process.env.REQUESTER_ENVIRONMENT

    },
    config: {},
    kwargs: {},
  };
  
  log("getLLMStream", "payload to be sent for user level response", JSON.stringify(payloadForUserLevelResponse));


  let llmResponses = "";
  const tableKeys = [];
  
  axios
    .post(
      url,
      payloadForUserLevelResponse,
      {
        responseType: "stream"
      }
    )
    .then(async (response) => {
      log(
        url,
        "response received from LLM",
        JSON.stringify({
          chatHistory,
          promptText,
          clientId,
          user_id,
          access_level,
        })
      );
      for (const [socketId, socket] of userStreams) {
        if (socket.llmSessionId === sid) {
          userStreams.set(socketId, { ...socket, llmStream: response.data });
          break;
        }
      }
      response.data.on("data", (chunk) => {
        const chunkData = chunk.toString("utf8");
        const extractedString = extractResponse(chunkData);
        llmResponses += extractedString;
        const tableKey = getTableKeys(extractedString);
        if (tableKey) {
          tableKeys.push(tableKey);
        }
        
        publishMessageToConnectedClients(chunkData, { userId: sid });
      });
      response.data.on("end", async () => {
        for (const [_, socket] of userStreams) {
          if (socket.llmSessionId === sid) {
            publishMessageToConnectedClients("{}", {
              userId: sid,
              isStreamEnd: true,
            });
            log("getLLMStream", "Stream ended and sent successfully", "");
            await storeLLMResponse(promptId, llmResponses, tableKeys);
            break;
          }
        }
      });
      response.data.on("error", (error) => {
        publishMessageToConnectedClients("{}", {
          userId: sid,
          isError: true,
          isStreamEnd: true,
        });
        console.error("Error streaming data:", error);
      });
    })
    .catch(async (error) => {
      publishMessageToConnectedClients("{}", {
        userId: sid,
        isError: true,
        isStreamEnd: true,
      });
      console.error("Error streaming data:", error);
    });
};

const extractResponse = (chunkData) => {
  let extractedString = "";
  const regex = /event: data\r\ndata: "(.+?)"\r\n\r\n/;
  const match = chunkData.match(regex);

  if (match && match[1]) {
    extractedString = match[1];
  } else {
    extractedString = "";
  }
  return extractedString;
};

const generateLLMTitle = async (promptText) => {
  try {
    log(
      "generateLLMTitle",
      "generate title for conversation",
      JSON.stringify({ promptText })
    );
    const response = await axios.post(
      `${process.env.LLM_URL}/title/invoke`,
      {
        input: {
          query: promptText,
        },
        config: {},
        kwargs: {},
      },
      {}
    );
    return response.data?.output;
  } catch (e) {
    console.error(e);
    return "";
  }
};

const getTableKeys = (inputString) => {
  const match = inputString.match(tableRegex);
  if (match) {
    const key = match[1];
    return key;
  }
  return "";
};

const endResponseStream = async (userSid, prompt, response, retry) => {
  let found = false;
  try {
    console.log(
      "endResponseStream",
      `Connection closed for connection Id=${userSid}`,
      retry
    );
    console.log("endStreams -- --- --- ", userStreams);
    const del = [];
    for (const [socketId, socket] of userStreams) {
      if (userSid && socket.llmSessionId === userSid) {
        console.log("endStreams -- --- --- found");
        const { res, llmStream } = socket;
        res.end();
        llmStream.destroy();
        del.push(socketId);
        found = true;
        console.log("endStreams -- --- --- deleted");
        await storeLLMResponse(prompt, response, []);
        break;
      }
    }
    if (!found) {
      if (retry) {
        redisClientToPublishMessages.publish(
          CHANNEL_NAME_TO_PUBLISH_SOCKET_MESSAGES,
          JSON.stringify({ userSid, prompt, response })
        );
      }
    } else {
      del.forEach((d) => userStreams.delete(d));
    }
  } catch (e) {
    console.error(e);
  }
};



export {
  socketConnectionRequest,
  onReceiveMessageFromRedis,
  createConnectionAndSubscribeRedis,
  publishMessageToConnectedClients,
  publishMessageToConnectedClientsByRole,
  publishMessageToConnectedClientsByUserId,
  getLLMStream,
  generateLLMTitle,
  endResponseStream,
  storeLLMResponse,
};
