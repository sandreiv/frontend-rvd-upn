import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { APP_CONFIG } from '../config/app-config.token';
import { AppConfig } from '../config/app-config';

type SidebarThemeMode = 'default' | 'custom';

type SidebarThemeTokens = {
  '--sidebar-bg': string;
  '--sidebar-fg': string;
  '--sidebar-muted': string;
  '--sidebar-hover-bg': string;
  '--sidebar-hover-fg': string;
  '--sidebar-active-bg': string;
  '--sidebar-active-fg': string;
  '--sidebar-icon': string;
  '--sidebar-icon-active': string;
  '--sidebar-border': string;
};

@Injectable({
  providedIn: 'root',
})
export class SidebarTheme {
  // Punto unico para cambiar el color base institucional del sidebar.
  readonly presetColor: string;

  private readonly modeSubject = new BehaviorSubject<SidebarThemeMode>('default');
  readonly mode$ = this.modeSubject.asObservable();

  private readonly cssVarKeys: (keyof SidebarThemeTokens)[] = [
    '--sidebar-bg',
    '--sidebar-fg',
    '--sidebar-muted',
    '--sidebar-hover-bg',
    '--sidebar-hover-fg',
    '--sidebar-active-bg',
    '--sidebar-active-fg',
    '--sidebar-icon',
    '--sidebar-icon-active',
    '--sidebar-border',
  ];

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    this.presetColor = this.normalizeHex(this.config.sidebarTheme.color) ?? '#00482B';

    this.applyCustomTheme(this.presetColor);
  }

  toggleThemeMode() {
    if (this.modeSubject.value === 'custom') {
      this.applyDefaultTheme();
      return;
    }

    this.applyCustomTheme(this.presetColor);
  }

  resetToDefaultTheme() {
    this.applyDefaultTheme();
  }

  private applyDefaultTheme() {
    this.clearCustomCssVariables();
    this.modeSubject.next('default');
  }

  private applyCustomTheme(color: string) {
    const normalizedColor = this.normalizeHex(color) ?? this.presetColor;

    this.applyCssVariables(this.buildCustomTokens(normalizedColor));
    this.modeSubject.next('custom');
  }

  private applyCssVariables(tokens: SidebarThemeTokens) {
    const rootStyle = document.documentElement.style;

    this.cssVarKeys.forEach((key) => {
      rootStyle.setProperty(key, tokens[key]);
    });
  }

  private clearCustomCssVariables() {
    const rootStyle = document.documentElement.style;

    this.cssVarKeys.forEach((key) => {
      rootStyle.removeProperty(key);
    });
  }

  private buildCustomTokens(baseColor: string): SidebarThemeTokens {
    const textColor = this.pickReadableTextColor(baseColor);
    const isLightText = textColor === '#FFFFFF';

    return {
      '--sidebar-bg': baseColor,
      '--sidebar-fg': textColor,
      '--sidebar-muted': this.mixColors(baseColor, textColor, isLightText ? 0.72 : 0.55),
      '--sidebar-hover-bg': this.mixColors(baseColor, textColor, isLightText ? 0.12 : 0.08),
      '--sidebar-hover-fg': textColor,
      '--sidebar-active-bg': this.mixColors(baseColor, textColor, isLightText ? 0.2 : 0.16),
      '--sidebar-active-fg': textColor,
      '--sidebar-icon': this.mixColors(baseColor, textColor, isLightText ? 0.75 : 0.6),
      '--sidebar-icon-active': textColor,
      '--sidebar-border': this.mixColors(baseColor, textColor, isLightText ? 0.28 : 0.18),
    };
  }

  private pickReadableTextColor(backgroundHex: string): '#FFFFFF' | '#101828' {
    const whiteContrast = this.contrastRatio(backgroundHex, '#FFFFFF');
    const darkContrast = this.contrastRatio(backgroundHex, '#101828');

    return whiteContrast >= darkContrast ? '#FFFFFF' : '#101828';
  }

  private contrastRatio(colorA: string, colorB: string): number {
    const luminanceA = this.relativeLuminance(colorA);
    const luminanceB = this.relativeLuminance(colorB);
    const lighter = Math.max(luminanceA, luminanceB);
    const darker = Math.min(luminanceA, luminanceB);

    return (lighter + 0.05) / (darker + 0.05);
  }

  private relativeLuminance(hexColor: string): number {
    const rgb = this.hexToRgb(hexColor);

    if (!rgb) {
      return 0;
    }

    const [r, g, b] = rgb.map((value) => {
      const normalized = value / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private mixColors(colorA: string, colorB: string, colorBWeight: number): string {
    const rgbA = this.hexToRgb(colorA);
    const rgbB = this.hexToRgb(colorB);

    if (!rgbA || !rgbB) {
      return colorA;
    }

    const weight = Math.min(Math.max(colorBWeight, 0), 1);
    const mixed = rgbA.map((value, index) => {
      return Math.round(value * (1 - weight) + rgbB[index] * weight);
    });

    return this.rgbToHex(mixed[0], mixed[1], mixed[2]);
  }

  private normalizeHex(value: string): string | null {
    const trimmed = value.trim();
    const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    const validHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(withHash);

    if (!validHex) {
      return null;
    }

    if (withHash.length === 4) {
      const expanded = withHash
        .slice(1)
        .split('')
        .map((char) => char + char)
        .join('');

      return `#${expanded}`.toUpperCase();
    }

    return withHash.toUpperCase();
  }

  private hexToRgb(hexColor: string): [number, number, number] | null {
    const normalized = this.normalizeHex(hexColor);

    if (!normalized) {
      return null;
    }

    const hex = normalized.slice(1);

    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
    ];
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (value: number) => {
      return value.toString(16).padStart(2, '0');
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }
}


