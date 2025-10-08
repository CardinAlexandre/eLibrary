import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book, PagedResult } from '../models/book.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BooksService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBooks(page: number = 1, pageSize: number = 20, genre?: string, language?: string): Observable<PagedResult<Book>> {
    let url = `${this.apiUrl}/catalog/books?page=${page}&pageSize=${pageSize}`;
    if (genre) url += `&genre=${genre}`;
    if (language) url += `&language=${language}`;
    
    return this.http.get<PagedResult<Book>>(url);
  }

  getBookById(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/catalog/books/${id}`);
  }

  searchBooks(query: string, page: number = 1, pageSize: number = 20): Observable<PagedResult<Book>> {
    return this.http.get<PagedResult<Book>>(
      `${this.apiUrl}/catalog/books/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`
    );
  }
}

