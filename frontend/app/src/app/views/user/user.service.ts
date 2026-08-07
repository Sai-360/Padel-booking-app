import { Injectable } from '@angular/core';
import { Member } from '../../model/Member';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private currentUser: Member | null = null;

  setCurrentUser(member: Member, clearAdminSession: boolean = true): void {
    this.currentUser = member;
    localStorage.setItem('currentUser', JSON.stringify(member));

    if (clearAdminSession) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
  }

  getCurrentUser(): Member {
    const currentUser = this.getCurrentUserOrNull();

    if (!currentUser) {
      throw new Error('No current user selected.');
    }

    return currentUser;
  }

  getCurrentUserOrNull(): Member | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    const storedUser = localStorage.getItem('currentUser');

    if (storedUser) {
      this.currentUser = JSON.parse(storedUser) as Member;
      return this.currentUser;
    }

    return null;
  }

  getCurrentUserId(): string {
    return this.getCurrentUser().id;
  }

  isLoggedIn(): boolean {
    return this.getCurrentUserOrNull() !== null;
  }

  logout(): void {
    this.currentUser = null;

    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }
}
