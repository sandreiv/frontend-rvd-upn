import { Routes } from '@angular/router';
import { PreloadCall } from './preload-call/pages/preload-call/preload-call';
import { ProfessorPreload } from './professor-preload/pages/professor-preload/professor-preload';

export const configurationRoutes: Routes = [
  {
    path: 'convocatoria-precarga',
    component: PreloadCall,
  },

  {
    path: 'precarga-docente',
    component: ProfessorPreload,
  }
  
];
