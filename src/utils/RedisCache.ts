import { getRedisInstance } from './RedisManager';
import log from '../utils/log';

class RedisCache {

    private defaulTTL: number;

    constructor() {
        this.defaulTTL = Number(process.env.REDIS__CACHE_EXPIRY) || 300000;
    }

    async get(key: string) {
        let client: any;
        try {
            log('RedisCache', 'get', `Get ${key} from cache`);
            client = await getRedisInstance(true);

            const cachedData = process.env.STAGE === 'local' ?
                await client.get(key) : await client.v4.get(key);

            if (cachedData) {
                return JSON.parse(cachedData);
            }
            return null;
        } catch (error) {
            console.error(error);
            return undefined;
        } finally {
            log('RedisCache', 'get', 'Releasing redis connection');
            if (client) {
                process.env.STAGE === 'local' ?
                    client.quit() : client.v4.quit();
            }
        }
    }

    async set(key: string, data: any, ttl: number = this.defaulTTL) {
        let client: any;
        try {
            log('RedisCache', 'set', `Set ${key} in cache for ${ttl}`);
            client = await getRedisInstance();

            let freshData;
            if (data) {
                freshData = JSON.stringify(data);
            }

            return process.env.STAGE === 'local' ?
                client.set(key, freshData, 'EX', ttl) : client.v4.set(key, freshData, 'EX', ttl);
        } catch (error) {
            console.error(error);
            return undefined;
        } finally {
            log('RedisCache', 'set', 'Releasing redis connection');
            if (client) {
                process.env.STAGE === 'local' ?
                    client.quit() : client.v4.quit();
            }
        }
    }

    async delete(key: string) {
        let client: any;
        try {
            log('RedisCache', 'delete', `Delete ${key} from cache`);
            client = await getRedisInstance();
            process.env.STAGE === 'local' ?
                await client.del(key) : await client.v4.del(key);
            return true;
        } catch (error) {
            log('RedisCache', 'delete', `Error while deleting ${key}`);
            console.error(error);
            return false;
        } finally {
            log('RedisCache', '', 'Releasing redis connection');
            if (client) {
                process.env.STAGE === 'local' ?
                    client.quit() : client.v4.quit();
            }
        }
    }

    async mget(keys: string[]) {
        let client: any;
        try {
            log('RedisCache', 'mget', `Get ${JSON.stringify(keys)} from cache`);
            client = await getRedisInstance(true);
            const cachedData = process.env.STAGE === 'local' ?
                await client.mget(keys) : await client.v4.mget(keys);

            if (cachedData) {
                return cachedData.map((ele, index) => ({ cacheKey: keys[index], data: JSON.parse(ele) }));
            }
            return null;
        } catch (error) {
            console.error(error);
            return undefined;
        } finally {
            log('RedisCache', '', 'Releasing redis connection');
            if (client) {
                process.env.STAGE === 'local' ?
                    client.quit() : client.v4.quit();
            }
        }
    }
}

export default RedisCache;
