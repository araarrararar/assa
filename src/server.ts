import 'dotenv/config';
import mongoose from 'mongoose';
import { app } from './app';
import http from 'http';
import { listening, logPrefix, criticalPrefix } from './json/en.json';
import { logError } from './utils/ErrorLogger';
import { ResponseStatus } from './utils/ResponseStatus';
import { logger } from './utils/Logger';
import { llmResponse } from "./api/helpers/socketHelper"
// import { server as WebSocketServerType } from 'websocket';
// import { createConnectionAndSubscribeRedis } from './api/helpers/socketHelper';
// import { testModel } from '../src/models/testModel';
// import axios from "axios";
const url = process.env.MONGO_URI;
console.log(url);
const port = process.env.PORT || 3000;
const keepAliveTimeout = process.env.KEEP_ALIVE_TIMEOUT || 65000;
try {
        const options: http.ServerOptions = {
            keepAlive: true,
            noDelay: true,
        };
        logger.info(`${logPrefix} Trying to connect: ${url}`);
        mongoose.connect(process.env.MONGO_URI, {dbName:"agentm"}).then(async () => {
            const server = await http.createServer(options, app).listen(
                port, () => {
                    logger.info(`${logPrefix} ${listening} ${port}`);
                },
            );

            
            server.keepAliveTimeout = Number(keepAliveTimeout);
            llmResponse(server)
        }).catch((err) => {
            console.error(`database connection error: ${err}`);
        });
    } catch (err) {
        logError(ResponseStatus.INTERNAL_SERVER_ERROR, `${criticalPrefix} ${err.message}`);
        console.error(err);
    }



