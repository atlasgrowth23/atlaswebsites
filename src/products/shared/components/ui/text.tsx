import React from 'react';
import { cn } from '@/lib/utils';

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted' | 'accent' | 'success' | 'warning' | 'error';
  as?: 'p' | 'span' | 'div';
  align?: 'left' | 'center' | 'right' | 'justify';
}

export function Text({
  children,
  size = 'md',
  weight = 'normal',
  color = 'default',
  as: Component = 'p',
  align = 'left',
  className,
  ...props
}: TextProps) {
  const sizeClasses = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'md': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
  };

  const weightClasses = {
    'normal': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold',
  };

  const colorClasses = {
    'default': 'text-gray-900 dark:text-gray-100',
    'muted': 'text-gray-500 dark:text-gray-400',
    'accent': 'text-blue-600 dark:text-blue-400',
    'success': 'text-green-600 dark:text-green-400',
    'warning': 'text-yellow-600 dark:text-yellow-400',
    'error': 'text-red-600 dark:text-red-400',
  };

  const alignClasses = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right',
    'justify': 'text-justify',
  };

  return (
    <Component
      className={cn(
        'leading-relaxed',
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}