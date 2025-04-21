import User from '../models/user.model';

export const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({
      where: { username: 'admin' }
    });

    if (!adminExists) {
      // Create admin user
      await User.create({
        username: 'admin',
        email: 'admincimsel@mail.com',
        password: 'Admin123!',  // Will be hashed by model hook
        name: 'Admin',
        role: 'admin'
      });
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};