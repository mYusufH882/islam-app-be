import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import blogRoutes from './routes/blog.routes';
import { createAdminUser } from './seeds/admin.seed';
import { createDefaultCategories } from './seeds/category.seed';

// Load environment variables
dotenv.config();

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
app.use('/api', blogRoutes);

// Initialize Database
initDatabase().then(async() => {
    // Create admin user if it doesn't exist
    await createAdminUser();
    
    // Create default categories
    await createDefaultCategories();

    // Start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
});

export default app;