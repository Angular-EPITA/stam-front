import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse } from '../models/auth.interface';
import { Router } from '@angular/router';

const ACCESS_TOKEN_KEY = 'stam_access_token';
const REFRESH_TOKEN_KEY = 'stam_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly loggedIn$ = new BehaviorSubject<boolean>(this.hasToken());

  get isLoggedIn$(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  get isLoggedIn(): boolean {
    return this.loggedIn$.value;
  }

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { username, password }).pipe(
      tap(res => this.storeTokens(res)),
      catchError(err => throwError(() => err))
    );
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token'));
    }
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(res => this.storeTokens(res)),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.loggedIn$.next(false);
    this.router.navigate(['/login']);
  }

  private storeTokens(res: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    this.loggedIn$.next(true);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  }
}
