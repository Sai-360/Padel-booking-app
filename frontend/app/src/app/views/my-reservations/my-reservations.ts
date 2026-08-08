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
import { MemberApiService } from '../user/member-api.service';
import { Reservation } from '../../model/Reservations';
import { Member } from '../../model/Member';
import { BookingRuleApiService } from '../../services/booking-rule-api.service';

type MyReservationFilter = 'ALL' | 'UPCOMING' | 'PAST' | 'ORGANIZER' | 'JOINED' | 'PRIVATE';

type ReservationWithUserState = Reservation & {
  currentUserJoined?: boolean;
  currentUserPaid?: boolean;
  participantsCount?: number;
};

type TimeSlotFromBackend = {
  startTime: string;
  endTime: string;
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
  private memberApiService = inject(MemberApiService);
  private bookingRuleApiService = inject(BookingRuleApiService);

  reservations: Reservation[] = [];
  members: Member[] = [];

  selectedFilter: MyReservationFilter = 'ALL';

  privatePlayersForms: Record<string, string> = {};
  privatePlayersMessage: Record<string, string> = {};
  privatePlayersError: Record<string, string> = {};
  privatePlayersLoading: Record<string, boolean> = {};

  isLoading = false;
  loadingError = '';

  isLoadingMembers = false;
  membersError = '';

  maxPlayers = 0;

  private timeSlotLabelCache: Record<string, string> = {};
  private timeSlotEndTimeCache: Record<string, string> = {};

  get currentUserId(): string {
    return this.userService.getCurrentUserOrNull()?.id ?? '';
  }

  ngOnInit(): void {
    this.loadBookingRules();
    this.loadMembers();
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
        this.loadTimeSlotsForReservations();
        this.isLoading = false;
      },
      error: error => {
        this.isLoading = false;
        this.loadingError = 'Unable to load your reservations.';
        console.error('Error loading my reservations', error);
      }
    });
  }

  loadMembers(): void {
    this.isLoadingMembers = true;
    this.membersError = '';

    this.memberApiService.getMembers().subscribe({
      next: members => {
        this.members = members;
        this.isLoadingMembers = false;
      },
      error: error => {
        this.members = [];
        this.isLoadingMembers = false;
        this.membersError = 'Unable to load members for private invitations.';
        console.error('Error loading members', error);
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

  private loadTimeSlotsForReservations(): void {
    const siteIds = [...new Set(this.reservations.map(reservation => reservation.siteId))];

    for (const siteId of siteIds) {
      this.bookingRuleApiService.getTimeSlotsBySite(siteId).subscribe({
        next: timeSlots => {
          for (const timeSlot of timeSlots as TimeSlotFromBackend[]) {
            const startTime = this.normalizeTimeValue(timeSlot.startTime);
            const endTime = this.normalizeTimeValue(timeSlot.endTime);
            const key = this.getTimeSlotCacheKey(siteId, startTime);

            this.timeSlotLabelCache[key] = `${startTime} - ${endTime}`;
            this.timeSlotEndTimeCache[key] = endTime;
          }
        },
        error: error => {
          console.error('Error loading time slots for reservations', error);
        }
      });
    }
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
      && this.maxPlayers > 0
      && this.getPlayersCount(reservation) < this.maxPlayers;
  }

  getSelectableMembers(reservation: Reservation): Member[] {
    return this.members
      .filter(member => member.id !== this.currentUserId)
      .filter(member => !this.isBlockedMember(member))
      .filter(member => !this.isAlreadyInReservation(reservation, member))
      .sort((a, b) => a.matricule.localeCompare(b.matricule));
  }

  selectPrivatePlayer(reservationId: string, member: Member): void {
    this.privatePlayersForms[reservationId] = member.matricule;
    this.privatePlayersMessage[reservationId] = '';
    this.privatePlayersError[reservationId] = '';
  }

  quickAddPrivatePlayer(reservationId: string, member: Member): void {
    this.selectPrivatePlayer(reservationId, member);
    this.addPrivatePlayers(reservationId);
  }

  addPrivatePlayers(reservationId: string): void {
    const currentUser = this.userService.getCurrentUserOrNull();
    const matricule = (this.privatePlayersForms[reservationId] ?? '').trim().toUpperCase();

    this.privatePlayersMessage[reservationId] = '';
    this.privatePlayersError[reservationId] = '';

    if (!currentUser) {
      this.privatePlayersError[reservationId] = 'Please login before adding a player.';
      return;
    }

    if (!matricule) {
      this.privatePlayersError[reservationId] = 'Please select or enter one player matricule.';
      return;
    }

    this.privatePlayersLoading[reservationId] = true;

    this.reservationsService.addPrivatePlayers(
      reservationId,
      currentUser.id,
      [matricule]
    ).subscribe({
      next: () => {
        this.privatePlayersLoading[reservationId] = false;
        this.privatePlayersMessage[reservationId] = `Player ${matricule} added successfully.`;
        this.privatePlayersForms[reservationId] = '';
        this.loadMyReservations();
      },
      error: error => {
        this.privatePlayersLoading[reservationId] = false;
        this.privatePlayersError[reservationId] =
          error.error?.message || 'Unable to add private player.';
      }
    });
  }

  getMemberTypeLabel(member: Member): string {
    if (member.type === 'GLOBAL') {
      return 'Global member';
    }

    if (member.type === 'SITE') {
      return 'Site member';
    }

    if (member.type === 'FREE') {
      return 'Free member';
    }

    return member.type;
  }

  getMemberStatusLabel(member: Member): string {
    if (this.isBlockedMember(member)) {
      return 'Blocked';
    }

    if (Number(member.unpaidBalance ?? 0) > 0) {
      return 'Balance due';
    }

    if (member.adminRole && member.adminRole !== 'NONE') {
      return 'Admin account';
    }

    return 'Available';
  }

  isBlockedMember(member: Member): boolean {
    if (!member.blockedUntil) {
      return false;
    }

    const today = new Date();
    const blockedUntil = new Date(`${member.blockedUntil}T00:00:00`);

    today.setHours(0, 0, 0, 0);
    blockedUntil.setHours(0, 0, 0, 0);

    return blockedUntil.getTime() >= today.getTime();
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

    const cacheKey = this.getTimeSlotCacheKey(reservation.siteId, startTime);

    return this.timeSlotLabelCache[cacheKey] ?? startTime;
  }

  isPast(reservation: Reservation): boolean {
    const matchEnd = this.getReservationEndDateTime(reservation);

    return matchEnd.getTime() < Date.now();
  }

  private isAlreadyInReservation(reservation: Reservation, member: Member): boolean {
    if (reservation.organizerId === member.id) {
      return true;
    }

    return reservation.players?.some(player => player.id === member.id) ?? false;
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

  private getReservationEndDateTime(reservation: Reservation): Date {
    const startTime = this.getNormalizedStartTime(reservation);
    const cacheKey = this.getTimeSlotCacheKey(reservation.siteId, startTime);
    const endTime = this.timeSlotEndTimeCache[cacheKey] ?? startTime;

    const date = new Date(`${reservation.date}T00:00:00`);
    const [hours, minutes] = endTime.split(':').map(value => Number(value));

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

  private normalizeTimeValue(value: string): string {
    return value.substring(0, 5);
  }

  private getTimeSlotCacheKey(siteId: string, startTime: string): string {
    return `${siteId}-${startTime}`;
  }
}
