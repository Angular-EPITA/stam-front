import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not be logged in initially', () => {
    expect(service.isLoggedIn).toBeFalse();
  });

  it('should store tokens on login', () => {
    const mockResponse = { accessToken: 'access123', refreshToken: 'refresh456' };

    service.login('admin', 'admin').subscribe(res => {
      expect(res.accessToken).toBe('access123');
      expect(service.accessToken).toBe('access123');
      expect(service.refreshToken).toBe('refresh456');
      expect(service.isLoggedIn).toBeTrue();
    });

    const req = httpMock.expectOne(r => r.url.includes('/auth/login'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'admin', password: 'admin' });
    req.flush(mockResponse);
  });

  it('should clear tokens on logout', () => {
    localStorage.setItem('stam_access_token', 'token');
    localStorage.setItem('stam_refresh_token', 'refresh');

    service.logout();

    expect(service.accessToken).toBeNull();
    expect(service.refreshToken).toBeNull();
    expect(service.isLoggedIn).toBeFalse();
  });
});
