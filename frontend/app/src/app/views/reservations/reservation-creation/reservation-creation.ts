import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatError, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';

import { Reservation } from '../../../model/Reservations';
import { uuid } from '../../../shared/uuid';
import { ReservationsService } from '../reservations.service';
import { UserService } from '../../user/user.service';
import { SiteApiService, SiteDTO } from '../../../services/site-api.service';
import { CourtApiService, CourtDTO } from '../../../services/court-api.service';
import {
  BookingRuleApiService,
  BookingRuleDTO,
  TimeSlotDTO
} from '../../../services/booking-rule-api.service';

@Component({
  selector: 'app-reservation-creation',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatError,
    MatLabel,
    MatCardContent,
    MatCard
  ],
  templateUrl: './reservation-creation.html',
  styleUrl: './reservation-creation.css'
})
export class ReservationCreation implements OnInit {

  private reservationsService = inject(ReservationsService);
  private userService = inject(UserService);
  private siteApiService = inject(SiteApiService);
  private courtApiService = inject(CourtApiService);
  private bookingRuleApiService = inject(BookingRuleApiService);

  sites: SiteDTO[] = [];
  courts: CourtDTO[] = [];
  timeSlots: TimeSlotDTO[] = [];

  bookingRule: BookingRuleDTO | null = null;

  closedDays: string[] = [];
  private closedDaySet = new Set<string>();

  minDate = this.getStartOfToday();
  maxDate = this.addDays(this.getStartOfToday(), 5);

  bookingError = '';
  bookingSuccess = '';
  isSubmitting = false;
  isLoadingSites = false;
  isLoadingCourts = false;
  isLoadingTimeSlots = false;

