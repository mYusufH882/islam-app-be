import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';
import Category from './category.model';

interface BlogAttributes {
  id?: number;
  title: string;
  content: string;
  image?: string;
  status: 'draft' | 'published';
  publishedAt?: Date;
  userId: number;
  categoryId: number;
  commentCount?: number;
}

interface BlogCreationAttributes extends BlogAttributes {}

class Blog extends Model<BlogAttributes, BlogCreationAttributes> implements BlogAttributes {
  public id!: number;
  public title!: string;
  public content!: string;
  public image!: string;
  public status!: 'draft' | 'published';
  public publishedAt!: Date;
  public userId!: number;
  public categoryId!: number;
  public commentCount!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations can be defined here
  public readonly user?: User;
  public readonly category?: Category;
}

Blog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      defaultValue: 'draft'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Category,
        key: 'id'
      }
    },
    commentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'blogs',
    hooks: {
      beforeCreate: (blog) => {
        if (blog.status === 'published' && !blog.publishedAt) {
          blog.publishedAt = new Date();
        }
      },
      beforeUpdate: (blog) => {
        if (blog.changed('status') && blog.status === 'published' && !blog.publishedAt) {
          blog.publishedAt = new Date();
        }
      }
    }
  }
);

// Set up associations
Blog.belongsTo(User, { foreignKey: 'userId', as: 'author' });
User.hasMany(Blog, { foreignKey: 'userId', as: 'blogs' });

Blog.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Blog, { foreignKey: 'categoryId', as: 'blogs' });

export default Blog;