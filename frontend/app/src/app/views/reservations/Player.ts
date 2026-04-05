export interface Player {
  id: string;
  name: string;
  paid: boolean;       // si il a payer ou pas
  role: 'ORGANIZER' | 'PLAYER';
}
