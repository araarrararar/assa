import 'dotenv/config';
import { Request, Response } from "express";
// import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { ResponseStatus } from "../../utils/ResponseStatus";
import { criticalPrefix } from "../../json/en.json";
import log from "../../utils/log";
import { logError } from "../../utils/ErrorLogger";
// import axios from "axios";
import {
  socketConnectionRequest,
  publishMessageToConnectedClients,
  publishMessageToConnectedClientsByRole,
  publishMessageToConnectedClientsByUserId,
  getLLMStream,
  // generateLLMTitle,
  endResponseStream,
} from "../helpers/socketHelper";
// import { testModel } from "../../models/testModel";
// import  {ws} from "../../server"

// import {
//   getConversationByThreadId,
//   createConversation,
//   createConversationPrompt,
//   getPromptById,
// } from "../helpers/threadHelper";
// import { constants } from "../../utils/Constants";




// const allowedThreadCount = constants.allowedThreadCount;
// const maxRegenerationAttempts = constants.maxRegenerationAttempts;

// interface UserDocument extends mongoose.Document {
//   client_id: string;
//   email: string;
//   access_level: string;
//   _id: mongoose.Types.ObjectId;
// }
class SocketController {
  public async setConnectionStream(req: Request, res: Response) {
    try {
      log(
        "setConnectionStream",
        "publishMessageToConnectedClients",
        "send message to client"
      );
      // res.setHeader('Cache-Control', 'no-cache');
      // res.setHeader('Content-Type', 'text/event-stream');
      // res.setHeader('Access-Control-Allow-Origin', '*');
      // res.setHeader('Connection', 'keep-alive');
      // res.flushHeaders();
      socketConnectionRequest(req, res);
    } catch (error) {
      logError(
        ResponseStatus.INTERNAL_SERVER_ERROR,
        `${criticalPrefix} ${error.message}`,
        "sendMessage"
      );
      console.error(error);
      return res.status(ResponseStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message,
        success: false,
      });
    }
  }
  public async LLMresponse(req: any, res:Response) {
  
    
  
  
  }
  public async streamLLMResponse(req: any, res: Response) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
   //   log("streamLLMResponse", "streamLLMResponse", "send message to client");
     // const { llmSessionId, clientId } = req.user;
      const {
        conversationType,
        conversationCategory,
        promptText,
        promptId,
        chatHistory,
        sid,
        clientId,
        access_level,
        userID,
        isRegeneration,
        llmSessionId
      } = req.body;
      console.log({
        conversationType,
        conversationCategory,
        promptText,
        promptId,
        chatHistory,
        sid,
        clientId,
        access_level,
        userID,
        isRegeneration,
        llmSessionId
    });
      const result = await getLLMStream(promptId, promptText, sid, conversationType, chatHistory, clientId, access_level, userID)
        return res.status(200).json(result)
    } catch(error) {
      return res.status(400).json(error)
    }
      //const { email: userEmail } = req.user;
    //   const { email: userEmail } = req.body;
    //   let { threadId } = req.body;
    //  // let currentPrompt;
    
    //   let threadTitle = "";
    //   const isNewConversationRequest = !threadId;
    //   const isNewPromptRequest = threadId && !isRegeneration 
    //   && !promptId;
    //   if (isNewConversationRequest) {
    //     // if new conversation
    //     threadId = uuidv4();

    //     // log(
    //     //   "streamLLMResponse",
    //     //   "request to title api initiated",
    //     //   JSON.stringify({ promptText })
    //     // );
    //     threadTitle = await generateLLMTitle(promptText);
    //     // log(
    //     //   "streamLLMResponse",
    //     //   "request to title api completed",
    //     //   JSON.stringify({ threadTitle })
    //     // );

    //    // log("streamLLMResponse", "initiated database instructions", "");
    //     const { prompt } = await createConversation(
    //       {
    //         threadId,
    //         conversationType,
    //         conversationCategory,
    //         promptText,
    //         userEmail,
    //         threadTitle,
    //         clientId,
    //       },
    //       { session }
    //     );
    //     log("streamLLMResponse", "completed database instructions", "");

    //     currentPrompt = prompt._id;
    //   } else if (isNewPromptRequest) {
    //     // if existing conversation but new prompt
    //     const thread = await getConversationByThreadId(threadId);
    //     if (!thread) {
    //       log(
    //         "streamLLMResponse",
    //         "streamLLMResponse",
    //         "invalid thread id provided"
    //       );
    //       return res.status(ResponseStatus.BAD_REQUEST).json({
    //         message: "User has provided invalid thread Id!",
    //         success: false,
    //       });
    //     }
    //     const { prompt } = await createConversationPrompt(
    //       { thread, promptText },
    //       { session }
    //     );
    //     //currentPrompt = prompt._id;
    //   } else {
    //     // if existing conversation and prompt but regeneration request
    //     const thread = await getConversationByThreadId(threadId);
    //     if (!thread) {
    //       log(
    //         "streamLLMResponse",
    //         "streamLLMResponse",
    //         "invalid thread id provided"
    //       );
    //       return res.status(ResponseStatus.BAD_REQUEST).json({
    //         message: "User has provided invalid thread Id!",
    //         success: false,
    //       });
    //     }
    //     const prompt = await getPromptById(thread._id, promptId);
    //     if (!prompt) {
    //       log(
    //         "streamLLMResponse",
    //         "streamLLMResponse",
    //         "invalid prompt id provided"
    //       );
    //       return res.status(ResponseStatus.BAD_REQUEST).json({
    //         message: "User has provided invalid thread Id!",
    //         success: false,
    //       });
    //     }
    //     if (
    //       isRegeneration &&
    //       prompt.responses?.length >= maxRegenerationAttempts
    //     ) {
    //       log(
    //         "streamLLMResponse",
    //         "streamLLMResponse",
    //         "invalid thread id provided"
    //       );
    //       return res.status(ResponseStatus.BAD_REQUEST).json({
    //         message: "User has used all regeneration attempts!",
    //         success: false,
    //       });
    //     }
       // currentPrompt = prompt._id;
    //  }

    //   const connectToCoreDatabase = async () => {
    //     try {
    //       const url = process.env.KAVIDA_CORE_MONGO_URI;
    //       const connection = await mongoose.createConnection(url);
      
    //       await new Promise<void>((resolve, reject) => {
    //         connection.on("connected", () => resolve());
    //         connection.on("error", (err) => reject(err));
    //       });      
    //       const result = await findUsers(connection);
    //       return { connection, result };

    //     } catch (error) {
    //       console.error(`Database connection error: ${error}`);
    //       throw error;
    //     }
    //   };
      
    //   const findUsers = async (connection) => {
    //     try {
    //       if (!(connection instanceof mongoose.Connection)) {
    //         throw new Error("Invalid mongoose connection object");
    //       }
    //       const userSchema = new mongoose.Schema({
    //         client_id: { type: String, required: true },
    //         email: { type: String, required: true },
    //         access_level: { type: String, required: true },
    //       });
    //       const Users = connection.model("User", userSchema, "users");
      
    //       // @ts-ignore
    //       const user_info: UserDocument = await Users.findOne({
    //         client_id: clientId,
    //         email: userEmail,
    //       }).exec();
      
    //       if (!user_info) {
    //         throw new Error("User not found");
    //       }else{
    //         console.log(user_info, "user found")
    //       }
      
    //       const access_level = user_info.access_level;
    //       const _id = user_info._id.toString();
    //       const result = { access_level, _id };
    //       return result;
      
    //     } catch (error) {
    //       console.error("Error querying users:", error);
    //     }
    //   };
      
    //   (async () => {
    //     const { result } = await connectToCoreDatabase();
      
    //     if (result) {
    //       const { access_level, _id } = result;
    //       getLLMStream(
    //         currentPrompt,
    //         promptText,
    //         llmSessionId,
    //         conversationType,
    //         chatHistory,
    //         clientId,
    //         access_level,
    //         _id
    //       );
    //     }
    //   })();
      
    //   await session.commitTransaction();
    //   await session.endSession();
    //   return res.status(ResponseStatus.STATUS_OK).json({
    //     message: "API returned success!",
    //     success: true,
    //     data: {
    //       threadId,
    //       promptText,
    //       threadTitle,
    //       promptId: currentPrompt,
    //     },
    //   });
    // } catch (error) {
    //   logError(
    //     ResponseStatus.INTERNAL_SERVER_ERROR,
    //     `${criticalPrefix} ${error.message}`,
    //     "streamLLMResponse"
    //   );
    //   await session.abortTransaction();
    //   await session.endSession();
    //   console.error(error);
    //   return res.status(ResponseStatus.INTERNAL_SERVER_ERROR).json({
    //     message: error,
    //     success: false,
    //   });
    // }
    }
  public async sendMessage(req: Request, res: Response) {
    try {
      log(
        "sendMessage",
        "publishMessageToConnectedClients",
        "send message to client"
      );
      // Add API to retrive data from LLM engine
      publishMessageToConnectedClients(
        `This event is triggered at ${new Date()}`
      );
      return res.status(ResponseStatus.STATUS_OK).json({
        message: "API returned success!",
        success: true,
      });
    } catch (error) {
      logError(
        ResponseStatus.INTERNAL_SERVER_ERROR,
        `${criticalPrefix} ${error.message}`,
        "sendMessage"
      );
      console.error(error);
      return res.status(ResponseStatus.INTERNAL_SERVER_ERROR).json({
        message: error,
        success: false,
      });
    }
  }

  public async sendMessageToRole(req: Request, res: Response) {
    const {
      params: { role },
    } = req;
    try {
      log(
        "sendMessageToRole",
        "publishMessageToConnectedClients",
        "send message to client based on role"
      );
      // Add API to retrive data from LLM engine
      publishMessageToConnectedClientsByRole(
        `This event is triggered at ${new Date()}`,
        role
      );
      return res.status(ResponseStatus.STATUS_OK).json({
        message: "API returned success!",
        success: true,
      });
    } catch (error) {
      logError(
        ResponseStatus.INTERNAL_SERVER_ERROR,
        `${criticalPrefix} ${error.message}`,
        "sendMessage"
      );
      console.error(error);
      return res.status(ResponseStatus.INTERNAL_SERVER_ERROR).json({
        message: error,
        success: false,
      });
    }
  }

  public async sendMessageToUser(req: Request, res: Response) {
    const {
      params: { userId },
    } = req;
    try {
      log(
        "sendMessageToUser",
        "publishMessageToConnectedClientsByUserId",
        "send message to client based on userId"
      );
      // Add API to retrive data from LLM engine
      publishMessageToConnectedClientsByUserId(
        `This event is triggered at ${new Date()}`,
        +userId
      );
      return res.status(ResponseStatus.STATUS_OK).json({
        message: "API returned success!",
        success: true,
      });
    } catch (error) {
      logError(
        ResponseStatus.INTERNAL_SERVER_ERROR,
        `${criticalPrefix} ${error.message}`,
        "sendMessage"
      );
      console.error(error);
      return res.status(ResponseStatus.INTERNAL_SERVER_ERROR).json({
        message: error,
        success: false,
      });
    }
  }
  
  public async stopResponseStream(req: any, res: Response) {
    const { prompt, response } = req.body;
    const { llmSessionId } = req.user;
    try {
      log("stopResponseStream", "", "end stream based on userId");

      await endResponseStream(llmSessionId, prompt, response, true);
      return res.status(ResponseStatus.STATUS_OK).json({
        message: "API returned success!",
        success: true,
      });
    } catch (error) {
      logError(
        ResponseStatus.INTERNAL_SERVER_ERROR,
        `${criticalPrefix} ${error.message}`,
        "stopResponseStream"
      );
      console.error(error);
      return res.status(ResponseStatus.INTERNAL_SERVER_ERROR).json({
        message: error,
        success: false,
      });
    }
  }
}

export { SocketController };
