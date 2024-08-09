import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
    {
        clientId: {
            type: String,
            required: true,
        },
        userEmail: {
            type: String,
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['operational', 'intelligence'],
            required: true
        },
        category: {
            type: String,
            enum: ['platform', 'risks'],
            required: false,
        },
        threadId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        threadTitle: {
            type: String,
            default: "",
        },
        isSaved: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true }
);

const promptSchema = new mongoose.Schema(
    {
        // thread Id will be _id of Conversation
        threadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        promptText: {
            type: String,
            required: true,
        },
        responses: [{
            responseFeedback: {
                type: Number,
                default: null,
            },
            writtenFeedback: {
                type: String,
                default: "",
            },
            regenerationAttempt: {
                type: Number,
                default: 0,
                required: true,
            },
            regenerationFeedback: {
                type: Number,
                default: null,
            },
            answerText: {
                type: String,
                required: true,
            },
            suggestedPrompts: [{
                promptText: {
                    type: String,
                    required: true,
                },
            }],
            tableData: [{
                key: {
                    type: String,
                },
                tables: {
                    type: mongoose.Schema.Types.Mixed,
                }
            }],
        }],
    },
    { timestamps: true }
);
ConversationSchema.index({ userEmail: 1, isSaved: 1 });
const UserPromptModel = mongoose.model("UserPrompt", promptSchema);
const ConversationModel = mongoose.model("Conversation", ConversationSchema);

export {
    UserPromptModel,
    ConversationModel,
};
