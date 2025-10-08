import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Book } from '../../models/book.model';
import { loadBookById } from '../../store/actions/books.actions';
import { selectCurrentBook, selectBooksLoading } from '../../store/selectors/books.selectors';

@Component({
  selector: 'app-book-details',
  templateUrl: './book-details.component.html',
  styleUrls: ['./book-details.component.css']
})
export class BookDetailsComponent implements OnInit {
  book$: Observable<Book | null>;
  loading$: Observable<boolean>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store
  ) {
    this.book$ = this.store.select(selectCurrentBook);
    this.loading$ = this.store.select(selectBooksLoading);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.dispatch(loadBookById({ id }));
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}