  form = new FormGroup({
    siteId: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    courtId: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    date: new FormControl<Date | null>(null, {
      validators: [Validators.required]
    }),
    time: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    type: new FormControl<'PUBLIC' | 'PRIVATE'>('PUBLIC', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    price: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)]
    })
  });

  availableDateFilter = (date: Date | null): boolean => {
    if (!date) {
      return false;
    }

    const backendDate = this.formatDateForBackend(date);

    return !this.closedDaySet.has(backendDate);
  };

  ngOnInit(): void {
    this.updateDateLimits();
    this.loadBookingRules();
    this.loadSites();

    this.form.controls.siteId.valueChanges.subscribe((siteId: string) => {
      this.form.controls.courtId.setValue('');
      this.form.controls.time.setValue('');
      this.form.controls.date.setValue(null);

      if (siteId) {
        this.loadCourtsBySite(siteId);
        this.loadTimeSlotsBySite(siteId);
        this.loadClosedDaysBySite(siteId);
      } else {
        this.courts = [];
        this.timeSlots = [];
        this.closedDays = [];
        this.closedDaySet = new Set<string>();
      }
    });
  }

  private loadBookingRules(): void {
    this.bookingError = '';

    this.bookingRuleApiService.getBookingRules().subscribe({
      next: (rule: BookingRuleDTO) => {
        this.bookingRule = rule;
        this.form.controls.price.setValue(rule.matchPrice);
        this.updateDateLimits();
      },
      error: (error) => {
        this.bookingError = 'Unable to load booking rules.';
        console.error('Error loading booking rules', error);
      }
    });
  }

  private loadSites(): void {
    this.isLoadingSites = true;
    this.bookingError = '';

    this.siteApiService.getSites().subscribe({
      next: (sites: SiteDTO[]) => {
        this.sites = sites;
        this.isLoadingSites = false;

        if (sites.length > 0) {
          this.form.controls.siteId.setValue(sites[0].id);
        }
      },
      error: (error) => {
        this.isLoadingSites = false;
        this.bookingError = 'Unable to load sites.';
        console.error('Error loading sites', error);
      }
    });
  }

  private loadCourtsBySite(siteId: string): void {
    this.isLoadingCourts = true;
    this.bookingError = '';

    this.courtApiService.getCourtsBySite(siteId).subscribe({
      next: (courts: CourtDTO[]) => {
        this.courts = courts.filter((court: CourtDTO) => court.active);
        this.isLoadingCourts = false;

        if (this.courts.length > 0) {
          this.form.controls.courtId.setValue(this.courts[0].id);
        }
      },
      error: (error) => {
        this.isLoadingCourts = false;
        this.bookingError = 'Unable to load courts for this site.';
        console.error('Error loading courts', error);
      }
    });
  }

  private loadTimeSlotsBySite(siteId: string): void {
    this.isLoadingTimeSlots = true;
    this.bookingError = '';

    this.bookingRuleApiService.getTimeSlotsBySite(siteId).subscribe({
      next: (timeSlots: TimeSlotDTO[]) => {
        this.timeSlots = timeSlots;
        this.isLoadingTimeSlots = false;

        if (this.timeSlots.length > 0) {
          this.form.controls.time.setValue(this.timeSlots[0].startTime);
        }
      },
      error: (error) => {
        this.isLoadingTimeSlots = false;
        this.bookingError = 'Unable to load time slots for this site.';
        console.error('Error loading time slots', error);
      }
    });
  }

  private loadClosedDaysBySite(siteId: string): void {
    this.bookingRuleApiService.getClosedDaysBySite(siteId).subscribe({
      next: (closedDays: string[]) => {
        this.closedDays = closedDays;
        this.closedDaySet = new Set<string>(closedDays);

        const selectedDate = this.form.controls.date.value;

        if (selectedDate && this.closedDaySet.has(this.formatDateForBackend(selectedDate))) {
          this.form.controls.date.setValue(null);
        }

        this.form.controls.date.updateValueAndValidity();
      },
      error: (error) => {
        this.bookingError = 'Unable to load closed days for this site.';
        console.error('Error loading closed days', error);
      }
    });
  }

  addReservation(): void {
    this.bookingError = '';
    this.bookingSuccess = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.canCurrentUserBook()) {
      return;
    }

    const currentUser = this.userService.getCurrentUser();
    const selectedDate = this.form.controls.date.value;

    if (!selectedDate) {
      this.bookingError = 'Please select a reservation date.';
      return;
    }

    const reservation: Reservation = {
      id: uuid(),
      siteId: this.form.controls.siteId.value,
      courtId: this.form.controls.courtId.value,
      date: this.formatDateForBackend(selectedDate),
      time: this.form.controls.time.value,
      type: this.form.controls.type.value,
      organizerId: currentUser.id,
      players: [],
      price: this.form.controls.price.value,
      status: 'ACTIVE'
    };

    this.isSubmitting = true;

    this.reservationsService.addReservation(reservation).subscribe({
      next: () => {
        this.bookingSuccess = 'Reservation created successfully.';
        this.isSubmitting = false;

        const currentSiteId = this.form.controls.siteId.value;
        const currentCourtId = this.form.controls.courtId.value;
        const currentPrice = this.bookingRule?.matchPrice ?? this.form.controls.price.value;

        this.form.reset({
          siteId: currentSiteId,
          courtId: currentCourtId,
          date: null,
          time: '',
          type: 'PUBLIC',
          price: currentPrice
        });

        if (this.timeSlots.length > 0) {
          this.form.controls.time.setValue(this.timeSlots[0].startTime);
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.bookingError = error.error?.message || 'Reservation could not be created.';
        console.error('Error creating reservation', error);
      }
    });
  }

  private canCurrentUserBook(): boolean {
    if (!this.bookingRule) {
      this.bookingError = 'Booking rules are not loaded.';
      return false;
    }

    const currentUser = this.userService.getCurrentUserOrNull();

    if (!currentUser) {
      this.bookingError = 'Please login before booking a court.';
      return false;
    }

    const selectedDate = this.form.controls.date.value;
    const selectedSiteId = this.form.controls.siteId.value;

    if (!selectedDate) {
      this.bookingError = 'Please select a reservation date.';
      return false;
    }

    const selectedDateForBackend = this.formatDateForBackend(selectedDate);

    if (this.closedDaySet.has(selectedDateForBackend)) {
      this.bookingError = 'This site is closed on the selected date.';
      return false;
    }

    const daysBeforeMatch = this.getDaysBetweenTodayAnd(selectedDate);

    if (daysBeforeMatch < 0) {
      this.bookingError = 'You cannot book a court in the past.';
      return false;
    }

    if (currentUser.type === 'GLOBAL') {
      if (daysBeforeMatch > this.bookingRule.globalBookingLimitDays) {
        this.bookingError =
          `Global members can only book up to ${this.bookingRule.globalBookingLimitDays} days before the match.`;
        return false;
      }

      return true;
    }

    if (currentUser.type === 'SITE') {
      if (daysBeforeMatch > this.bookingRule.siteBookingLimitDays) {
        this.bookingError =
          `Site members can only book up to ${this.bookingRule.siteBookingLimitDays} days before the match.`;
        return false;
      }

      if (selectedSiteId !== currentUser.siteId) {
        this.bookingError = 'Site members can only book on their own site.';
        return false;
      }

      return true;
    }

    if (currentUser.type === 'FREE') {
      if (daysBeforeMatch > this.bookingRule.freeBookingLimitDays) {
        this.bookingError =
          `Free members can only book up to ${this.bookingRule.freeBookingLimitDays} days before the match.`;
        return false;
      }

      return true;
    }

    this.bookingError = 'Unknown member type.';
    return false;
  }

  private updateDateLimits(): void {
    const currentUser = this.userService.getCurrentUserOrNull();
    const today = this.getStartOfToday();

    let bookingLimitDays = this.bookingRule?.freeBookingLimitDays ?? 5;

    if (currentUser?.type === 'GLOBAL') {
      bookingLimitDays = this.bookingRule?.globalBookingLimitDays ?? 21;
    }

    if (currentUser?.type === 'SITE') {
      bookingLimitDays = this.bookingRule?.siteBookingLimitDays ?? 14;
    }

    if (currentUser?.type === 'FREE') {
      bookingLimitDays = this.bookingRule?.freeBookingLimitDays ?? 5;
    }

    this.minDate = today;
    this.maxDate = this.addDays(today, bookingLimitDays);

    this.form.controls.date.updateValueAndValidity();
  }

  private getDaysBetweenTodayAnd(dateValue: Date): number {
    const today = this.getStartOfToday();
    const selectedDate = new Date(dateValue);

    selectedDate.setHours(0, 0, 0, 0);

    const diffInMs = selectedDate.getTime() - today.getTime();

    return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  }

  private getStartOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private formatDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  formatDateForDisplay(dateValue: string | Date | null | undefined): string {
    if (!dateValue) {
      return 'Choose a date';
    }

    const date = typeof dateValue === 'string'
      ? new Date(`${dateValue}T00:00:00`)
      : dateValue;

    return date.toLocaleDateString('fr-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
