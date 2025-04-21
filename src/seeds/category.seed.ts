import Category from '../models/category.model';

export const createDefaultCategories = async () => {
  try {
    const categories = [
      {
        name: 'Al-Quran',
        description: 'Artikel tentang Al-Quran dan tafsirnya'
      },
      {
        name: 'Ibadah',
        description: 'Artikel tentang ibadah dalam Islam'
      },
      {
        name: 'Informasi',
        description: 'Informasi dan pengumuman terkini'
      },
      {
        name: 'Kisah',
        description: 'Kisah teladan dan sejarah Islam'
      }
    ];
    
    for (const category of categories) {
      const exists = await Category.findOne({
        where: { name: category.name }
      });
      
      if (!exists) {
        await Category.create(category);
        console.log(`Category "${category.name}" created`);
      } else {
        console.log(`Category "${category.name}" already exists`);
      }
    }
    
    console.log('Default categories created successfully');
  } catch (error) {
    console.error('Error creating default categories:', error);
  }
};