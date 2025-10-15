import { Document, Model, PopulateOptions } from 'mongoose';
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  select?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class PaginationHelper {
  static async paginate<T>(
    model: Model<T>,
    query: Record<string, unknown> = {},
    options: PaginationOptions = {},
    populate?: PopulateOptions | PopulateOptions[],
  ): Promise<PaginationResult<T>> {
    const page = Math.max(Number(options.page) || 1, 1);
    const limit = Math.max(Number(options.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const sort = options.sort || { createdAt: -1 };
    const select = options.select ?? '-__v';

    const [data, total] = await Promise.all([
      model
        .find(query)
        .populate(populate || [])
        .select(select)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      model.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as T[],
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}
