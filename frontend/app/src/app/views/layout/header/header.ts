import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LayoutService } from '../layout.service';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../user/user.service';
import { AdminAuthService } from '../../../shared/services/admin-auth.service';
import { MemberApiService } from '../../user/member-api.service';

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
export class Header implements OnInit {
  layoutService = inject(LayoutService);

  private memberApiService = inject(MemberApiService);
  private userService = inject(UserService);
  private adminAuthService = inject(AdminAuthService);
  private router = inject(Router);

  title = signal('Padel');

  ngOnInit(): void {
    this.reloadCurrentUserFromBackend();
  }

  reloadCurrentUserFromBackend(): void {
    if (this.adminAuthService.isAdminLoggedIn()) {
      return;
    }

    const currentUser = this.userService.getCurrentUserOrNull();

    if (!currentUser) {
      return;
    }

    this.memberApiService.getMemberByMatricule(currentUser.matricule).subscribe({
      next: updatedMember => {
        this.userService.setCurrentUser(updatedMember);
      },
      error: error => {
        console.error(error);
      }
    });
  }

  isLoggedIn(): boolean {
    return this.userService.isLoggedIn() || this.adminAuthService.isAdminLoggedIn();
  }

  isAdminLoggedIn(): boolean {
    return this.adminAuthService.isAdminLoggedIn();
  }

  canShowLoginButton(): boolean {
    return !this.userService.isLoggedIn() && !this.adminAuthService.isAdminLoggedIn();
  }

  getConnectedName(): string {
    const adminUser = this.getStoredAdminUser();

    if (adminUser && this.adminAuthService.isAdminLoggedIn()) {
      return adminUser.name || adminUser.matricule || 'Admin';
    }

    const currentUser = this.userService.getCurrentUserOrNull();

    if (!currentUser) {
      return '';
    }

    return currentUser.name;
  }

  getConnectedRoleLabel(): string {
    const adminUser = this.getStoredAdminUser();

    if (adminUser && this.adminAuthService.isAdminLoggedIn()) {
      return this.formatAdminRole(adminUser.adminRole);
    }

    const currentUser = this.userService.getCurrentUserOrNull();

    if (!currentUser) {
      return '';
    }

    if (currentUser.type === 'GLOBAL') {
      return 'Global Member';
    }

    if (currentUser.type === 'SITE') {
      return 'Site Member';
    }

    if (currentUser.type === 'FREE') {
      return 'Free Member';
    }

    return 'Member';
  }

  getConnectedLabel(): string {
    const connectedName = this.getConnectedName();

    if (!connectedName) {
      return '';
    }

    const currentUser = this.userService.getCurrentUserOrNull();

    if (!this.adminAuthService.isAdminLoggedIn() && currentUser?.unpaidBalance && currentUser.unpaidBalance > 0) {
      return `Connected as ${connectedName} - unpaid balance: ${currentUser.unpaidBalance}€`;
    }

    return `Connected as ${connectedName}`;
  }

  getUserInitials(): string {
    const name = this.getConnectedName();

    if (!name) {
      return '?';
    }

    const parts = name.trim().split(' ').filter(part => part.length > 0);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  hasUnpaidBalance(): boolean {
    if (this.adminAuthService.isAdminLoggedIn()) {
      return false;
    }

    const currentUser = this.userService.getCurrentUserOrNull();

    return !!currentUser?.unpaidBalance && currentUser.unpaidBalance > 0;
  }

  payBalance(): void {
    const currentUser = this.userService.getCurrentUserOrNull();

    if (!currentUser) {
      return;
    }

    this.memberApiService.payBalance(currentUser.id).subscribe({
      next: updatedMember => {
        this.userService.setCurrentUser(updatedMember);
      },
      error: error => {
        console.error(error);
      }
    });
  }

  logout(): void {
    this.userService.logout();
    this.adminAuthService.logout();
    this.router.navigate(['/login']);
  }

  private getStoredAdminUser(): { name?: string; matricule?: string; adminRole?: string } | null {
    const adminUser = localStorage.getItem('adminUser');

    if (!adminUser) {
      return null;
    }

    try {
      return JSON.parse(adminUser);
    } catch {
      return null;
    }
  }

  private formatAdminRole(adminRole?: string): string {
    if (adminRole === 'GLOBAL_ADMIN') {
      return 'Global Admin';
    }

    if (adminRole === 'SITE_ADMIN') {
      return 'Site Admin';
    }

    return 'Admin';
  }
}
