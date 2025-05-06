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

app.use('/uploads', (req, res, next) => {
    // Allow access from any origin
    res.header('Access-Control-Allow-Origin', '*');
    // Allow cross-origin resource sharing
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    // Allow cross-origin embedder policy
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    // Allow preflight requests
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      res.status(200).send();
      return; // Just return, don't pass a Response object
    }
    
    next();
});
  
// Serve static files from uploads directory
app.use('/uploads', express.static('public/uploads'));
  
// Then your CORS configuration for API routes
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = [frontendUrl];

// Add additional origins in development mode
if (process.env.NODE_ENV === 'development') {
    // Include localhost with different ports for development
    allowedOrigins.push('http://localhost:3001');
}
  
// Actually use the frontendUrl in CORS configuration
app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`CORS blocked request from origin: ${origin}`);
        // You can still allow the request but log it
        callback(null, true);
        
        // Or strictly enforce CORS if needed:
        // callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

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