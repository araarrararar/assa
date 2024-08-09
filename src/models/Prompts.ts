import mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['operational', 'external risks'],
            required: true
        },
        category: {
            type: String,
            enum: ['platform', 'risks'],
            required: true
        },
        promptText: {
            type: String,
            required: true
        },
        promptId: {
            type: String,
            default: mongoose.Types.ObjectId,
            required: true
        },
    },
    { timestamps: true },
);
schema.index({ type: 1, category: 1 });
schema.index({ promptId: 1 }, { unique: true });

const Prompts = mongoose.model('Prompt', schema);

export default Prompts;
