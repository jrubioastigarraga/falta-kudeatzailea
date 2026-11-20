import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/data.service';
import { I18nService } from '../core/i18n.service';
import { Challenge } from '../core/models';
import { toIso } from '../core/i18n.service';

@Component({
  selector: 'app-challenges',
  imports: [FormsModule],
  templateUrl: './challenges.html',
})
export class ChallengesPage {
  readonly data = inject(DataService);
  readonly i18n = inject(I18nService);

  readonly modalOpen = signal(false);
  readonly editing = signal<Challenge | null>(null);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);

  name = '';
  moduleId = '';
  startDate = '';
  endDate = '';

  readonly rows = computed(() => this.data.challenges());

  moduleName(id: string | null): string {
    if (!id) return '—';
    return this.data.modules().find((m) => m.id === id)?.name ?? '—';
  }

  moduleColor(id: string | null): string {
    return this.data.modules().find((m) => m.id === id)?.color ?? '#858796';
  }

  status(challenge: Challenge): 'upcoming' | 'active' | 'finished' {
    const today = toIso(new Date());
    if (today < challenge.start_date) return 'upcoming';
    if (today > challenge.end_date) return 'finished';
    return 'active';
  }

  open(challenge?: Challenge): void {
    this.editing.set(challenge ?? null);
    this.name = challenge?.name ?? '';
    this.moduleId = challenge?.module_id ?? '';
    this.startDate = challenge?.start_date ?? '';
    this.endDate = challenge?.end_date ?? '';
    this.error.set(null);
    this.modalOpen.set(true);
  }

  close(): void {
    this.modalOpen.set(false);
  }

  async save(): Promise<void> {
    this.error.set(null);
    if (!this.name.trim() || !this.startDate || !this.endDate) {
      this.error.set(this.i18n.t('common.error'));
      return;
    }
    if (this.endDate < this.startDate) {
      this.error.set(this.i18n.t('challenges.invalidRange'));
      return;
    }
    this.saving.set(true);
    try {
      await this.data.saveChallenge({
        id: this.editing()?.id,
        name: this.name.trim(),
        module_id: this.moduleId || null,
        start_date: this.startDate,
        end_date: this.endDate,
      });
      this.modalOpen.set(false);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : this.i18n.t('common.error'));
    } finally {
      this.saving.set(false);
    }
  }

  async remove(challenge: Challenge): Promise<void> {
    if (!confirm(this.i18n.t('challenges.deleteConfirm'))) return;
    await this.data.deleteChallenge(challenge.id);
  }
}
