import { Component, inject, OnInit } from '@angular/core';
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
export class MyReservations implements OnInit {

  private reservationsService = inject(ReservationsService);
  private userService = inject(UserService);

  reservations: Reservation[] = [];

  ngOnInit(): void {
    this.loadMyReservations();
  }

  loadMyReservations(): void {
    this.reservationsService.getMyReservations(
      this.userService.getCurrentUserId()
    ).subscribe({
      next: reservations => {
        this.reservations = reservations;
      },
      error: error => {
        console.error('Error loading my reservations', error);
      }
    });
  }
}
