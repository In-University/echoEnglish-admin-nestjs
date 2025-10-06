import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private users: User[] = [];

  constructor() {
    // Initialize with a default admin user for testing
    this.createDefaultUser();
  }

  private async createDefaultUser() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    this.users.push({
      id: '1',
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      createdAt: new Date(),
    });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async create(email: string, password: string, name: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user: User = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
