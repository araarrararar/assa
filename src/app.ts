import express, { Application } from 'express';
// import compression from 'compression';
import helmet from 'helmet';
// import dompurify from 'dompurify';
import { Routes } from './routes/Routes';
import { ResponseStatus } from './utils/ResponseStatus';
import { logError } from './utils/ErrorLogger';
import { routeNotFound, criticalPrefix } from './json/en.json';
import HealthRouter from './routes/HealthRouter';
import cors from 'cors';
import { loggingMiddleware } from './middleware/loggingMiddleware';


class App {
    public app: Application;
    public routePrv: Routes;
    
    constructor() {
        this.app = express();
        this.app.use(loggingMiddleware());
        this.app.use(helmet());
        // this.app.use(compression());
        this.app.use(express.json({ limit: '200mb' }));
        this.app.use(express.urlencoded({ limit: '200mb', extended: true }));
        this.app.use('*', cors({}));
        this.app.use(HealthRouter);
        this.routePrv = new Routes();
        this.routePrv.routes(this.app);
        this.app.use((request, response) => {
            // const sanitizedUrl = dompurify.sanitize(request.url);
            // const sanitizedErrorMessage = dompurify.sanitize(`${routeNotFound}`);

            const sanitizedUrl = request.url;
            const sanitizedErrorMessage = routeNotFound;

            logError(ResponseStatus.REQUEST_NOT_FOUND, `${criticalPrefix} ${sanitizedUrl}: ${sanitizedErrorMessage}`);

            response.status(ResponseStatus.REQUEST_NOT_FOUND).json({
                message: `${sanitizedUrl}: ${sanitizedErrorMessage}`,
            });
        });
    }
}

export const app = new App().app;
