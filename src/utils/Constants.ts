export const constants = {
    maxRegenerationAttempts: 3,
    allowedThreadCount: 10,
    defaultPromptsKey: 'default-prompts-key',
    defaultSuggestionsKey: 'default-suggestions-key',
};

export const responseFeedbackEnum = {
    like: 1,
    dislike: 2,
};

export const regenerationFeedbackEnum = {
    better: 1,
    worse: 2,
    same: 3,
};

export const ACTIVE_CONNECTIONS_KEY = 'active-connections-redis-key';
