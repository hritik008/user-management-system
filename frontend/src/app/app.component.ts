import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'User Management System';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Try to load current user on app initialization
    const token = this.authService.getToken();
    if (token) {
      this.authService.getMe().subscribe({
        error: (err) => {
          // Token invalid or expired
          localStorage.removeItem('token');
        }
      });
    }
  }
}
