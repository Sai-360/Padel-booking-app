import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CourtDTO {
  id: string;
  name: string;
  siteId: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CourtApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/courts';

  getCourtsBySite(siteId: string): Observable<CourtDTO[]> {
    return this.http.get<CourtDTO[]>(`${this.apiUrl}/site/${siteId}`);
  }
}
