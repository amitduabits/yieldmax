// ==================== YIELDMAX DESIGN SYSTEM ====================

import { createGlobalStyle } from 'styled-components';

// ==================== DESIGN TOKENS ====================

export const designTokens = {
  // Color Palette - Professional dark theme with accent colors
  colors: {
    // Primary colors
    primary: {
      50: '#E8F5FF',
      100: '#D1EBFF',
      200: '#A3D7FF',
      300: '#75C3FF',
      400: '#47AFFF',
      500: '#199BFF', // Main brand blue
      600: '#007ACC',
      700: '#005999',
      800: '#003866',
      900: '#001733',
    },
    
    // Neutral colors for dark theme
    neutral: {
      50: '#FAFAFA',
      100: '#F4F4F5',
      200: '#E4E4E7',
      300: '#D4D4D8',
      400: '#A1A1AA',
      500: '#71717A',
      600: '#52525B',
      700: '#3F3F46',
      800: '#27272A',
      900: '#18181B',
      950: '#09090B', // Main background
    },
    
    // Semantic colors
    success: {
      light: '#4ADE80',
      main: '#22C55E',
      dark: '#16A34A',
      bg: 'rgba(34, 197, 94, 0.1)',
    },
    
    error: {
      light: '#F87171',
      main: '#EF4444',
      dark: '#DC2626',
      bg: 'rgba(239, 68, 68, 0.1)',
    },
    
    warning: {
      light: '#FDE047',
      main: '#EAB308',
      dark: '#CA8A04',
      bg: 'rgba(234, 179, 8, 0.1)',
    },
    
    info: {
      light: '#60A5FA',
      main: '#3B82F6',
      dark: '#2563EB',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
    
    // Glass morphism colors
    glass: {
      bg: 'rgba(255, 255, 255, 0.03)',
      bgHover: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.12)',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
    },
    
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.375rem',   // 6px
    base: '0.5rem',   // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    full: '9999px',
  },
  
  // Shadows for depth
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(25, 155, 255, 0.4)',
  },
  
  // Animation
  animation: {
    duration: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    modal: 30,
    popover: 40,
    tooltip: 50,
  },
};

// ==================== GLOBAL STYLES ====================

export const GlobalStyles = createGlobalStyle`
  /* CSS Reset and Base Styles */
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  * {
    margin: 0;
    padding: 0;
  }
  
  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  body {
    font-family: ${designTokens.typography.fontFamily.sans};
    font-size: ${designTokens.typography.fontSize.base};
    line-height: ${designTokens.typography.lineHeight.normal};
    color: ${designTokens.colors.neutral[100]};
    background-color: ${designTokens.colors.neutral[950]};
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }
  
  /* Background gradient */
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      ellipse at top left,
      rgba(25, 155, 255, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at bottom right,
      rgba(147, 51, 234, 0.1) 0%,
      transparent 50%
    );
    pointer-events: none;
    z-index: -1;
  }
  
  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    font-weight: ${designTokens.typography.fontWeight.semibold};
    line-height: ${designTokens.typography.lineHeight.tight};
    color: ${designTokens.colors.neutral[50]};
  }
  
  h1 { font-size: ${designTokens.typography.fontSize['5xl']}; }
  h2 { font-size: ${designTokens.typography.fontSize['4xl']}; }
  h3 { font-size: ${designTokens.typography.fontSize['3xl']}; }
  h4 { font-size: ${designTokens.typography.fontSize['2xl']}; }
  h5 { font-size: ${designTokens.typography.fontSize.xl}; }
  h6 { font-size: ${designTokens.typography.fontSize.lg}; }
  
  /* Links */
  a {
    color: ${designTokens.colors.primary[400]};
    text-decoration: none;
    transition: color ${designTokens.animation.duration.fast} ${designTokens.animation.easing.easeOut};
    
    &:hover {
      color: ${designTokens.colors.primary[300]};
    }
  }
  
  /* Code */
  code, pre {
    font-family: ${designTokens.typography.fontFamily.mono};
    font-size: ${designTokens.typography.fontSize.sm};
  }
  
  /* Selection */
  ::selection {
    background-color: ${designTokens.colors.primary[500]};
    color: ${designTokens.colors.neutral[50]};
  }
  
  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: ${designTokens.colors.neutral[900]};
  }
  
  ::-webkit-scrollbar-thumb {
    background: ${designTokens.colors.neutral[700]};
    border-radius: ${designTokens.borderRadius.full};
    
    &:hover {
      background: ${designTokens.colors.neutral[600]};
    }
  }
  
  /* Focus styles */
  :focus-visible {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: 2px;
  }
  
  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  /* Utility classes */
  .animate-fade-in {
    animation: fadeIn ${designTokens.animation.duration.slow} ${designTokens.animation.easing.easeOut};
  }
  
  .animate-slide-in {
    animation: slideIn ${designTokens.animation.duration.slow} ${designTokens.animation.easing.easeOut};
  }
  
  .animate-pulse {
    animation: pulse 2s ease-in-out infinite;
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  /* Glass morphism base */
  .glass {
    background: ${designTokens.colors.glass.bg};
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid ${designTokens.colors.glass.border};
    
    &:hover {
      background: ${designTokens.colors.glass.bgHover};
      border-color: ${designTokens.colors.glass.borderHover};
    }
  }
`;

