import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Category from '../models/category.model';
import { AuthRequest } from '../middlewares/auth.middleware';

// Get all categories
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.findAll({
      order: [['id', 'ASC']]
    });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create category (admin only)
export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Only admin can create categories'
      });
      return;
    }
    
    const { name, description } = req.body;
    
    // Check if category with same name already exists
    const existingCategory = await Category.findOne({
      where: {
        name: {
          [Op.eq]: name
        }
      }
    });
    
    if (existingCategory) {
      res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
      return;
    }
    
    const category = await Category.create({
      name,
      description
    });
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update category (admin only)
export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Only admin can update categories'
      });
      return;
    }
    
    const { id } = req.params;
    const { name, description } = req.body;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }
    
    // Check if another category with the same name exists
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        where: {
          name: {
            [Op.eq]: name
          },
          id: {
            [Op.ne]: id
          }
        }
      });
      
      if (existingCategory) {
        res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
        return;
      }
    }
    
    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description
    });
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete category (admin only)
export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Only admin can delete categories'
      });
      return;
    }
    
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }
    
    // Check if category is being used by any blogs
    const blogCount = await category.countBlogs();
    
    if (blogCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category: ${blogCount} blog(s) are using this category`
      });
      return;
    }
    
    await category.destroy();
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};