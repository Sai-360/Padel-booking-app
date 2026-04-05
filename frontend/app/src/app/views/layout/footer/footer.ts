import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {}
