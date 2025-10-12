import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GoogleBooksService } from '../../services/google-books.service';
import { Book } from '../../models/book.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.css']
})
export class ImportComponent {
  searchQuery = '';
  searchResults: Book[] = [];
  loading = false;
  error = '';
  success = '';
  addingBook: { [key: string]: boolean } = {};

  constructor(
    private googleBooksService: GoogleBooksService,
    private http: HttpClient
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  searchGoogleBooks(): void {
    if (!this.searchQuery.trim()) return;

    this.loading = true;
    this.error = '';
    this.searchResults = [];

    this.googleBooksService.searchGoogleBooks(this.searchQuery, 0, 20).subscribe({
      next: (response) => {
        this.searchResults = response.items;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors de la recherche';
        this.loading = false;
      }
    });
  }

  addBook(book: Book): void {
    this.addingBook[book.id] = true;
    this.error = '';
    this.success = '';

    const bookDto = {
      title: book.title,
      authors: book.authors,
      isbn: book.isbn,
      bookType: book.bookType,
      publishedDate: book.publishedDate,
      pages: book.pages,
      language: book.language,
      genre: book.genre,
      tags: book.tags,
      description: book.description,
      coverUrl: book.coverUrl,
      copiesAvailable: 3,
      totalCopies: 3,
      typeSpecificData: book.typeSpecificData
    };

    this.http.post(`${environment.apiUrl}/api/catalog/books`, bookDto, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          this.success = `"${book.title}" ajouté au catalogue avec succès !`;
          this.addingBook[book.id] = false;
        },
        error: (err) => {
          this.error = err.error?.error || 'Erreur lors de l\'ajout du livre';
          this.addingBook[book.id] = false;
        }
      });
  }

  seedDatabase(): void {
    if (!confirm('Voulez-vous initialiser la base de données avec des livres par défaut ?')) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.http.post(`${environment.apiUrl}/api/catalog/books/seed`, {}, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          this.success = 'Base de données initialisée avec succès !';
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.error || 'Erreur lors de l\'initialisation';
          this.loading = false;
        }
      });
  }

  clearCatalog(): void {
    if (!confirm('⚠️ Voulez-vous vraiment supprimer TOUS les livres du catalogue ? Cette action est irréversible.')) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.http.delete(`${environment.apiUrl}/api/catalog/books/clear`, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          this.success = 'Catalogue vidé avec succès !';
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.error || 'Erreur lors de la suppression';
          this.loading = false;
        }
      });
  }

  isAdding(bookId: string): boolean {
    return this.addingBook[bookId] || false;
  }
}

