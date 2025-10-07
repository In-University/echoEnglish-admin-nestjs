import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../../database/role.schema';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  async findAll(search?: string): Promise<Role[]> {
    const query: any = {};
    if (search) {
      query.name = new RegExp(search, 'i');
    }

    return this.roleModel.find(query).select('name description').exec();
  }
}
