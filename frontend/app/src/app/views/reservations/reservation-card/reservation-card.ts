import { Component, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Reservation } from '../../../model/Reservations';
import { ReservationsService } from '../reservations.service';
import { Player } from '../../../model/Player';
import { UserService } from '../../user/user.service';

@Component({
  selector: 'app-reservation-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './reservation-card.html',
  styleUrl: './reservation-card.css',
})
export class ReservationCard {

  private reservationsService = inject(ReservationsService);
  private userService = inject(UserService);

  reservations = input.required<Reservation>();

  isFull(): boolean {
    return this.reservations().players.length >= 4;
  }

  isPublic(): boolean {
    return this.reservations().type === 'PUBLIC';
  }

  isCurrentUserInReservation(): boolean {
    const currentUserId = this.userService.getCurrentUserId();

    return this.reservations().players.some(player => player.id === currentUserId);
  }

  isCurrentUserPaid(): boolean {
    const currentUserId = this.userService.getCurrentUserId();

    const player = this.reservations().players.find(player => player.id === currentUserId);

    return player?.paid === true;
  }

  canJoin(): boolean {
    return this.isPublic() && !this.isFull() && !this.isCurrentUserInReservation();
  }

  canPay(): boolean {
    return this.isCurrentUserInReservation() && !this.isCurrentUserPaid();
  }

  join(): void {
    const currentUser = this.userService.getCurrentUser();

    const player: Player = {
      id: currentUser.id,
      name: currentUser.name,
      paid: false,
      role: 'PLAYER'
    };

    this.reservationsService.joinReservation(this.reservations().id, player);
  }

  pay(): void {
    const currentUserId = this.userService.getCurrentUserId();

    this.reservationsService.payReservation(this.reservations().id, currentUserId);
  }
}
