import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Loan } from '../models/book.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoansService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  borrowBook(bookId: string, loanDurationDays: number = 14): Observable<Loan> {
    return this.http.post<Loan>(
      `${this.apiUrl}/api/catalog/loans`,
      { bookId, loanDurationDays },
      { headers: this.getHeaders() }
    );
  }

  returnBook(loanId: string, notes?: string): Observable<Loan> {
    return this.http.post<Loan>(
      `${this.apiUrl}/api/catalog/loans/${loanId}/return`,
      { notes },
      { headers: this.getHeaders() }
    );
  }

  getMyLoans(status?: string): Observable<Loan[]> {
    let url = `${this.apiUrl}/api/catalog/loans/my-loans`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get<Loan[]>(url, { headers: this.getHeaders() });
  }

  getBookLoans(bookId: string, activeOnly: boolean = true): Observable<Loan[]> {
    return this.http.get<Loan[]>(
      `${this.apiUrl}/api/catalog/loans/book/${bookId}?activeOnly=${activeOnly}`,
      { headers: this.getHeaders() }
    );
  }
}

