import { Component, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { OtelService } from './observability/otel.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly otel = inject(OtelService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly title = signal('stam-front');

  constructor() {
    this.otel.info('Application started', 'APP_START', {
      href: typeof window !== 'undefined' ? window.location.href : undefined,
    });

    this.auth.isLoggedIn$.subscribe((isLoggedIn) => {
      this.otel.info(isLoggedIn ? 'User is logged in' : 'User is logged out', 'AUTH_STATE', {
        isLoggedIn,
      });
    });

    this.router.events
      .pipe(
        filter(
          (ev): ev is NavigationStart | NavigationEnd | NavigationCancel | NavigationError =>
            ev instanceof NavigationStart ||
            ev instanceof NavigationEnd ||
            ev instanceof NavigationCancel ||
            ev instanceof NavigationError
        )
      )
      .subscribe((ev) => {
        if (ev instanceof NavigationStart) {
          this.otel.info('Navigation start', 'ROUTER', { url: ev.url });
        } else if (ev instanceof NavigationEnd) {
          this.otel.info('Navigation end', 'ROUTER', { url: ev.urlAfterRedirects });
        } else if (ev instanceof NavigationCancel) {
          this.otel.warn('Navigation canceled', 'ROUTER', { url: ev.url, reason: ev.reason });
        } else if (ev instanceof NavigationError) {
          this.otel.error('Navigation error', 'ROUTER', { url: ev.url, error: String(ev.error) });
        }
      });

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.otel.info('Browser is online', 'NETWORK'));
      window.addEventListener('offline', () => this.otel.warn('Browser is offline', 'NETWORK'));
    }
  }
}
