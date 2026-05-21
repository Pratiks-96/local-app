import type { TokenPayload } from '../lib/jwt';

declare global {
  namespace Express {
    // JWT auth payload attached by authenticate middleware
    interface User extends TokenPayload {}
  }
}

export {};
