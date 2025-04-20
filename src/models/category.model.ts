import { Model, DataTypes, HasManyCountAssociationsMixin, Association } from 'sequelize';
import sequelize from '../config/database';
import Blog from './blog.model';

interface CategoryAttributes {
  id?: number;
  name: string;
  description?: string;
}

interface CategoryCreationAttributes extends CategoryAttributes {}

class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
    public name!: string;
    public description!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
        
        // Add association methods
    public countBlogs!: HasManyCountAssociationsMixin;
    
    // Define associations
    public readonly blogs?: Blog[];
    
    public static associations: {
        blogs: Association<Category, Blog>;
    };
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'categories'
  }
);

export default Category;