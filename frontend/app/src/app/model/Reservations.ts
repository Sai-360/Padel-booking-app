import { Player } from './Player';

export interface Reservation {
  id: string;
  siteId: string;
  courtId: string;
  date: string;
  time: string;
  type: 'PUBLIC' | 'PRIVATE';
  organizerId: string;
  players: Player[];
  price: number;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
  currentUserJoined?: boolean;
  currentUserPaid?: boolean;
}
