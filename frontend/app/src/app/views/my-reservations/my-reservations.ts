import { Component, inject } from '@angular/core';
import { ReservationCard } from '../reservations/reservation-card/reservation-card';
import { ReservationsService } from '../reservations/reservations.service';
import { UserService } from '../user/user.service';
import { Reservation } from '../../model/Reservations';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [ReservationCard],
  templateUrl: './my-reservations.html',
  styleUrl: './my-reservations.css'
})
export class MyReservations {

  private reservationsService = inject(ReservationsService);
  private userService = inject(UserService);

  get reservations(): Reservation[] {
    return this.reservationsService.getMyReservations(
      this.userService.getCurrentUserId()
    );
  }
}
