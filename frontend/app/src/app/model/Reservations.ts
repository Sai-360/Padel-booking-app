import { Player } from './Player';

export interface Reservation {

  id: string; // UUID

  siteId: string;
  courtId: string;

  date: string;       // ex: 2026-06-15
  time: string;       // ex: 10:30

  type: 'PRIVATE' | 'PUBLIC';

  organizerId: string;

  players: Player[];

  price: number; // 60€

  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
}
