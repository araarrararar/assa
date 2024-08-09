import { logger } from './Logger';

const logInfo = (statusCode, message, methodName?) => {
    logger.error({
        methodName,
        message,
        status: statusCode,
    });
};

const logError = (statusCode, message, methodName?) => {
    logger.error({
        methodName,
        message,
        status: statusCode,
    });
};

export {
    logInfo,
    logError,
};
