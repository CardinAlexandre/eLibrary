import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectDarkMode } from '../../store/selectors/theme.selectors';
import { toggleDarkMode } from '../../store/actions/theme.actions';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  darkMode$: Observable<boolean>;

  constructor(private store: Store) {
    this.darkMode$ = this.store.select(selectDarkMode);
  }

  toggleTheme(): void {
    this.store.dispatch(toggleDarkMode());
  }
}

