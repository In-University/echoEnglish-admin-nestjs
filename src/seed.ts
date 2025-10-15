import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './database/role.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));

  try {
    // Create ADMIN role if not exists
    let adminRole = await roleModel.findOne({ name: 'ADMIN' });
    if (!adminRole) {
      adminRole = await roleModel.create({
        name: 'ADMIN',
        description: 'Administrator role with full access',
        permissions: ['all'],
      });
      console.log('✓ ADMIN role created');
    }

    // Check if admin user already exists
    const existingAdmin = await usersService.findByEmail('admin@gmail.com');

    if (!existingAdmin) {
      // Create default admin user with ADMIN role
      await usersService.create({
        fullName: 'Admin User',
        email: 'admin@gmail.com',
        password: '12341234',
        roles: [adminRole._id.toString()],
      });
      console.log('✓ Default admin user created successfully');
      console.log('  Email: admin@gmail.com');
      console.log('  Password: 12341234');
    } else {
      console.log('✓ Admin user already exists');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }

  await app.close();
}

bootstrap();
