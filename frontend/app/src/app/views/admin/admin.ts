import { Component, inject, OnInit } from '@angular/core';
import { ReservationsService } from '../reservations/reservations.service';
import { Reservation } from '../../model/Reservations';
import { ReservationCard } from '../reservations/reservation-card/reservation-card';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    MatCardModule,
    ReservationCard
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {

  private readonly reservationsService = inject(ReservationsService);

  reservations: Reservation[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.errorMessage = '';

    this.reservationsService.getReservation().subscribe({
      next: reservations => {
        this.reservations = reservations;
        this.loading = false;
      },
      error: error => {
        this.errorMessage = 'Could not load admin dashboard.';
        this.loading = false;
        console.error(error);
      }
    });
  }

  getTotalReservations(): number {
    return this.reservations.length;
  }

  getPublicReservationsCount(): number {
    return this.reservations.filter(reservation => reservation.type === 'PUBLIC').length;
  }

  getPrivateReservationsCount(): number {
    return this.reservations.filter(reservation => reservation.type === 'PRIVATE').length;
  }

  getEstimatedRevenue(): number {
    return this.reservations.reduce((total, reservation) => total + reservation.price, 0);
  }

  getActiveReservationsCount(): number {
    return this.reservations.filter(reservation => reservation.status === 'ACTIVE').length;
  }
}
