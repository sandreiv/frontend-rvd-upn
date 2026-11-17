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
    ],
  },
];
