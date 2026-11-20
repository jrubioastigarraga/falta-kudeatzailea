import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/data.service';
import { I18nService } from '../core/i18n.service';
import { Evaluation } from '../core/models';

@Component({
  selector: 'app-calendar',
  imports: [FormsModule],
  templateUrl: './calendar.html',
})
export class CalendarPage {
  readonly data = inject(DataService);
  readonly i18n = inject(I18nService);

  courseName = '';
  courseStart = '';
  courseEnd = '';
  courseActive = false;
  readonly creating = signal(false);
  readonly courseSaving = signal(false);
  readonly courseMessage = signal<string | null>(null);

  holidayDate = '';
  holidayName = '';
  readonly holidayError = signal<string | null>(null);

  readonly evalModal = signal(false);
  readonly evalEditing = signal<Evaluation | null>(null);
  evalName = '';
  evalStart = '';
  evalEnd = '';
  readonly evalError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const course = this.data.selectedCourse();
      if (this.creating()) return;
      this.courseName = course?.name ?? '';
      this.courseStart = course?.start_date ?? '';
      this.courseEnd = course?.end_date ?? '';
      this.courseActive = course?.active ?? false;
    });
  }

  async saveCourse(): Promise<void> {
    if (!this.courseName.trim() || !this.courseStart || !this.courseEnd) {
      this.courseMessage.set(this.i18n.t('common.error'));
      return;
    }
    if (this.courseEnd < this.courseStart) {
      this.courseMessage.set(this.i18n.t('challenges.invalidRange'));
      return;
    }
    this.courseSaving.set(true);
    this.courseMessage.set(null);
    try {
      await this.data.saveCourse({
        id: this.creating() ? undefined : this.data.selectedCourse()?.id,
        name: this.courseName.trim(),
        start_date: this.courseStart,
        end_date: this.courseEnd,
      });
      this.creating.set(false);
      const saved = this.data.selectedCourse();
      if (this.courseActive && saved) {
        await this.data.setActiveCourse(saved.id);
      }
      this.courseMessage.set(this.i18n.t('calendar.courseSaved'));
      setTimeout(() => this.courseMessage.set(null), 2500);
    } catch (err) {
      this.courseMessage.set(err instanceof Error ? err.message : this.i18n.t('common.error'));
    } finally {
      this.courseSaving.set(false);
    }
  }

  newCourse(): void {
    this.creating.set(true);
    this.courseName = '';
    this.courseStart = '';
    this.courseEnd = '';
    this.courseActive = false;
  }

  async addHoliday(): Promise<void> {
    this.holidayError.set(null);
    if (!this.holidayDate || !this.holidayName.trim()) {
      this.holidayError.set(this.i18n.t('common.error'));
      return;
    }
    await this.data.addHoliday(this.holidayDate, this.holidayName.trim());
    this.holidayDate = '';
    this.holidayName = '';
  }

  async removeHoliday(id: string): Promise<void> {
    await this.data.deleteHoliday(id);
  }

  openEvaluation(evaluation?: Evaluation): void {
    this.evalEditing.set(evaluation ?? null);
    this.evalName = evaluation?.name ?? '';
    this.evalStart = evaluation?.start_date ?? '';
    this.evalEnd = evaluation?.end_date ?? '';
    this.evalError.set(null);
    this.evalModal.set(true);
  }

  closeEvaluation(): void {
    this.evalModal.set(false);
  }

  async saveEvaluation(): Promise<void> {
    this.evalError.set(null);
    if (!this.evalName.trim() || !this.evalStart || !this.evalEnd) {
      this.evalError.set(this.i18n.t('common.error'));
      return;
    }
    if (this.evalEnd < this.evalStart) {
      this.evalError.set(this.i18n.t('challenges.invalidRange'));
      return;
    }
    await this.data.saveEvaluation({
      id: this.evalEditing()?.id,
      name: this.evalName.trim(),
      start_date: this.evalStart,
      end_date: this.evalEnd,
    });
    this.evalModal.set(false);
  }

  async removeEvaluation(id: string): Promise<void> {
    if (!confirm(this.i18n.t('common.deleteConfirm'))) return;
    await this.data.deleteEvaluation(id);
  }
}
