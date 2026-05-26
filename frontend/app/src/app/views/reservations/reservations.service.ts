import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Reservation } from '../../model/Reservations';
import { Player } from '../../model/Player';
import { UserService } from '../user/user.service';
import { Observable, map } from 'rxjs';

interface ReservationDTO {
  id: string;
  siteId: string;
  courtId: string;
  organizerId: string;
  reservationDate: string;
  startTime: string;
  type: 'PUBLIC' | 'PRIVATE';
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
  price: number;
  participantsCount: number;
  currentUserJoined: boolean;
  currentUserPaid: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationsService {

  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);

  private readonly apiUrl = 'http://localhost:8080/reservations';

  getReservation(): Observable<Reservation[]> {
    const currentUserId = this.userService.getCurrentUserId();

    return this.http.get<ReservationDTO[]>(`${this.apiUrl}?currentUserId=${currentUserId}`)
      .pipe(
        map(reservations => reservations.map(reservation => this.toReservation(reservation)))
      );
  }

  getPublicReservations(): Observable<Reservation[]> {
    const currentUserId = this.userService.getCurrentUserId();

    return this.http.get<ReservationDTO[]>(`${this.apiUrl}/public?currentUserId=${currentUserId}`)
      .pipe(
        map(reservations => reservations.map(reservation => this.toReservation(reservation)))
      );
  }

  addReservation(reservation: Reservation): Observable<Reservation> {
    const reservationDTO: ReservationDTO = {
      id: reservation.id,
      siteId: reservation.siteId,
      courtId: reservation.courtId,
      organizerId: reservation.organizerId,
      reservationDate: reservation.date,
      startTime: this.formatTimeForBackend(reservation.time),
      type: reservation.type,
      status: reservation.status,
      price: reservation.price,
      participantsCount: reservation.players.length,
      currentUserJoined: reservation.currentUserJoined ?? false,
      currentUserPaid: reservation.currentUserPaid ?? false
    };

    return this.http.post<ReservationDTO>(this.apiUrl, reservationDTO)
      .pipe(
        map(createdReservation => this.toReservation(createdReservation))
      );
  }

  joinReservation(reservationId: string, player: Player): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/${reservationId}/join`, {
      memberId: player.id
    });
  }

  payReservation(reservationId: string, playerId: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/${reservationId}/pay`, {
      memberId: playerId
    });
  }

  getMyReservations(playerId: string): Observable<Reservation[]> {
    return this.http.get<ReservationDTO[]>(`${this.apiUrl}/member/${playerId}`)
      .pipe(
        map(reservations => reservations.map(reservation => this.toReservation(reservation)))
      );
  }

  private toReservation(reservationDTO: ReservationDTO): Reservation {
    return {
      id: reservationDTO.id,
      siteId: reservationDTO.siteId,
      courtId: reservationDTO.courtId,
      date: reservationDTO.reservationDate,
      time: reservationDTO.startTime.substring(0, 5),
      type: reservationDTO.type,
      organizerId: reservationDTO.organizerId,
      players: this.createFakePlayers(reservationDTO.participantsCount),
      price: reservationDTO.price,
      status: reservationDTO.status,
      currentUserJoined: reservationDTO.currentUserJoined,
      currentUserPaid: reservationDTO.currentUserPaid
    };
  }

  private createFakePlayers(participantsCount: number): Player[] {
    return Array.from({ length: participantsCount }, (_, index) => ({
      id: `player-${index + 1}`,
      name: `Player ${index + 1}`,
      paid: false,
      role: 'PLAYER'
    }));
  }

  private formatTimeForBackend(time: string): string {
    if (time.length === 5) {
      return `${time}:00`;
    }

    return time;
  }
}
