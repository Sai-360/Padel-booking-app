import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BookingRuleDTO {
  matchPrice: number;
  maxPlayers: number;
  globalBookingLimitDays: number;
  siteBookingLimitDays: number;
  freeBookingLimitDays: number;
  penaltyAmountPerMissingPlayer: number;
  privatePenaltyBlockDays: number;
  penaltyCheckDaysBeforeMatch: number;
}

export interface TimeSlotDTO {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingRuleApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/booking-rules';

  getBookingRules(): Observable<BookingRuleDTO> {
    return this.http.get<BookingRuleDTO>(this.apiUrl);
  }

  getTimeSlotsBySite(siteId: string): Observable<TimeSlotDTO[]> {
    return this.http.get<TimeSlotDTO[]>(`${this.apiUrl}/time-slots?siteId=${siteId}`);
  }

  getClosedDaysBySite(siteId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/closed-days?siteId=${siteId}`);
  }
}
