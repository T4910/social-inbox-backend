import jwt from "jsonwebtoken";

const JWT_SECRET_KEY = "your-secret-key"; // Change this to a secure, random key

// Function to generate JWT token
export function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET_KEY, { expiresIn: "1h" });
}

// Function to verify JWT token
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET_KEY);
  } catch (error) {
    return null;
  }
}
