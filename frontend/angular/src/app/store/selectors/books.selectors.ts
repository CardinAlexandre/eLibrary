import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BooksState } from '../reducers/books.reducer';

export const selectBooksState = createFeatureSelector<BooksState>('books');

export const selectBooks = createSelector(
  selectBooksState,
  (state) => state.items
);

export const selectCurrentBook = createSelector(
  selectBooksState,
  (state) => state.currentBook
);

export const selectBooksLoading = createSelector(
  selectBooksState,
  (state) => state.loading
);

export const selectBooksError = createSelector(
  selectBooksState,
  (state) => state.error
);

export const selectTotalCount = createSelector(
  selectBooksState,
  (state) => state.totalCount
);

