import 'dotenv/config';
import mongoose from 'mongoose';
import { app } from './app';
import http from 'http';
import { listening, logPrefix, criticalPrefix } from './json/en.json';
import { logError } from './utils/ErrorLogger';
import { ResponseStatus } from './utils/ResponseStatus';
import { logger } from './utils/Logger';


// import { createConnectionAndSubscribeRedis } from './api/helpers/socketHelper';

const url = process.env.MONGO_URI;
console.log(url);
const port = process.env.PORT || 3000;
const keepAliveTimeout = process.env.KEEP_ALIVE_TIMEOUT || 65000;
let db;
try {
    
    const options: http.ServerOptions = {
        keepAlive: true,
        noDelay: true,
    };
    logger.info(`${logPrefix} Trying to connect: ${url}`);
    mongoose.connect(process.env.MONGO_URI, {dbName:"agentm"}).then(async () => {
        console.log(process.env.MONGO_URI, "hello")
        logger.info(`${logPrefix} Connected to MongoDB server successfully!`);
      //  const copilotDb = mongoose.connection.useDb('copilot')
    //    const kavidacoreDb = mongoose.connection.useDb('kavidacore')
      //  const db = await testModel.find({});
        // db.once("open", () => {
        //     logger.info(`${logPrefix} ${db} database connected successfully`)
        // })

        // db.on("error", (err) => {
        //     logError(ResponseStatus.INTERNAL_SERVER_ERROR, `${criticalPrefix} ${err.message}`)
        // })
        // copilotDb.once('open',() => {
        //     logger.info(`${logPrefix} ${copilotDb} database connected successfully`)
        // })

        // copilotDb.on('error', (err) => {
        //     logError(ResponseStatus.INTERNAL_SERVER_ERROR, `${criticalPrefix} ${err.message}`)
        // })

        // kavidacoreDb.once('open', () => {
        //     logger.info(`${logPrefix} ${kavidacoreDb} database connected successfully`)
        // })

        // kavidacoreDb.on('error', (err) => {
        //     logError(ResponseStatus.INTERNAL_SERVER_ERROR, `${criticalPrefix} ${err.message}`)
        // })

        const server = http.createServer(options, app).listen(
            port, () => {
                logger.info(`${logPrefix} ${listening} ${port}`);
                // createConnectionAndSubscribeRedis();
            },
        );
        server.keepAliveTimeout = Number(keepAliveTimeout);
    }).catch((err) => {
        console.error(`database connection error: ${err}`);
    });
} catch (err) {
    logError(ResponseStatus.INTERNAL_SERVER_ERROR, `${criticalPrefix} ${err.message}`);
    console.error(err);
}


export default {db};