import { Component, OnInit } from '@angular/core';
import { LoansService } from '../../services/loans.service';
import { Loan } from '../../models/book.model';

@Component({
  selector: 'app-loans',
  templateUrl: './loans.component.html',
  styleUrls: ['./loans.component.css']
})
export class LoansComponent implements OnInit {
  activeLoans: Loan[] = [];
  returnedLoans: Loan[] = [];
  loading = false;
  returning: { [key: string]: boolean } = {};
  error = '';
  success = '';

  constructor(private loansService: LoansService) {}

  ngOnInit(): void {
    this.loadLoans();
  }

  loadLoans(): void {
    this.loading = true;
    this.error = '';

    this.loansService.getMyLoans().subscribe({
      next: (loans) => {
        this.activeLoans = loans.filter(l => l.status === 'Active' || l.status === 'Overdue');
        this.returnedLoans = loans.filter(l => l.status === 'Returned');
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des emprunts';
        this.loading = false;
      }
    });
  }

  returnBook(loanId: string): void {
    this.returning[loanId] = true;
    this.error = '';
    this.success = '';

    this.loansService.returnBook(loanId).subscribe({
      next: () => {
        this.success = 'Livre retourné avec succès !';
        this.returning[loanId] = false;
        this.loadLoans();
      },
      error: (err) => {
        this.error = err.error?.error || 'Erreur lors du retour du livre';
        this.returning[loanId] = false;
      }
    });
  }

  isReturning(loanId: string): boolean {
    return this.returning[loanId] || false;
  }
}

