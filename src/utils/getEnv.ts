const getEnv = (key, defaultValue: string | boolean | null | undefined = undefined) => {
    const valueFromEnv: string | undefined = process.env[key];
    if (valueFromEnv) {
        if (valueFromEnv.match(/^[Tt]rue$/)) {
            return true;
        }
        if (valueFromEnv.match(/^[Ff]alse$/)) {
            return false;
        }
        if (valueFromEnv === 'null') {
            return null;
        }
        const value = valueFromEnv.replace(/\\n/g, '\n');
        return value;
    }

    if (defaultValue !== undefined) {
        return defaultValue;
    }

    throw new Error(`Undefined variable ${key}`);
};

export default getEnv;
