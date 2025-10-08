export interface Book {
  id: string;
  title: string;
  authors: string[];
  isbn: string;
  bookType: string;
  publishedDate: string;
  pages: number;
  language: string;
  genre: string;
  tags: string[];
  description: string;
  coverUrl: string;
  isAvailable: boolean;
  averageRating: number;
  reviewCount: number;
  typeSpecificData: Record<string, any>;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

