import { Injectable } from '@angular/core';
import { Member } from '../../model/Member';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly currentUser: Member = {
    id: '11111111-1111-1111-1111-111111111111',
    matricule: 'G0001',
    name: 'Global Member',
    type: 'GLOBAL',
    unpaidBalance: 0
  };

  getCurrentUser(): Member {
    return this.currentUser;
  }

  getCurrentUserId(): string {
    return this.currentUser.id;
  }
}
