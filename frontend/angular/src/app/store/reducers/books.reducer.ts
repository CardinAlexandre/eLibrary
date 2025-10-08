import { createReducer, on } from '@ngrx/store';
import { Book } from '../../models/book.model';
import * as BooksActions from '../actions/books.actions';

export interface BooksState {
  items: Book[];
  currentBook: Book | null;
  totalCount: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
}

const initialState: BooksState = {
  items: [],
  currentBook: null,
  totalCount: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  error: null
};

export const booksReducer = createReducer(
  initialState,
  on(BooksActions.loadBooks, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(BooksActions.loadBooksSuccess, (state, { items, totalCount, page, pageSize }) => ({
    ...state,
    items,
    totalCount,
    page,
    pageSize,
    loading: false
  })),
  on(BooksActions.loadBooksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(BooksActions.loadBookById, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(BooksActions.loadBookByIdSuccess, (state, { book }) => ({
    ...state,
    currentBook: book,
    loading: false
  })),
  on(BooksActions.loadBookByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);

