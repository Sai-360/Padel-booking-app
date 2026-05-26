import { Injectable } from '@angular/core';
import { Member } from '../../model/Member';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private currentUser: Member | null = null;

  setCurrentUser(member: Member): void {
    this.currentUser = member;
    localStorage.setItem('currentUser', JSON.stringify(member));
  }

  getCurrentUser(): Member {
    if (this.currentUser) {
      return this.currentUser;
    }

    const storedUser = localStorage.getItem('currentUser');

    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      return this.currentUser!;
    }

    return {
      id: '11111111-1111-1111-1111-111111111111',
      matricule: 'G0001',
      name: 'Global Member',
      type: 'GLOBAL',
      unpaidBalance: 0
    };
  }

  getCurrentUserId(): string {
    return this.getCurrentUser().id;
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null || localStorage.getItem('currentUser') !== null;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }
}
