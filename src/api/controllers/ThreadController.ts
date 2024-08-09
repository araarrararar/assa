import { Request, Response } from 'express';
import { ResponseStatus } from '../../utils/ResponseStatus';
import { criticalPrefix } from '../../json/en.json';
import log from '../../utils/log';
import { logError } from '../../utils/ErrorLogger';

import Prompts from '../../models/Prompts';
import Suggestions from '../../models/Suggestions';
import RedisCache from '../../utils/RedisCache';
import {
    getConversationByThreadId,
    getPromptById,
    getSavedConversations,
    updateThreadById,
    addPromptFeedback,
    getConversationDataByThreadId,
    formatThreadData,
} from '../helpers/threadHelper';
// import { constants } from '../../utils/Constants';
import { defaultSuggestions } from '../../script/defaultPrompts';

// const allowedThreadCount = constants.allowedThreadCount;

class ThreadController {
    public async fetchAllDefaultPrompts(req: Request, res: Response) {
        try {
            log('fetchAllDefaultPrompts', 'fetch all prompts', 'fetch all prompts from database');

            // const key = constants.defaultPromptsKey;
            // const redisCache = new RedisCache();
            // const data = await redisCache.get(key);
            // if (data) {
            //     return res.status(200).json({
            //         prompts: data,
            //         success: true,
            //     });
            // }
            const prompts = await Prompts.find();
            if (prompts.length) {
                // const cacheData = prompts;
                // await redisCache.set(key, cacheData);
                return res.status(200).json({
                    prompts,
                    success: true,
                });
            }

            return res.status(200).json({
                prompts: [],
                success: true,
            });
        } catch (error) {
            logError(
                ResponseStatus.INTERNAL_SERVER_ERROR,
                `${criticalPrefix} ${error.message}`,
                'fetchAllDefaultPrompts',
            );
            console.error(error);
            return res.status(ResponseStatus.INTERNAL_SERVER_ERROR).json({
                message: error.message,
                success: false,
            });
        }
    }

    public async updateThreadData(req: any, res: Response) {
        try {
            log('updateThreadData', 'save the thread data', 'mark thread as saved or update thread title');
            const { threadId, isSaved, threadTitle } = req.body;
            let thread = await getConversationByThreadId(threadId);
            if (!thread) {
                log('updateThreadData', 'updateThreadData', 'invalid thread id provided');
                return res.status(ResponseStatus.BAD_REQUEST).json({
                    message: 'User has provided invalid thread Id!',
                    success: false,
                });
            }
            thread = await updateThreadById(
                thread._id,
                {
                    isSaved,
                    ...(threadTitle && { threadTitle }),
                },
            );
            return res.status(200).json({
                thread,
                success: true,
            });
        } catch (error) {
            logError(
                ResponseStatus.INTERNAL_SERVER_ERROR,
                `${criticalPrefix} ${error.message}`,
                'updateThreadData',
            );
            console.error(error);
            return res.status(ResponseStatus.INTERNAL_SERVER_ERROR).json({
                message: error.message,
                success: false,
            });
        }
    }

    public async fetchSavedThreads(req: any, res: Response) {
        try {
            log('fetchSavedThreads', 'save the thread', 'mark thread as saved');
            const { email: userEmail } = req.user;

            const savedThreads = await getSavedConversations(userEmail);

            return res.status(200).json({
                threads: savedThreads,
                success: true,
            });
        } catch (error) {
            logError(
                ResponseStatus.INTERNAL_SERVER_ERROR,
                `${criticalPrefix} ${error.message}`,
                'fetchSavedThreads',
            );
            console.error(error);
            return res.status(ResponseStatus.INTERNAL_SERVER_ERROR).json({
                message: error.message,
                success: false,
            });
        }
    }

