import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login').then((m) => m.LoginPage),
    title: 'Falta Kudeatzailea · Login',
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard').then((m) => m.DashboardPage),
        title: 'Falta Kudeatzailea · Panela',
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users').then((m) => m.UsersPage),
        canActivate: [adminGuard],
        title: 'Falta Kudeatzailea · Erabiltzaileak',
      },
      {
        path: 'calendar',
        loadComponent: () => import('./pages/calendar').then((m) => m.CalendarPage),
        canActivate: [adminGuard],
        title: 'Falta Kudeatzailea · Ikasturtea',
      },
      {
        path: 'modules',
        loadComponent: () => import('./pages/modules').then((m) => m.ModulesPage),
        canActivate: [adminGuard],
        title: 'Falta Kudeatzailea · Moduluak',
      },
      {
        path: 'challenges',
        loadComponent: () => import('./pages/challenges').then((m) => m.ChallengesPage),
        canActivate: [adminGuard],
        title: 'Falta Kudeatzailea · Erronkak',
      },
      {
        path: 'timetable',
        loadComponent: () => import('./pages/timetable').then((m) => m.TimetablePage),
        canActivate: [adminGuard],
        title: 'Falta Kudeatzailea · Ordutegia',
      },
      {
        path: 'absences',
        loadComponent: () => import('./pages/absences').then((m) => m.AbsencesPage),
        title: 'Falta Kudeatzailea · Faltak',
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports').then((m) => m.ReportsPage),
        title: 'Falta Kudeatzailea · Txostenak',
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
