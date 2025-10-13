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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Response } from '../../common/interfaces/response.interface';
import e from 'express';
import { PaymentQuery, PaymentService } from './payment.service';
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {

    constructor(private readonly paymentService: PaymentService) {}

    @Get()
    async findAll(
        @Query() body : PaymentQuery, 
        @Query('page') page = 1,
        @Query('limit') limit = 10) : Promise<Response<any>> {
        const result = await this.paymentService.findAll(body, +page, +limit);
        return {
            message: 'Fetched payments successfully',
            data: result,
        };
    }
}