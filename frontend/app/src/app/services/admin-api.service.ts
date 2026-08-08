import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Reservation } from '../model/Reservations';
import { Player } from '../model/Player';

export interface AdminMemberDTO {
  id: string;
  matricule: string;
  name: string;
  type: string;
  siteId: string | null;
  unpaidBalance: number;
  blockedUntil: string | null;
  adminRole: string;
}

interface AdminReservationDTO {
  id: string;
  siteId: string;
  courtId: string;
  organizerId: string;
  reservationDate: string;
  startTime: string;
  type: 'PUBLIC' | 'PRIVATE';
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
  price: number;
  participantsCount?: number;
  currentUserJoined?: boolean;
  currentUserPaid?: boolean;
}

type ReservationWithBackendCount = Reservation & {
  participantsCount?: number;
};

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/admin';

  getAdminReservations(): Observable<Reservation[]> {
    return this.http.get<AdminReservationDTO[]>(`${this.apiUrl}/reservations`)
      .pipe(
        map(reservations => reservations.map(reservation => this.toReservation(reservation)))
      );
  }

  getAdminMembers(): Observable<AdminMemberDTO[]> {
    return this.http.get<AdminMemberDTO[]>(`${this.apiUrl}/members`);
  }

  private toReservation(reservationDTO: AdminReservationDTO): Reservation {
    const participantsCount = reservationDTO.participantsCount ?? 0;

    const reservation: ReservationWithBackendCount = {
      id: reservationDTO.id,
      siteId: reservationDTO.siteId,
      courtId: reservationDTO.courtId,
      date: reservationDTO.reservationDate,
      time: reservationDTO.startTime.substring(0, 5),
      type: reservationDTO.type,
      organizerId: reservationDTO.organizerId,
      players: this.createFakePlayers(participantsCount),
      price: reservationDTO.price,
      status: reservationDTO.status,
      currentUserJoined: reservationDTO.currentUserJoined ?? false,
      currentUserPaid: reservationDTO.currentUserPaid ?? false,
      participantsCount
    };

    return reservation;
  }

  private createFakePlayers(participantsCount: number): Player[] {
    return Array.from({ length: participantsCount }, (_, index) => ({
      id: `player-${index + 1}`,
      name: `Player ${index + 1}`,
      paid: false,
      role: 'PLAYER'
    }));
  }
}
