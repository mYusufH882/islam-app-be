// src/controllers/dashboard.controller.ts

import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Blog from '../models/blog.model';
import User from '../models/user.model';
import Bookmark from '../models/bookmark.model';
import Category from '../models/category.model';
import sequelize from '../config/database';
import { Op, QueryTypes, literal } from 'sequelize';

// Fungsi untuk mendapatkan statistik dashboard
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Cek apakah user adalah admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    // Get blog stats
    const totalBlogs = await Blog.count();
    const publishedBlogs = await Blog.count({ where: { status: 'published' } });
    const draftBlogs = await Blog.count({ where: { status: 'draft' } });

    // Get user stats
    const totalUsers = await User.count({ where: { role: 'user' } });
    const activeUsers = await User.count({ where: { role: 'user', status: 'active' } });
    const inactiveUsers = await User.count({ where: { role: 'user', status: 'inactive' } });

    // Get bookmark stats
    const totalBookmarks = await Bookmark.count();
    
    // Get bookmarks for current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Gunakan literal untuk akses createdAt karena tidak terdefinisi dalam interface
    const bookmarksThisMonth = await Bookmark.count({
      where: {
        [Op.and]: [
          literal(`"Bookmark"."createdAt" >= '${firstDayOfMonth.toISOString()}'`)
        ]
      }
    });

    res.json({
      success: true,
      data: {
        blogStats: {
          total: totalBlogs,
          published: publishedBlogs,
          draft: draftBlogs
        },
        userStats: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers
        },
        bookmarkStats: {
          total: totalBookmarks,
          thisMonth: bookmarksThisMonth
        },
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Fungsi untuk mendapatkan data grafik dashboard
export const getChartData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Cek apakah user adalah admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    // Get last 6 months
    const months = [];
    const monthsData = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      months.push(monthName);
      monthsData.push({
        month: monthName,
        year: month.getFullYear(),
        monthIndex: month.getMonth()
      });
    }

    // Get blog data per month
    const blogData = [];
    
    for (const monthData of monthsData) {
      const startDate = new Date(monthData.year, monthData.monthIndex, 1);
      const endDate = new Date(monthData.year, monthData.monthIndex + 1, 0);
      
      // Gunakan literal untuk query berdasarkan createdAt
      const count = await Blog.count({
        where: {
          [Op.and]: [
            literal(`"Blog"."createdAt" >= '${startDate.toISOString()}'`),
            literal(`"Blog"."createdAt" <= '${endDate.toISOString()}'`)
          ]
        }
      });
      
      blogData.push(count);
    }

    // Get user data per month
    const userData = [];
    
    for (const monthData of monthsData) {
      const startDate = new Date(monthData.year, monthData.monthIndex, 1);
      const endDate = new Date(monthData.year, monthData.monthIndex + 1, 0);
      
      // Gunakan literal untuk query berdasarkan createdAt dan role
      const count = await User.count({
        where: {
          [Op.and]: [
            literal(`"User"."createdAt" >= '${startDate.toISOString()}'`),
            literal(`"User"."createdAt" <= '${endDate.toISOString()}'`),
            { role: 'user' }
          ]
        }
      });
      
      userData.push(count);
    }

    // Get category distribution
    const categories = await Category.findAll({
      attributes: [
        'id',
        'name',
        [sequelize.fn('COUNT', sequelize.col('blogs.id')), 'blogCount']
      ],
      include: [{
        model: Blog,
        as: 'blogs',
        attributes: []
      }],
      group: ['Category.id'],
      raw: true
    });
    
    const totalBlogCount = await Blog.count();
    
    const categoryDistribution = categories.map((category: any) => {
      const count = parseInt(category.blogCount, 10) || 0;
      const percentage = totalBlogCount > 0 ? (count / totalBlogCount) * 100 : 0;
      
      return {
        name: category.name,
        count,
        percentage: parseFloat(percentage.toFixed(1))
      };
    }).sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: {
        blogChartData: {
          labels: months,
          data: blogData
        },
        userChartData: {
          labels: months,
          data: userData
        },
        categoryDistribution
      }
    });
  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Fungsi untuk mendapatkan aktivitas terbaru
export const getRecentActivities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Cek apakah user adalah admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    // Ambil 5 blog terbaru
    const recentBlogs = await Blog.findAll({
      include: [{
        model: User,
        as: 'author',  // Pastikan relasi 'author' terdefinisi di Blog model
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Ambil 5 user terbaru
    const recentUsers = await User.findAll({
      where: { role: 'user' },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Ambil 5 bookmark terbaru
    const recentBookmarks = await Bookmark.findAll({
      include: [{
        model: User,  // Pastikan relasi dengan User terdefinisi di Bookmark model
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Gabungkan semua aktivitas dan urutkan berdasarkan waktu
    const activities = [
      // Blog activities
      ...recentBlogs.map(blog => {
        // Gunakan type casting untuk mengakses user yang berelasi
        const authorModel = blog.get('author') as User | undefined;
        const authorName = authorModel?.name || 'Admin';
        
        return {
          id: `blog-${blog.id}`,
          title: `Artikel ${blog.status === 'published' ? 'Dipublikasikan' : 'Draft'}: "${blog.title}"`,
          type: 'Blog',
          user: authorName,
          date: blog.createdAt,
          link: `/admin/blog/${blog.id}`
        };
      }),
      
      // User activities
      ...recentUsers.map(user => ({
        id: `user-${user.id}`,
        title: `Pendaftaran Pengguna Baru: ${user.name}`,
        type: 'User',
        user: user.name,
        date: user.createdAt,
        link: `/admin/users`
      })),
      
      // Bookmark activities
      ...recentBookmarks.map(bookmark => {
        // Gunakan type casting untuk mengakses user yang berelasi
        const userModel = bookmark.get('User') as User | undefined;
        const userName = userModel?.name || 'Pengguna';
        
        return {
          id: `bookmark-${bookmark.id}`,
          title: `Bookmark Baru pada ${bookmark.type === 'quran' ? 'Al-Quran' : 'Blog'}`,
          type: 'Bookmark',
          user: userName,
          date: bookmark.createdAt,
          link: bookmark.type === 'quran' ? `/admin/quran` : `/admin/blog`
        };
      })
    ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
    .map(activity => ({
      ...activity,
      date: new Date(activity.date).toISOString()
    }));

    res.json({
      success: true,
      data: {
        activities
      }
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};