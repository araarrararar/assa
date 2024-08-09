import mongoose from 'mongoose';
import { sortBy } from 'lodash';
import log from '../../utils/log';

import { ConversationModel, UserPromptModel } from '../../models/Thread';
import { isNullOrUndefined } from '../../utils/validators';

const getSavedConversations = async (userEmail) => {
    log('getSavedConversations', '', 'get all save conversation for user');
    return ConversationModel.find({
        userEmail,
        isSaved: true,
    });
};

const getConversationByThreadId = async (threadId, options = {}) => {
    log('getConversationByThreadId', '', 'get conversation data by id');
    return ConversationModel.findOne({
        threadId,
    });
};

const getPromptById = async (threadId, promptId, options = {}) => {
    log('getPromptById', '', 'get prompt data by id');
    return UserPromptModel.findOne(
        {
            threadId,
            _id: promptId,
        },
        options,
    );
};

const createConversation = async (params, options = {}) => {
    log('createConversation', '', 'create new conversation thread');
    const {
        threadId, userEmail, conversationType, conversationCategory,
        promptText, clientId, threadTitle,
    } = params;

    let thread = new ConversationModel({
        threadId,
        userEmail,
        clientId,
        threadTitle,
        type: conversationType,
        category: conversationCategory,
        isSaved: false,
    });
    thread = await thread.save(options);
    let prompt = new UserPromptModel({
        promptText,
        threadId: thread._id,
    });
    prompt = await prompt.save(options);
    return {
        thread,
        prompt,
    };
};

const createConversationPrompt = async (params, options = {}) => {
    log('createConversation', '', 'create new conversation thread');
    const {
        thread,
        promptText,
    } = params;
    let prompt = new UserPromptModel({
        promptText,
        threadId: new mongoose.Types.ObjectId(thread._id),
    });
    prompt = await prompt.save(options);

    return {
        prompt,
    };
};

const updateThreadById = async (id, params) => {
    return ConversationModel.findByIdAndUpdate(
        id,
        { ...params },
        { new: true },
    );
};

const addPromptFeedback = async (
    prompt, writtenFeedback, responseAttempt, responseFeedback, regenerationFeedback,
) => {
    const updatedResponses = prompt.responses.map((res) => {
        if (Number(res.regenerationAttempt) === responseAttempt - 1) {
            return {
                ...res,
                ...(!isNullOrUndefined(responseFeedback) && { responseFeedback }),
                ...(!isNullOrUndefined(regenerationFeedback) && { regenerationFeedback }),
                ...(!isNullOrUndefined(writtenFeedback) && { writtenFeedback }),
            };
        }
        return res;
    });
    prompt.responses = updatedResponses;
    return prompt.save();
};

const getConversationDataByThreadId = async (threadId, options = {}) => {
    log('getConversationDataByThreadId', '', 'get conversation data by id');

    const threadFields = ['threadId', '_id', 'type', 'category', 'threadTitle', 'prompts'];
    const promptFields = ['_id', 'promptText', 'responses'];

    return ConversationModel.aggregate([
        {
            $match: {
                threadId,
            },
        },
        {
            $lookup: {
                from: 'userprompts', // Name of the Prompt model's collection
                localField: '_id',
                foreignField: 'threadId',
                as: 'prompts', // alias
            },
        },
        {
            // add fields to select
            $project: {
                ...threadFields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {}),
                ...promptFields.reduce((acc, field) => ({ ...acc, [`userprompts.${field}`]: 1 }), {}),
            },
        },
        {
            $addFields: {
                prompts: {
                    $ifNull: ['$prompts', []], // Handle cases where there are no prompts
                },
            },
        },
    ]);
};

const formatThreadData = (threads) => {
    return threads.map(thread => ({
        ...thread,
        prompts: sortBy(thread.prompts, obj => new Date(obj.createdAt)),
    }));
};

export {
    getSavedConversations,
    getConversationByThreadId,
    createConversation,
    createConversationPrompt,
    getPromptById,
    updateThreadById,
    addPromptFeedback,
    getConversationDataByThreadId,
    formatThreadData,
};
