import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import { ReservationCard } from '../reservations/reservation-card/reservation-card';
import { ReservationsService } from '../reservations/reservations.service';
import { UserService } from '../user/user.service';
import { Reservation } from '../../model/Reservations';
import { BookingRuleApiService } from '../../services/booking-rule-api.service';

type MyReservationFilter = 'ALL' | 'UPCOMING' | 'PAST' | 'ORGANIZER' | 'JOINED' | 'PRIVATE';

type ReservationWithUserState = Reservation & {
  currentUserJoined?: boolean;
  currentUserPaid?: boolean;
  participantsCount?: number;
};

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [
    ReservationCard,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './my-reservations.html',
  styleUrl: './my-reservations.css'
})
export class MyReservations implements OnInit {

  private reservationsService = inject(ReservationsService);
  private userService = inject(UserService);
  private bookingRuleApiService = inject(BookingRuleApiService);

  reservations: Reservation[] = [];

  selectedFilter: MyReservationFilter = 'ALL';

  privatePlayersForms: Record<string, string> = {};
  privatePlayersMessage: Record<string, string> = {};
  privatePlayersError: Record<string, string> = {};

  isLoading = false;
  loadingError = '';

  maxPlayers = 4;

  get currentUserId(): string {
    return this.userService.getCurrentUserOrNull()?.id ?? '';
  }

  ngOnInit(): void {
    this.loadBookingRules();
    this.loadMyReservations();
  }

  loadMyReservations(): void {
    const currentUser = this.userService.getCurrentUserOrNull();

    if (!currentUser) {
      this.loadingError = 'Please login to see your reservations.';
      return;
    }

    this.isLoading = true;
    this.loadingError = '';

    this.reservationsService.getMyReservations(currentUser.id).subscribe({
      next: reservations => {
        this.reservations = reservations;
        this.preparePrivatePlayersForms();
        this.isLoading = false;
      },
      error: error => {
        this.isLoading = false;
        this.loadingError = 'Unable to load your reservations.';
        console.error('Error loading my reservations', error);
      }
    });
  }

  private loadBookingRules(): void {
    this.bookingRuleApiService.getBookingRules().subscribe({
      next: rule => {
        this.maxPlayers = rule.maxPlayers;
      },
      error: error => {
        console.error('Error loading booking rules', error);
      }
    });
  }

  private preparePrivatePlayersForms(): void {
    for (const reservation of this.reservations) {
      if (this.privatePlayersForms[reservation.id] === undefined) {
        this.privatePlayersForms[reservation.id] = '';
      }
    }
  }

  setFilter(filter: MyReservationFilter): void {
    this.selectedFilter = filter;
  }

  getFilteredReservations(): Reservation[] {
    let filteredReservations = [...this.reservations];

    if (this.selectedFilter === 'UPCOMING') {
      filteredReservations = filteredReservations.filter(reservation => !this.isPast(reservation));
    }

    if (this.selectedFilter === 'PAST') {
      filteredReservations = filteredReservations.filter(reservation => this.isPast(reservation));
    }

    if (this.selectedFilter === 'ORGANIZER') {
      filteredReservations = filteredReservations.filter(reservation => this.isOrganizer(reservation));
    }

    if (this.selectedFilter === 'JOINED') {
      filteredReservations = filteredReservations.filter(reservation =>
        this.hasJoined(reservation) && !this.isOrganizer(reservation)
      );
    }

    if (this.selectedFilter === 'PRIVATE') {
      filteredReservations = filteredReservations.filter(reservation => reservation.type === 'PRIVATE');
    }

    return filteredReservations.sort((a, b) =>
      this.getReservationDateTime(a).getTime() - this.getReservationDateTime(b).getTime()
    );
  }

  getTotalReservations(): number {
    return this.reservations.length;
  }

  getUpcomingReservationsCount(): number {
    return this.reservations.filter(reservation => !this.isPast(reservation)).length;
  }

