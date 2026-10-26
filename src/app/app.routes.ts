import { Routes } from '@angular/router';
import { AppLayout } from './shared/layout/app-layout/app-layout';
import { PreloadCall } from './features/configuration/preload-call/pages/preload-call/preload-call';
import { ProfessorPreload } from './features/configuration/professor-preload/pages/professor-preload/professor-preload';
import { CdpRequests } from './features/configuration/cdp-requests/pages/cdp-requests/cdp-requests';
import { administrationRoutes } from './features/administration/administration.routes';
import { ProjectCalls } from './features/administration/project-calls/pages/project-calls/project-calls';
import { ProjectTypes } from './features/administration/project-types/pages/project-types/project-types';
import { SessionRequired } from './features/auth/session-required/session-required';
import { authGuard } from './core/guards/auth.guard';
import { homeRedirectGuard, menuGuard } from './core/guards/menu.guard';
import { TeacherAccess } from './features/public-view/professor-access/professor-access';
import { publicViewRoutes } from './features/public-view/public-view.routes';
import { publicSessionGuard } from './core/guards/public-session.guard';
import { VerifyProfessors } from './features/configuration/verify-professors/pages/verify-professors/verify-professors';
import { HiringCall } from './features/configuration/hiring-call/pages/hiring-call/hiring-call';

export const routes: Routes = [
  {
    path: 'sesion-requerida',
    component: SessionRequired,
    title: 'Sesión requerida',
  },
  {
    path: 'acceso-docente',
    component: TeacherAccess,
    title: 'Acceso docente - RVD',
  },
  {
    path: 'publico',
    component: AppLayout,
    title: 'RVD UdeC',
    canActivate: [publicSessionGuard],
    canActivateChild: [publicSessionGuard],
    children: publicViewRoutes,
  },
  {
    path: '',
    redirectTo: '/rvd',
    pathMatch: 'full',
  },
  {
    path: 'rvd',
    component: AppLayout,
    title: 'RVD UdeC',
    canActivate: [authGuard],
    canActivateChild: [menuGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [homeRedirectGuard],
        children: [],
      },
      { path: 'convocatoria-precarga', component: PreloadCall },
      { path: 'precarga-docente', component: ProfessorPreload },
      { path: 'administracion', children: administrationRoutes },
      { path: 'solicitudes-cdp', component: CdpRequests },
      { path: 'convocatorias-de-proyecto', component: ProjectCalls },
      { path: 'tipos-de-proyecto', component: ProjectTypes },
      { path: 'verificar-docentes', component: VerifyProfessors },
      { path: 'convocatoria-contratacion', component: HiringCall },
    ],
  },
];
