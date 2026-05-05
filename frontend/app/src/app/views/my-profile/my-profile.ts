import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { UserService } from '../user/user.service';
import { Member } from '../../model/Member';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.css'
})
export class MyProfile {
  private userService = inject(UserService);

  get user(): Member {
    return this.userService.getCurrentUser();
  }
}
