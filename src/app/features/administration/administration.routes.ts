/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Redirección por defecto a tipo-actividades y limpieza de opciones de administración
 */
import { Routes } from '@angular/router';
import { AdministrationView } from './administration-view/administration-view';
import { ActivityTypesPage } from './activity-types/pages/activity-types-page/activity-types-page';
import { Projects } from './projects/pages/projects/projects';

export const administrationRoutes: Routes = [
  {
    path: '',
    component: AdministrationView,
    children: [
      {
        path: '',
        redirectTo: 'tipo-actividades',
        pathMatch: 'full',
      },
      {
        path: 'tipo-actividades',
        component: ActivityTypesPage,
      },
      {
        path: 'proyectos',
        component: Projects,
      },
    ],
  },
];
