import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatError, MatFormFieldModule, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Reservation } from '../../../model/Reservations';
import { uuid } from '../../../shared/uuid';
import { ReservationsService } from '../reservations.service';
import {ReservationCard} from '../reservation-card/reservation-card';
import {MatCard, MatCardContent} from '@angular/material/card';


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
    ReservationCard,
    MatCardContent,
    MatCard
  ],
  templateUrl: './reservation-creation.html',
  styleUrl: './reservation-creation.css'
})
export class ReservationCreation {

  reservationsService = inject(ReservationsService);

  form = new FormGroup({
    siteId: new FormControl<string>('', [Validators.required]),
    courtId: new FormControl<string>('', [Validators.required]),
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const reservation: Reservation = {
      id: uuid(),
      siteId: this.form.get('siteId')?.value!,
      courtId: this.form.get('courtId')?.value!,
      date: this.form.get('date')?.value!,
      time: this.form.get('time')?.value!,
      type: this.form.get('type')?.value!,
      organizerId: 'player-1',
      players: [],
      price: this.form.get('price')?.value!,
      status: 'ACTIVE'
    };

    this.reservationsService.addReservation(reservation);
    this.form.reset({
      siteId: '',
      courtId: '',
      date: '',
      time: '',
      type: 'PUBLIC',
      price: 60
    });
  }
  get reservations() {
    return this.reservationsService.getPublicReservations();
  }
}
