const decycle = (obj: any, cache: any[] = []) => {
    if (obj && typeof obj === 'object') {
        // Check if we've encountered this object before
        if (cache.includes(obj)) {
            return '[Circular]';
        }

        // Add this object to the cache
        cache.push(obj);

        // Process each property in the object
        return Array.isArray(obj) ? obj.map((item) => decycle(item, cache)) : Object.keys(obj).reduce((acc, key) => {
            acc[key] = decycle(obj[key], cache);
            return acc;
        },                                                                                            {} as any);
    }

    // If the value is not an object, or if it's a function, return it as is
    return obj;
};

export { decycle };
