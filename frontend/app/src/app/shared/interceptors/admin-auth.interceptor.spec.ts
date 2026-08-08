import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { adminAuthInterceptor } from './admin-auth.interceptor';
import { AdminAuthService } from '../services/admin-auth.service';

describe('adminAuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let adminAuthServiceSpy: jasmine.SpyObj<AdminAuthService>;

  beforeEach(() => {
    adminAuthServiceSpy = jasmine.createSpyObj<AdminAuthService>('AdminAuthService', [
      'getToken'
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: AdminAuthService, useValue: adminAuthServiceSpy },
        provideHttpClient(withInterceptors([adminAuthInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should add Authorization header when admin token exists', () => {
    adminAuthServiceSpy.getToken.and.returnValue('fake-jwt-token');

    httpClient.get('/admin/members').subscribe();

    const request = httpTestingController.expectOne('/admin/members');

    expect(request.request.headers.get('Authorization')).toBe('Bearer fake-jwt-token');

    request.flush([]);
  });

  it('should not add Authorization header when admin token does not exist', () => {
    adminAuthServiceSpy.getToken.and.returnValue(null);

    httpClient.get('/sites').subscribe();

    const request = httpTestingController.expectOne('/sites');

    expect(request.request.headers.has('Authorization')).toBeFalse();

    request.flush([]);
  });
});
