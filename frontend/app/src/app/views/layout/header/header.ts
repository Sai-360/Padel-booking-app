import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LayoutService } from '../layout.service';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../user/user.service';
import { AdminAuthService } from '../../../shared/services/admin-auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconButton,
    MatIconModule,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  layoutService = inject(LayoutService);
  private userService = inject(UserService);
  private adminAuthService = inject(AdminAuthService);
  private router = inject(Router);

  title = signal('Padel');

  isLoggedIn(): boolean {
    return this.userService.isLoggedIn() || this.adminAuthService.isAdminLoggedIn();
  }

  isAdminLoggedIn(): boolean {
    return this.adminAuthService.isAdminLoggedIn();
  }

  getConnectedLabel(): string {
    const adminUser = localStorage.getItem('adminUser');

    if (adminUser && this.adminAuthService.isAdminLoggedIn()) {
      const parsedAdmin = JSON.parse(adminUser);
      return `Connected as ${parsedAdmin.name}`;
    }

    const currentUser = this.userService.getCurrentUser();
    return `Connected as ${currentUser.name}`;
  }

  canShowLoginButton(): boolean {
    const currentUser = this.userService.getCurrentUser();

    return !this.adminAuthService.isAdminLoggedIn()
      && currentUser.matricule === 'L0001';
  }

  logout(): void {
    this.userService.logout();
    this.adminAuthService.logout();
    this.router.navigate(['/login']);
  }
}
