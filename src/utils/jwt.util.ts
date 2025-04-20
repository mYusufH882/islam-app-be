import jwt, { Secret, SignOptions, JwtPayload } from 'jsonwebtoken';
import User from '../models/user.model';

// Define proper types
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Define the payload interface
interface TokenPayload {
  id: number;
  username?: string;
  role?: string;
}

export const generateTokens = (user: User) => {
  // Access token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as any }  // Using type assertion to bypass TypeScript check
  );

  // Refresh token
  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN as any }  // Using type assertion to bypass TypeScript check
  );

  return { token, refreshToken };
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};