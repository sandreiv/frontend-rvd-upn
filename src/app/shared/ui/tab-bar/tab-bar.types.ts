export type TabBarId = number | string;

export type TabBarAccent =
  | 'brand'
  | 'brandDeep'
  | 'brandLight'
  | 'brandStrong'
  | 'brandSoft';

export interface TabBarItem {
  id: TabBarId;
  label: string;
  accent?: TabBarAccent;
  badge?: string;
}

export const TAB_BAR_DEFAULT_ACCENTS: TabBarAccent[] = [
  'brand',
  'brandDeep',
  'brandLight',
  'brandStrong',
  'brandSoft',
];
