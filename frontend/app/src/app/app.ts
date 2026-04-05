import {Component, inject} from '@angular/core';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from '@angular/material/sidenav';
import {MatToolbar} from '@angular/material/toolbar';
import {MatNavList} from '@angular/material/list';
import {Header} from './views/layout/header/header';
import {Content} from './views/layout/content/content';
import {Menu} from './views/layout/menu/menu';
import {LayoutService} from './views/layout/layout.service';
import {Footer} from './views/layout/footer/footer';

@Component({
  selector: 'app-root',
  imports: [MatSidenavContainer,
    MatSidenav,
    MatToolbar,
    MatNavList,
    MatSidenavContent,
    Header,
    Content,
    Menu, Footer,],
  templateUrl: './app.html',
  standalone: true,
  styleUrl: './app.css'
})
export class App {

  layoutService = inject(LayoutService)
}
