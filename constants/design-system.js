/**
 * Modern Design System for Prenatal Care App
 * Healthcare-focused, clean, and accessible design
 */

export const colors = {
  // Primary Colors - Medical Blue
  primary: "#0284c7", // Sky Blue
  primaryDark: "#0369a1",
  primaryLight: "#0ea5e9",

  // Secondary Colors - Supportive Teal
  secondary: "#14b8a6", // Teal
  secondaryLight: "#2dd4bf",

  // Status Colors
  success: "#10b981", // Emerald Green
  warning: "#f59e0b", // Amber
  error: "#ef4444", // Red
  info: "#3b82f6", // Blue

  // Neutral Colors
  background: "#ffffff",
  surface: "#f8fafc",
  border: "#e2e8f0",

  // Text Colors
  text: {
    primary: "#1a3a52", // Deep Navy
    secondary: "#64748b", // Slate
    tertiary: "#94a3b8", // Light Slate
    inverse: "#ffffff",
  },

  // Semantic Colors for Health
  healthGood: "#10b981",
  healthWarning: "#f59e0b",
  healthCritical: "#ef4444",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const typography = {
  h1: {
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
    letterSpacing: 0,
  },
  h5: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
    letterSpacing: 0,
  },
  h6: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0.4,
  },
};

export const commonStyles = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.md,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text.primary,
  },
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
};

// Healthcare-specific colors
export const healthIndicators = {
  lowRisk: {
    color: colors.healthGood,
    backgroundColor: "#d1fae5",
    borderColor: "#6ee7b7",
  },
  mediumRisk: {
    color: colors.healthWarning,
    backgroundColor: "#fef3c7",
    borderColor: "#fcd34d",
  },
  highRisk: {
    color: colors.healthCritical,
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
  },
  neutral: {
    color: colors.text.secondary,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  commonStyles,
  healthIndicators,
};
