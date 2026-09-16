import { StyleSheet } from 'react-native';

function encode(x: number) {
  const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, v)) * 255);
}

export function oklch(l: number, c: number, h: number, alpha = 1) {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const lp = Math.pow(l + 0.3963377774 * a + 0.2158037573 * b, 3);
  const mp = Math.pow(l - 0.1055613458 * a - 0.0638541728 * b, 3);
  const sp = Math.pow(l - 0.0894841775 * a - 1.291485548 * b, 3);
  const r = encode(4.0767416621 * lp - 3.3077115913 * mp + 0.2309699292 * sp);
  const g = encode(-1.2684380046 * lp + 2.6097574011 * mp - 0.3413193965 * sp);
  const bl = encode(-0.0041960863 * lp - 0.7034186147 * mp + 1.707614701 * sp);
  return alpha >= 1 ? `rgb(${r}, ${g}, ${bl})` : `rgba(${r}, ${g}, ${bl}, ${alpha})`;
}

export const color = {
  bg: oklch(0.15, 0, 0),
  surface: oklch(0.2, 0, 0),
  raised: oklch(0.25, 0, 0),
  line: oklch(0.31, 0, 0),
  ink: oklch(0.96, 0, 0),
  muted: oklch(0.72, 0, 0),
  faint: oklch(0.62, 0, 0),
  primary: oklch(0.58, 0.21, 10),
  primaryPressed: oklch(0.51, 0.19, 10),
  primaryInk: oklch(0.74, 0.16, 10),
  primarySoft: oklch(0.58, 0.21, 10, 0.16),
  accent: oklch(0.86, 0.06, 220),
  onPrimary: oklch(1, 0, 0),
  scrim: oklch(0.15, 0, 0, 0.92),
};

export const accountHues = [20, 70, 140, 200, 260, 320];

export function accountColor(hue: number) {
  return oklch(0.8, 0.12, accountHues[hue % accountHues.length]);
}

export function accountSoft(hue: number) {
  return oklch(0.8, 0.12, accountHues[hue % accountHues.length], 0.14);
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };

export const font = StyleSheet.create({
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  label: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  heading: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.5 },
  tabular: { fontVariant: ['tabular-nums'] },
});
