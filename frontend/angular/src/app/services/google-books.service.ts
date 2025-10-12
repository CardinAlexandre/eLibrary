import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, delay } from 'rxjs/operators';
import { Book } from '../models/book.model';

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1';

export interface GoogleBooksResponse {
  totalItems: number;
  items: Book[];
}

@Injectable({
  providedIn: 'root'
})
export class GoogleBooksService {
  constructor(private http: HttpClient) {}

  private stripHtml(html: string): string {
    if (!html) return '';
    let text = html.replace(/<\/?(p|div|br|h[1-6]|li|tr|td)[^>]*>/gi, ' ');
    text = text.replace(/<[^>]*>/g, '');
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    text = textarea.value;
    return text.replace(/\s+/g, ' ').trim();
  }

  private normalizeDate(dateString: string | undefined): string {
    if (!dateString) {
      return new Date().toISOString();
    }

    try {
      const parts = dateString.split('-');
      
      if (parts.length === 1) {
        return `${parts[0]}-01-01T00:00:00.000Z`;
      } else if (parts.length === 2) {
        return `${parts[0]}-${parts[1]}-01T00:00:00.000Z`;
      } else {
        return new Date(dateString).toISOString();
      }
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return new Date().toISOString();
    }
  }

  private convertToBook(item: any): Book {
    const volumeInfo = item.volumeInfo || {};
    const isbn = volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier || 
                 volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier || 
                 '';

    return {
      id: item.id,
      title: volumeInfo.title || 'Sans titre',
      authors: volumeInfo.authors || ['Auteur inconnu'],
      isbn: isbn,
      bookType: 'PrintedBook',
      publishedDate: this.normalizeDate(volumeInfo.publishedDate),
      pages: volumeInfo.pageCount || 0,
      language: volumeInfo.language || 'en',
      genre: volumeInfo.categories?.[0] || 'General',
      tags: volumeInfo.categories || [],
      description: this.stripHtml(volumeInfo.description) || 'Pas de description disponible',
      coverUrl: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '',
      isAvailable: true,
      copiesAvailable: 3,
      totalCopies: 3,
      averageRating: volumeInfo.averageRating || 0,
      reviewCount: volumeInfo.ratingsCount || 0,
      typeSpecificData: {
        publisher: volumeInfo.publisher || '',
        previewLink: volumeInfo.previewLink || ''
      }
    };
  }

  searchGoogleBooks(
    query: string, 
    startIndex: number = 0, 
    maxResults: number = 20,
    filters?: { language?: string; subject?: string; orderBy?: string }
  ): Observable<GoogleBooksResponse> {
    let searchQuery = query;
    
    if (filters?.subject) {
      searchQuery += `+subject:${filters.subject}`;
    }

    const url = `${GOOGLE_BOOKS_API}/volumes`;
    const params: any = {
      q: searchQuery,
      startIndex: startIndex.toString(),
      maxResults: maxResults.toString(),
      orderBy: filters?.orderBy || 'relevance'
    };

    if (filters?.language) {
      params.langRestrict = filters.language;
    }

    return this.http.get<any>(url, { params }).pipe(
      map(response => ({
        totalItems: response.totalItems || 0,
        items: (response.items || []).map((item: any) => this.convertToBook(item))
      })),
      catchError(error => {
        console.error('Error fetching Google Books:', error);
        
        if (error.status === 503) {
          return throwError(() => new Error('❌ Google Books API est temporairement indisponible. Veuillez réessayer dans quelques minutes ou utilisez votre catalogue local.'));
        } else if (error.status === 429) {
          return throwError(() => new Error('⚠️ Quota dépassé. Attendez quelques secondes.'));
        }
        
        return throwError(() => new Error('❌ Erreur lors de la recherche Google Books. Vérifiez votre connexion internet ou utilisez le catalogue local.'));
      })
    );
  }

  getGoogleBookById(id: string): Observable<Book | null> {
    const url = `${GOOGLE_BOOKS_API}/volumes/${id}`;

    return this.http.get<any>(url).pipe(
      map(item => this.convertToBook(item)),
      catchError(error => {
        console.error('Error fetching Google Book:', error);
        
        if (error.status === 503) {
          return throwError(() => new Error('❌ Google Books API est temporairement indisponible.'));
        }
        
        return throwError(() => new Error('❌ Erreur lors de la récupération du livre Google Books.'));
      })
    );
  }
}

