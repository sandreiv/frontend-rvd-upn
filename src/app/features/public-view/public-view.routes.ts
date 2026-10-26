import { Routes } from '@angular/router';
import { Hiring } from './hiring/pages/hiring/hiring';

export const publicViewRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'plan-de-trabajo/contratacion-docentes',
  },
  {
    path: 'plan-de-trabajo/contratacion-docentes',
    component: Hiring,
    title: 'Contratación para docentes - RVD',
  }
];
