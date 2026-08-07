import { Component, inject, OnInit } from '@angular/core';
import { ReservationCard } from '../reservations/reservation-card/reservation-card';
import { ReservationsService } from '../reservations/reservations.service';
import { Reservation } from '../../model/Reservations';

type PublicMatchFilter = 'ALL' | 'TODAY' | 'UPCOMING';

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
  selectedFilter: PublicMatchFilter = 'ALL';

  isLoading = false;
  loadingError = '';

  ngOnInit(): void {
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
    return this.reservations.reduce((total, reservation) => {
      const playersCount = reservation.players?.length ?? 0;
      const availableSeats = Math.max(4 - playersCount, 0);

      return total + availableSeats;
    }, 0);
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
