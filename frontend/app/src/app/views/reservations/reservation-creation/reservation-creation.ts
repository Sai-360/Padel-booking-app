import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatError, MatFormFieldModule, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Reservation } from '../../../model/Reservations';
import { uuid } from '../../../shared/uuid';
import { ReservationsService } from '../reservations.service';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UserService } from '../../user/user.service';

@Component({
  selector: 'app-reservation-creation',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatError,
    MatHint,
    MatLabel,
    MatCardContent,
    MatCard
  ],
  templateUrl: './reservation-creation.html',
  styleUrl: './reservation-creation.css'
})
export class ReservationCreation {

  private reservationsService = inject(ReservationsService);
  private userService = inject(UserService);

  bookingError = '';
  bookingSuccess = '';
  isSubmitting = false;

  form = new FormGroup({
    siteId: new FormControl<string>('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', [Validators.required]),
    courtId: new FormControl<string>('cccccccc-cccc-cccc-cccc-cccccccccccc', [Validators.required]),
    date: new FormControl<string>('', [Validators.required]),
    time: new FormControl<string>('', [Validators.required]),
    type: new FormControl<'PUBLIC' | 'PRIVATE'>('PUBLIC', [Validators.required]),
    price: new FormControl<number>(60, [Validators.required, Validators.min(1)])
  });

  isSiteInvalid() {
    return this.form.get('siteId')?.hasError('required');
  }

  isCourtInvalid() {
    return this.form.get('courtId')?.hasError('required');
  }

  isDateInvalid() {
    return this.form.get('date')?.hasError('required');
  }

  isTimeInvalid() {
    return this.form.get('time')?.hasError('required');
  }

  addReservation() {
    this.bookingError = '';
    this.bookingSuccess = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.canCurrentUserBook()) {
      return;
    }

    const currentUser = this.userService.getCurrentUser();

    const reservation: Reservation = {
      id: uuid(),
      siteId: this.form.get('siteId')?.value!,
      courtId: this.form.get('courtId')?.value!,
      date: this.form.get('date')?.value!,
      time: this.form.get('time')?.value!,
      type: this.form.get('type')?.value!,
      organizerId: currentUser.id,
      players: [],
      price: this.form.get('price')?.value!,
      status: 'ACTIVE'
    };

    this.isSubmitting = true;

    this.reservationsService.addReservation(reservation).subscribe({
      next: () => {
        this.bookingSuccess = 'Reservation created successfully.';
        this.isSubmitting = false;

        this.form.reset({
          siteId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          courtId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          date: '',
          time: '',
          type: 'PUBLIC',
          price: 60
        });
      },
      error: error => {
        this.isSubmitting = false;
        this.bookingError = error.error?.message || 'Reservation could not be created.';
        console.error('Error creating reservation', error);
      }
    });
  }

  private canCurrentUserBook(): boolean {
    const currentUser = this.userService.getCurrentUser();
    const selectedDateValue = this.form.get('date')?.value;
    const selectedSiteId = this.form.get('siteId')?.value;

    if (!selectedDateValue) {
      this.bookingError = 'Please select a reservation date.';
      return false;
    }

    const daysBeforeMatch = this.getDaysBetweenTodayAnd(selectedDateValue);

    if (daysBeforeMatch < 0) {
      this.bookingError = 'You cannot book a court in the past.';
      return false;
    }

    if (currentUser.type === 'GLOBAL') {
      if (daysBeforeMatch > 21) {
        this.bookingError = 'Global members can only book up to 3 weeks before the match.';
        return false;
      }

      return true;
    }

    if (currentUser.type === 'SITE') {
      if (daysBeforeMatch > 14) {
        this.bookingError = 'Site members can only book up to 2 weeks before the match.';
        return false;
      }

      if (selectedSiteId !== currentUser.siteId) {
        this.bookingError = 'Site members can only book on their own site.';
        return false;
      }

      return true;
    }

    if (currentUser.type === 'FREE') {
      if (daysBeforeMatch > 5) {
        this.bookingError = 'Free members can only book up to 5 days before the match.';
        return false;
      }

      return true;
    }

    this.bookingError = 'Unknown member type.';
    return false;
  }

  private getDaysBetweenTodayAnd(dateValue: string): number {
    const today = new Date();
    const selectedDate = new Date(dateValue);

    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    const diffInMs = selectedDate.getTime() - today.getTime();

    return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  }
}
