import { Injectable } from '@angular/core';
import { Reservation } from '../../model/Reservations';
import { Player } from '../../model/Player';

@Injectable({
  providedIn: 'root'
})
export class ReservationsService {

  private readonly reservations: Reservation[] = [
    {
      id: '1',
      siteId: 'Site 1',
      courtId: 'Court 2',
      date: '2026-06-15',
      time: '10:30',
      type: 'PUBLIC',
      organizerId: 'player-1',
      players: [ {
        id: 'player-1',
        name: 'Player 1',
        paid: true,
        role: 'ORGANIZER'
      },
        {
          id: 'player-2',
          name: 'Player 2',
          paid: true,
          role: 'PLAYER'
        },
        {
          id: 'player-3',
          name: 'Player 3',
          paid: false,
          role: 'PLAYER'

        },
        {  id: 'player-4',
          name: 'Player 4',
          paid: true,
          role: 'PLAYER'
        }],
      price: 60,
      status: 'ACTIVE'
    },
    {
      id: '2',
      siteId: 'Site 2',
      courtId: 'Court 1',
      date: '2026-06-16',
      time: '12:00',
      type: 'PUBLIC',
      organizerId: 'player-2',
      players: [ {
        id: 'player-1',
        name: 'Player 1',
        paid: true,
        role: 'ORGANIZER'
      },
        {
          id: 'player-2',
          name: 'Player 2',
          paid: true,
          role: 'PLAYER'
        },
        {
          id: 'player-3',
          name: 'Player 3',
          paid: false,
          role: 'PLAYER'

        }],
      price: 60,
      status: 'ACTIVE'
    }
  ];

  getReservation(): Reservation[] {
    return this.reservations;
  }

  getPublicReservations(): Reservation[] {
    return this.reservations.filter(r => r.type === 'PUBLIC');
  }

  addReservation(reservation: Reservation): void {
    this.reservations.push(reservation);
  }

  joinReservation(reservationId: string, player: Player): void {
    const reservation = this.reservations.find(r => r.id === reservationId);

    if (!reservation) return;
    if (reservation.players.length >= 4) return;
    if (reservation.players.some(p => p.id === player.id)) return;

    reservation.players.push(player);
  }


  getMyReservations(playerId: string): Reservation[] {
    return this.reservations.filter(reservation =>
      reservation.organizerId === playerId ||
      reservation.players.some(player => player.id === playerId)
    );
  }

  payReservation(reservationId: string, playerId: string): void {
    const reservation = this.reservations.find(r => r.id === reservationId);

    if (!reservation) return;

    const player = reservation.players.find(p => p.id === playerId);

    if (!player) return;

    player.paid = true;
  }

}