  getPrivateReservationsCount(): number {
    return this.reservations.filter(reservation => reservation.type === 'PRIVATE').length;
  }

  getNeedPaymentCount(): number {
    return this.reservations.filter(reservation =>
      this.hasJoined(reservation) && !this.hasPaid(reservation) && !this.isPast(reservation)
    ).length;
  }

  isPrivateOrganizer(reservation: Reservation): boolean {
    return reservation.type === 'PRIVATE' && this.isOrganizer(reservation);
  }

  isOrganizer(reservation: Reservation): boolean {
    return !!this.currentUserId && reservation.organizerId === this.currentUserId;
  }

  hasJoined(reservation: Reservation): boolean {
    const reservationWithState = reservation as ReservationWithUserState;

    if (reservationWithState.currentUserJoined === true) {
      return true;
    }

    if (!this.currentUserId) {
      return false;
    }

    return reservation.players?.some(player => player.id === this.currentUserId) ?? false;
  }

  hasPaid(reservation: Reservation): boolean {
    const reservationWithState = reservation as ReservationWithUserState;

    if (reservationWithState.currentUserPaid === true) {
      return true;
    }

    if (!this.currentUserId) {
      return false;
    }

    return reservation.players?.some(player =>
      player.id === this.currentUserId && player.paid === true
    ) ?? false;
  }

  getPlayersCount(reservation: Reservation): number {
    const reservationWithState = reservation as ReservationWithUserState;

    if (typeof reservationWithState.participantsCount === 'number') {
      return reservationWithState.participantsCount;
    }

    return reservation.players?.length ?? 0;
  }

  getAvailableSeats(reservation: Reservation): number {
    return Math.max(this.maxPlayers - this.getPlayersCount(reservation), 0);
  }

  canAddPrivatePlayer(reservation: Reservation): boolean {
    return this.isPrivateOrganizer(reservation)
      && !this.isPast(reservation)
      && this.getPlayersCount(reservation) < this.maxPlayers;
  }

  addPrivatePlayers(reservationId: string): void {
    const currentUser = this.userService.getCurrentUserOrNull();
    const matricule = this.privatePlayersForms[reservationId];

    this.privatePlayersMessage[reservationId] = '';
    this.privatePlayersError[reservationId] = '';

    if (!currentUser) {
      this.privatePlayersError[reservationId] = 'Please login before adding a player.';
      return;
    }

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

  getDateLabel(reservation: Reservation): string {
    if (!reservation.date) {
      return 'Date not set';
    }

    const date = new Date(`${reservation.date}T00:00:00`);

    return date.toLocaleDateString('fr-BE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getTimeLabel(reservation: Reservation): string {
    const startTime = this.getNormalizedStartTime(reservation);

    if (!startTime) {
      return 'Time not set';
    }

    const [hours, minutes] = startTime.split(':').map(value => Number(value));

    const start = new Date();
    start.setHours(hours, minutes, 0, 0);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 90);

    return `${this.formatTime(start)} - ${this.formatTime(end)}`;
  }

  isPast(reservation: Reservation): boolean {
    const matchEnd = this.getReservationDateTime(reservation);
    matchEnd.setMinutes(matchEnd.getMinutes() + 90);

    return matchEnd.getTime() < Date.now();
  }

  private getReservationDateTime(reservation: Reservation): Date {
    const startTime = this.getNormalizedStartTime(reservation);
    const date = new Date(`${reservation.date}T00:00:00`);

    if (!startTime) {
      date.setHours(0, 0, 0, 0);
      return date;
    }

    const [hours, minutes] = startTime.split(':').map(value => Number(value));

    date.setHours(hours, minutes, 0, 0);

    return date;
  }

  private getNormalizedStartTime(reservation: Reservation): string {
    const time = reservation.time;

    if (!time) {
      return '';
    }

    if (time.includes('-')) {
      return time.split('-')[0].trim().substring(0, 5);
    }

    return time.substring(0, 5);
  }

  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  }
}
