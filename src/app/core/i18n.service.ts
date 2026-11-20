import { Injectable, computed, signal } from '@angular/core';

export type Lang = 'eu' | 'es';

type Entry = [eu: string, es: string];

const DICT: Record<string, Entry> = {
  'app.title': ['Falta Kudeatzailea', 'Falta Kudeatzailea'],
  'app.tagline': ['Falten kudeaketa akademikoa', 'Gestión académica de faltas'],

  'nav.main': ['Nagusia', 'Principal'],
  'nav.dashboard': ['Panela', 'Panel'],
  'nav.management': ['Kudeaketa', 'Gestión'],
  'nav.users': ['Erabiltzaileak', 'Usuarios'],
  'nav.calendar': ['Ikasturtea', 'Curso'],
  'nav.modules': ['Moduluak', 'Módulos'],
  'nav.challenges': ['Erronkak', 'Retos'],
  'nav.attendance': ['Asistentzia', 'Asistencia'],
  'nav.timetable': ['Ordutegia', 'Horario'],
  'nav.absences': ['Faltak', 'Faltas'],
  'nav.reports': ['Txostenak', 'Informes'],
  'nav.logout': ['Irten', 'Salir'],

  'common.add': ['Gehitu', 'Añadir'],
  'common.new': ['Berria', 'Nuevo'],
  'common.edit': ['Editatu', 'Editar'],
  'common.delete': ['Ezabatu', 'Eliminar'],
  'common.save': ['Gorde', 'Guardar'],
  'common.cancel': ['Utzi', 'Cancelar'],
  'common.close': ['Itxi', 'Cerrar'],
  'common.search': ['Bilatu...', 'Buscar...'],
  'common.actions': ['Ekintzak', 'Acciones'],
  'common.confirm': ['Baieztatu', 'Confirmar'],
  'common.yes': ['Bai', 'Sí'],
  'common.no': ['Ez', 'No'],
  'common.none': ['Bat ere ez', 'Ninguno'],
  'common.all': ['Guztiak', 'Todos'],
  'common.date': ['Data', 'Fecha'],
  'common.name': ['Izena', 'Nombre'],
  'common.module': ['Modulua', 'Módulo'],
  'common.course': ['Ikasturtea', 'Curso'],
  'common.student': ['Ikaslea', 'Estudiante'],
  'common.students': ['Ikasleak', 'Estudiantes'],
  'common.role': ['Rola', 'Rol'],
  'common.admin': ['Administratzailea', 'Administrador'],
  'common.email': ['Emaila', 'Email'],
  'common.password': ['Pasahitza', 'Contraseña'],
  'common.active': ['Aktibo', 'Activo'],
  'common.inactive': ['Ez aktibo', 'Inactivo'],
  'common.status': ['Egoera', 'Estado'],
  'common.total': ['Guztira', 'Total'],
  'common.hours': ['ordu', 'horas'],
  'common.loading': ['Kargatzen...', 'Cargando...'],
  'common.noData': ['Ez dago daturik', 'No hay datos'],
  'common.error': ['Errore bat gertatu da', 'Se ha producido un error'],
  'common.select': ['Aukeratu', 'Selecciona'],
  'common.optional': ['aukerakoa', 'opcional'],
  'common.week': ['Astea', 'Semana'],
  'common.percent': ['Ehunekoa', 'Porcentaje'],
  'common.logout': ['Saioa itxi', 'Cerrar sesión'],
  'common.demoMode': ['DEMO modua', 'Modo DEMO'],
  'common.language': ['Hizkuntza', 'Idioma'],
  'common.today': ['Gaur', 'Hoy'],
  'common.deleteConfirm': ['Ziur zaude ezabatu nahi duzula?', '¿Seguro que quieres eliminarlo?'],

  'login.welcome': ['Ongi etorri', 'Bienvenido'],
  'login.subtitle': ['Hasi saioa zure faltak kudeatzeko', 'Inicia sesión para gestionar tus faltas'],
  'login.signin': ['Hasi saioa', 'Iniciar sesión'],
  'login.signup': ['Sortu kontua', 'Crear cuenta'],
  'login.fullName': ['Izen-abizenak', 'Nombre y apellidos'],
  'login.haveAccount': ['Baduzu kontua? Hasi saioa', '¿Ya tienes cuenta? Inicia sesión'],
  'login.noAccount': ['Ez duzu konturik? Sortu bat', '¿No tienes cuenta? Crea una'],
  'login.invalid': ['Email edo pasahitz okerra', 'Email o contraseña incorrectos'],
  'login.demoHint': ['Demo gakoa: admin@falta.eus / admin123', 'Clave demo: admin@falta.eus / admin123'],
  'login.checkEmail': [
    'Begiratu zure emaila kontua baieztatzeko',
    'Revisa tu email para confirmar la cuenta',
  ],
  'login.signupDisabled': [
    'Kontuak administradoreak sortzen ditu Supabase panela erabiliz.',
    'Los usuarios los crea el administrador desde el panel de Supabase.',
  ],
  'login.error': ['Ezin izan da saioa hasi', 'No se ha podido iniciar sesión'],

  'dashboard.title': ['Panela', 'Panel'],
  'dashboard.subtitle': ['Ikasturtearen laburpena', 'Resumen del curso'],
  'dashboard.students': ['Ikasleak', 'Estudiantes'],
  'dashboard.modules': ['Moduluak', 'Módulos'],
  'dashboard.challenges': ['Erronkak', 'Retos'],
  'dashboard.absences': ['Faltak', 'Faltas'],
  'dashboard.justified': ['Justifikatuak', 'Justificadas'],
  'dashboard.unjustified': ['Justifikatu gabeak', 'No justificadas'],
  'dashboard.byModule': ['Faltak moduluka', 'Faltas por módulo'],
  'dashboard.byModuleHint': ['% ikasturteko orduen gainean', '% sobre las horas del curso'],
  'dashboard.recent': ['Azken faltak', 'Últimas faltas'],
  'dashboard.noRecent': ['Oraindik ez dago falten erregistrorik', 'Todavía no hay faltas registradas'],
  'dashboard.viewAll': ['Denak ikusi', 'Ver todas'],
  'dashboard.selectCourse': ['Aukeratu ikasturtea', 'Selecciona un curso'],
  'dashboard.noCourse': [
    'Sortu ikasturte bat hasteko: Ikasturtea atala.',
    'Crea un curso para empezar: sección Curso.',
  ],
  'dashboard.rate': ['Asistentzia tasa', 'Tasa de asistencia'],
  'dashboard.activeCourse': ['Ikasturte aktiboa', 'Curso activo'],

  'users.title': ['Erabiltzaileen kudeaketa', 'Gestión de usuarios'],
  'users.subtitle': ['Ikasleak, rolak eta matrikulazioa', 'Estudiantes, roles y matrículas'],
  'users.new': ['Erabiltzaile berria', 'Nuevo usuario'],
  'users.edit': ['Erabiltzailea editatu', 'Editar usuario'],
  'users.role': ['Rola', 'Rol'],
  'users.enrollment': ['Matrikula', 'Matrícula'],
  'users.enrolled': ['Matrikulatuta', 'Matriculado'],
  'users.notEnrolled': ['Ez matrikulatuta', 'Sin matrícula'],
  'users.enroll': ['Matrikulatu', 'Matricular'],
  'users.unenroll': ['Matrikula kendu', 'Quitar matrícula'],
  'users.adminOnly': ['Atal hau administratzaileentzat da', 'Esta sección es solo para administradores'],
  'users.registerNote': [
    'Supabase gisa: erabiltzaile berriak "Sortu kontua" bidez erregistratzen dira; gero hemen rola eta matrikula ezarri.',
    'Con Supabase: los nuevos usuarios se registran con "Crear cuenta"; luego aquí se asigna rol y matrícula.',
  ],
  'users.demoNote': [
    'Demo moduan erabiltzaileak hemen sortzen dira zuzenean.',
    'En modo demo los usuarios se crean aquí directamente.',
  ],
  'users.passwordHint': ['Gutxienez 6 karaktere', 'Mínimo 6 caracteres'],
  'users.roleAdmin': ['Administratzailea', 'Administrador'],
  'users.roleStudent': ['Ikaslea', 'Estudiante'],
  'users.deleteConfirm': [
    'Erabiltzailea eta bere datuak ezabatu?',
    '¿Eliminar el usuario y sus datos?',
  ],
  'users.selfDelete': ['Ezin duzu zure burua ezabatu', 'No puedes eliminarte a ti mismo'],
  'users.created': ['Erabiltzailea sortu da', 'Usuario creado'],
  'users.emailExists': ['Email hori dagoeneko erregistratuta dago', 'Ese email ya está registrado'],
  'users.createNote': [
    'Erabiltzailea email eta pasahitzarekin sortuko da eta berehala has dezake saioa.',
    'El usuario se creará con email y contraseña y podrá iniciar sesión inmediatamente.',
  ],
  'users.permissionNote': [
    'Supabase-n erabiltzaileak administratzeko zerbitzu-gakoa behar da. Erregistratu eta gero editatu hemen.',
    'Gestionar altas en Supabase requiere la service key. Regístralos y edítalos aquí después.',
  ],

  'calendar.title': ['Ikasturtearen egutegia', 'Calendario del curso'],
  'calendar.subtitle': ['Hasiera, amaiera, jaiegunak eta ebaluazioak', 'Inicio, fin, festivos y evaluaciones'],
  'calendar.courseData': ['Ikasturtearen datuak', 'Datos del curso'],
  'calendar.courseName': ['Ikasturtearen izena', 'Nombre del curso'],
  'calendar.start': ['Hasiera', 'Inicio'],
  'calendar.end': ['Amaiera', 'Fin'],
  'calendar.active': ['Ikasturte aktiboa', 'Curso activo'],
  'calendar.newCourse': ['Ikasturte berria', 'Nuevo curso'],
  'calendar.editCourse': ['Ikasturtea editatu', 'Editar curso'],
  'calendar.holidays': ['Jaiegunak', 'Días festivos'],
  'calendar.addHoliday': ['Jaiegun bat gehitu', 'Añadir festivo'],
  'calendar.holidayName': ['Jaiegunaren izena', 'Nombre del festivo'],
  'calendar.evaluations': ['Ebaluazioak', 'Evaluaciones'],
  'calendar.addEvaluation': ['Ebaluazioa gehitu', 'Añadir evaluación'],
  'calendar.evalName': ['Ebaluazioaren izena', 'Nombre de la evaluación'],
  'calendar.noHolidays': ['Ez dago jaiegunik', 'No hay festivos'],
  'calendar.noEvals': ['Ez dago ebaluaziorik', 'No hay evaluaciones'],
  'calendar.noCourses': ['Ez dago ikasturterik. Sortu bat hasteko.', 'No hay cursos. Crea uno para empezar.'],
  'calendar.period': ['Aldia', 'Periodo'],
  'calendar.courseSaved': ['Ikasturtea gordeta', 'Curso guardado'],
  'calendar.overlap': [
    'Ebaluazioen datak gainjarri egiten dira',
    'Las fechas de las evaluaciones se solapan',
  ],

  'modules.title': ['Moduluak', 'Módulos'],
  'modules.subtitle': ['Ikasturteko moduluen zerrenda', 'Lista de módulos del curso'],
  'modules.new': ['Modulu berria', 'Nuevo módulo'],
  'modules.edit': ['Modulua editatu', 'Editar módulo'],
  'modules.name': ['Moduluaren izena', 'Nombre del módulo'],
  'modules.code': ['Kodea', 'Código'],
  'modules.color': ['Kolorea', 'Color'],
  'modules.deleteConfirm': [
    'Modulua ezabatu? Ordutegiko erreferentziak eta faltak ere ezabatuko dira.',
    '¿Eliminar el módulo? También se borrarán sus referencias de horario y faltas.',
  ],
  'modules.empty': ['Ez dago modulurik ikasturte honetan', 'No hay módulos en este curso'],

  'challenges.title': ['Erronkak', 'Retos'],
  'challenges.subtitle': ['Erronkak, moduluak eta datak', 'Retos, módulos y fechas'],
  'challenges.new': ['Erronka berria', 'Nuevo reto'],
  'challenges.edit': ['Erronka editatu', 'Editar reto'],
  'challenges.name': ['Erronkaren izena', 'Nombre del reto'],
  'challenges.module': ['Modulua', 'Módulo'],
  'challenges.startDate': ['Hasiera data', 'Fecha de inicio'],
  'challenges.endDate': ['Amaiera data', 'Fecha de fin'],
  'challenges.deleteConfirm': ['Erronka ezabatu?', '¿Eliminar el reto?'],
  'challenges.empty': ['Ez dago erronkarik', 'No hay retos'],
  'challenges.invalidRange': ['Amaiera hasiera baino lehenago dago', 'La fecha de fin es anterior al inicio'],
  'challenges.active': ['Abian', 'En curso'],
  'challenges.upcoming': ['Datorrena', 'Próximo'],
  'challenges.finished': ['Amaituta', 'Finalizado'],
  'challenges.notes': ['Oharrak', 'Notas'],

  'timetable.title': ['Ordutegia', 'Horario'],
  'timetable.subtitle': ['Astelehenetik ostiralera, 08:00-14:00', 'De lunes a viernes, 08:00-14:00'],
  'timetable.hint': [
    'Aukeratu modulu bat data eta ordu bakoitzean. Aldaketak automatikoki gordetzen dira.',
    'Selecciona un módulo en cada fecha y hora. Los cambios se guardan automáticamente.',
  ],
  'timetable.clear': ['Garbitu', 'Vaciar'],
  'timetable.noModules': ['Lehenengo moduluak sortu behar dituzu', 'Primero debes crear módulos'],
  'timetable.saved': ['Ordutegia gordeta', 'Horario guardado'],
  'timetable.monday': ['Astelehena', 'Lunes'],
  'timetable.tuesday': ['Asteartea', 'Martes'],
  'timetable.wednesday': ['Asteazkena', 'Miércoles'],
  'timetable.thursday': ['Osteguna', 'Jueves'],
  'timetable.friday': ['Ostirala', 'Viernes'],

  'absences.title': ['Falten erregistroa', 'Registro de faltas'],
  'absences.subtitle': ['Asteko asistentzia: justifikatua ala ez', 'Asistencia semanal: justificada o no'],
  'absences.student': ['Ikaslea', 'Estudiante'],
  'absences.selectStudent': ['Aukeratu ikasle bat', 'Selecciona un estudiante'],
  'absences.week': ['Astea', 'Semana'],
  'absences.prevWeek': ['Aurreko astea', 'Semana anterior'],
  'absences.nextWeek': ['Hurrengo astea', 'Semana siguiente'],
  'absences.thisWeek': ['Aste hau', 'Esta semana'],
  'absences.present': ['Bertan', 'Presente'],
  'absences.justified': ['Justifikatua', 'Justificada'],
  'absences.unjustified': ['Justifikatu gabea', 'No justificada'],
  'absences.legend': ['Egin klik gelaxkan egoera aldatzeko', 'Haz clic en la celda para cambiar el estado'],
  'absences.noSlots': ['Ez dago ordutegirik aste honetan', 'No hay horario esta semana'],
  'absences.noStudents': ['Ez dago ikasle matrikulaturik', 'No hay estudiantes matriculados'],
  'absences.noModules': ['Ordutegia bete gabe dago', 'El horario está vacío'],
  'absences.saved': ['Asistentzia gordeta', 'Asistencia guardada'],
  'absences.weekSummary': ['Asteko laburpena', 'Resumen semanal'],
  'absences.holiday': ['Jaieguna', 'Festivo'],
  'absences.outOfCourse': ['Data hau ikasturtetik kanpo dago', 'Esta fecha está fuera del curso'],

  'reports.title': ['Falten txostenak', 'Informes de faltas'],
  'reports.subtitle': [
    'Faltak ikasturte, ebaluazio, erronka eta moduluka, ehunekoekin',
    'Faltas por curso, evaluación, reto y módulo, con porcentajes',
  ],
  'reports.filters': ['Iragazkiak', 'Filtros'],
  'reports.student': ['Ikaslea', 'Estudiante'],
  'reports.allStudents': ['Ikasle guztiak', 'Todos los estudiantes'],
  'reports.evaluation': ['Ebaluazioa', 'Evaluación'],
  'reports.allEvaluations': ['Ebaluazio guztiak', 'Todas las evaluaciones'],
  'reports.challenge': ['Erronka', 'Reto'],
  'reports.allChallenges': ['Erronka guztiak', 'Todos los retos'],
  'reports.module': ['Modulua', 'Módulo'],
  'reports.allModules': ['Modulu guztiak', 'Todos los módulos'],
  'reports.period': ['Aldia', 'Periodo'],
  'reports.expectedHours': ['Ordu esperoak', 'Horas previstas'],
  'reports.justified': ['Justifikatuak', 'Justificadas'],
  'reports.unjustified': ['Justifikatu gabeak', 'No justificadas'],
  'reports.totalAbsences': ['Falta guztiak', 'Faltas totales'],
  'reports.byModule': ['Moduluka', 'Por módulo'],
  'reports.byEvaluation': ['Ebaluazioka', 'Por evaluación'],
  'reports.byChallenge': ['Erronkaka', 'Por reto'],
  'reports.summary': ['Laburpena', 'Resumen'],
  'reports.noData': ['Iragazki hauekin ez dago daturik', 'No hay datos con estos filtros'],
  'reports.percentOfHours': ['Orduen %', '% de horas'],
  'reports.overCourse': ['Ikasturte osoa', 'Curso completo'],
  'reports.attendance': ['Asistentzia', 'Asistencia'],
  'reports.absenceRate': ['Falta tasa', 'Tasa de faltas'],
  'reports.studentsCount': ['Ikasle kopurua', 'Número de estudiantes'],
  'reports.totalHours': ['Ordu guztiak', 'Horas totales'],
  'reports.justifiedShort': ['Justif.', 'Justif.'],
  'reports.unjustifiedShort': ['Ez justif.', 'No justif.'],
  'reports.export': ['CSV esportatu', 'Exportar CSV'],
  'reports.basis': [
    'Ehunekoak ordutegiko ordu esperoen gainean kalkulatzen dira (jaiegunak kenduta).',
    'Los porcentajes se calculan sobre las horas previstas del horario (sin festivos).',
  ],

  'status.present': ['Bertan', 'Presente'],
  'status.justified': ['Justifikatua', 'Justificada'],
  'status.unjustified': ['Justifikatu gabea', 'No justificada'],
  'status.late': ['Berandutzea', 'Retraso'],

  'role.admin': ['Administratzailea', 'Administrador'],
  'role.student': ['Ikaslea', 'Estudiante'],

  'toast.saved': ['Gordeta', 'Guardado'],
  'toast.error': ['Errorea gordetzean', 'Error al guardar'],
  'toast.deleted': ['Ezabatuta', 'Eliminado'],
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(this.initialLang());
  readonly locale = computed(() => (this.lang() === 'eu' ? 'eu-ES' : 'es-ES'));

  private initialLang(): Lang {
    const stored = localStorage.getItem('fk_lang');
    if (stored === 'eu' || stored === 'es') return stored;
    return 'eu';
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
    localStorage.setItem('fk_lang', lang);
    document.documentElement.lang = lang;
  }

  t(key: string): string {
    const entry = DICT[key];
    if (!entry) return key;
    return this.lang() === 'eu' ? entry[0] : entry[1];
  }

  formatDate(iso: string | null | undefined): string {
    const date = parseIso(iso);
    if (!date) return '';
    const months = this.months();
    return `${`${date.getDate()}`.padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  formatDayMonth(iso: string): string {
    const date = parseIso(iso);
    if (!date) return '';
    return `${`${date.getDate()}`.padStart(2, '0')} ${this.months()[date.getMonth()]}`;
  }

  weekdayName(weekday: number): string {
    const names =
      this.lang() === 'eu'
        ? ['astelehena', 'asteartea', 'asteazkena', 'osteguna', 'ostirala', 'larunbata', 'igandea']
        : ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    return names[weekday - 1] ?? '';
  }

  monthYear(date: Date): string {
    return `${this.months()[date.getMonth()]} ${date.getFullYear()}`;
  }

  private months(): string[] {
    return this.lang() === 'eu'
      ? ['urt.', 'ots.', 'mar.', 'api.', 'mai.', 'eka.', 'uzt.', 'abu.', 'ira.', 'urr.', 'aza.', 'abe.']
      : ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
  }
}

export function parseIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.substring(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  date.setHours(12, 0, 0, 0);
  return date;
}

export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}
