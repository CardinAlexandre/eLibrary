import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { selectDarkMode } from '../../store/selectors/theme.selectors';
import { selectIsAuthenticated, selectUser } from '../../store/selectors/auth.selectors';
import { toggleDarkMode } from '../../store/actions/theme.actions';
import { logout as logoutAction } from '../../store/actions/auth.actions';

interface DecodedToken {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string[];
}

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, OnDestroy {
  darkMode$: Observable<boolean>;
  isAuthenticated$: Observable<boolean>;
  user$: Observable<any>;
  
  isAuthenticated = false;
  user: any = null;

  private subscriptions = new Subscription();

  constructor(private store: Store, private router: Router) {
    this.darkMode$ = this.store.select(selectDarkMode);
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
    this.user$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.isAuthenticated$.subscribe(isAuth => {
        this.isAuthenticated = isAuth;
      })
    );

    this.subscriptions.add(
      this.user$.subscribe(user => {
        this.user = user;
      })
    );

    this.checkAuth();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  checkAuth(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = this.decodeToken(token);
        this.user = decoded;
        this.isAuthenticated = true;
      } catch (error) {
        this.isAuthenticated = false;
        this.user = null;
      }
    }
  }

  decodeToken(token: string): DecodedToken {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  isAdmin(): boolean {
    return this.user?.role?.includes('Admin') || false;
  }

  isLibrarian(): boolean {
    return this.user?.role?.includes('Librarian') || false;
  }

  toggleTheme(): void {
    this.store.dispatch(toggleDarkMode());
  }

  logout(): void {
    localStorage.removeItem('token');
    this.store.dispatch(logoutAction());
    this.isAuthenticated = false;
    this.user = null;
    this.router.navigate(['/login']);
  }
}

