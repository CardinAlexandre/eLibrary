import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectDarkMode } from './store/selectors/theme.selectors';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  darkMode$: Observable<boolean>;

  constructor(private store: Store) {
    this.darkMode$ = this.store.select(selectDarkMode);
  }

  ngOnInit(): void {
    this.darkMode$.subscribe(darkMode => {
      if (darkMode) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    });
  }
}

