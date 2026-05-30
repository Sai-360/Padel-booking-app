import { Injectable } from '@angular/core';
import { Member } from '../../model/Member';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly defaultUser: Member = {
    id: '33333333-3333-3333-3333-333333333333',
    matricule: 'L0001',
    name: 'Free Member',
    type: 'FREE',
    unpaidBalance: 0
  };

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

    this.currentUser = this.defaultUser;
    localStorage.setItem('currentUser', JSON.stringify(this.defaultUser));

    return this.defaultUser;
  }

  getCurrentUserId(): string {
    return this.getCurrentUser().id;
  }

  isLoggedIn(): boolean {
    return true;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }
}
