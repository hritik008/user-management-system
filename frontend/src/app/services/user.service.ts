import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  createUser(userData: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/users`, userData, { withCredentials: true });
  }

  getDirectChildren(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/users/children`, { withCredentials: true });
  }

  getDownline(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/users/downline`, { withCredentials: true });
  }

  getHierarchy(userId?: string): Observable<any> {
    const url = userId 
      ? `${environment.apiUrl}/users/hierarchy/${userId}`
      : `${environment.apiUrl}/users/hierarchy`;
    return this.http.get(url, { withCredentials: true });
  }

  getUserById(userId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/users/${userId}`, { withCredentials: true });
  }

  changePassword(userId: string, newPassword: string): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/users/${userId}/password`,
      { newPassword },
      { withCredentials: true }
    );
  }

  getBalanceSummary(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/users/summary/balance`, { withCredentials: true });
  }
}
