import { Component, inject, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LayoutService } from '../layout.service';
import {MatIconButton} from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatIconButton,MatIconModule ],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  layoutService = inject(LayoutService);

  title = signal("Padel");
}
