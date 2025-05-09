import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';

interface UserTrustAttributes {
  id?: number;
  userId: number;
  trustLevel: 'new' | 'trusted';
  approvedComments: number;
  rejectedComments: number;
  lastStatusChange?: Date;
}

interface UserTrustCreationAttributes extends UserTrustAttributes {}

class UserTrust extends Model<UserTrustAttributes, UserTrustCreationAttributes> implements UserTrustAttributes {
  public id!: number;
  public userId!: number;
  public trustLevel!: 'new' | 'trusted';
  public approvedComments!: number;
  public rejectedComments!: number;
  public lastStatusChange!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association
  public readonly user?: User;
}

UserTrust.init(
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
      },
      unique: true
    },
    trustLevel: {
      type: DataTypes.ENUM('new', 'trusted'),
      defaultValue: 'new',
      allowNull: false
    },
    approvedComments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    rejectedComments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    lastStatusChange: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'user_trusts',
    hooks: {
      beforeUpdate: async (userTrust) => {
        if (userTrust.changed('trustLevel')) {
          userTrust.lastStatusChange = new Date();
        }
      }
    }
  }
);

// Set up associations
UserTrust.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(UserTrust, { foreignKey: 'userId' });

export default UserTrust;