import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../database/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async updatePassword(email: string, newPassword: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await this.userModel
      .findOneAndUpdate(
        { email, isDeleted: false },
        { $set: { password: hashedPassword } },
        { new: true },
      )
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email.toLowerCase(),
      isDeleted: false,
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
    });

    return user.save();
  }

  async findAll(
    search?: string,
    page = 1,
    limit = 10,
  ): Promise<{
    data: User[];
    total: number;
    totalPages: number;
    page: number;
  }> {
    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.userModel
        .find(query)
        .populate('roles')
        .select('-password')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    };
  }

  async findById(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userModel
      .findOne({ _id: id, isDeleted: false })
      .populate('roles')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), isDeleted: false })
      .populate('roles')
      .exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user ID');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: updateUserDto },
        { new: true, runValidators: true },
      )
      .populate('roles')
      .select('-password')
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(id: string, hardDelete = false): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user ID');
    }

    if (hardDelete) {
      const res = await this.userModel.deleteOne({ _id: id }).exec();
      if (res.deletedCount === 0) throw new NotFoundException('User not found');
      return;
    }

    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true } },
      )
      .exec();

    if (!user) throw new NotFoundException('User not found');
  }

  async restore(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user ID');
    }

    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, isDeleted: true },
        { $set: { isDeleted: false } },
        { new: true },
      )
      .populate('roles')
      .select('-password')
      .exec();

    if (!user) throw new NotFoundException('User not found or not deleted');
    return user;
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async addCredits(id: string, amount: number): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $inc: { credits: amount } },
        { new: true },
      )
      .populate('roles')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async assignRoles(id: string, roleIds: string[]): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }

    // Validate all role IDs
    const validRoleIds = roleIds.every((roleId) =>
      Types.ObjectId.isValid(roleId),
    );
    if (!validRoleIds) {
      throw new ConflictException('Invalid role IDs');
    }

    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { roles: roleIds.map((id) => new Types.ObjectId(id)) } },
        { new: true },
      )
      .populate('roles')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
