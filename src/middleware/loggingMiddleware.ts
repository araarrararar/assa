// loggingMiddleware.ts

import morgan from 'morgan';
import os from 'os';
import express from 'express';
import { winstonStream } from '../utils/Logger';

// Define custom tokens for morgan
morgan.token('conversation-id', (req: express.Request) => {
    return req.headers['conversation-id'] || '-';
});
morgan.token('session-id', (req: express.Request) => {
    return req.headers['session-id'] || '-';
});
morgan.token('instance-id', (req: express.Request) => {
    return req.headers['instance-id'] || '-';
});
morgan.token('hostname', () => {
    return os.hostname();
});
morgan.token('pid', () => {
    return process.pid.toString();
});
//Json format for our given log
const jsonFormat = (tokens: any, req: express.Request, res: express.Response) => {
    return JSON.stringify({
        'remote-address': tokens['remote-addr'](req, res),
        time: tokens.date(req, res, 'iso'),
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        'http-version': tokens['http-version'](req, res),
        'status-code': tokens.status(req, res),
        'content-length': tokens.res(req, res, 'content-length'),
        referrer: tokens.referrer(req, res),
        'user-agent': tokens['user-agent'](req, res),
        'conversation-id': tokens['conversation-id'](req, res),
        'session-id': tokens['session-id'](req, res),
        hostname: tokens.hostname(req, res),
        instance: tokens['instance-id'](req, res),
        pid: tokens.pid(req, res),
    });
};

export const loggingMiddleware = () => {
    return morgan(jsonFormat, { stream: winstonStream });
};
