import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SiteApiService, SiteDTO } from '../../services/site-api.service';
import {
  BookingRuleApiService,
  BookingRuleDTO,
  TimeSlotDTO
} from '../../services/booking-rule-api.service';

type ClosedDaysBySite = {
  siteId: string;
  siteName: string;
  closedDays: string[];
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  private siteApiService = inject(SiteApiService);
  private bookingRuleApiService = inject(BookingRuleApiService);

  bookingRule: BookingRuleDTO | null = null;
  sites: SiteDTO[] = [];
  timeSlots: TimeSlotDTO[] = [];
  closedDaysBySite: ClosedDaysBySite[] = [];

  isLoadingOverview = false;
  overviewError = '';

  ngOnInit(): void {
    this.loadHomeOverview();
  }

  loadHomeOverview(): void {
    this.isLoadingOverview = true;
    this.overviewError = '';

    forkJoin({
      bookingRule: this.bookingRuleApiService.getBookingRules(),
      sites: this.siteApiService.getSites()
    }).subscribe({
      next: result => {
        this.bookingRule = result.bookingRule;
        this.sites = result.sites;

        this.loadSiteDetails(result.sites);
      },
      error: error => {
        this.isLoadingOverview = false;
        this.overviewError = 'Unable to load booking overview.';
        console.error('Error loading home overview', error);
      }
    });
  }

  private loadSiteDetails(sites: SiteDTO[]): void {
    if (sites.length === 0) {
      this.isLoadingOverview = false;
      return;
    }

    forkJoin({
      closedDaysLists: forkJoin(
        sites.map(site => this.bookingRuleApiService.getClosedDaysBySite(site.id))
      ),
      timeSlots: this.bookingRuleApiService.getTimeSlotsBySite(sites[0].id)
    }).subscribe({
      next: result => {
        this.timeSlots = result.timeSlots;

        this.closedDaysBySite = sites.map((site, index) => ({
          siteId: site.id,
          siteName: site.name,
          closedDays: result.closedDaysLists[index] ?? []
        }));

        this.isLoadingOverview = false;
      },
      error: error => {
        this.isLoadingOverview = false;
        this.overviewError = 'Unable to load site details.';
        console.error('Error loading site details', error);
      }
    });
  }

  getMatchPriceLabel(): string {
    if (!this.bookingRule) {
      return '—';
    }

    return Number(this.bookingRule.matchPrice).toLocaleString('fr-BE', {
      style: 'currency',
      currency: 'EUR'
    });
  }

  getPerPlayerPriceLabel(): string {
    if (!this.bookingRule || !this.bookingRule.maxPlayers) {
      return '—';
    }

    const pricePerPlayer = Number(this.bookingRule.matchPrice) / this.bookingRule.maxPlayers;

    return pricePerPlayer.toLocaleString('fr-BE', {
      style: 'currency',
      currency: 'EUR'
    });
  }

  getMaxPlayersLabel(): string {
    if (!this.bookingRule) {
      return '—';
    }

    return `${this.bookingRule.maxPlayers}`;
  }

  getMatchDurationLabel(): string {
    const firstTimeSlot = this.timeSlots[0];

    if (!firstTimeSlot) {
      return '—';
    }

    const startTime = firstTimeSlot.startTime.substring(0, 5);
    const endTime = firstTimeSlot.endTime.substring(0, 5);

    const [startHours, startMinutes] = startTime.split(':').map(value => Number(value));
    const [endHours, endMinutes] = endTime.split(':').map(value => Number(value));

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const durationMinutes = endTotalMinutes - startTotalMinutes;

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h${String(minutes).padStart(2, '0')}`;
    }

    if (hours > 0) {
      return `${hours}h`;
    }

    return `${minutes} min`;
  }

  getBookingWindowLabel(): string {
    if (!this.bookingRule) {
      return '—';
    }

    return `${this.bookingRule.globalBookingLimitDays}/${this.bookingRule.siteBookingLimitDays}/${this.bookingRule.freeBookingLimitDays} days`;
  }

  getSitesLabel(): string {
    if (this.sites.length === 0) {
      return '—';
    }

    if (this.sites.length === 1) {
      return '1 club';
    }

    return `${this.sites.length} clubs`;
  }

  getUpcomingClosedDays(closedDays: string[]): string[] {
    const today = this.formatDateForBackend(new Date());

    return closedDays
      .filter(closedDay => closedDay >= today)
      .sort();
  }

  formatDateForDisplay(dateValue: string): string {
    const date = new Date(`${dateValue}T00:00:00`);

    return date.toLocaleDateString('fr-BE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private formatDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
