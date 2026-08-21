/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

// Bloom-n-Breathe Design System Colors
// Based on HSL values from bloom design tokens

// Primary: HSL(152, 55%, 40%) - Teal/Green
const primaryColor = "#2d9d78";
const primaryLight = "#3eaf8f";
const primaryDark = "#1f7056";

// Background and Surfaces
const backgroundLight = "#f8fbf9"; // HSL(120, 20%, 98%)
const cardLight = "#ffffff"; // 0 0% 100%
const foregroundLight = "#1a2e29"; // HSL(160, 25%, 10%)
const mutedLight = "#ede9e6"; // HSL(120, 15%, 93%)
const borderLight = "#e0e7e3"; // HSL(120, 15%, 88%)

// Dark mode variants
const backgroundDark = "#0f1612"; // HSL(160, 20%, 6%)
const cardDark = "#192320"; // HSL(160, 20%, 10%)
const foregroundDark = "#ebe8e5"; // HSL(120, 15%, 92%)

// Risk colors
const riskLow = "#3db870"; // HSL(145, 60%, 45%)
const riskMedium = "#ffa500"; // HSL(35, 90%, 55%)
const riskHigh = "#dc2626"; // HSL(0, 72%, 55%)

export const Colors = {
  light: {
    // Primary colors
    primary: primaryColor,
    primaryLight: primaryLight,
    primaryDark: primaryDark,

    // Text and foreground
    text: foregroundLight,
    foreground: foregroundLight,
    background: backgroundLight,

    // Surface colors
    card: cardLight,
    muted: mutedLight,
    border: borderLight,

    // Interactive
    tint: primaryColor,
    icon: "#6b7280",
    tabIconDefault: "#9ca3af",
    tabIconSelected: primaryColor,

    // Status
    success: riskLow,
    warning: riskMedium,
    error: riskHigh,

    // Semantic
    destructive: riskHigh,
    accent: "#3eb8a8",
  },
  dark: {
    // Primary colors
    primary: "#4fb589",
    primaryLight: "#63c49f",
    primaryDark: "#2d9d78",

    // Text and foreground
    text: foregroundDark,
    foreground: foregroundDark,
    background: backgroundDark,

    // Surface colors
    card: cardDark,
    muted: "#1f2a25",
    border: "#293330",

    // Interactive
    tint: "#4fb589",
    icon: "#d1d5db",
    tabIconDefault: "#9ca3af",
    tabIconSelected: "#4fb589",

    // Status
    success: "#4fb589",
    warning: "#fbbf24",
    error: "#ef4444",

    // Semantic
    destructive: "#ef4444",
    accent: "#5eccbe",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
