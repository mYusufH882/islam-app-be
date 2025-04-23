import jwt, { SignOptions, JwtPayload, Secret } from 'jsonwebtoken';
import User from '../models/user.model';

const SECRET: Secret = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export const generateTokens = (user: User) => {
  // Use type assertion to help TypeScript understand the type
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    SECRET, // Using the same secret for both tokens
    { expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  return { token, refreshToken };
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET);
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