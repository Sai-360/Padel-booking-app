import { Component, inject, OnInit } from '@angular/core';

import { ReservationCard } from '../reservations/reservation-card/reservation-card';
import { ReservationsService } from '../reservations/reservations.service';
import { Reservation } from '../../model/Reservations';
import { BookingRuleApiService } from '../../services/booking-rule-api.service';

type PublicMatchFilter = 'ALL' | 'TODAY' | 'UPCOMING';

type ReservationWithBackendCount = Reservation & {
  participantsCount?: number;
};

@Component({
  selector: 'app-public-matches',
  standalone: true,
  imports: [ReservationCard],
  templateUrl: './public-matches.html',
  styleUrl: './public-matches.css'
})
export class PublicMatches implements OnInit {

  private reservationsService = inject(ReservationsService);
  private bookingRuleApiService = inject(BookingRuleApiService);

  reservations: Reservation[] = [];
  selectedFilter: PublicMatchFilter = 'ALL';

  maxPlayers: number | null = null;

  isLoading = false;
  loadingError = '';

  ngOnInit(): void {
    this.loadBookingRules();
    this.loadPublicReservations();
  }

  loadPublicReservations(): void {
    this.isLoading = true;
    this.loadingError = '';

    this.reservationsService.getPublicReservations().subscribe({
      next: reservations => {
        this.reservations = reservations;
        this.isLoading = false;
      },
      error: error => {
        this.isLoading = false;
        this.loadingError = 'Unable to load public matches.';
        console.error('Error loading public reservations', error);
      }
    });
  }

  loadBookingRules(): void {
    this.bookingRuleApiService.getBookingRules().subscribe({
      next: bookingRule => {
        this.maxPlayers = bookingRule.maxPlayers;
      },
      error: error => {
        console.error('Error loading booking rules', error);
      }
    });
  }

  setFilter(filter: PublicMatchFilter): void {
    this.selectedFilter = filter;
  }

  getFilteredReservations(): Reservation[] {
    if (this.selectedFilter === 'TODAY') {
      return this.reservations.filter(reservation => this.isToday(reservation.date));
    }

    if (this.selectedFilter === 'UPCOMING') {
      return this.reservations.filter(reservation => this.isUpcoming(reservation.date));
    }

    return this.reservations;
  }

  getTotalMatches(): number {
    return this.reservations.length;
  }

  getTodayMatches(): number {
    return this.reservations.filter(reservation => this.isToday(reservation.date)).length;
  }

  getUpcomingMatches(): number {
    return this.reservations.filter(reservation => this.isUpcoming(reservation.date)).length;
  }

  getAvailableSeatsCount(): number {
    if (this.maxPlayers === null) {
      return 0;
    }

    return this.reservations.reduce((total, reservation) => {
      const playersCount = this.getPlayersCount(reservation);
      const availableSeats = Math.max(this.maxPlayers! - playersCount, 0);

      return total + availableSeats;
    }, 0);
  }

  private getPlayersCount(reservation: Reservation): number {
    const reservationWithCount = reservation as ReservationWithBackendCount;

    if (typeof reservationWithCount.participantsCount === 'number') {
      return reservationWithCount.participantsCount;
    }

    return reservation.players?.length ?? 0;
  }

  private isToday(dateValue: string): boolean {
    const today = this.formatDateForBackend(new Date());

    return dateValue === today;
  }

  private isUpcoming(dateValue: string): boolean {
    const today = this.getStartOfToday();
    const reservationDate = new Date(`${dateValue}T00:00:00`);

    reservationDate.setHours(0, 0, 0, 0);

    return reservationDate.getTime() >= today.getTime();
  }

  private getStartOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return today;
  }

  private formatDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
