import { PromoCode, PromoCodeDocument } from '../../database/promo.schema';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { PromoQueryDto } from './dto/promo_code_query.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';


@Injectable()
export class PromoService {
    constructor(
        @InjectModel(PromoCode.name) private promoModel: Model<PromoCodeDocument>,
    ) {}

    async findAll(query: PromoQueryDto, page: number, limit: number) {
        const { search, active, minDiscount, maxDiscount, sort, status, availability  } = query;
        const filter: FilterQuery<PromoCodeDocument> = {};
        if (search) {
            filter.code = { $regex: search, $options: 'i' };
        }
        if (typeof active === 'boolean') filter.active = active;
        if (minDiscount || maxDiscount) {
            filter.discount = {};
            if (minDiscount) filter.discount.$gte = Number(minDiscount);
            if (maxDiscount) filter.discount.$lte = Number(maxDiscount);
        }

        if (status === 'expired') {
            filter.expiration = { $lt: new Date() };
        } 
        else if (status === 'valid') {
            filter.$or = [
                { expiration: { $gte: new Date() } },
                { expiration: { $exists: false } }, // chưa có ngày hết hạn
            ];
        }

        if (availability === 'out') {
            filter.$expr = { $gte: ['$usedCount', '$usageLimit'] };
        } 
        else if (availability === 'available') {
            filter.$or = [
                { usageLimit: { $exists: false } },
                { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
            ];
        }


        return PaginationHelper.paginate(
            this.promoModel,
            filter,
            {
            page,
            limit,
            sort: { createdAt: sort === 'desc' ? -1 : 1 },
            },
        );
    }

    async create(data: Partial<PromoCode>) {
        const existing = await this.promoModel.findOne({ code: data.code.toUpperCase() });
        if (existing) {
            throw new BadRequestException('Code already exists');
        }
        const promo = new this.promoModel(data);
        return promo.save();
    }
  
    async update(id: string, data: Partial<PromoCode>) {
        const updated = await this.promoModel.findByIdAndUpdate(id, data, { new: true });
        if (!updated) {
            throw new NotFoundException('Promo code not found');
        }
        return updated;
    }

    async delete(id: string) {
        const deleted = await this.promoModel.findByIdAndDelete(id);
        if (!deleted) {
            throw new NotFoundException('Promo code not found');
        }
    }
}


