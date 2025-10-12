import { Component, OnInit } from '@angular/core';
import { StatsService, DashboardStats } from '../../services/stats.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  data: DashboardStats | null = null;
  loading = false;

  constructor(private statsService: StatsService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.statsService.getDashboardStats().subscribe({
      next: (stats) => {
        this.data = stats;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching dashboard:', err);
        this.loading = false;
      }
    });
  }

  getAvailabilityRate(): number {
    if (!this.data || this.data.totalCopies === 0) return 0;
    return (this.data.availableCopies / this.data.totalCopies) * 100;
  }
}

