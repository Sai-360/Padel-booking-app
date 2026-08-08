import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AdminAuthService } from './admin-auth.service';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let httpTestingController: HttpTestingController;

  const loginResponse = {
    accessToken: 'fake-jwt-token',
    memberId: '11111111-1111-1111-1111-111111111111',
    matricule: 'G0001',
    name: 'Global Admin',
    adminRole: 'GLOBAL_ADMIN' as const
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AdminAuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AdminAuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should send admin login request and store token and admin user', () => {
    service.login('G0001', 'admin123').subscribe(response => {
      expect(response.accessToken).toBe('fake-jwt-token');
    });

    const request = httpTestingController.expectOne('http://localhost:8080/auth/admin/login');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      matricule: 'G0001',
      password: 'admin123'
    });

    request.flush(loginResponse);

    expect(localStorage.getItem('adminToken')).toBe('fake-jwt-token');

    const storedAdminUser = JSON.parse(localStorage.getItem('adminUser') ?? '{}');

    expect(storedAdminUser.memberId).toBe(loginResponse.memberId);
    expect(storedAdminUser.matricule).toBe('G0001');
    expect(storedAdminUser.name).toBe('Global Admin');
    expect(storedAdminUser.adminRole).toBe('GLOBAL_ADMIN');
  });

  it('should return true when admin token exists', () => {
    localStorage.setItem('adminToken', 'fake-jwt-token');

    expect(service.isAdminLoggedIn()).toBeTrue();
  });

  it('should return false when admin token does not exist', () => {
    expect(service.isAdminLoggedIn()).toBeFalse();
  });

  it('should remove admin token and admin user on logout', () => {
    localStorage.setItem('adminToken', 'fake-jwt-token');
    localStorage.setItem('adminUser', JSON.stringify({ matricule: 'G0001' }));

    service.logout();

    expect(localStorage.getItem('adminToken')).toBeNull();
    expect(localStorage.getItem('adminUser')).toBeNull();
  });
});
