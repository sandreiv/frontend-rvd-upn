import { Routes } from '@angular/router';
import { AdministrationView } from './administration-view/administration-view';
import { CoordinationAdministration } from './coordination-administration/pages/coordination-administration/coordination-administration';
import { ActivityTypesPage } from './activity-types/pages/activity-types-page/activity-types-page';
import { LoadRestrictionPage } from './load-restriction/pages/load-restriction-page/load-restriction-page';
import { ProjectCalls } from './project-calls/pages/project-calls/project-calls';
import { ProjectTypes } from './project-types/pages/project-types/project-types';
import { Projects } from './projects/pages/projects/projects';
import { Novelties } from './novelties/pages/novelties/novelties';
import { PointsValidity } from './points-validity/pages/points-validity/points-validity';

export const administrationRoutes: Routes = [
  {
    path: '',
    component: AdministrationView,
    children: [
      {
        path: 'coordinaciones',
        component: CoordinationAdministration,
      },
      {
        path: 'tipo-actividades',
        component: ActivityTypesPage,
      },
      {
        path: 'restriccion-carga',
        component: LoadRestrictionPage,
      },
      {
        path: 'novedades',
        component: Novelties,
      },
      {
        path: 'puntos-vigencia',
        component: PointsValidity,
      },
      {
        path: '',
        redirectTo: 'coordinaciones',
        pathMatch: 'full',
      },
      {
        path: 'convocatorias-de-proyecto',
        component: ProjectCalls,
      },
      {
        path: 'tipos-de-proyecto',
        component: ProjectTypes,
      },
      {
        path: 'proyectos',
        component: Projects,
      },
    ],
  },
];
