import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email?: string;
  role: Role;
}

function signOptions(expiresIn: string): SignOptions {
  return { expiresIn: expiresIn as SignOptions['expiresIn'] };
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, signOptions(config.jwt.expiresIn));
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, signOptions(config.jwt.refreshExpiresIn));
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
}
