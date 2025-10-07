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
  ) {
    const result = await this.usersService.findAll(search, +page, +limit);
    return result;
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    // Password is already removed by schema toJSON transform
    return user;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Query('hard') hard?: string) {
    await this.usersService.remove(id, hard === 'true');
    return { message: 'User deleted successfully' };
  }

  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    return user;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id/credits')
  async addCredits(
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    return this.usersService.addCredits(id, amount);
  }

  @Patch(':id/roles')
  async assignRoles(
    @Param('id') id: string,
    @Body('roleIds') roleIds: string[],
  ) {
    return this.usersService.assignRoles(id, roleIds);
  }
}
