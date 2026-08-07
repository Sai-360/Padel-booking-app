import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SiteDTO {
  id: string;
  name: string;
  location: string;
  openingTime: string;
  closingTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class SiteApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/sites';

  getSites(): Observable<SiteDTO[]> {
    return this.http.get<SiteDTO[]>(this.apiUrl);
  }
}
