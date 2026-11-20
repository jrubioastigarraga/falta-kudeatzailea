import { Component, inject, input } from '@angular/core';
import { AttendanceStats } from '../core/stats';
import { I18nService } from '../core/i18n.service';

export interface ReportRow {
  name: string;
  subtitle?: string;
  stats: AttendanceStats;
}

@Component({
  selector: 'app-stats-table',
  imports: [],
  template: `
    <div class="table-responsive">
      <table class="table mb-0 align-middle">
        <thead>
          <tr>
            <th>{{ i18n.t('common.name') }}</th>
            <th class="text-center">{{ i18n.t('reports.expectedHours') }}</th>
            <th class="text-center">{{ i18n.t('reports.justified') }}</th>
            <th class="text-center">{{ i18n.t('reports.unjustified') }}</th>
            <th style="min-width: 140px">{{ i18n.t('reports.totalAbsences') }}</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.name + (row.subtitle ?? '')) {
            <tr>
              <td>
                <div class="font-weight-bold text-gray-800">{{ row.name }}</div>
                @if (row.subtitle) {
                  <div class="text-gray-500 text-xs">{{ row.subtitle }}</div>
                }
              </td>
              <td class="text-center text-xs">{{ row.stats.expected }}</td>
              <td class="text-center text-xs">
                <span class="badge badge-soft-warning">{{ row.stats.justified }}</span>
                <div class="text-gray-500 mt-1">{{ pct(row.stats.justifiedPct) }}</div>
              </td>
              <td class="text-center text-xs">
                <span class="badge badge-soft-danger">{{ row.stats.unjustified }}</span>
                <div class="text-gray-500 mt-1">{{ pct(row.stats.unjustifiedPct) }}</div>
              </td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="progress flex-grow-1">
                    <div
                      class="progress-bar bg-danger"
                      [style.width.%]="barWidth(row.stats.totalPct)"
                    ></div>
                  </div>
                  <strong class="text-xs text-nowrap">{{ pct(row.stats.totalPct) }}</strong>
                </div>
                <div class="text-gray-500 text-xs">
                  {{ row.stats.total }} / {{ row.stats.expected }}
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5">
                <div class="fk-empty py-4">
                  <i class="fa-solid fa-chart-simple"></i>{{ i18n.t('reports.noData') }}
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class StatsTable {
  readonly i18n = inject(I18nService);
  readonly rows = input<ReportRow[]>([]);

  pct(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  barWidth(value: number): number {
    return Math.min(100, Math.max(0, value));
  }
}
