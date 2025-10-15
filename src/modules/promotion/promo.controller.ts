import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PromoService } from './promo.service';
import { PromoCode } from '../../database/promo.schema';
import { PromoQueryDto } from './dto/promo_code_query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Response } from '../../common/interfaces/response.interface';
@Controller('promo')
@UseGuards(JwtAuthGuard)
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  @Get()
  async findAll(@Query() body: PromoQueryDto): Promise<Response<any>> {
    const { page = 1, limit = 10, ...filters } = body;
    const result = await this.promoService.findAll(filters, +page, +limit);
    return {
      message: 'Fetched promo codes successfully',
      data: result,
    };
  }

  @Post()
  async create(
    @Body() createPromoDto: Partial<PromoCode>,
  ): Promise<Response<any>> {
    const promo = await this.promoService.create(createPromoDto);
    return {
      message: 'Promo code created successfully',
      data: promo,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePromoDto: Partial<PromoCode>,
  ): Promise<Response<any>> {
    const updated = await this.promoService.update(id, updatePromoDto);
    return {
      message: 'Promo code updated successfully',
      data: updated,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Response<any>> {
    await this.promoService.delete(id);
    return {
      message: 'Promo code deleted successfully',
    };
  }
}
