import { Routes } from '@angular/router';
import {Home} from './views/home/home';
import {ReservationList} from './views/reservations/reservation-list/reservation-list';
import {ReservationCreation} from './views/reservations/reservation-creation/reservation-creation';
import {PublicMatches} from './views/public-matches/public-matches';
export const routes: Routes = [


{path: 'home', component: Home},
  { path: 'book', component: ReservationCreation },
  { path: 'public-matches', component: PublicMatches }


];
