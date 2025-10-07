import { Controller, Get, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Response } from '../../common/interfaces/response.interface';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(@Query('search') search?: string): Promise<Response<any>> {
    const result = await this.rolesService.findAll(search);
    return {
      message: "Get role success",
      data: result
    }
  }
}
