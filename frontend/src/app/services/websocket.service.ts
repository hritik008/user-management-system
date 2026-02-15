import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket | null = null;

  constructor(private authService: AuthService) {}

  connect(): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.socket = io(environment.socketUrl, {
      auth: {
        token: token
      }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onBalanceUpdated(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      this.socket.on('balanceUpdated', (data: any) => {
        observer.next(data);
      });

      return () => {
        if (this.socket) {
          this.socket.off('balanceUpdated');
        }
      };
    });
  }

  onUserCreated(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      this.socket.on('userCreated', (data: any) => {
        observer.next(data);
      });

      return () => {
        if (this.socket) {
          this.socket.off('userCreated');
        }
      };
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
