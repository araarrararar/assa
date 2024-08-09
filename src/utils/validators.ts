export const isNullOrUndefined = (val) => {
    return val === null ||
        typeof val === undefined ||
        val === '';
};
