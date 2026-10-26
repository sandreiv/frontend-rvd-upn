import { ToastOptions } from '@ngxpert/hot-toast';
import { AppIconName } from '../../icon/icons';
import { Toast } from '../toas.model';

export const TOAST_POSITION = 'top-right' as const;

const TOAST_ICONS: Record<Toast['type'], AppIconName> = {
  success: 'toastSuccess',
  error: 'toastError',
  info: 'toastInfo',
};

interface ToastVisualConfig {
  style: Record<string, string>;
  iconTheme: {
    primary: string;
    secondary: string;
  };
}

const TOAST_VISUALS: Record<Toast['type'], ToastVisualConfig> = {
  success: {
    style: {
      border: '1px solid #166534',
      padding: '16px',
      color: '#166534',
      borderRadius: '12px',
      background: '#F0FDF4',
      boxShadow: '0 8px 24px rgba(22, 101, 52, 0.15)',
    },
    iconTheme: {
      primary: '#166534',
      secondary: '#F0FDF4',
    },
  },
  error: {
    style: {
      border: '1px solid #991B1B',
      padding: '16px',
      color: '#991B1B',
      borderRadius: '12px',
      background: '#FEF2F2',
      boxShadow: '0 8px 24px rgba(153, 27, 27, 0.15)',
    },
    iconTheme: {
      primary: '#991B1B',
      secondary: '#FEF2F2',
    },
  },
  info: {
    style: {
      border: '1px solid #713200',
      padding: '16px',
      color: '#713200',
      borderRadius: '12px',
      background: '#FFFAEE',
      boxShadow: '0 8px 24px rgba(113, 50, 0, 0.12)',
    },
    iconTheme: {
      primary: '#713200',
      secondary: '#FFFAEE',
    },
  },
};

export function getToastIconName(type: Toast['type']): AppIconName {
  return TOAST_ICONS[type];
}

export function buildToastOptions(
  type: Toast['type'],
  durationMs: number,
): ToastOptions<unknown> {
  const visual = TOAST_VISUALS[type];

  return {
    position: TOAST_POSITION,
    duration: durationMs,
    dismissible: true,
    style: visual.style,
    iconTheme: visual.iconTheme,
  };
}
