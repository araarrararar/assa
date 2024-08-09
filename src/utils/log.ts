import { logger } from './Logger';

const log = (methodName, methodOrApiCalled = '', description = '') => {
    logger.info(
        `${new Date()} : COPILOT_MIDDLEWARE : methodName: ${methodName} : methodOrApiCalled: ${methodOrApiCalled} : description : ${description}`,
    );
};

export default log;
