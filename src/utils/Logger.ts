import winston from 'winston';
import { decycle } from './Decycle';

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf((info) => {
            try {
                const { level, message, ...rest } = info;
                const decycledArgs = decycle(rest);
                const { timestamp, ...restArgs } = decycledArgs;
                const time = timestamp.slice(0, 19).replace('T', ' ');
                return `${time} [${level}]: ${message} ${Object.keys(restArgs).length ? JSON.stringify(restArgs, null, 2) : ''}`;
            } catch (error) {
                return error.message;
            }
        }),
    ),
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: {},
    transports: [
        new winston.transports.Console(),
    ],
    exitOnError: false,
});

const winstonStream = {
    write: (message) => {
        logger.info(message.trim());
    },
};

process.on('unhandledRejection', (err: Error) => {
    logger.error({
        message: err.message,
        error: err,
    });
});

export { logger, winstonStream };
