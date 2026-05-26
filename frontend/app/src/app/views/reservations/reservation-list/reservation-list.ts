import { Component, inject, OnInit } from '@angular/core';
import { ReservationCard } from '../reservation-card/reservation-card';
import { ReservationsService } from '../reservations.service';
import { Reservation } from '../../../model/Reservations';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [ReservationCard],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css'
})
export class ReservationList implements OnInit {

  private reservationsService = inject(ReservationsService);

  reservations: Reservation[] = [];

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.reservationsService.getPublicReservations().subscribe({
      next: reservations => {
        this.reservations = reservations;
      },
      error: error => {
        console.error('Error loading reservations', error);
      }
    });
  }
}
