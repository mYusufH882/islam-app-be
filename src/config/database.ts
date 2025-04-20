import { Sequelize } from 'sequelize';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database synchronized');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export default sequelize;