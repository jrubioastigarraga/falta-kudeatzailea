import { Component, computed, inject, signal } from '@angular/core';
import { DataService } from '../core/data.service';
import { I18nService } from '../core/i18n.service';
import { HOURS, WEEKDAYS } from '../core/models';

@Component({
  selector: 'app-timetable',
  imports: [],
  templateUrl: './timetable.html',
})
export class TimetablePage {
  readonly data = inject(DataService);
  readonly i18n = inject(I18nService);

  readonly hours = HOURS;
  readonly weekdays = WEEKDAYS;
  readonly saved = signal(false);

  readonly weeklySummary = computed(() =>
    this.data.modules().map((module) => ({
      module,
      hours: this.data.timetable().filter((t) => t.module_id === module.id).length,
    })),
  );

  slot(weekday: number, hour: number) {
    return this.data.findSlot(weekday, hour);
  }

  moduleColor(moduleId: string | undefined): string {
    return this.data.modules().find((m) => m.id === moduleId)?.color || '#4e73df';
  }

  async change(weekday: number, hour: number, event: Event): Promise<void> {
    const value = (event.target as HTMLSelectElement).value;
    try {
      await this.data.setSlot(weekday, hour, value || null);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 1500);
    } catch {
      // keep the previous value visible
      (event.target as HTMLSelectElement).value = this.slot(weekday, hour)?.module_id ?? '';
    }
  }

  async clearAll(): Promise<void> {
    if (!confirm(this.i18n.t('common.deleteConfirm'))) return;
    for (const weekday of this.weekdays) {
      for (const hour of this.hours) {
        if (this.slot(weekday, hour)) {
          await this.data.setSlot(weekday, hour, null);
        }
      }
    }
  }
}
