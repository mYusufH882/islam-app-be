import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';

interface UserAttributes {
  id?: number;
  username: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  lastLogin?: Date;
}

interface UserCreationAttributes extends UserAttributes {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public name!: string;
  public role!: 'admin' | 'user';
  public lastLogin!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Method untuk verifikasi password
  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      defaultValue: 'user'
    },
    lastLogin: {
      type: DataTypes.DATE
    }
  },
  {
    sequelize,
    tableName: 'users',
    hooks: {
      // Hash password sebelum menyimpan ke database
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 10);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  }
);

export default User;