// /config/premiumTheme.ts
// Système de Design Premium Multi-Plateforme (iOS / Android / Web)

import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const PremiumTheme = {
  // Couleurs pour les gradients (utilisées avec LinearGradient)
  gradients: {
    primary: {
      colors: ['#4F46E5', '#7C3AED'], // Indigo/Violet plus subtil et élégant
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    secondary: {
      colors: ['#EC4899', '#8B5CF6'], // Rose/Violet sophistiqué
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    success: {
      colors: ['#10B981', '#059669'], // Vert moderne et clair
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    gold: {
      colors: ['#F59E0B', '#D97706'], // Or mat (pas bling-bling)
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    silver: {
      colors: ['#E5E7EB', '#D1D5DB'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    bronze: {
      colors: ['#F59E0B', '#D97706'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    module: {
      colors: ['#4F46E5', '#7C3AED'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    speedDrill: {
      colors: ['#F59E0B', '#EF4444'], // Orange/Rouge pour urgence
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
  },

  // Couleurs solides (fallback)
  colors: {
    primary: '#4F46E5', // Indigo moderne
    primaryDark: '#4338CA',
    secondary: '#EC4899',
    secondaryDark: '#DB2777',
    success: '#10B981',
    successDark: '#059669',
    gold: '#F59E0B', // Or mat
    silver: '#9CA3AF',
    bronze: '#D97706',
    
    // Couleurs existantes préservées
    blue: '#4F46E5',
    green: '#10B981',
    orange: '#F59E0B',
    red: '#EF4444',
    gray: '#6B7280',
    lightGray: '#F9FAFB',
    darkGray: '#111827', // Presque noir pour meilleur contraste
    white: '#FFFFFF',
  },

  // Ombres adaptatives (Web vs Mobile)
  shadows: {
    none: isWeb
      ? {}
      : {
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        },
    
    soft: isWeb
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 3,
        },
    
    medium: isWeb
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
        }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 8,
        },
    
    elevated: isWeb
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.15,
          shadowRadius: 30,
        }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.18,
          shadowRadius: 30,
          elevation: 15,
        },
    
    glow: (color: string) => isWeb
      ? {
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 15,
        }
      : {
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 15,
          elevation: 10,
        },
  },

  // Bordures arrondies généreuses
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 20,
    xxlarge: 25,
    round: 9999,
  },

  // Spacing système (pour cohérence)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Typographie (Web: fonts customs, Mobile: System optimisé)
  typography: {
    fontFamily: {
      display: isWeb ? 'Poppins, system-ui, -apple-system, sans-serif' : 'System',
      body: isWeb ? 'Inter, system-ui, -apple-system, sans-serif' : 'System',
      mono: isWeb ? 'monospace' : Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 28,
      display: isWeb ? 34 : 26,
    },
    fontWeight: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
    },
  },

  // Timing des animations (millisecondes)
  animation: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },

  // Easing curves (pour Animated API)
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// Helper pour créer des styles de carte premium
export const createPremiumCardStyle = (options: {
  borderColor?: string;
  isCompleted?: boolean;
  isLocked?: boolean;
} = {}) => {
  const { borderColor = PremiumTheme.colors.primary, isCompleted = false, isLocked = false } = options;
  
  return {
    backgroundColor: isLocked ? '#F9FAFB' : PremiumTheme.colors.white,
    borderRadius: PremiumTheme.borderRadius.xlarge,
    padding: PremiumTheme.spacing.xl,
    borderLeftWidth: 5,
    borderLeftColor: isCompleted ? PremiumTheme.colors.green : isLocked ? PremiumTheme.colors.gray : borderColor,
    opacity: isLocked ? 0.7 : 1,
    ...PremiumTheme.shadows.medium,
  };
};

// Helper pour créer des styles de bouton premium
export const createPremiumButtonStyle = (variant: 'primary' | 'secondary' | 'success' | 'danger' = 'primary') => {
  const colors: Record<string, string[]> = {
    primary: PremiumTheme.gradients.primary.colors,
    secondary: PremiumTheme.gradients.secondary.colors,
    success: [PremiumTheme.colors.green, '#059669'],
    danger: [PremiumTheme.colors.red, '#DC2626'],
  };

  return {
    borderRadius: PremiumTheme.borderRadius.large,
    paddingVertical: PremiumTheme.spacing.md,
    paddingHorizontal: PremiumTheme.spacing.xl,
    ...PremiumTheme.shadows.soft,
    colors: colors[variant],
  };
};

export default PremiumTheme;

