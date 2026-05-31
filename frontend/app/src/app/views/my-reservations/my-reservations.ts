import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ReservationCard } from '../reservations/reservation-card/reservation-card';
import { ReservationsService } from '../reservations/reservations.service';
import { UserService } from '../user/user.service';
import { Reservation } from '../../model/Reservations';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [
    ReservationCard,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './my-reservations.html',
  styleUrl: './my-reservations.css'
})
export class MyReservations implements OnInit {

  private reservationsService = inject(ReservationsService);
  private userService = inject(UserService);

  reservations: Reservation[] = [];

  privatePlayersForms: Record<string, string> = {};
  privatePlayersMessage: Record<string, string> = {};
  privatePlayersError: Record<string, string> = {};

  get currentUserId(): string {
    return this.userService.getCurrentUserId();
  }

  ngOnInit(): void {
    this.loadMyReservations();
  }

  loadMyReservations(): void {
    this.reservationsService.getMyReservations(
      this.userService.getCurrentUserId()
    ).subscribe({
      next: reservations => {
        this.reservations = reservations;
      },
      error: error => {
        console.error('Error loading my reservations', error);
      }
    });
  }

  initPrivatePlayersForm(reservationId: string): string {
    if (this.privatePlayersForms[reservationId] === undefined) {
      this.privatePlayersForms[reservationId] = '';
    }

    return '';
  }

  addPrivatePlayers(reservationId: string): void {
    const currentUser = this.userService.getCurrentUser();
    const matricule = this.privatePlayersForms[reservationId];

    this.privatePlayersMessage[reservationId] = '';
    this.privatePlayersError[reservationId] = '';

    if (!matricule || !matricule.trim()) {
      this.privatePlayersError[reservationId] = 'Please enter one player matricule.';
      return;
    }

    this.reservationsService.addPrivatePlayers(
      reservationId,
      currentUser.id,
      [matricule.trim()]
    ).subscribe({
      next: () => {
        this.privatePlayersMessage[reservationId] = 'Player added successfully.';
        this.privatePlayersForms[reservationId] = '';
        this.loadMyReservations();
      },
      error: error => {
        this.privatePlayersError[reservationId] =
          error.error?.message || 'Unable to add private player.';
      }
    });
  }
}
