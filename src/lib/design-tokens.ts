/**
 * Design tokens for quotation preview and PDF export
 * Single source of truth for colors, spacing, and typography
 *
 * Usage:
 * - PDF (quotation-document.tsx): Import and use COLORS directly
 * - Preview (quotation-preview.tsx): Use corresponding Tailwind classes
 */

export const COLORS = {
  accent: '#1e293b',      // slate-800 - titles, headers
  text: '#111827',        // gray-900 - primary text
  textMedium: '#374151',  // gray-700 - secondary text
  textLight: '#4b5563',   // gray-600 - tertiary text
  muted: '#6b7280',       // gray-500 - labels, muted text
  placeholder: '#9ca3af', // gray-400 - placeholders
  border: '#e5e7eb',      // gray-200 - borders
  bgAlt: '#f9fafb',       // gray-50 - alternate background
  white: '#ffffff',       // white - primary background
} as const

export const FONT_SIZE = {
  xs: 7,      // tiny labels
  sm: 8,      // small text
  base: 9,    // body text
  md: 10,     // medium text
  lg: 11,     // large text
  xl: 14,     // extra large
  xxl: 24,    // title
} as const

export const SPACING = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
} as const
