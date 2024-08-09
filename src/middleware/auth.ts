// import axios, { Method } from 'axios';
import { Keycloak } from 'keycloak-backend';
import log from '../utils/log';
import { logError } from '../utils/ErrorLogger';
import { ResponseStatus } from '../utils/ResponseStatus';
import { criticalPrefix } from '../json/en.json';
import { getStringEnv } from '../utils/getEnvValue';
// import DumpCloudWatchLogs from 'utils/cloudwatch';

const KEYCLOAK__REALM = getStringEnv('KEYCLOAK__REALM');
const KEYCLOAK__BASE_URL = getStringEnv('KEYCLOAK__BASE_URL');
const KEYCLOAK__CLIENT_ID = getStringEnv('KEYCLOAK__CLIENT_ID');

const keycloak = new Keycloak({
    realm: KEYCLOAK__REALM,
    keycloak_base_url: KEYCLOAK__BASE_URL,
    client_id: KEYCLOAK__CLIENT_ID,
    is_legacy_endpoint: false,
});

export const streamAuthenticate = async (req, res, next) => {
    log('streamAuthenticate', 'authenticate request based on bearer token', '');
    // Bearer token is passed as an authorization header
    const url = req.url;
    const searchParams = url.split('?')[1];
    const params = new URLSearchParams(searchParams);
    await authenticator(
                `Bearer ${params.get('idToken')}`,
                params.get('clientId'),
                params.get('sessionId'),
                params.get('llmSessionId'),
                req, res, next);
};

export const authenticate = async (req, res, next) => {
    log('authenticate', 'authenticate request based on bearer token', '');
    // Bearer token is passed as an authorization header
    const authorizationHeader = req.headers.authorization;
    const clientId = req.headers.clientid;
    // const incomingClientId = req.query.clientId || req.headers.clientid;
    // const clientId = incomingClientId === '6655ca8cd49909179f9f424f' ? incomingClientId : '62612d25f0ae8fc4280f6890';
    const sessionId = req.query.sessionId || req.headers.sessionid;
    const llmSessionId = req.query.llmSessionId || req.headers.llmsessionid;
    console.log(authorizationHeader, clientId, sessionId, llmSessionId, "checking")
    await authenticator(authorizationHeader, clientId, sessionId, llmSessionId, req, res, next);
};

const authenticator = async (bearer, clientId, sessionId, llmSessionId, req, res, next) => {
    const currSessionId = sessionId || 'da6a1299-bd3e-4882-8654-bd78effe2f78';
    const currEmail = process.env.DEFAULT_USER_EMAIL || 'test.kavida@gmail.com';
    if (!clientId || !bearer) {
        const userInfo = {
            llmSessionId,
            scope: 'openid address microprofile-jwt phone email profile offline_access',
            sid: currSessionId,
            name: 'User Kavida',
            preferred_username: 'user',
            given_name: 'User',
            family_name: 'Kavida',
            email: `${currSessionId.replace('-', '_')}.${currEmail}`,
            clientId: clientId,
        };
        log('authenticate', 'default user is validated successfuly', `userInfo: ${JSON.stringify(userInfo)}`);
        req.user = userInfo;
        return next();
    }
    if (bearer && bearer.startsWith('Bearer ')) {
        try {
            // Specify the required scopes, including "openid"
            // const requiredScopes = "openid address microprofile-jwt phone email profile offline_access";

            // Authenticate and obtain an access token with the specified scopes
            // const accessToken = await keycloak.accessToken.get(requiredScopes);
            // console.log("access token: " + accessToken);

            // Validate the access token against the specified scopes and fetch user information
            const accessToken = bearer.split(' ')[1];
            const payload = await keycloak.jwt.verify(accessToken);

            const {
                content: {
                    scope, sid, name, preferred_username, given_name, family_name, email,
                },
            } = payload || {};
            const userInfo = {
                llmSessionId,
                scope, name, preferred_username, given_name, family_name, email,
                clientId, sid: sessionId || sid,
            };
            log('authenticate', 'token is validated successfuly', `userInfo: ${JSON.stringify(userInfo)}`);
            req.user = userInfo;
            next();
        } catch (error) {
            console.error(error);
            logError(
                error?.response?.status || ResponseStatus.INTERNAL_SERVER_ERROR,
                `${criticalPrefix} ${error.message}`,
                'authenticate',
            );
            res.status(error?.response?.status || ResponseStatus.INTERNAL_SERVER_ERROR).json({
                message: error.message,
                success: false,
            });
        }
    } else {
        // there is no token, don't process the request further
        res.status(ResponseStatus.UNAUTHENTICATED).json({
            message: 'Invalid or missing Bearer token in Authorization header',
            success: false,
        });
    }
};
