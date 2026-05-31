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

    if (!this.userService.isLoggedIn()) {
      return;
    }

    const currentUser = this.userService.getCurrentUser();

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

  getConnectedLabel(): string {
    const adminUser = localStorage.getItem('adminUser');

    if (adminUser && this.adminAuthService.isAdminLoggedIn()) {
      const parsedAdmin = JSON.parse(adminUser);
      return `Connected as ${parsedAdmin.name}`;
    }

    const currentUser = this.userService.getCurrentUser();

    if (currentUser.unpaidBalance && currentUser.unpaidBalance > 0) {
      return `Connected as ${currentUser.name} - unpaid balance: ${currentUser.unpaidBalance}€`;
    }

    return `Connected as ${currentUser.name}`;
  }

  hasUnpaidBalance(): boolean {
    if (this.adminAuthService.isAdminLoggedIn()) {
      return false;
    }

    const currentUser = this.userService.getCurrentUser();
    return !!currentUser.unpaidBalance && currentUser.unpaidBalance > 0;
  }

  payBalance(): void {
    const currentUser = this.userService.getCurrentUser();

    this.memberApiService.payBalance(currentUser.id).subscribe({
      next: updatedMember => {
        this.userService.setCurrentUser(updatedMember);
      },
      error: error => {
        console.error(error);
      }
    });
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
