import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  totalBooks: number;
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  totalCopies: number;
  availableCopies: number;
  topGenres: Array<{
    genre: string;
    count: number;
    loanCount: number;
    activeLoans: number;
  }>;
  topBooks: Array<{
    bookId: string;
    title: string;
    loanCount: number;
    viewCount: number;
    averageRating: number;
  }>;
  recentActivity: Array<{
    eventType: string;
    bookTitle: string;
    userEmail: string;
    userName?: string;
    eventDate: string;
  }>;
  activeLoansDetails: Array<{
    loanId: string;
    bookId: string;
    bookTitle: string;
    userEmail: string;
    userName?: string;
    loanDate: string;
    dueDate: string;
    isOverdue: boolean;
    daysOverdue: number;
    lateFee: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(
      `${this.apiUrl}/api/catalog/stats/dashboard`,
      { headers: this.getHeaders() }
    );
  }
}

