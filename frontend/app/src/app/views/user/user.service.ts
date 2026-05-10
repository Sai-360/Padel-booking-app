import { Injectable } from '@angular/core';
import { Member } from '../../model/Member';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly currentUser: Member = {
    id: 'player-current',
    matricule: 'S0001',
    name: 'Site Member',
    type: 'SITE',
    siteId: 'site-1',
    unpaidBalance: 0
  };

  getCurrentUser(): Member {
    return this.currentUser;
  }

  getCurrentUserId(): string {
    return this.currentUser.id;
  }
}
