import { Routes } from '@angular/router';
import {Home} from './views/home/home';
import {ReservationList} from './views/reservations/reservation-list/reservation-list';
import {ReservationCreation} from './views/reservations/reservation-creation/reservation-creation';
import {PublicMatches} from './views/public-matches/public-matches';
import {MyReservations} from './views/my-reservations/my-reservations';
export const routes: Routes = [


{path: 'home', component: Home},
  { path: 'book', component: ReservationCreation },
  { path: 'public-matches', component: PublicMatches },
  { path: 'my-reservations', component: MyReservations }

];
