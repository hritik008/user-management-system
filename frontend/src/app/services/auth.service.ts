import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  level: number;
  balance: number;
  commissionRate?: number;
  totalCommissionEarned?: number;
  parent?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  getCaptcha(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/auth/captcha`, { withCredentials: true });
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register`, 
      { username, email, password },
      { withCredentials: true }
    ).pipe(
      tap((response: any) => {
        if (response.success && response.user) {
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  login(username: string, password: string, captcha: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login`, 
      { username, password, captcha },
      { withCredentials: true }
    ).pipe(
      tap((response: any) => {
        if (response.success && response.user) {
          this.currentUserSubject.next(response.user);
          localStorage.setItem('token', response.token);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.currentUserSubject.next(null);
          localStorage.removeItem('token');
        })
      );
  }

  getMe(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/auth/me`, { withCredentials: true })
      .pipe(
        tap((response: any) => {
          if (response.success && response.user) {
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