    public async feedbackPrompt(req: any, res: Response) {
        try {
            log('feedbackPrompt', 'save/update the feedback for prompt', 'save/update the feedback for prompt');
            const {
                threadId, promptId, regenerationFeedback, writtenFeedback, responseFeedback,
                responseAttempt,
            } = req.body;

            const thread = await getConversationByThreadId(threadId);
            if (!thread) {
                log('feedbackPrompt', 'feedbackPrompt', 'invalid thread id provided');
                return res.status(ResponseStatus.BAD_REQUEST).json({
                    message: 'User has provided invalid thread Id!',
                    success: false,
                });
            }

            const prompt = await getPromptById(thread._id, promptId);
            if (!prompt || prompt?.responses?.length < responseAttempt) {
                log('feedbackPrompt', 'feedbackPrompt', 'invalid prompt data provided');
                return res.status(ResponseStatus.BAD_REQUEST).json({
                    message: 'User has provided invalid prompt data!',
                    success: false,
                });
            }
            await addPromptFeedback(
                prompt, writtenFeedback, responseAttempt,
                responseFeedback, regenerationFeedback,
            );
            return res.status(200).json({
                success: true,
            });
        } catch (error) {
            logError(
                ResponseStatus.INTERNAL_SERVER_ERROR,
                `${criticalPrefix} ${error.message}`,
                'feedbackPrompt',
            );
            console.error(error);
            return res.status(ResponseStatus.INTERNAL_SERVER_ERROR).json({
                message: error.message,
                success: false,
            });
        }
    }

    public async fetchThreadData(req: any, res: Response) {
        try {
            log('fetchThreadData', 'fetch the thread', 'fetch the thread data');
            const { threadId } = req.body;

            const savedThread = await getConversationDataByThreadId(threadId);
            if (!savedThread) {
                log('fetchThreadData', 'feedbackPrompt', 'invalid thread id provided');
                return res.status(ResponseStatus.BAD_REQUEST).json({
                    message: 'User has provided invalid thread Id!',
                    success: false,
                });
            }
            return res.status(200).json({
                threads: formatThreadData(savedThread),
                success: true,
            });
        } catch (error) {
            logError(
                ResponseStatus.INTERNAL_SERVER_ERROR,
                `${criticalPrefix} ${error.message}`,
                'fetchThreadData',
            );
            console.error(error);
            return res.status(ResponseStatus.INTERNAL_SERVER_ERROR).json({
                message: error.message,
                success: false,
            });
        }
    }

    public async fetchRedisData(req: any, res: Response) {
        try {
            const { key } = req.params;
            log('fetchRedisData', 'fetch data stored in Redis', `key: ${key}`);

            const redisCache = new RedisCache();
            const data = await redisCache.get(key);
            if (data) {
                return res.status(200).json({
                    data,
                    success: true,
                });
            }
            return res.status(200).json({
                data: [],
                success: false,
            });
        } catch (error) {
            logError(
                ResponseStatus.INTERNAL_SERVER_ERROR,
                `${criticalPrefix} ${error.message}`,
                'fetchRedisData',
            );
            console.error(error);
            return res.status(ResponseStatus.INTERNAL_SERVER_ERROR).json({
                message: error.message,
                success: false,
            });
        }
    }

    public async storeDefaultSuggestions(req: any, res: Response) {
        try {
            log('storeDefaultSuggestions', 'store all suggestions', 'store all suggestions from database');

            const suggestions = await Suggestions.find();
            if (!suggestions.length) {
                await Suggestions.insertMany(defaultSuggestions);
            }

            return res.status(200).json({
                success: true,
            });
        } catch (error) {
            logError(
                ResponseStatus.INTERNAL_SERVER_ERROR,
                `${criticalPrefix} ${error.message}`,
                'storeDefaultSuggestions',
            );
            console.error(error);
            return res.status(ResponseStatus.INTERNAL_SERVER_ERROR).json({
                message: error.message,
                success: false,
            });
        }
    }

    public async fetchDefaultSuggestions(req: any, res: Response) {
        try {
            log('fetchDefaultSuggestions', 'fetch all suggestions', 'fetch all suggestions from database');

            // const key = constants.defaultSuggestionsKey;
            // const redisCache = new RedisCache();
            // const data = await redisCache.get(key);
            // if (data) {
            //     return res.status(200).json({
            //         suggestions: data,
            //         success: true,
            //     });
            // }
            const suggestions = await Suggestions.find();
            // if (suggestions.length) {
            //     const cacheData = suggestions;
            //     await redisCache.set(key, cacheData);
            //     return res.status(200).json({
            //         suggestions,
            //         success: true,
            //     });
            // }

            return res.status(200).json({
                suggestions,
                success: true,
            });
        } catch (error) {
            logError(
                ResponseStatus.INTERNAL_SERVER_ERROR,
                `${criticalPrefix} ${error.message}`,
                'fetchDefaultSuggestions',
            );
            console.error(error);
            return res.status(ResponseStatus.INTERNAL_SERVER_ERROR).json({
                message: error.message,
                success: false,
            });
        }
    }

}

export { ThreadController };
