import mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        suggestion: {
            type: String,
            required: true,
            unique: true,
        },
    },
    { timestamps: true },
);
schema.index({ suggestion: 1 });

const Suggestions = mongoose.model('Suggestion', schema);

export default Suggestions;
