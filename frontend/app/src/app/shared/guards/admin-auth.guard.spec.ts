import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { adminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from '../services/admin-auth.service';

describe('adminAuthGuard', () => {
  let adminAuthServiceSpy: jasmine.SpyObj<AdminAuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    adminAuthServiceSpy = jasmine.createSpyObj<AdminAuthService>('AdminAuthService', [
      'isAdminLoggedIn'
    ]);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AdminAuthService, useValue: adminAuthServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('should allow access when admin is logged in', () => {
    adminAuthServiceSpy.isAdminLoggedIn.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      adminAuthGuard({} as any, {} as any)
    );

    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should reject access and redirect to login when admin is not logged in', () => {
    adminAuthServiceSpy.isAdminLoggedIn.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      adminAuthGuard({} as any, {} as any)
    );

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
