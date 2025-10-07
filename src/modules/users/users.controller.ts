import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Response } from '../../common/interfaces/response.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // Lấy danh sách user + search
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) : Promise<Response<any>> {
    const result = await this.usersService.findAll(search, +page, +limit);
    return {
      message: 'Fetched users successfully',
      data: result,
    };
  }
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<Response<any>> {
    const user = await this.usersService.create(createUserDto);
    return {
      message: 'User created successfully',
      data: user,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Response<any>> {
    const updated = await this.usersService.update(id, updateUserDto);
    return {
      message: 'User updated successfully',
      data: updated,
    };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query('hard') hard?: string,
  ): Promise<Response<void>> {
    await this.usersService.remove(id, hard === 'true');
    return {
      message: 'User deleted successfully',
    };
  }

  @Patch(':id/restore')
  async restore(@Param('id') id: string): Promise<Response<any>> {
    const restored = await this.usersService.restore(id);
    return {
      message: 'User restored successfully',
      data: restored,
    };
  }

  @Get('profile')
  async getProfile(@Request() req): Promise<Response<any>> {
    const user = await this.usersService.findById(req.user.userId);
    return {
      message: 'Fetched profile successfully',
      data: user,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Response<any>> {
    const user = await this.usersService.findById(id);
    return {
      message: 'Fetched user successfully',
      data: user,
    };
  }

  @Patch(':id/credits')
  async addCredits(
    @Param('id') id: string,
    @Body('amount') amount: number,
  ): Promise<Response<any>> {
    const updated = await this.usersService.addCredits(id, amount);
    return {
      message: 'Credits added successfully',
      data: updated,
    };
  }

  @Patch(':id/roles')
  async assignRoles(
    @Param('id') id: string,
    @Body('roleIds') roleIds: string[],
  ): Promise<Response<any>> {
    const updated = await this.usersService.assignRoles(id, roleIds);
    return {
      message: 'Roles assigned successfully',
      data: updated,
    };
  }
}