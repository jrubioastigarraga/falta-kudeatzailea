import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { DataService } from '../core/data.service';
import { I18nService, Lang } from '../core/i18n.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class Shell {
  readonly auth = inject(AuthService);
  readonly data = inject(DataService);
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  readonly sidebarOpen = signal(false);

  setLang(lang: Lang): void {
    this.i18n.setLang(lang);
  }

  changeCourse(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value) this.data.selectCourse(value);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
