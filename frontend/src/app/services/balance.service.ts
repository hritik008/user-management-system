import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {
  constructor(private http: HttpClient) {}

  getBalance(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/balance`, { withCredentials: true });
  }

  recharge(amount: number): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/balance/recharge`,
      { amount },
      { withCredentials: true }
    );
  }

  transferBalance(receiverId: string, amount: number): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/balance/transfer`,
      { receiverId, amount },
      { withCredentials: true }
    );
  }

  adminCredit(userId: string, amount: number): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/balance/admin-credit`,
      { userId, amount },
      { withCredentials: true }
    );
  }

  getStatement(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get(`${environment.apiUrl}/balance/statement`, {
      params: httpParams,
      withCredentials: true
    });
  }
}
