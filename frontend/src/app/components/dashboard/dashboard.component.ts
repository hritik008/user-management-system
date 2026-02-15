import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import { BalanceService } from '../../services/balance.service';
import { UserService } from '../../services/user.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  balance = 0;
  totalCommission = 0;
  children: any[] = [];
  recentTransactions: any[] = [];
  loading = true;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private balanceService: BalanceService,
    private userService: UserService,
    private websocketService: WebsocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadDashboardData();
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.websocketService.disconnect();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Load balance
    this.subscriptions.push(
      this.balanceService.getBalance().subscribe({
        next: (response) => {
          if (response.success) {
            this.balance = response.balance;
            this.totalCommission = response.totalCommissionEarned;
          }
        },
        error: (error) => console.error('Error loading balance:', error)
      })
    );

    // Load children
    this.subscriptions.push(
      this.userService.getDirectChildren().subscribe({
        next: (response) => {
          if (response.success) {
            this.children = response.users;
          }
        },
        error: (error) => console.error('Error loading children:', error)
      })
    );

    // Load recent transactions
    this.subscriptions.push(
      this.balanceService.getStatement({ page: 1, limit: 5 }).subscribe({
        next: (response) => {
          if (response.success) {
            this.recentTransactions = response.transactions;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          this.loading = false;
        }
      })
    );
  }

  setupWebSocket(): void {
    this.websocketService.connect();

    this.subscriptions.push(
      this.websocketService.onBalanceUpdated().subscribe({
        next: (data) => {
          this.balance = data.balance;
          this.loadDashboardData(); // Refresh all data
        },
        error: (error) => console.error('WebSocket error:', error)
      })
    );

    this.subscriptions.push(
      this.websocketService.onUserCreated().subscribe({
        next: (data) => {
          this.loadDashboardData(); // Refresh children list
        },
        error: (error) => console.error('WebSocket error:', error)
      })
    );
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.router.navigate(['/login']);
      }
    });
  }

  getTransactionType(transaction: any): string {
    const userId = this.currentUser?.id;
    
    if (transaction.type === 'recharge') {
      return 'Recharge';
    } else if (transaction.type === 'commission') {
      return 'Commission';
    } else if (transaction.receiver._id === userId) {
      return 'Credit';
    } else {
      return 'Debit';
    }
  }

  getTransactionAmount(transaction: any): number {
    const userId = this.currentUser?.id;
    
    if (transaction.receiver._id === userId) {
      return transaction.amount;
    } else {
      return -transaction.amount;
    }
  }

  getTransactionClass(transaction: any): string {
    const amount = this.getTransactionAmount(transaction);
    return amount >= 0 ? 'positive' : 'negative';
  }
}
