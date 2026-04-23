import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { OtelService } from '../observability/otel.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const otel = inject(OtelService);

  // Ne pas intercepter les requêtes d'auth
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const token = authService.accessToken;
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRefreshing && authService.refreshToken) {
        otel.warn('401 received, attempting token refresh', 'AUTH_INTERCEPTOR', { url: req.url });
        isRefreshing = true;
        return authService.refresh().pipe(
          switchMap(res => {
            isRefreshing = false;
            otel.info('Token refresh OK, retrying request', 'AUTH_INTERCEPTOR', { url: req.url });
            const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } });
            return next(retryReq);
          }),
          catchError(err => {
            isRefreshing = false;
            otel.warn('Token refresh failed, forcing logout', 'AUTH_INTERCEPTOR', { url: req.url, message: err?.message });
            authService.logout();
            return throwError(() => err);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
