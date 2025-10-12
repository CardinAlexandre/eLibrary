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
  copiesAvailable: number;
  totalCopies: number;
  averageRating: number;
  reviewCount: number;
  typeSpecificData: Record<string, any>;
}

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userEmail: string;
  userName?: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  isOverdue: boolean;
  daysOverdue: number;
  lateFee: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

