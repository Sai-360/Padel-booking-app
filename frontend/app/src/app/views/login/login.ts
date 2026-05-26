import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatError, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MemberApiService } from '../user/member-api.service';
import { UserService } from '../user/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
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
  private router = inject(Router);

  loginError = '';

  form = new FormGroup({
    matricule: new FormControl<string>('', [Validators.required])
  });

  login(): void {
    this.loginError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const matricule = this.form.get('matricule')?.value!;

    this.memberApiService.getMemberByMatricule(matricule).subscribe({
      next: member => {
        this.userService.setCurrentUser(member);
        this.router.navigate(['/public-matches']);
      },
      error: () => {
        this.loginError = 'Unknown matricule.';
      }
    });
  }
}
