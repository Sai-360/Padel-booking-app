import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ReservationsService } from '../reservations/reservations.service';
import { Reservation } from '../../model/Reservations';
import { ReservationCard } from '../reservations/reservation-card/reservation-card';

type AdminReservationFilter = 'ALL' | 'ACTIVE' | 'PUBLIC' | 'PRIVATE' | 'PAST';
type AdminMemberFilter = 'ALL' | 'ADMINS' | 'BALANCE' | 'BLOCKED';

interface AdminMemberDTO {
  id: string;
  matricule: string;
  name: string;
  type: string;
  siteId: string | null;
  unpaidBalance: number;
  blockedUntil: string | null;
  adminRole: string;
}

type ReservationWithCount = Reservation & {
  participantsCount?: number;
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ReservationCard
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {

  private readonly reservationsService = inject(ReservationsService);
  private readonly http = inject(HttpClient);

  private readonly adminApiUrl = 'http://localhost:8080/admin';

  reservations: Reservation[] = [];
  members: AdminMemberDTO[] = [];

  reservationFilter: AdminReservationFilter = 'ALL';
  memberFilter: AdminMemberFilter = 'ALL';

  loadingReservations = false;
  loadingMembers = false;

  errorMessage = '';
  memberErrorMessage = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loadReservations();
    this.loadMembers();
  }

  loadReservations(): void {
    this.loadingReservations = true;
    this.errorMessage = '';

    this.reservationsService.getReservation().subscribe({
      next: reservations => {
        this.reservations = reservations;
        this.loadingReservations = false;
      },
      error: error => {
        this.errorMessage = 'Could not load admin reservations.';
        this.loadingReservations = false;
        console.error(error);
      }
    });
  }

  loadMembers(): void {
    this.loadingMembers = true;
    this.memberErrorMessage = '';

    this.http.get<AdminMemberDTO[]>(`${this.adminApiUrl}/members`).subscribe({
      next: members => {
        this.members = members;
        this.loadingMembers = false;
      },
      error: error => {
        this.memberErrorMessage = 'Could not load admin members.';
        this.loadingMembers = false;
        console.error(error);
      }
    });
  }

  setReservationFilter(filter: AdminReservationFilter): void {
    this.reservationFilter = filter;
  }

  setMemberFilter(filter: AdminMemberFilter): void {
    this.memberFilter = filter;
  }

  getFilteredReservations(): Reservation[] {
    let filteredReservations = [...this.reservations];

    if (this.reservationFilter === 'ACTIVE') {
      filteredReservations = filteredReservations.filter(reservation => reservation.status === 'ACTIVE');
    }

    if (this.reservationFilter === 'PUBLIC') {
      filteredReservations = filteredReservations.filter(reservation => reservation.type === 'PUBLIC');
    }

    if (this.reservationFilter === 'PRIVATE') {
      filteredReservations = filteredReservations.filter(reservation => reservation.type === 'PRIVATE');
    }

    if (this.reservationFilter === 'PAST') {
      filteredReservations = filteredReservations.filter(reservation => this.isPastReservation(reservation));
    }

    return filteredReservations.sort((a, b) =>
      this.getReservationDateTime(a).getTime() - this.getReservationDateTime(b).getTime()
    );
  }

  getFilteredMembers(): AdminMemberDTO[] {
    let filteredMembers = [...this.members];

    if (this.memberFilter === 'ADMINS') {
      filteredMembers = filteredMembers.filter(member => member.adminRole && member.adminRole !== 'NONE');
    }

    if (this.memberFilter === 'BALANCE') {
      filteredMembers = filteredMembers.filter(member => Number(member.unpaidBalance ?? 0) > 0);
    }

    if (this.memberFilter === 'BLOCKED') {
      filteredMembers = filteredMembers.filter(member => this.isMemberBlocked(member));
    }

    return filteredMembers.sort((a, b) => a.name.localeCompare(b.name));
  }

  getCurrentAdminName(): string {
    const adminUser = this.getStoredAdminUser();

    return adminUser?.name || adminUser?.matricule || 'Admin';
  }

  getCurrentAdminRoleLabel(): string {
    const adminUser = this.getStoredAdminUser();

    if (adminUser?.adminRole === 'GLOBAL_ADMIN') {
      return 'Global Admin';
    }

    if (adminUser?.adminRole === 'SITE_ADMIN') {
      return 'Site Admin';
    }

    return 'Admin';
  }

  getAdminScopeLabel(): string {
    const adminUser = this.getStoredAdminUser();

    if (adminUser?.adminRole === 'GLOBAL_ADMIN') {
      return 'Full platform overview';
    }

    if (adminUser?.adminRole === 'SITE_ADMIN') {
      return 'Site-level overview';
    }

    return 'Protected dashboard';
  }

  getTotalReservations(): number {
    return this.reservations.length;
  }

  getActiveReservationsCount(): number {
    return this.reservations.filter(reservation => reservation.status === 'ACTIVE').length;
  }

  getPublicReservationsCount(): number {
    return this.reservations.filter(reservation => reservation.type === 'PUBLIC').length;
  }

  getPrivateReservationsCount(): number {
    return this.reservations.filter(reservation => reservation.type === 'PRIVATE').length;
  }

  getPastReservationsCount(): number {
    return this.reservations.filter(reservation => this.isPastReservation(reservation)).length;
  }

  getTotalMembers(): number {
    return this.members.length;
  }

  getAdminMembersCount(): number {
    return this.members.filter(member => member.adminRole && member.adminRole !== 'NONE').length;
  }

  getMembersWithBalanceCount(): number {
    return this.members.filter(member => Number(member.unpaidBalance ?? 0) > 0).length;
  }

  getBlockedMembersCount(): number {
    return this.members.filter(member => this.isMemberBlocked(member)).length;
  }

  getTotalParticipantsCount(): number {
    return this.reservations.reduce((total, reservation) => {
      return total + this.getPlayersCount(reservation);
    }, 0);
  }

  getEstimatedRevenue(): number {
    return this.reservations.reduce((total, reservation) => {
      return total + Number(reservation.price ?? 0);
    }, 0);
  }

  getEstimatedRevenueLabel(): string {
    return this.getEstimatedRevenue().toLocaleString('fr-BE', {
      style: 'currency',
      currency: 'EUR'
    });
  }

  getAveragePlayersLabel(): string {
    if (this.reservations.length === 0) {
      return '0';
    }

    const average = this.getTotalParticipantsCount() / this.reservations.length;

    return average.toFixed(1);
  }

  getPlayersCount(reservation: Reservation): number {
    const reservationWithCount = reservation as ReservationWithCount;

    if (typeof reservationWithCount.participantsCount === 'number') {
      return reservationWithCount.participantsCount;
    }

    return reservation.players?.length ?? 0;
  }

  getMemberInitials(member: AdminMemberDTO): string {
    const parts = member.name.trim().split(' ').filter(part => part.length > 0);

    if (parts.length === 0) {
      return member.matricule.substring(0, 2).toUpperCase();
    }

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  getMemberTypeLabel(member: AdminMemberDTO): string {
    if (member.type === 'GLOBAL') {
      return 'Global Member';
    }

    if (member.type === 'SITE') {
      return 'Site Member';
    }

    if (member.type === 'FREE') {
      return 'Free Member';
    }

    return member.type;
  }

  getMemberAdminRoleLabel(member: AdminMemberDTO): string {
    if (!member.adminRole || member.adminRole === 'NONE') {
      return 'No admin access';
    }

    if (member.adminRole === 'GLOBAL_ADMIN') {
      return 'Global Admin';
    }

    if (member.adminRole === 'SITE_ADMIN') {
      return 'Site Admin';
    }

    return member.adminRole;
  }

  getMemberBalanceLabel(member: AdminMemberDTO): string {
    return Number(member.unpaidBalance ?? 0).toLocaleString('fr-BE', {
      style: 'currency',
      currency: 'EUR'
    });
  }

  getMemberStatusLabel(member: AdminMemberDTO): string {
    if (this.isMemberBlocked(member)) {
      return 'Blocked';
    }

    if (Number(member.unpaidBalance ?? 0) > 0) {
      return 'Payment due';
    }

    return 'Active';
  }

  isMemberAdmin(member: AdminMemberDTO): boolean {
    return !!member.adminRole && member.adminRole !== 'NONE';
  }

  isMemberBlocked(member: AdminMemberDTO): boolean {
    if (!member.blockedUntil) {
      return false;
    }

    const today = this.getStartOfToday();
    const blockedUntil = new Date(`${member.blockedUntil}T00:00:00`);

    blockedUntil.setHours(0, 0, 0, 0);

    return blockedUntil.getTime() >= today.getTime();
  }

  isPastReservation(reservation: Reservation): boolean {
    const date = this.getReservationDateTime(reservation);
    date.setMinutes(date.getMinutes() + 90);

    return date.getTime() < Date.now();
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

  private getStartOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return today;
  }

  private getStoredAdminUser(): { name?: string; matricule?: string; adminRole?: string } | null {
    const adminUser = localStorage.getItem('adminUser');

    if (!adminUser) {
      return null;
    }

    try {
      return JSON.parse(adminUser);
    } catch {
      return null;
    }
  }
}
