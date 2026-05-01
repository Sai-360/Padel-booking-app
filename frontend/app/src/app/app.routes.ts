import { Routes } from '@angular/router';
import {Home} from './views/home/home';
import {ReservationList} from './views/reservations/reservation-list/reservation-list';
import {ReservationCreation} from './views/reservations/reservation-creation/reservation-creation';
export const routes: Routes = [


{path: 'home', component: Home},
  { path: 'book', component: ReservationList },
  { path: 'book/create', component: ReservationCreation },


];
