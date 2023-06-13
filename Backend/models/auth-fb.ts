import {module} from '../decorator/module';
import {post,get} from '../decorator/route';
import * as service from '../services/auth';
import { validator } from '../middleware/validation';
import { loginValidator } from '../validators/auth';

import { responseData } from "../helper/response_utils";

import passport from 'passport'

@module('/auth')
export default class AuthModule {

  @post('/login', [
    validator.body(loginValidator)
  ])
  async login(ctx: any) {
	 
    ctx.body = await service.login(ctx);
  }

  @get('/login/federated/facebook')
    async loginWithFacebook(ctx: any) {
      await service.loginWithFacebookAuth(ctx.req, ctx.res);
    }

    @get('/oauth2/redirect/facebook')
    async loginCallback(ctx: any) {
       await service.loginCallback(ctx.req, ctx.res);
    }

}
