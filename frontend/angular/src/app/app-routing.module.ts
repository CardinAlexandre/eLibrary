import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { BookDetailsComponent } from './pages/book-details/book-details.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { LoansComponent } from './pages/loans/loans.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ImportComponent } from './pages/import/import.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'books/:id', component: BookDetailsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'loans', component: LoansComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'import', component: ImportComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

