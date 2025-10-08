import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { BooksService } from '../../services/books.service';
import * as BooksActions from '../actions/books.actions';

@Injectable()
export class BooksEffects {
  loadBooks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BooksActions.loadBooks),
      switchMap(({ page, pageSize, genre, language }) =>
        this.booksService.getBooks(page, pageSize, genre, language).pipe(
          map((response) =>
            BooksActions.loadBooksSuccess({
              items: response.items,
              totalCount: response.totalCount,
              page: response.page,
              pageSize: response.pageSize
            })
          ),
          catchError((error) =>
            of(BooksActions.loadBooksFailure({ error: error.message }))
          )
        )
      )
    )
  );

  loadBookById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BooksActions.loadBookById),
      switchMap(({ id }) =>
        this.booksService.getBookById(id).pipe(
          map((book) => BooksActions.loadBookByIdSuccess({ book })),
          catchError((error) =>
            of(BooksActions.loadBookByIdFailure({ error: error.message }))
          )
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private booksService: BooksService
  ) {}
}

