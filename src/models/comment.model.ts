import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';
import Blog from './blog.model';

interface CommentAttributes {
  id?: number;
  content: string;
  blogId: number;
  userId: number;
  parentId?: number;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  isRead: boolean;
  adminNote?: string;
}

interface CommentCreationAttributes extends CommentAttributes {}

class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  public id!: number;
  public content!: string;
  public blogId!: number;
  public userId!: number;
  public parentId!: number;
  public status!: 'pending' | 'approved' | 'rejected' | 'spam';
  public isRead!: boolean;
  public adminNote!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations can be defined here
  public readonly user?: User;
  public readonly blog?: Blog;
  public readonly parent?: Comment;
  public readonly replies?: Comment[];
}

Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    blogId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Blog,
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'spam'),
      defaultValue: 'pending',
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    adminNote: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'comments',
    hooks: {
      afterCreate: async (comment) => {
        if (comment.status === 'approved') {
          // Update blog comment count if approved
          await Blog.increment('commentCount', {
            by: 1,
            where: { id: comment.blogId }
          });
        }
      },
      afterUpdate: async (comment) => {
        if (comment.changed('status')) {
          const previousStatus = comment.previous('status');
          const currentStatus = comment.status;
          
          // If comment status changed to approved from non-approved
          if (currentStatus === 'approved' && previousStatus !== 'approved') {
            await Blog.increment('commentCount', {
              by: 1,
              where: { id: comment.blogId }
            });
          } 
          // If comment status changed from approved to non-approved
          else if (previousStatus === 'approved' && currentStatus !== 'approved') {
            await Blog.decrement('commentCount', {
              by: 1,
              where: { id: comment.blogId }
            });
          }
        }
      },
      afterDestroy: async (comment) => {
        if (comment.status === 'approved') {
          // Decrease blog comment count if approved comment is deleted
          await Blog.decrement('commentCount', {
            by: 1,
            where: { id: comment.blogId }
          });
        }
      }
    }
  }
);

// Set up associations
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });

Comment.belongsTo(Blog, { foreignKey: 'blogId' });
Blog.hasMany(Comment, { foreignKey: 'blogId', as: 'comments' });

// Self-referencing association for comment replies
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });

export default Comment;