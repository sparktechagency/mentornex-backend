export type IPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;

  sortOrder?: 'asc' | 'desc';
};

export const paginationConstants = ['page', 'limit', 'sortBy', 'sortOrder'];
