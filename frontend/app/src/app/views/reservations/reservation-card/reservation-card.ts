import { Component, EventEmitter, inject, input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Reservation } from '../../../model/Reservations';
import { ReservationsService } from '../reservations.service';
import { UserService } from '../../user/user.service';
import { SiteApiService } from '../../../services/site-api.service';
import { CourtApiService } from '../../../services/court-api.service';
import { BookingRuleApiService } from '../../../services/booking-rule-api.service';

type ReservationWithBackendCount = Reservation & {
  participantsCount?: number;
};

@Component({
  selector: 'app-reservation-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './reservation-card.html',
  styleUrl: './reservation-card.css',
})
export class ReservationCard implements OnInit {

  private reservationsService = inject(ReservationsService);
  private userService = inject(UserService);
  private siteApiService = inject(SiteApiService);
  private courtApiService = inject(CourtApiService);
  private bookingRuleApiService = inject(BookingRuleApiService);
  private router = inject(Router);

  private static siteNameCache = new Map<string, string>();
  private static courtNameCache = new Map<string, string>();
  private static maxPlayersCache: number | null = null;

  reservations = input.required<Reservation>();

  @Output() reservationUpdated = new EventEmitter<void>();

  actionError = '';

  siteName = 'Loading site...';
  courtName = 'Loading court...';
  maxPlayers = 4;

  ngOnInit(): void {
    this.loadDisplayNames();
    this.loadMaxPlayers();
  }

  private loadDisplayNames(): void {
    const reservation = this.reservations();

    const cachedSiteName = ReservationCard.siteNameCache.get(reservation.siteId);
    const cachedCourtName = ReservationCard.courtNameCache.get(reservation.courtId);

    if (cachedSiteName) {
      this.siteName = cachedSiteName;
    } else {
      this.siteName = this.shortenUuid(reservation.siteId);

      this.siteApiService.getSites().subscribe({
        next: sites => {
          for (const site of sites) {
            ReservationCard.siteNameCache.set(site.id, site.name);
          }

          this.siteName = ReservationCard.siteNameCache.get(reservation.siteId)
            ?? this.shortenUuid(reservation.siteId);
        },
        error: error => {
          console.error('Error loading site name', error);
        }
      });
    }

    if (cachedCourtName) {
      this.courtName = cachedCourtName;
    } else {
      this.courtName = this.shortenUuid(reservation.courtId);

      this.courtApiService.getCourtsBySite(reservation.siteId).subscribe({
        next: courts => {
          for (const court of courts) {
            ReservationCard.courtNameCache.set(court.id, court.name);
          }

          this.courtName = ReservationCard.courtNameCache.get(reservation.courtId)
            ?? this.shortenUuid(reservation.courtId);
        },
        error: error => {
          console.error('Error loading court name', error);
        }
      });
    }
  }

  private loadMaxPlayers(): void {
    if (ReservationCard.maxPlayersCache !== null) {
      this.maxPlayers = ReservationCard.maxPlayersCache;
      return;
    }

    this.bookingRuleApiService.getBookingRules().subscribe({
      next: rule => {
        ReservationCard.maxPlayersCache = rule.maxPlayers;
        this.maxPlayers = rule.maxPlayers;
      },
      error: error => {
        console.error('Error loading booking rule max players', error);
      }
    });
  }

  getSiteName(): string {
    return this.siteName;
  }

  getCourtName(): string {
    return this.courtName;
  }

  isFull(): boolean {
    return this.getPlayersCount() >= this.maxPlayers;
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

  isOrganizer(): boolean {
    const currentUser = this.userService.getCurrentUserOrNull();

    if (!currentUser) {
      return false;
    }

    return this.reservations().organizerId === currentUser.id;
  }

  canJoin(): boolean {
    return this.userService.isLoggedIn()
      && this.isPublic()
      && !this.isFull()
      && !this.hasJoined()
      && !this.isOrganizer()
      && !this.isPast();
  }

  canShowLoginToJoin(): boolean {
    return !this.userService.isLoggedIn()
      && this.isPublic()
      && !this.isFull()
      && !this.isPast();
  }

  canPay(): boolean {
    return this.userService.isLoggedIn()
      && this.hasJoined()
      && !this.hasPaid()
      && !this.isPast();
  }

  join(): void {
    this.actionError = '';

    const currentUser = this.userService.getCurrentUserOrNull();

    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

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

    const currentUser = this.userService.getCurrentUserOrNull();

    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

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

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  getPlayersCount(): number {
    const reservation = this.reservations() as ReservationWithBackendCount;

    if (typeof reservation.participantsCount === 'number') {
      return reservation.participantsCount;
    }

    return reservation.players?.length ?? 0;
  }

  getAvailableSeats(): number {
    return Math.max(this.maxPlayers - this.getPlayersCount(), 0);
  }

  getPlayerSlots(): number[] {
    return Array.from({ length: this.maxPlayers }, (_, index) => index + 1);
  }

  getDateLabel(): string {
    const dateValue = this.reservations().date;

    if (!dateValue) {
      return 'Date not set';
    }

    const date = new Date(`${dateValue}T00:00:00`);

    return date.toLocaleDateString('fr-BE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getTimeLabel(): string {
    const startTime = this.getNormalizedStartTime();

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

  getPriceLabel(): string {
    const price = Number(this.reservations().price ?? 0);

    return price.toLocaleString('fr-BE', {
      style: 'currency',
      currency: 'EUR'
    });
  }

  getTypeLabel(): string {
    return this.isPublic() ? 'Public match' : 'Private match';
  }

  getRoleLabel(): string {
    if (this.isOrganizer()) {
      return 'Organizer';
    }

    if (this.hasJoined()) {
      return 'Player';
    }

    return 'Open';
  }

  getStatusLabel(): string {
    if (this.isPast()) {
      return 'Finished';
    }

    if (this.isFull()) {
      return 'Full';
    }

    if (this.hasPaid()) {
      return 'Paid';
    }

    if (this.hasJoined()) {
      return 'Joined';
    }

    return 'Available';
  }

  isPast(): boolean {
    const dateValue = this.reservations().date;
    const startTime = this.getNormalizedStartTime();

    if (!dateValue || !startTime) {
      return false;
    }

    const [hours, minutes] = startTime.split(':').map(value => Number(value));
    const matchEnd = new Date(`${dateValue}T00:00:00`);

    matchEnd.setHours(hours, minutes, 0, 0);
    matchEnd.setMinutes(matchEnd.getMinutes() + 90);

    return matchEnd.getTime() < Date.now();
  }

  private getNormalizedStartTime(): string {
    const time = this.reservations().time;

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

  private shortenUuid(value: string): string {
    if (!value) {
      return 'Unknown';
    }

    return value.substring(0, 8);
  }
}
