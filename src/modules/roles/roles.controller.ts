import { Controller, Get, Query } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.rolesService.findAll(search);
  }
}
