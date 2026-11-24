import { Routes } from '@angular/router';
import { BasicTablesView } from './basic-tables-view/basic-tables-view';

export const basicTablesRoutes: Routes = [
  {
    path: '',
    component: BasicTablesView,
    children: [
      {
        path: '',
        redirectTo: 'novedades',
        pathMatch: 'full',
      },
      {
        path: 'novedades',
        loadComponent: () =>
          import('./novedades/pages/novedades-page/novedades-page').then(
            (m) => m.NovedadesPage,
          ),
      },
    ],
  },
];
