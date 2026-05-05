import { Component, inject } from '@angular/core';
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
export class PublicMatches {
  private reservationsService = inject(ReservationsService);

  get reservations(): Reservation[] {
    return this.reservationsService.getPublicReservations();
  }
}
