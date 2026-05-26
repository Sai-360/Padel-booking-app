import { Component, EventEmitter, inject, input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Reservation } from '../../../model/Reservations';
import { ReservationsService } from '../reservations.service';
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

  @Output() reservationUpdated = new EventEmitter<void>();

  actionError = '';

  isFull(): boolean {
    return this.reservations().players.length >= 4;
  }

  isPublic(): boolean {
    return this.reservations().type === 'PUBLIC';
  }

  hasJoined(): boolean {
    return this.reservations().currentUserJoined === true;
  }

  hasPaid(): boolean {
    return this.reservations().currentUserPaid === true;
  }

  canJoin(): boolean {
    return this.isPublic() && !this.isFull() && !this.hasJoined() && !this.isOrganizer();
  }

  canPay(): boolean {
    return this.hasJoined() && !this.hasPaid();
  }

  join(): void {
    this.actionError = '';

    const currentUser = this.userService.getCurrentUser();

    this.reservationsService.joinReservation(this.reservations().id, {
      id: currentUser.id,
      name: currentUser.name,
      paid: false,
      role: 'PLAYER'
    }).subscribe({
      next: () => {
        this.reservationUpdated.emit();
      },
      error: error => {
        this.actionError = error.error?.message || 'Could not join reservation.';
        console.error('Error joining reservation', error);
      }
    });
  }

  pay(): void {
    this.actionError = '';

    const currentUser = this.userService.getCurrentUser();

    this.reservationsService.payReservation(this.reservations().id, currentUser.id).subscribe({
      next: () => {
        this.reservationUpdated.emit();
      },
      error: error => {
        this.actionError = error.error?.message || 'Could not pay reservation.';
        console.error('Error paying reservation', error);
      }
    });
  }

  getSiteName(): string {
    switch (this.reservations().siteId) {
      case 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa':
        return 'Padel Brussels';
      case 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb':
        return 'Padel Namur';
      default:
        return this.reservations().siteId;
    }
  }

  getCourtName(): string {
    switch (this.reservations().courtId) {
      case 'cccccccc-cccc-cccc-cccc-cccccccccccc':
        return 'Court 1';
      case 'dddddddd-dddd-dddd-dddd-dddddddddddd':
        return 'Court 2';
      default:
        return this.reservations().courtId;
    }
  }

  isOrganizer(): boolean {
    return this.reservations().organizerId === this.userService.getCurrentUserId();
  }


}
