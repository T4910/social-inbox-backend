import { sign, verify } from 'hono/jwt';

// Function to generate JWT token
export function generateToken(userId: string, secret: string) {
  return sign({ userId }, secret);
}

// Function to verify JWT token
export function verifyToken(token: string, secret: string) {
  try {
    return verify(token, secret);
  } catch (error) {
    return null;
  }
}
