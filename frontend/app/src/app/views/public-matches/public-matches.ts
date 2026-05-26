import { Component, inject, OnInit } from '@angular/core';
import { ReservationCard } from '../reservations/reservation-card/reservation-card';
import { ReservationsService } from '../reservations/reservations.service';
import { Reservation } from '../../model/Reservations';

@Component({
  selector: 'app-public-matches',
  standalone: true,
  imports: [ReservationCard],
  templateUrl: './public-matches.html',
  styleUrl: './public-matches.css'
})
export class PublicMatches implements OnInit {

  private reservationsService = inject(ReservationsService);

  reservations: Reservation[] = [];

  ngOnInit(): void {
    this.loadPublicReservations();
  }

  loadPublicReservations(): void {
    this.reservationsService.getPublicReservations().subscribe({
      next: reservations => {
        this.reservations = reservations;
      },
      error: error => {
        console.error('Error loading public reservations', error);
      }
    });
  }
}
