import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface AdminLoginRequest {
  matricule: string;
  password: string;
}

interface AdminLoginResponse {
  accessToken: string;
  memberId: string;
  matricule: string;
  name: string;
  adminRole: 'GLOBAL_ADMIN' | 'SITE_ADMIN';
}

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/auth/admin/login';

  login(matricule: string, password: string): Observable<AdminLoginResponse> {
    const request: AdminLoginRequest = {
      matricule,
      password
    };

    return this.http.post<AdminLoginResponse>(this.apiUrl, request)
      .pipe(
        tap(response => {
          localStorage.setItem('adminToken', response.accessToken);
          localStorage.setItem('adminUser', JSON.stringify({
            memberId: response.memberId,
            matricule: response.matricule,
            name: response.name,
            adminRole: response.adminRole
          }));
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem('adminToken');
  }

  isAdminLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  logout(): void {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }
}
