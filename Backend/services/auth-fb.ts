import { appConfig } from "../config/app";
import { transaction } from "objection";

// ** middleware
import { generateToken, generateTokenOrg } from "../middleware/jwt";
// ** models
import { Users } from "../models/users";
import { UserLog } from "../models/user_log";

// ** third party package
import bcrypt from 'bcrypt';

// ** services
import { Organization, OrganizationMember } from "../models/organizations";
import { Strategy as FacebookStrategy, Profile } from 'passport-facebook';

import https from 'https'

import passport from 'passport';
import { tChannelLink } from "../models/channel";



export const login = async (ctx) => {
    try {
        const { email, password } = ctx.request.body;

        const user = await Users.query().where("email", email).where("deleted_at", null).execute();

        if (user.length === 0 || !(await bcrypt.compare(password, user[0].password))) {
            ctx.status = 401;
            return {
                status: 401,
                message: 'Email or password wrong',
                result: false
            };
        }

        console.log(user, 'user');
        console.log(user[0].role, 'user role');

        let token, refreshToken;

        if (user[0].role === 'super admin' || user[0].role === '' || user[0].role === null) {

            token = await generateToken(user[0].id, user[0].role, appConfig.secretAccessToken, appConfig.expAccessToken);
            refreshToken = await generateToken(user[0].id, user[0].role, appConfig.secretRefreshToken, appConfig.expRefreshToken);

        } else if (user[0].role === 'admin' || user[0].role === 'supervisor') {

            const userOrganization = await OrganizationMember.query().where("user_id", user[0].id).where("deleted_at", null).execute();
            const organizationActive = await Organization.query().where("id", userOrganization[0].organization_id).andWhere("status", 1).andWhere("deleted_at", null).execute();

            token = await generateTokenOrg(user[0].id, user[0].role, userOrganization[0].organization_id, appConfig.secretAccessToken, appConfig.expAccessToken);
            refreshToken = await generateTokenOrg(user[0].id, user[0].role, userOrganization[0].organization_id, appConfig.secretRefreshToken, appConfig.expRefreshToken);


            return {
                status: 204,
                message: 'Success! But, Organization is inactive. Please contact your supervisor!',
                result: {
                    token: token,
                    refresh_token: refreshToken
                }
            };


        }
        ctx.status = 200;
        return {
            status: 200,
            message: 'success',
            result: {
                token: token,
                refresh_token: refreshToken
            }
        };


    } catch (error) {
        console.log("error POST /login : ", error);
        ctx.status = 500;
        ctx.body = {
            status: 500,
            message: error ? error.toString() : "Failed to Login",
            result: false
        }

    }
}

export const loginWithFacebookAuth = async (ctx, next: () => Promise<any>) => {

    console.log("sini login with fb");
    return await passport.authenticate('facebook', {

        scope: ['pages_show_list',
            'pages_read_engagement',
            'pages_manage_metadata',
            'pages_read_user_content',
            'pages_manage_posts',
            'pages_read_engagement',
            'email']

    })(ctx, next);

};

export const loginCallback = async (ctx, res) => {

    console.log('facebook callback first')

    passport.authenticate('facebook', {

        successRedirect: 'http://localhost:3000/callback-fb-page',
        failureRedirect: process.env.FRONTEND_API + '/login'
    })(ctx, res)

}