import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import User from '../models/user.model';

const SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

export const generateTokens = (user: User) => {
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    SECRET, // Using the same secret for both tokens
    { expiresIn: '30d' }
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