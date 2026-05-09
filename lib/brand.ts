export const colors = {
  navy: '#0f1b33',
  gold: '#D4A853',
  white: '#ffffff',

  navyLight: '#1B2A4A',
  navyDeep: '#0a121f',
  goldDim: '#a37f33',
  goldGlow: 'rgba(212, 168, 83, 0.4)',

  error: '#dc2626',
  errorBg: '#fef2f2',
  success: '#16a34a',
  successBg: '#f0fdf4',
  warning: '#ea580c',
  warningBg: '#fff7ed',

  textOnLight: '#1B2A4A',
  textMuted: '#6b7280',
  textSubtle: '#9ca3af',
  borderLight: '#e5e7eb',
  surfaceLight: '#f9fafb',
} as const;

export const typography = {
  family: {
    serif: 'var(--font-crimson), "Crimson Pro", Georgia, serif',
    sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  scale: {
    h1: { size: '48px', lineHeight: '56px', weight: 600 },
    h2: { size: '36px', lineHeight: '44px', weight: 600 },
    h3: { size: '28px', lineHeight: '36px', weight: 600 },
    body: { size: '18px', lineHeight: '28px', weight: 400 },
    small: { size: '16px', lineHeight: '24px', weight: 400 },
    caption: { size: '14px', lineHeight: '20px', weight: 400 },
  },
  scaleMobile: {
    h1: { size: '36px', lineHeight: '44px', weight: 600 },
    h2: { size: '28px', lineHeight: '36px', weight: 600 },
    h3: { size: '24px', lineHeight: '32px', weight: 600 },
    body: { size: '16px', lineHeight: '24px', weight: 400 },
    small: { size: '14px', lineHeight: '20px', weight: 400 },
    caption: { size: '12px', lineHeight: '18px', weight: 400 },
  },
} as const;

export const motion = {
  fadeIn: '240ms ease-out',
  glow: '2.4s ease-in-out infinite',
  float: '4s ease-in-out infinite',
  spin: '800ms linear infinite',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
