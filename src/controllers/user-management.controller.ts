import { Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';

// Get all users (excluding admins)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure the requester is an admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    const { 
      search, 
      status,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build the where clause
    const whereClause: any = {
      // Only fetch users with 'user' role, excluding admins
      role: 'user'
    };
    
    // Add search functionality if provided
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Add status filter if provided
    if (status) {
      // Assuming you have an 'active' or 'status' field in your user model
      whereClause.status = status;
    }

    // Find users with pagination
    const { rows: users, count } = await User.findAndCountAll({
      where: whereClause,
      attributes: { 
        exclude: ['password'] // Don't send password data
      },
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get user by ID
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure the requester is an admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    const { id } = req.params;
    
    const user = await User.findOne({
      where: { 
        id,
        role: 'user' // Only fetch users with 'user' role
      },
      attributes: { 
        exclude: ['password'] 
      }
    });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create new user
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure the requester is an admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    const { username, email, password, name, status } = req.body;
    
    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
      return;
    }
    
    // Create the user - always as a 'user' role
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by the User model hook
      name,
      role: 'user', // Enforce 'user' role
      status: status || 'active' // Default to active if not provided
    });
    
    // Return the created user without the password
    const { password: _, ...userData } = user.toJSON();
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userData
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure the requester is an admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    const { id } = req.params;
    const { username, email, name, status, password } = req.body;
    
    // Check if the target user exists and is not an admin
    const user = await User.findOne({
      where: { 
        id, 
        role: 'user' // Only allow updates to 'user' role accounts
      }
    });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Check if updated username or email conflicts with existing users
    if (username || email) {
      const whereClause: any = {
        id: { [Op.ne]: id }, // Exclude the current user
        [Op.or]: [] as any[]
      };
      
      if (username) {
        whereClause[Op.or].push({ username });
      }
      
      if (email) {
        whereClause[Op.or].push({ email });
      }
      
      // Only check if we have conditions to check
      if (whereClause[Op.or].length > 0) {
        const existingUser = await User.findOne({ where: whereClause });
        
        if (existingUser) {
          res.status(400).json({
            success: false,
            message: 'Username or email already exists'
          });
          return;
        }
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (password) updateData.password = password; // Will be hashed by the User model hook
    
    // Update the user
    await user.update(updateData);
    
    // Fetch the updated user
    const updatedUser = await User.findOne({
      where: { id },
      attributes: { exclude: ['password'] }
    });
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete user
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure the requester is an admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    const { id } = req.params;
    
    // Check if the target user exists and is not an admin
    const user = await User.findOne({
      where: { 
        id, 
        role: 'user' // Only allow deletion of 'user' role accounts
      }
    });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Delete the user
    await user.destroy();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update user status (activate/deactivate)
export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure the requester is an admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Valid status (active/inactive) is required'
      });
      return;
    }
    
    // Check if the target user exists and is not an admin
    const user = await User.findOne({
      where: { 
        id, 
        role: 'user' // Only allow updates to 'user' role accounts
      }
    });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Update the user status
    await user.update({ status });
    
    res.json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};