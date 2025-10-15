import { PaymentGateway } from '../../common/enums/payment_gateway.enum';
import { PaymentStatus } from '../..//common/enums/payment_status.enum';
import { TransactionType } from '../../common/enums/transaction_type.enum';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { Payment, PaymentDocument } from '../../database/payment.schema';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

export interface PaymentQuery {
  status?: PaymentStatus;
  type?: TransactionType;
  gateway?: PaymentGateway;
  fromDate?: string;
  toDate?: string;
  userId?: string;
  sort?: 'asc' | 'desc';
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async findAll(query: PaymentQuery, page = 1, limit = 10) {
    const { status, type, gateway, sort, fromDate, toDate, userId } = query;
    const filter: FilterQuery<PaymentDocument> = {};

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid userId');
      }
      filter.user = new Types.ObjectId(userId);
    }
    console.log(filter.user);

    if (status) {
      if (Object.values(PaymentStatus).includes(status as PaymentStatus)) {
        filter.status = status;
      } else {
        throw new BadRequestException('Invalid payment status');
      }
    }

    if (type) {
      if (Object.values(TransactionType).includes(type as TransactionType)) {
        filter.type = type;
      } else {
        throw new BadRequestException('Invalid transaction type');
      }
    }

    if (gateway) {
      if (Object.values(PaymentGateway).includes(gateway as PaymentGateway)) {
        filter.paymentGateway = gateway;
      } else {
        throw new BadRequestException('Invalid payment gateway');
      }
    }

    if (fromDate || toDate) {
      const dateFilter: any = {};

      if (fromDate) {
        const from = new Date(fromDate);
        if (isNaN(from.getTime()))
          throw new BadRequestException('Invalid fromDate format');
        dateFilter.$gte = from;
      }

      if (toDate) {
        const to = new Date(toDate);
        if (isNaN(to.getTime()))
          throw new BadRequestException('Invalid toDate format');

        // set end of day để không bị mất dữ liệu trong ngày cuối
        to.setHours(23, 59, 59, 999);
        dateFilter.$lte = to;
      }

      filter.createdAt = dateFilter;
    }

    return PaginationHelper.paginate(this.paymentModel, filter, {
      page,
      limit,
      sort: { createdAt: sort === 'desc' ? -1 : 1 },
      select: '-payUrl -transactionRef -updatedAt -isDeleted -__v',
    });
  }
}
