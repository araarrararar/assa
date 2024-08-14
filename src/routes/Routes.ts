import { Request, Response } from 'express';
import { SocketController } from '../api/controllers/SocketController';
import { message } from '../json/en.json';
import { authenticate, streamAuthenticate } from '../middleware/auth';
import { ThreadController } from '../api/controllers/ThreadController';

class Routes {
    private readonly socketController: SocketController;
    private readonly threadController: ThreadController;

    constructor() {
        this.socketController = new SocketController();
        this.threadController = new ThreadController();
    }

    public routes(app): void {
        // const prefix = process.env.ROUTE_PREFIX || '';

        app.route('/')
            .get(this.socketController.LLMresponse,(_request: Request, response: Response) => {
                response.status(200).send({ message, success: true });
            });

        app.route('/connect')
            .get(streamAuthenticate, this.socketController.setConnectionStream);

        app.route('/send-message-to-client')
            .get(this.socketController.sendMessage);

        app.route('/send-message-to-role/:role')
            .get(this.socketController.sendMessageToRole);

        app.route('/send-message-to-user/:userId')
            .get(this.socketController.sendMessageToUser);
     //   app.route('/send-message-to-server').post(this.socketController.sendMessageToServer)

        app.route('/fetch/prompts')
            .get(this.threadController.fetchAllDefaultPrompts);
        // right code
        // app.route('/fetch/response/stream')
        //     .post(authenticate, this.socketController.streamLLMResponse);
        
        app.route('/fetch/response/stream')
            .post(this.socketController.LLMresponse);

        app.route('/update/thread')
            .post(authenticate, this.threadController.updateThreadData);

        app.route('/fetch/threads')
            .post(authenticate, this.threadController.fetchSavedThreads);

        app.route('/prompt/feedback')
            .post(authenticate, this.threadController.feedbackPrompt);

        app.route('/fetch/data/thread')
            .post(authenticate, this.threadController.fetchThreadData);

        app.route('/fetch/redis-data/:key')
            .get(authenticate, this.threadController.fetchRedisData);
        app.route('/store/suggestions')
            .post(this.threadController.storeDefaultSuggestions);
        app.route('/fetch/suggestions')
            .get(authenticate, this.threadController.fetchDefaultSuggestions);
        app.route('/end/stream')
            .post(authenticate, this.socketController.stopResponseStream);
    }
}

export { Routes };
