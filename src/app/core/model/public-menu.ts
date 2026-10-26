import { MenuNavItem } from '../service/menu-service';

export const PUBLIC_HOME_PATH =
  '/publico/plan-de-trabajo/contratacion-docentes';

export const PUBLIC_NAV_ITEMS: MenuNavItem[] = [
  {
    name: 'Contratación docente',
    icon: 'briefcase',
    path: PUBLIC_HOME_PATH,
    codigo: 'public-work-plan',
  },
];
