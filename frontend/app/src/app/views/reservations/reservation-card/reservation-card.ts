import { Component, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Reservation } from '../../../model/Reservations';
import { ReservationsService } from '../reservations.service';
import {Player} from '../../../model/Player';

@Component({
  selector: 'app-reservation-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './reservation-card.html',
  styleUrl: './reservation-card.css',
})
export class ReservationCard {

  reservationsService = inject(ReservationsService);

  reservations = input.required<Reservation>();

  isFull(): boolean {
    return this.reservations().players.length >= 4;
  }

  isPublic(): boolean {
    return this.reservations().type === 'PUBLIC';
  }

  join(): void {
    const player: Player = {
      id: 'player-current',
      name: 'Current Player',
      paid: false,
      role: 'PLAYER'
    };

    this.reservationsService.joinReservation(this.reservations().id, player);
  }
}
