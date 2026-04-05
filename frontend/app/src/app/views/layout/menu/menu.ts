import {Component, inject} from '@angular/core';

import {RouterLink} from '@angular/router';
import {MatListItem} from '@angular/material/list';
import {LayoutService} from '../layout.service';
@Component({
  selector: 'app-menu',
  imports: [ RouterLink, MatListItem],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
  standalone: true
})
export class Menu {

  layoutService = inject(LayoutService);

}
