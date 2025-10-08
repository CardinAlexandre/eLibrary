import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Book, PagedResult } from '../../models/book.model';
import { loadBooks } from '../../store/actions/books.actions';
import { selectBooks, selectBooksLoading } from '../../store/selectors/books.selectors';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  books$: Observable<Book[]>;
  loading$: Observable<boolean>;

  constructor(private store: Store) {
    this.books$ = this.store.select(selectBooks);
    this.loading$ = this.store.select(selectBooksLoading);
  }

  ngOnInit(): void {
    this.store.dispatch(loadBooks({ page: 1, pageSize: 20 }));
  }
}