// ==================== COMPONENT LIBRARY ====================

import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';

// ==================== BUTTON COMPONENTS ====================

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const ButtonBase = styled(motion.button)<ButtonProps>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${designTokens.spacing[2]};
  font-family: ${designTokens.typography.fontFamily.sans};
  font-weight: ${designTokens.typography.fontWeight.medium};
  border: none;
  cursor: pointer;
  transition: all ${designTokens.animation.duration.base} ${designTokens.animation.easing.easeOut};
  white-space: nowrap;
  user-select: none;
  
  ${({ fullWidth }) => fullWidth && css`
    width: 100%;
  `}
  
  ${({ disabled }) => disabled && css`
    opacity: 0.5;
    cursor: not-allowed;
  `}
  
  /* Size variants */
  ${({ size }) => {
    switch (size) {
      case 'sm':
        return css`
          padding: ${designTokens.spacing[2]} ${designTokens.spacing[3]};
          font-size: ${designTokens.typography.fontSize.sm};
          border-radius: ${designTokens.borderRadius.sm};
        `;
      case 'lg':
        return css`
          padding: ${designTokens.spacing[3]} ${designTokens.spacing[6]};
          font-size: ${designTokens.typography.fontSize.lg};
          border-radius: ${designTokens.borderRadius.md};
        `;
      default:
        return css`
          padding: ${designTokens.spacing[2]} ${designTokens.spacing[4]};
          font-size: ${designTokens.typography.fontSize.base};
          border-radius: ${designTokens.borderRadius.base};
        `;
    }
  }}
  
  /* Variant styles */
  ${({ variant }) => {
    switch (variant) {
      case 'primary':
        return css`
          background: ${designTokens.colors.primary[500]};
          color: white;
          box-shadow: 0 0 20px rgba(25, 155, 255, 0.3);
          
          &:hover:not(:disabled) {
            background: ${designTokens.colors.primary[600]};
            box-shadow: 0 0 30px rgba(25, 155, 255, 0.5);
            transform: translateY(-1px);
          }
          
          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;
      case 'secondary':
        return css`
          background: ${designTokens.colors.glass.bg};
          color: ${designTokens.colors.neutral[100]};
          border: 1px solid ${designTokens.colors.glass.border};
          backdrop-filter: blur(12px);
          
          &:hover:not(:disabled) {
            background: ${designTokens.colors.glass.bgHover};
            border-color: ${designTokens.colors.glass.borderHover};
            transform: translateY(-1px);
          }
        `;
      case 'ghost':
        return css`
          background: transparent;
          color: ${designTokens.colors.neutral[300]};
          
          &:hover:not(:disabled) {
            background: ${designTokens.colors.glass.bg};
            color: ${designTokens.colors.neutral[100]};
          }
        `;
      case 'danger':
        return css`
          background: ${designTokens.colors.error.bg};
          color: ${designTokens.colors.error.main};
          border: 1px solid ${designTokens.colors.error.main};
          
          &:hover:not(:disabled) {
            background: ${designTokens.colors.error.main};
            color: white;
          }
        `;
      default:
        return '';
    }
  }}
`;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, loading, icon, ...props }, ref) => {
    return (
      <ButtonBase
        ref={ref}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : icon}
        {children}
      </ButtonBase>
    );
  }
);

