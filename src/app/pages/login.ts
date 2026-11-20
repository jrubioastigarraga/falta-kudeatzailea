import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { I18nService, Lang } from '../core/i18n.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class LoginPage {
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  fullName = '';

  readonly mode = signal<'login' | 'signup'>('login');
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  readonly loading = signal(false);

  setLang(lang: Lang): void {
    this.i18n.setLang(lang);
  }

  switchMode(mode: 'login' | 'signup'): void {
    this.mode.set(mode);
    this.error.set(null);
    this.info.set(null);
  }

  async submit(): Promise<void> {
    this.error.set(null);
    this.info.set(null);
    if (!this.email.trim() || !this.password.trim()) {
      this.error.set(this.i18n.t('common.error'));
      return;
    }
    this.loading.set(true);
    try {
      if (this.mode() === 'login') {
        await this.auth.login(this.email, this.password);
        await this.router.navigate(['/dashboard']);
      } else {
        const result = await this.auth.signup(this.fullName, this.email, this.password);
        if (result === 'email') {
          this.info.set(this.i18n.t('login.checkEmail'));
          this.mode.set('login');
        } else {
          await this.router.navigate(['/dashboard']);
        }
      }
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'INVALID_CREDENTIALS') {
        this.error.set(this.i18n.t('login.invalid'));
      } else if (code === 'DEMO_SIGNUP_FROM_ADMIN') {
        this.error.set(this.i18n.t('login.signupDisabled'));
      } else {
        this.error.set(code || this.i18n.t('login.error'));
      }
    } finally {
      this.loading.set(false);
    }
  }

  async quickLogin(email: string, password: string): Promise<void> {
    this.email = email;
    this.password = password;
    await this.submit();
  }
}
