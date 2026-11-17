import { TemplateRef } from '@angular/core';
import { AppIconName } from '../icon/icons';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type TooltipTheme = 'dark' | 'light' | 'brand' | 'success' | 'warning' | 'danger';
export type TooltipContent = string | TemplateRef<unknown> | null | undefined;

export interface TooltipOptions {
  placement?: TooltipPlacement;
  theme?: TooltipTheme;
  offset?: number;
  disabled?: boolean;
  delay?: number;
  icon?: AppIconName;
  kbd?: string;
  kbdIcon?: AppIconName;
  interactive?: boolean;
}

