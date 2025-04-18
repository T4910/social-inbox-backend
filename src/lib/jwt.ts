import { sign, verify } from "hono/jwt";

// Function to generate JWT token
export function generateToken(
  userId: string,
  currentOrgId: string,
  secret: string
) {
  return sign({ userId, currentOrgId }, secret);
}

type token = {
  userId: string;
  currentOrgId?: string;
};

// Function to verify JWT token
export function verifyToken(token: string, secret: string) {
  try {
    return verify(token, secret);
  } catch (error) {
    return null;
  }
}
