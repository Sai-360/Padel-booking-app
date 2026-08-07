import { Component, inject } from '@angular/core';
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
export class Login {

  private memberApiService = inject(MemberApiService);
  private userService = inject(UserService);
  private adminAuthService = inject(AdminAuthService);
  private router = inject(Router);

  loginMode: LoginMode = 'MEMBER';

  loginError = '';
  isSubmitting = false;

  form = new FormGroup({
    matricule: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    password: new FormControl<string>('', {
      nonNullable: true
    })
  });

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

  fillMemberDemo(): void {
    this.selectLoginMode('MEMBER');

    this.form.patchValue({
      matricule: 'G0002',
      password: ''
    });
  }

  fillAdminDemo(): void {
    this.selectLoginMode('ADMIN');

    this.form.patchValue({
      matricule: 'G0001',
      password: 'admin123'
    });
  }

  fillSiteAdminDemo(): void {
    this.selectLoginMode('ADMIN');

    this.form.patchValue({
      matricule: 'S0001',
      password: 'site123'
    });
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

            // Admin connecté + currentUser conservé pour pouvoir aussi créer une réservation.
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

        if (member.adminRole && member.adminRole !== 'NONE') {
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
