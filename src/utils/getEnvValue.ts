import getEnv from './getEnv';

const getEnvValue = <T>(key: string, type: 'string' | 'number'): T => {
    const value = getEnv(key, '');
    if (value === null) {
        throw new Error(`${key} cannot be null`);
    }
    if (type === 'number') {
        return Number(value) as unknown as T;
    }
    return value as unknown as T;
};

export const getStringEnv = (key: string): string => getEnvValue<string>(key, 'string');
export const getNumberEnv = (key: string): number => getEnvValue<number>(key, 'number');
