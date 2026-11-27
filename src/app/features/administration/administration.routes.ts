import { Routes } from '@angular/router';

import { AdministrationView } from './administration-view/administration-view';
import { ActivityTypesPage } from './activity-types/pages/activity-types-page/activity-types-page';

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
        path: 'grupos-convocatoria',
        loadComponent: () =>
          import(
            
            './project-calls/pages/project-calls/project-calls'
          
          ).then(
            (m) => m.ProjectCalls,
          ),
      },
      {
        path: 'tablas-basicas',
        redirectTo: 'tablas-basicas/novedades',
        pathMatch: 'full',
      },
      {
        path: 'tablas-basicas/novedades',
        loadComponent: () =>
          import('./basic-tables/pages/novedades-page/novedades-page').then(
            (m) => m.NovedadesPage,
          ),
      },

      {
        path: 'estados',
        loadComponent: () =>
          import(
            './states/pages/states/states'
          ).then(
            (m) => m.States,
          ),
      },
      {
        path: 'perfiles',
        loadComponent: () =>
          import(
            './profiles/pages/profiles/profiles'
          ).then(
            (m) => m.Profiles,
          ),
      },
      {
        path: 'coordinaciones',
        loadComponent: () =>
          import(
            './coordination-administration/pages/coordination-administration/coordination-administration'
          )
          .then(
            (m) => m.CoordinationAdministration,
          ),
      },
      {
        path: 'tipos-documentos',
        loadComponent: () =>
          import(
            './document-types/pages/document-types/document-types'
          )
          .then(
            (m) => m.DocumentTypes,
          ),
      },
      {
        path: 'vinculacion-actividades',
        loadComponent: () =>
          import(
            './vinculacion-actividades/pages/vinculacion-actividades/vinculacion-actividades'
          ).then(
            (m) => m.VinculacionActividades,
          ),
      },
    ],
  },
];