// ==================== CARD COMPONENTS ====================

interface CardProps {
  glass?: boolean;
  hover?: boolean;
  padding?: keyof typeof designTokens.spacing;
}

export const Card = styled(motion.div)<CardProps>`
  background: ${({ glass }) => glass 
    ? designTokens.colors.glass.bg 
    : designTokens.colors.neutral[900]};
  border-radius: ${designTokens.borderRadius.lg};
  border: 1px solid ${({ glass }) => glass 
    ? designTokens.colors.glass.border 
    : designTokens.colors.neutral[800]};
  padding: ${({ padding = 6 }) => designTokens.spacing[padding]};
  
  ${({ glass }) => glass && css`
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  `}
  
  ${({ hover }) => hover && css`
    cursor: pointer;
    transition: all ${designTokens.animation.duration.base} ${designTokens.animation.easing.easeOut};
    
    &:hover {
      background: ${glass 
        ? designTokens.colors.glass.bgHover 
        : designTokens.colors.neutral[800]};
      border-color: ${glass 
        ? designTokens.colors.glass.borderHover 
        : designTokens.colors.neutral[700]};
      transform: translateY(-2px);
      box-shadow: ${designTokens.shadows.lg};
    }
  `}
`;

// ==================== INPUT COMPONENTS ====================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${designTokens.spacing[2]};
`;

const InputLabel = styled.label`
  font-size: ${designTokens.typography.fontSize.sm};
  color: ${designTokens.colors.neutral[300]};
  font-weight: ${designTokens.typography.fontWeight.medium};
`;

const InputContainer = styled.div<{ hasError?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  background: ${designTokens.colors.glass.bg};
  border: 1px solid ${({ hasError }) => hasError 
    ? designTokens.colors.error.main 
    : designTokens.colors.glass.border};
  border-radius: ${designTokens.borderRadius.base};
  backdrop-filter: blur(12px);
  transition: all ${designTokens.animation.duration.base} ${designTokens.animation.easing.easeOut};
  
  &:focus-within {
    border-color: ${({ hasError }) => hasError 
      ? designTokens.colors.error.main 
      : designTokens.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ hasError }) => hasError 
      ? `${designTokens.colors.error.main}20` 
      : `${designTokens.colors.primary[500]}20`};
  }
`;

const InputField = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: ${designTokens.spacing[3]} ${designTokens.spacing[4]};
  font-size: ${designTokens.typography.fontSize.base};
  color: ${designTokens.colors.neutral[100]};
  
  &::placeholder {
    color: ${designTokens.colors.neutral[500]};
  }
`;

const InputError = styled.span`
  font-size: ${designTokens.typography.fontSize.sm};
  color: ${designTokens.colors.error.main};
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, suffix, ...props }, ref) => {
    return (
      <InputWrapper>
        {label && <InputLabel>{label}</InputLabel>}
        <InputContainer hasError={!!error}>
          {icon && <div style={{ paddingLeft: designTokens.spacing[4] }}>{icon}</div>}
          <InputField ref={ref} {...props} />
          {suffix && <div style={{ paddingRight: designTokens.spacing[4] }}>{suffix}</div>}
        </InputContainer>
        {error && <InputError>{error}</InputError>}
      </InputWrapper>
    );
  }
);

// ==================== BADGE COMPONENTS ====================

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const Badge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: ${designTokens.spacing[1]};
  padding: ${({ size = 'md' }) => size === 'sm' 
    ? `${designTokens.spacing[1]} ${designTokens.spacing[2]}` 
    : `${designTokens.spacing[1]} ${designTokens.spacing[3]}`};
  font-size: ${({ size = 'md' }) => size === 'sm' 
    ? designTokens.typography.fontSize.xs 
    : designTokens.typography.fontSize.sm};
  font-weight: ${designTokens.typography.fontWeight.medium};
  border-radius: ${designTokens.borderRadius.full};
  
  ${({ variant = 'default' }) => {
    switch (variant) {
      case 'success':
        return css`
          background: ${designTokens.colors.success.bg};
          color: ${designTokens.colors.success.main};
          border: 1px solid ${designTokens.colors.success.main}40;
        `;
      case 'error':
        return css`
          background: ${designTokens.colors.error.bg};
          color: ${designTokens.colors.error.main};
          border: 1px solid ${designTokens.colors.error.main}40;
        `;
      case 'warning':
        return css`
          background: ${designTokens.colors.warning.bg};
          color: ${designTokens.colors.warning.main};
          border: 1px solid ${designTokens.colors.warning.main}40;
        `;
      case 'info':
        return css`
          background: ${designTokens.colors.info.bg};
          color: ${designTokens.colors.info.main};
          border: 1px solid ${designTokens.colors.info.main}40;
        `;
      default:
        return css`
          background: ${designTokens.colors.glass.bg};
          color: ${designTokens.colors.neutral[300]};
          border: 1px solid ${designTokens.colors.glass.border};
        `;
    }
  }}
