import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ReservationCard } from '../reservation-card/reservation-card';
import { ReservationsService } from '../reservations.service';
import { Reservation } from '../../../model/Reservations';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [ReservationCard, MatButtonModule, RouterLink],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css'
})
export class ReservationList {
  private reservationsService = inject(ReservationsService);

  reservations: Reservation[] = this.reservationsService.getPublicReservations();
}
