import { createAction, props } from '@ngrx/store';
import { Book } from '../../models/book.model';

export const loadBooks = createAction(
  '[Books] Load Books',
  props<{ page?: number; pageSize?: number; genre?: string; language?: string }>()
);

export const loadBooksSuccess = createAction(
  '[Books] Load Books Success',
  props<{ items: Book[]; totalCount: number; page: number; pageSize: number }>()
);

export const loadBooksFailure = createAction(
  '[Books] Load Books Failure',
  props<{ error: string }>()
);

export const loadBookById = createAction(
  '[Books] Load Book By ID',
  props<{ id: string }>()
);

export const loadBookByIdSuccess = createAction(
  '[Books] Load Book By ID Success',
  props<{ book: Book }>()
);

export const loadBookByIdFailure = createAction(
  '[Books] Load Book By ID Failure',
  props<{ error: string }>()
);

export const searchBooks = createAction(
  '[Books] Search Books',
  props<{ query: string; page?: number; pageSize?: number }>()
);

export const searchBooksSuccess = createAction(
  '[Books] Search Books Success',
  props<{ items: Book[]; totalCount: number }>()
);

export const searchBooksFailure = createAction(
  '[Books] Search Books Failure',
  props<{ error: string }>()
);

