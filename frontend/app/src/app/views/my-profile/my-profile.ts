import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { UserService } from '../user/user.service';
import { Member } from '../../model/Member';
import { SiteApiService } from '../../services/site-api.service';
import { MemberApiService } from '../user/member-api.service';
import {
  BookingRuleApiService,
  BookingRuleDTO
} from '../../services/booking-rule-api.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.css'
})
export class MyProfile implements OnInit {

  private userService = inject(UserService);
  private siteApiService = inject(SiteApiService);
  private memberApiService = inject(MemberApiService);
  private bookingRuleApiService = inject(BookingRuleApiService);

  user: Member | null = null;
  siteName = 'All sites';
  bookingRule: BookingRuleDTO | null = null;

  profileError = '';
  paymentMessage = '';
  isPayingBalance = false;

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadBookingRules();
  }

  private loadCurrentUser(): void {
    this.user = this.userService.getCurrentUserOrNull();

    if (!this.user) {
      this.profileError = 'Please login to see your profile.';
      return;
    }

    this.loadSiteName();
  }

  private loadSiteName(): void {
    if (!this.user?.siteId) {
      this.siteName = 'All sites';
      return;
    }

    this.siteApiService.getSites().subscribe({
      next: sites => {
        const userSite = sites.find(site => site.id === this.user?.siteId);
        this.siteName = userSite?.name ?? this.user?.siteId ?? 'Unknown site';
      },
      error: error => {
        console.error('Error loading site name', error);
        this.siteName = this.user?.siteId ?? 'Unknown site';
      }
    });
  }

  private loadBookingRules(): void {
    this.bookingRuleApiService.getBookingRules().subscribe({
      next: rule => {
        this.bookingRule = rule;
      },
      error: error => {
        console.error('Error loading booking rules', error);
      }
    });
  }

  getInitials(): string {
    if (!this.user?.name) {
      return '?';
    }

    const parts = this.user.name.trim().split(' ').filter(part => part.length > 0);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  getMemberTypeLabel(): string {
    if (!this.user) {
      return 'Unknown';
    }

    if (this.user.type === 'GLOBAL') {
      return 'Global Member';
    }

    if (this.user.type === 'SITE') {
      return 'Site Member';
    }

    if (this.user.type === 'FREE') {
      return 'Free Member';
    }

    return this.user.type;
  }

  getAdminRoleLabel(): string {
    if (!this.user?.adminRole || this.user.adminRole === 'NONE') {
      return 'No admin access';
    }

    if (this.user.adminRole === 'GLOBAL_ADMIN') {
      return 'Global Admin';
    }

    if (this.user.adminRole === 'SITE_ADMIN') {
      return 'Site Admin';
    }

    return this.user.adminRole;
  }

  isAdmin(): boolean {
    return !!this.user?.adminRole && this.user.adminRole !== 'NONE';
  }

  hasUnpaidBalance(): boolean {
    return !!this.user?.unpaidBalance && Number(this.user.unpaidBalance) > 0;
  }

  isBlocked(): boolean {
    if (!this.user?.blockedUntil) {
      return false;
    }

    const today = this.getStartOfToday();
    const blockedUntil = new Date(`${this.user.blockedUntil}T00:00:00`);

    blockedUntil.setHours(0, 0, 0, 0);

    return blockedUntil.getTime() >= today.getTime();
  }

  getStatusLabel(): string {
    if (this.isBlocked()) {
      return 'Blocked';
    }

    if (this.hasUnpaidBalance()) {
      return 'Payment due';
    }

    return 'Active';
  }

  getStatusDescription(): string {
    if (this.isBlocked()) {
      return 'Your account is temporarily blocked for booking.';
    }

    if (this.hasUnpaidBalance()) {
      return 'You have an unpaid balance to settle.';
    }

    return 'Your account can create and join reservations.';
  }

  getBookingWindowLabel(): string {
    if (!this.bookingRule || !this.user) {
      return 'Rules loading...';
    }

    if (this.user.type === 'GLOBAL') {
      return `${this.bookingRule.globalBookingLimitDays} days before the match`;
    }

    if (this.user.type === 'SITE') {
      return `${this.bookingRule.siteBookingLimitDays} days before the match`;
    }

    if (this.user.type === 'FREE') {
      return `${this.bookingRule.freeBookingLimitDays} days before the match`;
    }

    return 'Unknown booking window';
  }

  getSiteAccessLabel(): string {
    if (!this.user) {
      return 'Unknown';
    }

    if (this.user.type === 'SITE') {
      return `Only ${this.siteName}`;
    }

    return 'All available sites';
  }

  getBalanceLabel(): string {
    const balance = Number(this.user?.unpaidBalance ?? 0);

    return balance.toLocaleString('fr-BE', {
      style: 'currency',
      currency: 'EUR'
    });
  }

  getBlockedUntilLabel(): string {
    if (!this.user?.blockedUntil) {
      return 'Not blocked';
    }

    return this.formatDateForDisplay(this.user.blockedUntil);
  }

  getPenaltyLabel(): string {
    if (!this.bookingRule) {
      return 'Rules loading...';
    }

    return Number(this.bookingRule.penaltyAmountPerMissingPlayer).toLocaleString('fr-BE', {
      style: 'currency',
      currency: 'EUR'
    });
  }

  payBalance(): void {
    if (!this.user || !this.hasUnpaidBalance()) {
      return;
    }

    this.paymentMessage = '';
    this.profileError = '';
    this.isPayingBalance = true;

    this.memberApiService.payBalance(this.user.id).subscribe({
      next: updatedMember => {
        this.isPayingBalance = false;
        this.user = updatedMember;

        const shouldClearAdminSession = !updatedMember.adminRole || updatedMember.adminRole === 'NONE';
        this.userService.setCurrentUser(updatedMember, shouldClearAdminSession);

        this.paymentMessage = 'Balance paid successfully.';
      },
      error: error => {
        this.isPayingBalance = false;
        this.profileError = error.error?.message || 'Unable to pay balance.';
        console.error('Error paying balance', error);
      }
    });
  }

  private formatDateForDisplay(dateValue: string): string {
    const date = new Date(`${dateValue}T00:00:00`);

    return date.toLocaleDateString('fr-BE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private getStartOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return today;
  }
}
