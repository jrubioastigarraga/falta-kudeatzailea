import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/data.service';
import { I18nService } from '../core/i18n.service';
import { Module } from '../core/models';

const COLORS = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#6f42c1', '#fd7e14', '#20c9a6'];

@Component({
  selector: 'app-modules',
  imports: [FormsModule],
  templateUrl: './modules.html',
})
export class ModulesPage {
  readonly data = inject(DataService);
  readonly i18n = inject(I18nService);

  readonly colors = COLORS;
  readonly modalOpen = signal(false);
  readonly editing = signal<Module | null>(null);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);

  name = '';
  code = '';
  color = COLORS[0];

  readonly rows = computed(() =>
    this.data.modules().map((module) => ({
      module,
      weeklyHours: this.data.timetable().filter((t) => t.module_id === module.id).length,
      challenges: this.data.challenges().filter((c) => c.module_id === module.id).length,
      absences: this.data.absences().filter((a) => a.module_id === module.id).length,
    })),
  );

  open(module?: Module): void {
    this.editing.set(module ?? null);
    this.name = module?.name ?? '';
    this.code = module?.code ?? '';
    this.color = module?.color || COLORS[0];
    this.error.set(null);
    this.modalOpen.set(true);
  }

  close(): void {
    this.modalOpen.set(false);
  }

  async save(): Promise<void> {
    if (!this.name.trim()) {
      this.error.set(this.i18n.t('common.error'));
      return;
    }
    this.saving.set(true);
    try {
      await this.data.saveModule({
        id: this.editing()?.id,
        name: this.name.trim(),
        code: this.code.trim(),
        color: this.color,
      });
      this.modalOpen.set(false);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : this.i18n.t('common.error'));
    } finally {
      this.saving.set(false);
    }
  }

  async remove(module: Module): Promise<void> {
    if (!confirm(this.i18n.t('modules.deleteConfirm'))) return;
    await this.data.deleteModule(module.id);
  }
}
