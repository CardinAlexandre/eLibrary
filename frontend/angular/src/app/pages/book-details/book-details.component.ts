import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BooksService } from '../../services/books.service';
import { GoogleBooksService } from '../../services/google-books.service';
import { LoansService } from '../../services/loans.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Book, Loan } from '../../models/book.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-book-details',
  templateUrl: './book-details.component.html',
  styleUrls: ['./book-details.component.css']
})
export class BookDetailsComponent implements OnInit {
  book: Book | null = null;
  loans: Loan[] = [];
  loading = false;
  borrowing = false;
  checkingLoan = true;
  hasActiveUserLoan = false;
  isLocalBook = false;
  error = '';
  success = '';
  bookId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private booksService: BooksService,
    private googleBooksService: GoogleBooksService,
    private loansService: LoansService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.bookId = params['id'];
      this.loadBook();
    });
  }

  private isGuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  loadBook(): void {
    this.loading = true;
    this.error = '';
    this.checkingLoan = true;

    if (this.isGuid(this.bookId)) {
      this.booksService.getBookById(this.bookId).subscribe({
        next: (book) => {
          this.book = book;
          this.isLocalBook = true;
          this.loadBookLoans();
          this.checkUserHasActiveLoan();
          this.loading = false;
        },
        error: () => {
          this.error = 'Livre introuvable';
          this.loading = false;
          this.checkingLoan = false;
        }
      });
    } else {
      this.googleBooksService.getGoogleBookById(this.bookId).subscribe({
        next: (book) => {
          if (book) {
            this.book = book;
            this.isLocalBook = false;
            this.checkIfBookExistsLocally();
            this.loading = false;
          }
        },
        error: (err) => {
          this.error = err.message || 'Livre introuvable';
          this.loading = false;
          this.checkingLoan = false;
        }
      });
    }
  }

  checkIfBookExistsLocally(): void {
    if (!this.book || !this.book.isbn) {
      this.checkingLoan = false;
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.checkingLoan = false;
      return;
    }

    this.booksService.searchBooks(this.book.isbn).subscribe({
      next: (response) => {
        const existingBook = response.items?.find((b: Book) => b.isbn === this.book!.isbn);
        if (existingBook) {
          this.checkUserHasActiveLoan(existingBook.id);
        } else {
          this.checkingLoan = false;
        }
      },
      error: () => {
        this.checkingLoan = false;
      }
    });
  }

  checkUserHasActiveLoan(bookId?: string): void {
    const idToCheck = bookId || this.bookId;
    const token = localStorage.getItem('token');
    if (!token) {
      this.hasActiveUserLoan = false;
      this.checkingLoan = false;
      return;
    }

    this.loansService.getMyLoans().subscribe({
      next: (loans) => {
        this.hasActiveUserLoan = loans.some(l => l.bookId === idToCheck && l.status === 'Active');
        this.checkingLoan = false;
      },
      error: () => {
        this.hasActiveUserLoan = false;
        this.checkingLoan = false;
      }
    });
  }

  loadBookLoans(): void {
    this.loansService.getBookLoans(this.bookId, true).subscribe({
      next: (loans) => {
        this.loans = loans;
      },
      error: () => {
        this.loans = [];
      }
    });
  }

  borrowBook(): void {
    if (!this.book) return;

    this.borrowing = true;
    this.error = '';
    this.success = '';

    const token = localStorage.getItem('token');
    let bookIdToLoan = this.bookId;
    const wasGoogleBook = !this.isLocalBook;

    if (!this.isLocalBook) {
      this.booksService.searchBooks(this.book.isbn || this.book.title).subscribe({
        next: (response) => {
          const existingBook = response.items?.find((b: Book) => 
            b.isbn === this.book!.isbn || b.title.toLowerCase() === this.book!.title.toLowerCase()
          );

          if (existingBook) {
            if (existingBook.copiesAvailable <= 0) {
              this.error = 'Ce livre n\'a plus d\'exemplaires disponibles dans le catalogue.';
              this.borrowing = false;
              return;
            }
            bookIdToLoan = existingBook.id;
            this.createLoan(bookIdToLoan, wasGoogleBook);
          } else {
            this.addBookToCatalog().subscribe({
              next: (addedBook: any) => {
                bookIdToLoan = addedBook.id;
                this.createLoan(bookIdToLoan, wasGoogleBook);
              },
              error: (err) => {
                this.error = 'Erreur lors de l\'ajout du livre au catalogue';
                this.borrowing = false;
              }
            });
          }
        },
        error: () => {
          this.addBookToCatalog().subscribe({
            next: (addedBook: any) => {
              bookIdToLoan = addedBook.id;
              this.createLoan(bookIdToLoan, wasGoogleBook);
            },
            error: () => {
              this.error = 'Erreur lors de l\'ajout du livre';
              this.borrowing = false;
            }
          });
        }
      });
    } else {
      this.createLoan(bookIdToLoan, wasGoogleBook);
    }
  }

  private addBookToCatalog(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    const bookDto = {
      title: this.book!.title,
      authors: this.book!.authors,
      isbn: this.book!.isbn,
      bookType: this.book!.bookType,
      publishedDate: this.book!.publishedDate,
      pages: this.book!.pages,
      language: this.book!.language,
      genre: this.book!.genre,
      tags: this.book!.tags,
      description: this.book!.description,
      coverUrl: this.book!.coverUrl,
      copiesAvailable: 3,
      totalCopies: 3,
      typeSpecificData: this.book!.typeSpecificData
    };

    return this.http.post(`${environment.apiUrl}/api/catalog/books`, bookDto, { headers });
  }

  private createLoan(bookId: string, wasGoogleBook: boolean): void {
    this.loansService.borrowBook(bookId, 14).subscribe({
      next: () => {
        this.success = wasGoogleBook 
          ? 'Livre emprunté avec succès ! 🎉 (Ajouté au catalogue local)'
          : 'Livre emprunté avec succès ! 🎉';
        this.hasActiveUserLoan = true;
        this.borrowing = false;
        
        this.booksService.getBookById(bookId).subscribe({
          next: (updatedBook) => {
            this.book = updatedBook;
            this.isLocalBook = true;
            this.loadBookLoans();
          }
        });
      },
      error: (err) => {
        const errorMessage = err.error?.error || 'Erreur lors de l\'emprunt';
        if (errorMessage.includes('already have an active loan')) {
          this.hasActiveUserLoan = true;
          this.error = 'Vous avez déjà emprunté ce livre. Retournez-le d\'abord avant de l\'emprunter à nouveau.';
        } else {
          this.error = errorMessage;
        }
        this.borrowing = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
