import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { LayoutService } from '../layout.service';
import { AdminAuthService } from '../../../shared/services/admin-auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatIconModule
  ],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class Menu {

  layoutService = inject(LayoutService);
  private adminAuthService = inject(AdminAuthService);

  isAdminLoggedIn(): boolean {
    return this.adminAuthService.isAdminLoggedIn();
  }
}
