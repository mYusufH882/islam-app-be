import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/user.model';
import RefreshToken from '../models/refreshToken.model';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.util';
import { AuthRequest } from '../middlewares/auth.middleware';

// Add 30 days to current date for refresh token expiry
const getRefreshTokenExpiry = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
      return;
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by the model hook
      name,
      role: 'user'
    });

    // Return user data and tokens
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email: username } // Allow login with email or username
        ]
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Generate tokens
    const { token, refreshToken } = generateTokens(user);

    // Save refresh token to database
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry()
    });

    // Update last login
    await user.update({ lastLogin: new Date() });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: requestToken } = req.body;

    if (!requestToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
      return;
    }

    // Find token in database
    const refreshTokenDoc = await RefreshToken.findOne({
      where: {
        token: requestToken,
        isRevoked: false,
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!refreshTokenDoc) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
      return;
    }

    // Verify token
    const decoded = verifyRefreshToken(requestToken);
    if (!decoded || typeof decoded !== 'object') {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
      return;
    }

    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Revoke old refresh token
    await refreshTokenDoc.update({ isRevoked: true });

    // Generate new tokens
    const { token, refreshToken: newRefreshToken } = generateTokens(user);

    // Save new refresh token
    await RefreshToken.create({
      token: newRefreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry()
    });

    res.json({
      success: true,
      data: {
        token,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
      return;
    }

    // Revoke the refresh token
    await RefreshToken.update(
      { isRevoked: true },
      {
        where: {
          token: refreshToken,
          userId: req.userId
        }
      }
    );

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    const user = await User.findByPk(req.userId);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    const { name, email, username } = req.body;
    
    // Find user
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Check if email or username already exists (if changing)
    if ((email && email !== user.email) || (username && username !== user.username)) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: email || '' },
            { username: username || '' }
          ],
          id: {
            [Op.ne]: req.userId
          }
        }
      });
      
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email or username already exists'
        });
        return;
      }
    }
    
    // Update user
    await user.update({
      name: name || user.name,
      email: email || user.email,
      username: username || user.username,
    });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
      return;
    }
    
    // Validate new password length
    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
      return;
    }
    
    // Find user
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Verify current password
    const isPasswordValid = await user.verifyPassword(currentPassword);
    
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }
    
    // Update password
    await user.update({ password: newPassword });
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};