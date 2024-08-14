const  sendMessageToServer = async (client_id: any, prompt: any) => {
  // const {
  //   params: {userId},
  // } = req;
  console.log(client_id)
//   const prompt = data.prompt;
//   console.log(userId,clientId);
  await testModel.find({
    
  })
  .then(async response => {
    const dataString = JSON.stringify(response, null, 2);

    // Combine the user's question with the data from MongoDB
    const combinedPrompt = `${prompt}\n\nHere is the relevant data:\n${dataString};`;


    //console.log(response);
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
            return {
                status: "error",
                message: "Collection name and question are required."
            }
        }
        console.log("documets fetched")
        // Analyze the question using Gemini API
        await axios.post(process.env.GEMINI_URL, data)
        .then(response => {
          console.log('Response:', response.data);
          return response.data
        })
        .catch(error => {
          console.error('Error:', error);
          return {
            error
          }
        });

  })
  .catch(error => {
    console.error('Error:', error);
    return {
      error
    }
  });
}

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
    // log(
    //   "getLLMStream",
    //   "request for LLM response generation initiated",
    //   JSON.stringify({
    //     promptId,
    //     promptText,
    //     sid,
    //     conversationType,
    //     chatHistory,
    //     clientId,
    //     access_level,
    //     user_id,
    //   })
    // );
  return new Promise((resolve, reject) => {
    let llmResponses;
  try{
    const url = process.env.GEMINI_URL;
    const documents = await testModel.find({})
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
        }
        axios.post(url, data, { responseType: 'stream' })
    .then(response => {
      let llmResponses = ''; // Initialize llmResponses here
     // let tableKeys = []; // Initialize tableKeys if needed
  
      response.data.on('data', chunk => {
        const chunkData = chunk.toString('utf8');
        llmResponses += chunkData;
  
        // Uncomment and adjust these lines if you have extraction functions
        // const extractedString = extractResponse(chunkData);
        // const tableKey = getTableKeys(extractedString);
        // if (tableKey) {
        //   tableKeys.push(tableKey);
        // }
  
        console.log(chunkData);
      });
  
      response.data.on('end', () => {
        // Handle the end of the stream here if needed
        console.log('Stream ended.');
        resolve({llmResponses})
      });
    })
    .catch(error => {
      console.error('Error occurred:', error);
      reject({error})
    });
    
        // log(
        //   url,
        //   "response received from LLM",
        //   JSON.stringify({
        //     chatHistory,
        //     promptText,
        //     clientId,
        //     user_id,
        //     access_level,
        //   })
        // );
        // for (const [socketId, socket] of userStreams) {
        //   if (socket.llmSessionId === sid) {
        //     userStreams.set(socketId, { ...socket, llmStream: response.data });
        //     break;
        //   }
        // }
        // publishMessageToConnectedClients(chunkData, { userId: sid });
        // response.data.on("end", async () => {
        //   // for (const [_, socket] of userStreams) {
        //   //   if (socket.llmSessionId === sid) {
        //   //     publishMessageToConnectedClients("{}", {
        //   //       userId: sid,
        //   //       isStreamEnd: true,
        //   //     });
        //   //     log("getLLMStream", "Stream ended and sent successfully", "");
        //   //     await storeLLMResponse(promptId, llmResponses, tableKeys);
        //   //     break;
        //   //   }
        //   // }
        // });
      //   response.data.on("error", (error) => {
      //     // publishMessageToConnectedClients("{}", {
      //     //   userId: sid,
      //     //   isError: true,
      //     //   isStreamEnd: true,
      //     // });
      //     console.error("Error streaming data:", error);
      //   });
      // })
      // const delay = 100; // Time delay in milliseconds
  
      // let index = 0;
      // function printNextChar() {
      //   if (index < response.text.length) {
      //       process.stdout.write(response[index]); // Print character without newline
      //       index++;
      //       setTimeout(printNextChar, delay); // Call the function again after delay
      //   } else {
      //       console.log(); // Print newline after finishing the string
      //   }
      // }
      // printNextChar()
      } catch(error){
        // publishMessageToConnectedClients("{}", {
        //   userId: sid,
        //   isError: true,
        //   isStreamEnd: true,
        // });
        console.error("Error streaming data:", error);
        return error.message;
        reject(error.message)
      }
    
    
        // Combine the user's question with the data from MongoDB
        
       // console.log("prompt",data)
    // const payloadForUserLevelResponse = {
    //   input: {
    //     chat_history: chatHistory || [],
    //     question: promptText,
    //     client_id: clientId,
    //     user_id: user_id,
    //     access_level: access_level,
    //     requester: process.env.REQUESTER_ENVIRONMENT
  
    //   },
    //   config: {},
    //   kwargs: {},
    // };
    
   // log("getLLMStream", "payload to be sent for user level response", JSON.stringify(payloadForUserLevelResponse));
  
  
   // let llmResponses = "";
   // const tableKeys = [];
   //console.log("data", combinedPrompt)
    
      
  // };
  
  // const extractResponse = (chunkData) => {
  //   let extractedString = "";
  //   const regex = /event: data\r\ndata: "(.+?)"\r\n\r\n/;
  //   const match = chunkData.match(regex);
  
  //   if (match && match[1]) {
  //     extractedString = match[1];
  //   } else {
  //     extractedString = "";
  //   }
  //   return extractedString;
  // };
  }