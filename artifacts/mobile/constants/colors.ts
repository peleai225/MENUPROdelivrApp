/**
 * MenuPro Delivery design tokens.
 *
 * Brand palette: vivid orange primary (Wave/Glovo-style food delivery),
 * deep slate secondary, warm off-white surfaces.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#1e293b',
    tint: '#f97316',

    // Core surfaces
    background: '#ffffff',
    foreground: '#1e293b',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#1e293b',

    // Primary action color (buttons, links, active states)
    primary: '#f97316',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#1e293b',
    secondaryForeground: '#ffffff',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#f8fafc',
    mutedForeground: '#64748b',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#fff1e2',
    accentForeground: '#c2410c',

    // Destructive actions (delete, error states)
    destructive: '#dc2626',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#e7eaf0',
    input: '#e7eaf0',

    // Extra semantic tokens used across MenuPro screens
    surface: '#f8fafc',
    success: '#16a34a',
    successSoft: '#e9f8ee',
    warning: '#f59e0b',
    warningSoft: '#fef3e0',
    info: '#7c3aed',
    infoSoft: '#f2ecfd',
  },

  dark: {
    text: '#f1f5f9',
    tint: '#fb923c',

    background: '#0f172a',
    foreground: '#f1f5f9',

    card: '#1e293b',
    cardForeground: '#f1f5f9',

    primary: '#fb923c',
    primaryForeground: '#ffffff',

    secondary: '#e2e8f0',
    secondaryForeground: '#0f172a',

    muted: '#1e293b',
    mutedForeground: '#94a3b8',

    accent: '#431407',
    accentForeground: '#fdba74',

    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    border: '#334155',
    input: '#334155',

    surface: '#1e293b',
    success: '#22c55e',
    successSoft: '#052e16',
    warning: '#f59e0b',
    warningSoft: '#451a03',
    info: '#a78bfa',
    infoSoft: '#2e1065',
  },

  // Border radius (in px): rounded-2xl cards ≈ 20px, pill buttons handled separately.
  radius: 20,
};

export default colors;
