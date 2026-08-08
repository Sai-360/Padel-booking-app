import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatError, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import { MemberApiService } from '../user/member-api.service';
import { UserService } from '../user/user.service';
import { AdminAuthService } from '../../shared/services/admin-auth.service';
import { Member } from '../../model/Member';

type LoginMode = 'MEMBER' | 'ADMIN';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatError,
    MatLabel,
    MatCard,
    MatCardContent
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {

  private memberApiService = inject(MemberApiService);
  private userService = inject(UserService);
  private adminAuthService = inject(AdminAuthService);
  private router = inject(Router);

  loginMode: LoginMode = 'MEMBER';

  loginError = '';
  isSubmitting = false;

  demoMembers: Member[] = [];
  isLoadingDemoMembers = false;
  demoMembersError = '';

  form = new FormGroup({
    matricule: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    password: new FormControl<string>('', {
      nonNullable: true
    })
  });

  ngOnInit(): void {
    this.loadDemoMembers();
  }

  loadDemoMembers(): void {
    this.isLoadingDemoMembers = true;
    this.demoMembersError = '';

    this.memberApiService.getMembers().subscribe({
      next: members => {
        this.demoMembers = members;
        this.isLoadingDemoMembers = false;
      },
      error: error => {
        this.demoMembers = [];
        this.isLoadingDemoMembers = false;
        this.demoMembersError = 'Demo accounts could not be loaded from the backend.';
        console.error(error);
      }
    });
  }

  selectLoginMode(mode: LoginMode): void {
    this.loginMode = mode;
    this.loginError = '';

    if (mode === 'MEMBER') {
      this.form.controls.password.setValue('');
    }
  }

  login(): void {
    this.loginError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const matricule = this.form.controls.matricule.value.trim().toUpperCase();
    const password = this.form.controls.password.value.trim();

    if (!matricule) {
      this.loginError = 'Please enter your matricule.';
      return;
    }

    if (this.loginMode === 'ADMIN') {
      if (!password) {
        this.loginError = 'Admin password is required.';
        return;
      }

      this.loginAsAdmin(matricule, password);
      return;
    }

    this.loginAsMember(matricule);
  }

  selectDemoMember(member: Member): void {
    const mode: LoginMode = this.isAdminMember(member) ? 'ADMIN' : 'MEMBER';

    this.selectLoginMode(mode);

    this.form.patchValue({
      matricule: member.matricule,
      password: ''
    });
  }

  getSortedDemoMembers(): Member[] {
    return [...this.demoMembers].sort((a, b) => {
      if (this.isAdminMember(a) && !this.isAdminMember(b)) {
        return -1;
      }

      if (!this.isAdminMember(a) && this.isAdminMember(b)) {
        return 1;
      }

      return a.matricule.localeCompare(b.matricule);
    });
  }

  isAdminMember(member: Member): boolean {
    return !!member.adminRole && member.adminRole !== 'NONE';
  }

  isBlockedMember(member: Member): boolean {
    if (!member.blockedUntil) {
      return false;
    }

    const today = new Date();
    const blockedUntil = new Date(`${member.blockedUntil}T00:00:00`);

    today.setHours(0, 0, 0, 0);
    blockedUntil.setHours(0, 0, 0, 0);

    return blockedUntil.getTime() >= today.getTime();
  }

  hasUnpaidBalance(member: Member): boolean {
    return Number(member.unpaidBalance ?? 0) > 0;
  }

  getDemoMemberIcon(member: Member): string {
    if (this.isAdminMember(member)) {
      return 'admin_panel_settings';
    }

    if (this.isBlockedMember(member)) {
      return 'block';
    }

    if (this.hasUnpaidBalance(member)) {
      return 'warning';
    }

    if (member.type === 'SITE') {
      return 'location_on';
    }

    if (member.type === 'FREE') {
      return 'sports_tennis';
    }

    return 'person';
  }

  getDemoMemberTitle(member: Member): string {
    if (member.adminRole === 'GLOBAL_ADMIN') {
      return 'Global admin';
    }

    if (member.adminRole === 'SITE_ADMIN') {
      return 'Site admin';
    }

    if (member.type === 'GLOBAL') {
      return 'Global member';
    }

    if (member.type === 'SITE') {
      return 'Site member';
    }

    if (member.type === 'FREE') {
      return 'Free member';
    }

    return 'Member';
  }

  getDemoMemberDescription(member: Member): string {
    if (this.isBlockedMember(member)) {
      return `Blocked until ${member.blockedUntil}`;
    }

    if (this.hasUnpaidBalance(member)) {
      return 'Has an unpaid balance. Useful to test payment blocking.';
    }

    if (member.adminRole === 'GLOBAL_ADMIN') {
      return 'Can access the full admin dashboard.';
    }

    if (member.adminRole === 'SITE_ADMIN') {
      return 'Can access the site admin dashboard.';
    }

    if (member.type === 'GLOBAL') {
      return 'Can book earlier than other member types.';
    }

    if (member.type === 'SITE') {
      return 'Can book on its own site.';
    }

    if (member.type === 'FREE') {
      return 'Has the shortest booking window.';
    }

    return 'Regular booking account.';
  }

  getModeTitle(): string {
    if (this.loginMode === 'ADMIN') {
      return 'Admin access';
    }

    return 'Member access';
  }

  getModeDescription(): string {
    if (this.loginMode === 'ADMIN') {
      return 'Use your admin matricule and password to access the administration dashboard.';
    }

    return 'Use your matricule to book courts, join public matches and manage your reservations.';
  }

  private loginAsAdmin(matricule: string, password: string): void {
    this.isSubmitting = true;

    this.adminAuthService.login(matricule, password).subscribe({
      next: () => {
        this.memberApiService.getMemberByMatricule(matricule).subscribe({
          next: member => {
            this.isSubmitting = false;

            this.userService.setCurrentUser(member, false);
            this.router.navigate(['/admin']);
          },
          error: error => {
            this.isSubmitting = false;
            this.loginError = 'Admin logged in, but member profile could not be loaded.';
            console.error(error);
          }
        });
      },
      error: error => {
        this.isSubmitting = false;
        this.loginError = error.error?.message || 'Invalid admin credentials.';
        console.error(error);
      }
    });
  }

  private loginAsMember(matricule: string): void {
    this.isSubmitting = true;

    this.memberApiService.getMemberByMatricule(matricule).subscribe({
      next: member => {
        this.isSubmitting = false;

        if (this.isAdminMember(member)) {
          this.loginError = 'Admin accounts must use the admin login mode with a password.';
          return;
        }

        this.userService.setCurrentUser(member);
        this.router.navigate(['/public-matches']);
      },
      error: error => {
        this.isSubmitting = false;
        this.loginError = 'Unknown matricule.';
        console.error(error);
      }
    });
  }
}
