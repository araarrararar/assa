import mongoose from 'mongoose';

export const connector = (serverCallBack) => {
    const url = process.env.MONGO_URI;
    try {
        console.info(`Trying to connect: ${url}`);
        mongoose.connect(url, {}).then(() => {
            console.info(`Database connected: ${url}`);
            serverCallBack();
        }).catch((err) => {
            console.error(`connection error: ${err}`);
        });
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }

    return mongoose.connection;
};
 