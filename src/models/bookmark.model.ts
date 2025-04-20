import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';

interface BookmarkAttributes {
  id?: number;
  userId: number;
  type: 'blog' | 'quran' | 'prayer';
  referenceId: string;
  notes?: string;
}

interface BookmarkCreationAttributes extends BookmarkAttributes {}

class Bookmark extends Model<BookmarkAttributes, BookmarkCreationAttributes> implements BookmarkAttributes {
  public id!: number;
  public userId!: number;
  public type!: 'blog' | 'quran' | 'prayer';
  public referenceId!: string;
  public notes!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Bookmark.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('blog', 'quran', 'prayer'),
      allowNull: false
    },
    referenceId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'ID reference (blog ID, surah:ayah, etc.)'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'bookmarks',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'type', 'referenceId']
      }
    ]
  }
);

// Set up associations
Bookmark.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Bookmark, { foreignKey: 'userId' });

export default Bookmark;