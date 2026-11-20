import { AppData } from './models';

export interface DemoCredential {
  email: string;
  password: string;
  profileId: string;
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
  { email: 'admin@falta.eus', password: 'admin123', profileId: 'u-admin' },
  { email: 'ana@falta.eus', password: 'ikasle123', profileId: 'u-ana' },
  { email: 'jon@falta.eus', password: 'ikasle123', profileId: 'u-jon' },
  { email: 'nerea@falta.eus', password: 'ikasle123', profileId: 'u-nerea' },
];

const COURSE = 'c-2026';

export function seedData(): AppData {
  const modules = [
    { id: 'm-web', name: 'Web Garapena', code: 'WEB', color: '#4e73df' },
    { id: 'm-db', name: 'Datu Baseak', code: 'DB', color: '#1cc88a' },
    { id: 'm-prog', name: 'Programazioa', code: 'PROG', color: '#36b9cc' },
    { id: 'm-eng', name: 'Ingeles Teknikoa', code: 'ENG', color: '#f6c23e' },
    { id: 'm-emp', name: 'Enpresa Ekimena', code: 'EMP', color: '#e74a3b' },
  ];

  const timetable: AppData['timetable'] = [];
  const plan: Record<number, string[]> = {
    1: ['m-web', 'm-web', 'm-db', 'm-db', 'm-prog', 'm-prog', 'm-eng'],
    2: ['m-prog', 'm-prog', 'm-web', 'm-web', 'm-db', 'm-db', 'm-emp'],
    3: ['m-db', 'm-db', 'm-prog', 'm-prog', 'm-eng', 'm-web', 'm-web'],
    4: ['m-web', 'm-web', 'm-emp', 'm-emp', 'm-db', 'm-db', 'm-prog'],
    5: ['m-eng', 'm-eng', 'm-prog', 'm-prog', 'm-web', 'm-web', 'm-db'],
  };
  for (const [weekday, moduleIds] of Object.entries(plan)) {
    moduleIds.forEach((moduleId, index) => {
      timetable.push({
        id: `t-${weekday}-${8 + index}`,
        course_id: COURSE,
        weekday: Number(weekday),
        hour: 8 + index,
        module_id: moduleId,
      });
    });
  }

  const students = [
    { id: 'u-ana', email: 'ana@falta.eus', full_name: 'Ana Etxeberria' },
    { id: 'u-jon', email: 'jon@falta.eus', full_name: 'Jon Aranburu' },
    { id: 'u-nerea', email: 'nerea@falta.eus', full_name: 'Nerea Zubiaurre' },
  ];

  return {
    courses: [
      {
        id: COURSE,
        name: '2026-2027',
        start_date: '2026-09-07',
        end_date: '2027-06-18',
        active: true,
      },
    ],
    evaluations: [
      {
        id: 'e-1',
        course_id: COURSE,
        name: '1. ebaluazioa',
        start_date: '2026-09-07',
        end_date: '2026-12-18',
        position: 1,
      },
      {
        id: 'e-2',
        course_id: COURSE,
        name: '2. ebaluazioa',
        start_date: '2026-12-19',
        end_date: '2027-03-26',
        position: 2,
      },
      {
        id: 'e-3',
        course_id: COURSE,
        name: '3. ebaluazioa',
        start_date: '2027-03-27',
        end_date: '2027-06-18',
        position: 3,
      },
    ],
    holidays: [
      { id: 'h-1', course_id: COURSE, date: '2026-10-12', name: 'Euskadiko Eguna' },
      { id: 'h-2', course_id: COURSE, date: '2026-11-02', name: 'Domu Santu jaieguna' },
      { id: 'h-3', course_id: COURSE, date: '2026-12-08', name: 'Konstituzioaren eguna' },
      { id: 'h-4', course_id: COURSE, date: '2026-12-25', name: 'Eguberria' },
      { id: 'h-5', course_id: COURSE, date: '2027-01-01', name: 'Urteberri eguna' },
      { id: 'h-6', course_id: COURSE, date: '2027-01-06', name: 'Erregeen eguna' },
    ],
    modules: modules.map((m) => ({ ...m, course_id: COURSE })),
    challenges: [
      {
        id: 'r-1',
        course_id: COURSE,
        module_id: 'm-web',
        name: 'Webgune korporatiboa',
        start_date: '2026-09-21',
        end_date: '2026-10-30',
      },
      {
        id: 'r-2',
        course_id: COURSE,
        module_id: 'm-db',
        name: 'Datu basearen diseinua',
        start_date: '2026-10-01',
        end_date: '2026-11-13',
      },
      {
        id: 'r-3',
        course_id: COURSE,
        module_id: 'm-prog',
        name: 'API REST aplikazioa',
        start_date: '2026-11-02',
        end_date: '2026-12-11',
      },
      {
        id: 'r-4',
        course_id: COURSE,
        module_id: 'm-eng',
        name: 'Technical presentation',
        start_date: '2026-11-09',
        end_date: '2026-12-04',
      },
      {
        id: 'r-5',
        course_id: COURSE,
        module_id: 'm-emp',
        name: 'Enpresa proiektua',
        start_date: '2027-01-11',
        end_date: '2027-03-19',
      },
    ],
    timetable,
    profiles: [
      {
        id: 'u-admin',
        email: 'admin@falta.eus',
        full_name: 'Administratzailea',
        role: 'admin',
        active: true,
      },
      ...students.map((s) => ({ ...s, role: 'student' as const, active: true })),
    ],
    enrollments: students.map((s, i) => ({
      id: `en-${i + 1}`,
      course_id: COURSE,
      student_id: s.id,
    })),
    absences: [
      { id: 'a-1', student_id: 'u-ana', date: '2026-10-06', hour: 8, status: 'justified' },
      { id: 'a-2', student_id: 'u-ana', date: '2026-10-06', hour: 9, status: 'justified' },
      { id: 'a-3', student_id: 'u-ana', date: '2026-11-10', hour: 12, status: 'unjustified' },
      { id: 'a-4', student_id: 'u-jon', date: '2026-10-14', hour: 10, status: 'unjustified' },
      { id: 'a-5', student_id: 'u-jon', date: '2026-10-15', hour: 10, status: 'unjustified' },
      { id: 'a-6', student_id: 'u-jon', date: '2026-11-03', hour: 8, status: 'justified' },
      { id: 'a-7', student_id: 'u-nerea', date: '2026-09-29', hour: 13, status: 'justified' },
      { id: 'a-8', student_id: 'u-nerea', date: '2026-11-16', hour: 9, status: 'unjustified' },
      { id: 'a-9', student_id: 'u-nerea', date: '2026-11-16', hour: 10, status: 'unjustified' },
    ].map((a) => {
      const slot = timetable.find(
        (t) => t.weekday === weekdayOf(a.date) && t.hour === a.hour,
      );
      return {
        ...a,
        course_id: COURSE,
        module_id: slot?.module_id ?? modules[0].id,
        status: a.status as 'justified' | 'unjustified',
      };
    }),
  };
}

function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 ? 7 : day;
}
