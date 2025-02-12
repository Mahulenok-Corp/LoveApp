import {JWTPayload, jwtVerify, SignJWT} from 'jose';
import { AuthToken, PayloadToken } from './types.t.js';


export async function verifyToken(token: string): Promise<JWTPayload | null> {
    const encoder = new TextEncoder();
    const key = encoder.encode(process.env.SECRET_AUTH_KEY);
    try {
      const {payload} = await jwtVerify(token, key);
      return payload;
    } catch (e) {
      console.log(e)
      return null;
    }
  }
  


  
export const createAuthToken = buildCreateToken<AuthToken>('1Y');
export const createPayloadToken = buildCreateToken<PayloadToken>('15m');


function buildCreateToken<T extends JWTPayload>(expirationTime: string): (payload: T) => Promise<string> {
    return async (payload: T) => {
      const encoder = new TextEncoder();
      const key = encoder.encode(process.env.SECRET_AUTH_KEY);
      return new SignJWT(payload)
        .setProtectedHeader({alg: 'HS256'})
        .setIssuedAt()
        .setExpirationTime(expirationTime)
        .sign(key);
    };
  }