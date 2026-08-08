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
import {
  BookingRuleApiService,
  TimeSlotDTO
} from '../../../services/booking-rule-api.service';

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
  private static timeSlotsBySiteCache = new Map<string, TimeSlotDTO[]>();

  reservations = input.required<Reservation>();

  @Output() reservationUpdated = new EventEmitter<void>();

  actionError = '';

  siteName = 'Loading site...';
  courtName = 'Loading court...';

  maxPlayers = 0;
  timeSlotLabel = '';
  matchEndTime = '';

  ngOnInit(): void {
    this.loadDisplayNames();
    this.loadBookingRules();
    this.loadTimeSlotInfo();
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

  private loadBookingRules(): void {
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

  private loadTimeSlotInfo(): void {
    const reservation = this.reservations();
    const cachedTimeSlots = ReservationCard.timeSlotsBySiteCache.get(reservation.siteId);

    if (cachedTimeSlots) {
      this.applyTimeSlotInfo(cachedTimeSlots);
      return;
    }

    this.bookingRuleApiService.getTimeSlotsBySite(reservation.siteId).subscribe({
      next: timeSlots => {
        ReservationCard.timeSlotsBySiteCache.set(reservation.siteId, timeSlots);
        this.applyTimeSlotInfo(timeSlots);
      },
      error: error => {
        console.error('Error loading time slots', error);
        this.timeSlotLabel = this.getNormalizedStartTime();
        this.matchEndTime = this.getNormalizedStartTime();
      }
    });
  }

  private applyTimeSlotInfo(timeSlots: TimeSlotDTO[]): void {
    const startTime = this.getNormalizedStartTime();

    if (!startTime) {
      this.timeSlotLabel = '';
      this.matchEndTime = '';
      return;
    }

    const matchingTimeSlot = timeSlots.find(slot => slot.startTime.substring(0, 5) === startTime);

    if (!matchingTimeSlot) {
      this.timeSlotLabel = startTime;
      this.matchEndTime = startTime;
      return;
    }

    const slotStart = matchingTimeSlot.startTime.substring(0, 5);
    const slotEnd = matchingTimeSlot.endTime.substring(0, 5);

    this.timeSlotLabel = matchingTimeSlot.label || `${slotStart} - ${slotEnd}`;
    this.matchEndTime = slotEnd;
  }

  getSiteName(): string {
    return this.siteName;
  }

  getCourtName(): string {
    return this.courtName;
  }

  isFull(): boolean {
    if (this.maxPlayers <= 0) {
      return false;
    }

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
    if (this.maxPlayers <= 0) {
      return 0;
    }

    return Math.max(this.maxPlayers - this.getPlayersCount(), 0);
  }

  getPlayerSlots(): number[] {
    if (this.maxPlayers <= 0) {
      return [];
    }

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
    if (this.timeSlotLabel) {
      return this.timeSlotLabel;
    }

    const startTime = this.getNormalizedStartTime();

    if (!startTime) {
      return 'Time not set';
    }

    return startTime;
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

    const endTime = this.matchEndTime || startTime;
    const [hours, minutes] = endTime.split(':').map(value => Number(value));
    const matchEnd = new Date(`${dateValue}T00:00:00`);

    matchEnd.setHours(hours, minutes, 0, 0);

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

  private shortenUuid(value: string): string {
    if (!value) {
      return 'Unknown';
    }

    return value.substring(0, 8);
  }
}
