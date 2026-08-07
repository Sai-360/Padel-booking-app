import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const adminAuthService = inject(AdminAuthService);
  const token = adminAuthService.getToken();

  if (!token) {
    return next(request);
  }

  const authenticatedRequest = request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authenticatedRequest);
};
