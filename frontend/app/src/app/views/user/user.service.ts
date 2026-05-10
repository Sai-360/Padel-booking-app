import { Injectable } from '@angular/core';
import { Member } from '../../model/Member';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly currentUser: Member = {
    id: 'player-current',
    matricule: 'G0001',
    name: 'Current Member',
    type: 'FREE',
    unpaidBalance: 0
  };

  getCurrentUser(): Member {
    return this.currentUser;
  }

  getCurrentUserId(): string {
    return this.currentUser.id;
  }
}
