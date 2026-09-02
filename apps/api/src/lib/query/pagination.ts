export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function parsePaginationParams(params: {
  page?: string | number;
  limit?: string | number;
}): PaginationParams {
  const pageNumber = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const skip = (pageNumber - 1) * pageSize;

  return {
    page: pageNumber,
    limit: pageSize,
    skip,
  };
}

export function buildPaginatedResult<T>({
  data,
  totalCount,
  page,
  limit,
}: {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
}): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
