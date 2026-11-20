# Falta Kudeatzailea

**Web:** https://jrubioastigarraga.github.io/falta-kudeatzailea/

Aplicación web para gestionar las faltas de asistencia de un curso de FP: calendario, módulos, retos, horario semanal (08:00–14:00), registro de faltas justificadas/no justificadas y estadísticas con porcentajes.

- **Frontend:** Angular 21 (standalone, signals, hash routing) + Bootstrap 5 con estética [SB Admin 2](https://startbootstrap.com/theme/sb-admin-2).
- **Backend:** Supabase (Postgres + Auth + RLS).
- **Idiomas:** euskera / castellano (selector en la barra superior).
- **Publicación:** GitHub Pages (`docs/`).

## Funcionalidad

1. **Login** con email y contraseña (Supabase Auth). El administrador puede crear usuarios desde el panel; el alumnado también puede registrarse desde la pantalla de login.
2. **Gestión de usuarios** (solo admin): alta con email/contraseña, rol, activo/inactivo y matrícula por curso.
3. **Curso**: nombre, fecha de inicio/fin, festivos y evaluaciones.
4. **Módulos**: nombre, código y color.
5. **Retos**: nombre, módulo, fecha de inicio y fin.
6. **Horario**: módulos por fecha (semana a semana) y hora (08:00–14:00); la rejilla semanal permite editar cada día.
7. **Faltas**: rejilla semanal por estudiante; un clic alterna *presente → justificada → no justificada → retraso*.
8. **Informes**: faltas por curso, evaluación, reto y módulo, con horas previstas y porcentaje. Exportación CSV.

Los porcentajes se calculan sobre las horas de horario previstas en el periodo, descontando fines de semana y festivos.

## Puesta en marcha local

```bash
npm install
npm start
```

La configuración de Supabase está en `src/app/core/environment.ts`. Si se dejan la URL y la anon key vacías, la app arranca en **modo DEMO** con datos de ejemplo en `localStorage`:

- Admin: `admin@falta.eus` / `admin123`
- Estudiante: `ana@falta.eus` / `ikasle123`

## Base de datos

En el SQL Editor de Supabase (o con la CLI):

1. Ejecutar `supabase/schema.sql` (tablas, trigger de perfiles, RLS y políticas).
2. Ejecutar `supabase/import_ordutegia.sql` para cargar los datos reales del Excel `ASISTENTZIA - Egunekoa.xlsx`.

El curso `2026-2027` se actualiza (no se borra), por lo que **se conservan los usuarios y matrículas existentes**. Las faltas importadas se asignan al usuario `inaki@lhusurbil.eus` (Iñax).

### Datos importados

- Curso: **2026-08-31 → 2027-07-02**.
- **359 sesiones** con fecha, hora (08:00–14:00) y módulo.
- **9 módulos**: Materias, Digi., Seguridad, Ingles prof., Ingles avan., Elab., Preelab., IPE y Sala.
- **4 retos**: 0 (04–11 sep), 1 (14 sep–30 oct), 2 (02 nov–29 ene), 3 (01 feb–30 abr), con las notas de cambios de horario del Excel.
- **27 días no lectivos** deducidos de los colores del calendario (festivos, vacaciones y días no lectivos).
- **58 faltas de Iñax**: 26 justificadas, 31 no justificadas y 1 retraso. Los códigos del Excel se mapean así:
  - `J` → justificada
  - `F`, `C`, `H`, `E` → no justificada
  - `R` → retraso (no suma como falta; 3 retrasos = 1 no justificada según la leyenda)
  - `-` → sin datos (no se importa)
- Las tres evaluaciones se han derivado de los cortes naturales del calendario (Navidades y Semana Santa) y se pueden editar en **Ikasturtea**.

`Sala` queda fuera de los porcentajes por reto, tal como indica la nota del Excel.

Para nombrar administrador a un usuario ya registrado:

```sql
update public.profiles set role = 'admin' where email = 'tu@email.eus';
```

El alta de usuarios desde el panel usa `signUp` de Supabase: requiere que la confirmación por email esté desactivada (Authentication → Providers → Email → *Confirm email* off) para que la cuenta quede operativa al instante. Si se activa, el usuario deberá confirmar el correo antes de entrar.

La anon key es pública por diseño; la seguridad depende de las políticas RLS incluidas en `schema.sql`. Los estudiantes solo pueden leer sus propias faltas y matrículas.

## Publicar en GitHub Pages

```bash
npm run build:pages
```

Esto genera `docs/` con `baseHref=/falta-kudeatzailea/`. Se sirve desde la rama `main`, carpeta `/docs` (Settings → Pages). Se usa **hash routing** (`/#/dashboard`) para que las rutas funcionen sin configuración de servidor.

## Estructura

```
src/app/
  core/        modelos, Supabase, auth, datos, i18n, estadísticas
  layout/      shell SB Admin 2 (sidebar + topbar)
  pages/       login, dashboard, usuarios, curso, módulos, retos,
               horario, faltas, informes
  shared/      tabla de estadísticas reutilizable
supabase/      schema.sql, migration_sessions.sql, import_ordutegia.sql
docs/          build de GitHub Pages
```
