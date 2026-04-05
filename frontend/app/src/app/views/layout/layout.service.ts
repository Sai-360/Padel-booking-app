import {inject, Injectable, linkedSignal, signal} from '@angular/core';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';

@Injectable({
  providedIn: 'root'
})


export class LayoutService{

  private readonly breakpointObserver = inject(BreakpointObserver);
  readonly isDesktop = toSignal(
    this.breakpointObserver
      .observe([Breakpoints.Tablet, Breakpoints.Large, Breakpoints.XLarge])
      .pipe(map(result => result.matches)),
    {initialValue: false}
  );

  sideNavOpened = signal(false);

  toggleMenuWhenClick() {
    if (!this.isDesktop()){

    this.sideNavOpened.set(false)
    }

  }

  toggleMenu() {
    this.sideNavOpened.update(value => !value)

  }
}
