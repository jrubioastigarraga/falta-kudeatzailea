import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { DataService } from '../core/data.service';
import { I18nService } from '../core/i18n.service';
import { Profile } from '../core/models';

@Component({
  selector: 'app-users',
  imports: [FormsModule],
  templateUrl: './users.html',
})
export class UsersPage {
  readonly data = inject(DataService);
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  readonly search = signal('');
  readonly modalOpen = signal(false);
  readonly editing = signal<Profile | null>(null);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly toast = signal<string | null>(null);

  fullName = '';
  email = '';
  password = '';
  role: Profile['role'] = 'student';
  active = true;

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const list = [...this.data.profiles()].sort((a, b) =>
      a.full_name.localeCompare(b.full_name),
    );
    if (!term) return list;
    return list.filter(
      (p) =>
        p.full_name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term),
    );
  });

  openNew(): void {
    this.editing.set(null);
    this.fullName = '';
    this.email = '';
    this.password = '';
    this.role = 'student';
    this.active = true;
    this.error.set(null);
    this.modalOpen.set(true);
  }

  openEdit(profile: Profile): void {
    this.editing.set(profile);
    this.fullName = profile.full_name;
    this.email = profile.email;
    this.password = '';
    this.role = profile.role;
    this.active = profile.active;
    this.error.set(null);
    this.modalOpen.set(true);
  }

  close(): void {
    this.modalOpen.set(false);
  }

  async save(): Promise<void> {
    this.error.set(null);
    if (!this.fullName.trim()) {
      this.error.set(this.i18n.t('common.error'));
      return;
    }
    this.saving.set(true);
    try {
      const current = this.editing();
      if (current) {
        await this.data.updateProfile(current.id, {
          full_name: this.fullName.trim(),
          role: this.role,
          active: this.active,
        });
      } else {
        if (!this.email.trim() || this.password.length < 6) {
          this.error.set(this.i18n.t('users.passwordHint'));
          return;
        }
        await this.data.createDemoUser(
          this.fullName.trim(),
          this.email,
          this.password,
          this.role,
          this.role === 'student',
        );
        this.auth.refreshDemoUser();
      }
      this.toast.set(this.i18n.t('toast.saved'));
      this.modalOpen.set(false);
      setTimeout(() => this.toast.set(null), 2500);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      this.error.set(code === 'EMAIL_EXISTS' ? this.i18n.t('users.emailExists') : code);
    } finally {
      this.saving.set(false);
    }
  }

  async toggleEnrollment(profile: Profile): Promise<void> {
    await this.data.toggleEnrollment(profile.id);
  }

  async remove(profile: Profile): Promise<void> {
    if (profile.id === this.auth.user()?.id) {
      this.error.set(this.i18n.t('users.selfDelete'));
      return;
    }
    if (!confirm(this.i18n.t('users.deleteConfirm'))) return;
    await this.data.deleteDemoUser(profile.id);
  }

  isEnrolled(profile: Profile): boolean {
    return this.data.isEnrolled(profile.id);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }
}
