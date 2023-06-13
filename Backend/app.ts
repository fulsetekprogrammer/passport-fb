import cors from '@koa/cors';
import Koa from 'koa';
import Router from 'koa-router';
import { ApplicationError, errorHandler, isExpectedError } from './helper/error_handler';
import { attachLogger } from './helper/logger';
import { tokenValidation } from './middleware/jwt';
import { apikeyValidation } from './middleware/api_key';
import initializeModules from './modules';
import { Strategy as FacebookStrategy, Profile } from 'passport-facebook';

import passport from 'passport'
import { tChannelLink } from './models/channel';

const serve = require('koa-static');
const mount = require('koa-mount');

const app = new Koa();

// app.use(passport.session());
// app.use(bodyParser());

const router = new Router();

passport.use(
    new FacebookStrategy(

        {
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            callbackURL: process.env.CALLBACK_URL,
            profileFields: ['id', 'emails', 'name', 'accessToken']
        },
        async function (accessToken, refreshToken, profile: any, done: any) {

            console.log("fb stra")

            const userFB = {
                id: profile.id,
                full_name: profile.name,
                access_token: accessToken,
                email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '',

            };

            console.log(userFB, 'user FB : ')


            console.log(userFB, 'userfB coba')

            try {
                await tChannelLink.query().insert({
                    channel_id: 'facebook_page',
                    access_token: userFB.access_token,
                    is_active: true,
                    created_by: profile.email,
                    updated_by: profile.email
                });

                console.log('masuk db tclink')

            } catch (error) {
                return done(error);
            }

            console.log('passed fb stra')

            return done(null, userFB);
        }
    )
);

passport.serializeUser(function (userFB, done) {
    done(null, userFB.id);
});

passport.deserializeUser(function (id, done) {

    const userFB = {
        id: 'USER_ID',
        name: 'John Doe',
        email: 'johndoe@example.com',
        // Other user properties
    };

    done(null, userFB);

});

app.use(mount('/public', serve('./public')));

app.use(cors());

app.use(async (ctx, next) => {

    console.log('ctx pathap', ctx.path)

    if (ctx.path === '/auth/login/federated/facebook' || ctx.path == '/auth/oauth2/redirect/facebook') {
        console.log('harusnya masuk sini')
        await next();
    } else {
        await apikeyValidation(ctx, next);
    }
});

app.use(tokenValidation);

// app.use(apikeyValidation);

app.use(router.routes());

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        if (err.status === 401) {
            err = new ApplicationError({
                message: err.message,
                type: 'AuthenticationError',
                result: null,
                error: {
                    type: "",
                    message: ""
                }
            });
        }
        ctx.app.emit('error', err, ctx);
        if (isExpectedError(err)) {
            ctx.status = err.httpCode;
            ctx.body = {
                status: err.status || err.httpCode,
                message: err.name,
                result: null,
                error: {
                    type: err.status || err.httpCode,
                    message: err.message,
                    detail: err.detail
                }
            };
            return;
        } else {
            ctx.status = 500;

            let message = 'InternalServerError';

            if (err.stack) {
                message = err.stack.split('\n')[0];
            }

            ctx.body = {
                message,
                status: false
            };
            return;
        }
    }
});

app.use(passport.initialize());

initializeModules(router);
attachLogger(app);

// app.use(router.routes());
app.use(router.allowedMethods());


app.on('error', (err, ctx) => {
    errorHandler(err);
});

export default app;
