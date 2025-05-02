import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { initDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import userManagementRoutes from './routes/user-management.routes';
import blogRoutes from './routes/blog.routes';
import quranRoutes from './routes/quran.routes';
import prayerRoutes from './routes/prayer.routes';
import bookmarkRoutes from './routes/bookmark.routes';
import { createAdminUser } from './seeds/admin.seed';
import { createDefaultCategories } from './seeds/category.seed';
import User from './models/user.model';
import Category from './models/category.model';

// Initialize express
const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Pemuda Persis Cimsel API!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin', userManagementRoutes);
app.use('/api', blogRoutes);
app.use('/api/quran', quranRoutes);
app.use('/api/prayer', prayerRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

// Initialize Database
initDatabase().then(async() => {
    // Check if database needs seeding
    const shouldSeed = await checkIfSeedingNeeded();
    
    if (shouldSeed) {
        // Create admin user if it doesn't exist
        await createAdminUser();
        
        // Create default categories
        await createDefaultCategories();
    } else {
        console.log('Database already initialized, skipping seeding.');
    }

    // Start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
});

/**
 * Check if the database needs to be seeded.
 * Returns true if seeding is needed, false otherwise.
 */
async function checkIfSeedingNeeded(): Promise<boolean> {
    try {
        // Check if admin user exists
        const adminCount = await User.count({
            where: {
                role: 'admin'
            }
        });
        
        // Check if categories exist
        const categoryCount = await Category.count();
        
        // If there are no admin users and no categories, we need to seed
        return adminCount === 0 || categoryCount === 0;
    } catch (error) {
        console.error('Error checking database state:', error);
        // If there's an error, assume we need to seed (safer approach)
        return true;
    }
}

export default app;