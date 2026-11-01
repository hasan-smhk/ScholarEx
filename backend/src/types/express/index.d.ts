import { JwtPayload } from 'jsonwebtoken';

declare module 'http' {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
      user?: {
        userId: string;
        email?: string;
        role?: string;
      };
    }
  }
}

export {};
