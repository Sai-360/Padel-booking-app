import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Member } from '../../model/Member';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MemberApiService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/members';

  getMemberByMatricule(matricule: string): Observable<Member> {
    return this.http.get<Member>(`${this.apiUrl}/${matricule}`);
  }

  payBalance(memberId: string): Observable<Member> {
    return this.http.post<Member>(`${this.apiUrl}/${memberId}/pay-balance`, {});
  }
}
