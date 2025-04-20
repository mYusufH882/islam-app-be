import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';

interface RefreshTokenAttributes {
  id?: number;
  token: string;
  userId: number;
  expiresAt: Date;
  isRevoked?: boolean;
}

interface RefreshTokenCreationAttributes extends RefreshTokenAttributes {}

class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes> implements RefreshTokenAttributes {
  public id!: number;
  public token!: string;
  public userId!: number;
  public expiresAt!: Date;
  public isRevoked!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    tableName: 'refresh_tokens'
  }
);

// Relasi dengan user
RefreshToken.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RefreshToken, { foreignKey: 'userId' });

export default RefreshToken;