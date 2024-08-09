import debug from 'debug';
import { getStringEnv, getNumberEnv } from './getEnvValue';
import * as redis from 'redis';

const REDIS__PROTOCOL = getStringEnv('REDIS__PROTOCOL');
const REDIS__HOST = getStringEnv('REDIS__HOST');
// const REDIS__USERNAME = getStringEnv('REDIS__USERNAME');
const REDIS__PASSWORD = getStringEnv('REDIS__PASSWORD');
const REDIS__PORT = getNumberEnv('REDIS__PORT');
const REDIS__DATABASE = getStringEnv('REDIS__DATABASE');
const STAGE = getStringEnv('STAGE');

const getRedisInstance = async (readonly = false) => {
    try {
        let redisInstance: any;
        const logger = debug('redis-handler');
        logger.enabled = true;
        const redisConfig: redis.RedisClientOptions = {
            // readonly,
            url: `${REDIS__PROTOCOL}://:${REDIS__PASSWORD}@${REDIS__HOST}:${REDIS__PORT}/${REDIS__DATABASE}`,
            socket: {
                noDelay: true,
                connectTimeout: 100000,
                // tls: true,
                keepAlive: 100000,
            },
            legacyMode: true,
            pingInterval: 1000,
        };

        if (STAGE === 'local') {
            redisInstance = redis.createClient();
        } else {
            redisInstance = redis.createClient(redisConfig);
        }
        await redisInstance.connect();
        return redisInstance;
    } catch (error) {
        console.error(error);
        throw (new Error('Redis disabled.'));
    }
};

export {
    getRedisInstance,
};
