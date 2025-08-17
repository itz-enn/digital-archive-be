import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserPayload } from 'express';
import { Request } from 'express';
import * as cookie from 'cookie';
import envConfig from '../config/env.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        // Check for token in Authorization header
        const tokenFromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

        // Check for token in cookies
        const cookies = cookie.parse(req.headers.cookie || '');
        const tokenFromCookie = cookies.jwt;

        // Return the token if found in either location
        return tokenFromHeader || tokenFromCookie;
      },
      secretOrKey: envConfig.jwtSecret,
    });
  }

  async validate(payload: UserPayload) {
    return payload;
  }
}
