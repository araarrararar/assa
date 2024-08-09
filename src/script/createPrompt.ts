import mongoose from 'mongoose';
import Prompts from '../models/Prompts';
import { defaultPrompts } from './defaultPrompts';

const uri = 'mongodb://0.0.0.0:27017/copilot';

// Connect to MongoDB
mongoose.connect(uri, {}).then(async () => {
    const collections = await mongoose.connection.db.listCollections().toArray();
        console.info('Collections:', collections.map(collection => collection.name));

    const prompts = await Prompts.find();
    if (!prompts.length) {
        await Prompts.insertMany(defaultPrompts);
        console.info('Data saved successfully');
    } else {
        console.info('Data already saved!');
    }
}).catch((err) => {
    console.error(err);
}).finally(() => {
    mongoose.connection.close();
    console.info('Closing database connection!');
});