`;

// ==================== LOADING COMPONENTS ====================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const SpinnerWrapper = styled.div<SpinnerProps>`
  display: inline-flex;
  ${({ size = 'md' }) => {
    const sizes = { sm: '16px', md: '24px', lg: '32px' };
    return css`
      width: ${sizes[size]};
      height: ${sizes[size]};
    `;
  }}
`;

const SpinnerSvg = styled.svg`
  animation: ${designTokens.animation.duration.slower} linear infinite spin;
`;

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = designTokens.colors.primary[500] }) => {
  return (
    <SpinnerWrapper size={size}>
      <SpinnerSvg viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60"
          strokeDashoffset="15"
        />
      </SpinnerSvg>
    </SpinnerWrapper>
  );
};

// ==================== TOOLTIP COMPONENTS ====================

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const TooltipContent = styled(motion.div)<{ position: string }>`
  position: absolute;
  z-index: ${designTokens.zIndex.tooltip};
  padding: ${designTokens.spacing[2]} ${designTokens.spacing[3]};
  background: ${designTokens.colors.neutral[800]};
  color: ${designTokens.colors.neutral[100]};
  font-size: ${designTokens.typography.fontSize.sm};
  border-radius: ${designTokens.borderRadius.base};
  border: 1px solid ${designTokens.colors.neutral[700]};
  white-space: nowrap;
  pointer-events: none;
  
  ${({ position }) => {
    switch (position) {
      case 'top':
        return css`
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-8px);
        `;
      case 'right':
        return css`
          left: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(8px);
        `;
      case 'bottom':
        return css`
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(8px);
        `;
      case 'left':
        return css`
          right: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(-8px);
        `;
      default:
        return '';
    }
  }}
`;

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  return (
    <TooltipWrapper
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <TooltipContent
          position={position}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
        >
          {content}
        </TooltipContent>
      )}
    </TooltipWrapper>
  );
};

// ==================== MODAL COMPONENTS ====================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: ${designTokens.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${designTokens.spacing[4]};
`;

const ModalContent = styled(motion.div)<{ size: string }>`
  background: ${designTokens.colors.neutral[900]};
  border: 1px solid ${designTokens.colors.neutral[800]};
  border-radius: ${designTokens.borderRadius.xl};
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  
  ${({ size }) => {
    const sizes = {
      sm: '400px',
      md: '600px',
      lg: '800px'
    };
    return css`
      width: 100%;
      max-width: ${sizes[size] || sizes.md};
    `;
  }}
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${designTokens.spacing[6]};
  border-bottom: 1px solid ${designTokens.colors.neutral[800]};
`;

const ModalTitle = styled.h3`
  font-size: ${designTokens.typography.fontSize['2xl']};
  font-weight: ${designTokens.typography.fontWeight.semibold};
  color: ${designTokens.colors.neutral[50]};
`;

const ModalBody = styled.div`
  padding: ${designTokens.spacing[6]};
`;

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}) => {
  if (!isOpen) return null;
  
  return (
    <ModalOverlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <ModalContent
        size={size}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {title && (
          <ModalHeader>
            <ModalTitle>{title}</ModalTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </ModalHeader>
        )}
        <ModalBody>{children}</ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

// ==================== EXPORT ALL COMPONENTS ====================

export * from './components/Charts';
export * from './components/Tables';
export * from './components/Navigation';
export * from './components/Forms';
export * from './components/Animations';