import { Component, OnInit, HostListener } from '@angular/core';
import { Store } from '@ngrx/store';
import { BooksService } from '../../services/books.service';
import { GoogleBooksService } from '../../services/google-books.service';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  localBooks: Book[] = [];
  googleBooks: Book[] = [];
  displayBooks: Book[] = [];
  
  searchQuery = '';
  filters = { genre: '', language: '', orderBy: 'relevance' };
  
  loading = false;
  loadingMore = false;
  useLocalBooks = true;
  hasMore = false;
  page = 1;
  pageSize = 20;
  error = '';

  genres = [
    { value: '', label: 'Tous les genres' },
    { value: 'Fiction', label: 'Fiction' },
    { value: 'Science Fiction', label: 'Science Fiction' },
    { value: 'Fantasy', label: 'Fantasy' },
    { value: 'Mystery', label: 'Mystère' },
    { value: 'Romance', label: 'Romance' },
    { value: 'Thriller', label: 'Thriller' },
    { value: 'Biography', label: 'Biographie' },
    { value: 'History', label: 'Histoire' },
    { value: 'Science', label: 'Science' },
    { value: 'Technology', label: 'Technologie' }
  ];

  languages = [
    { value: '', label: 'Toutes les langues' },
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'Anglais' },
    { value: 'es', label: 'Espagnol' },
    { value: 'de', label: 'Allemand' },
    { value: 'it', label: 'Italien' }
  ];

  sortOptions = [
    { value: 'relevance', label: 'Pertinence' },
    { value: 'newest', label: 'Plus récent' }
  ];

  constructor(
    private booksService: BooksService,
    private googleBooksService: GoogleBooksService,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.loadLocalBooks();
  }

  loadLocalBooks(): void {
    this.booksService.getBooks(1, 100).subscribe({
      next: (response) => {
        this.localBooks = response.items;
        if (this.useLocalBooks) {
          this.displayBooks = this.localBooks;
        }
      },
      error: (err) => {
        console.error('Error loading local books:', err);
      }
    });
  }

  searchGoogleBooks(): void {
    if (!this.searchQuery.trim()) {
      this.resetSearch();
      return;
    }

    this.useLocalBooks = false;
    this.page = 1;
    this.hasMore = true;
    this.loading = true;
    this.error = '';
    this.googleBooks = [];

    const startIndex = 0;
    this.googleBooksService.searchGoogleBooks(
      this.searchQuery,
      startIndex,
      this.pageSize,
      {
        language: this.filters.language,
        subject: this.filters.genre,
        orderBy: this.filters.orderBy
      }
    ).subscribe({
      next: (response) => {
        this.googleBooks = response.items;
        this.displayBooks = this.googleBooks;
        this.hasMore = response.items.length === this.pageSize;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors de la recherche';
        this.loading = false;
        this.googleBooks = [];
        this.displayBooks = [];
      }
    });
  }

  loadMoreGoogleBooks(): void {
    if (this.loadingMore || !this.hasMore || this.useLocalBooks) return;

    this.loadingMore = true;
    this.page++;
    const startIndex = (this.page - 1) * this.pageSize;

    this.googleBooksService.searchGoogleBooks(
      this.searchQuery,
      startIndex,
      this.pageSize,
      {
        language: this.filters.language,
        subject: this.filters.genre,
        orderBy: this.filters.orderBy
      }
    ).subscribe({
      next: (response) => {
        this.googleBooks = [...this.googleBooks, ...response.items];
        this.displayBooks = this.googleBooks;
        this.hasMore = response.items.length === this.pageSize;
        this.loadingMore = false;
      },
      error: (err) => {
        console.error('Error loading more:', err);
        this.loadingMore = false;
        this.hasMore = false;
      }
    });
  }

  onFilterChange(): void {
    if (this.searchQuery.trim()) {
      this.searchGoogleBooks();
    }
  }

  resetSearch(): void {
    this.searchQuery = '';
    this.filters = { genre: '', language: '', orderBy: 'relevance' };
    this.googleBooks = [];
    this.page = 1;
    this.hasMore = false;
    this.useLocalBooks = true;
    this.displayBooks = this.localBooks;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (this.useLocalBooks || this.loading || this.loadingMore || !this.hasMore) {
      return;
    }

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop + windowHeight >= documentHeight - 500) {
      this.loadMoreGoogleBooks();
    }
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filters.genre) count++;
    if (this.filters.language) count++;
    if (this.filters.orderBy !== 'relevance') count++;
    return count;
  }
}
