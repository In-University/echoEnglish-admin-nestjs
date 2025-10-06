import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    // Check if admin user already exists
    const existingAdmin = await usersService.findByEmail('admin@example.com');

    if (!existingAdmin) {
      // Create default admin user
      await usersService.create({
        fullName: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
      });
      console.log('✓ Default admin user created successfully');
      console.log('  Email: admin@example.com');
      console.log('  Password: admin123');
    } else {
      console.log('✓ Admin user already exists');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }

  await app.close();
}

bootstrap();
