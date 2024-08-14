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
import { server as WebSocketServerType } from 'websocket';
import { testModel } from "../../models/testModel";



const CHANNEL_NAME_TO_PUBLISH_SSE_MESSAGES = "sse-messages";
const CHANNEL_NAME_TO_PUBLISH_SOCKET_MESSAGES = "socket-messages";
let redisClientToPublishMessages;
let redisClientToSubscribeChannel;
// const tableRegex = /<<TABULAR DATA>>\s+(\S+)/g;

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

const getLLMStream = async (
  promptId,
  promptText,
  sid,
  conversationType,
  chatHistory,
  clientId,
  access_level = "admin",
  user_id
) => {
  return new Promise(async (resolve, reject) => {
    let llmResponses = '';
    try {
      const url = process.env.GEMINI_URL;
      const documents = await testModel.find({});
      const dataString = JSON.stringify(documents, null, 2);
      const combinedPrompt = `${promptText}\n\nHere is the relevant data:\n${dataString};`;
      const data = {
        "contents": [
          {
            "parts": [
              {
                "text": combinedPrompt
              }
            ]
          }
        ]
      };

      const response = await axios.post(url, data, { responseType: 'stream' });

      response.data.on('data', chunk => {
        const chunkData = chunk.toString('utf8');
        llmResponses += chunkData;
        // console.log(chunkData);
      });

      response.data.on('end', () => {
        console.log('Stream ended.');
        const delay = 100; // Time delay in milliseconds

        let index = 0;

        function printNextChar() {
          if (index < llmResponses.length) {
            process.stdout.write(llmResponses[index]); 
            index++;
            setTimeout(printNextChar, delay); 
          } else {
            console.log(); 
          }
        }

        printNextChar();

        resolve({ llmResponses });
      });

      response.data.on('error', (error) => {
        console.error('Error streaming data:', error);
        reject({ error });
      });

    } catch (error) {
      console.error('Error occurred:', error);
      reject({ error });
    }
  });
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

// const getTableKeys = (inputString) => {
//   const match = inputString.match(tableRegex);
//   if (match) {
//     const key = match[1];
//     return key;
//   }
//   return "";
// };

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

const llmResponse = async (server) => {
  const ws = new WebSocketServerType({
    httpServer: server
  });

  ws.on('request', function (request) {
    var connection = request.accept(null, request.origin);
    connection.on('message', async function (message) {
      if (message.type === 'utf8') {
        console.log('Received Message: ' + message.utf8Data);
        const prompt = message.utf8Data;

        try {
          const response = await testModel.find({});

          const dataString = JSON.stringify(response, null, 2);

          // Combine the user's question with the data from MongoDB
          const combinedPrompt = `${prompt}\n\nHere is the relevant data:\n${dataString};`;

          // Prepare the content to send to the Gemini API
          const data = {
            "contents": [
              {
                "parts": [
                  {
                    "text": combinedPrompt
                  }
                ]
              }
            ]
          };

          if (!response || !prompt) {
            connection.sendUTF("fetch error");
          } else {
            console.log("Documents fetched");

            // Analyze the question using Gemini API
            const res = await axios.post(process.env.GEMINI_URL, data, { responseType: 'stream' });

            let llmResponses = "";
            res.data.on('data', chunk => {
              const chunkData = chunk.toString('utf8');
              llmResponses += chunkData;
              console.log(llmResponses);
              connection.sendUTF(llmResponses);
            });
          }

        } catch (error) {
          connection.sendUTF(error.toString());
        }
      } else if (message.type === 'binary') {
        console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
        connection.sendBytes(message.binaryData);
      }
    });

    connection.on('close', function (reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
  });
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
  llmResponse
};

