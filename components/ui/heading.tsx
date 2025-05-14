import React, { ElementType } from 'react';
import { cn } from '@/lib/utils';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  as?: ElementType;
  tracking?: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';
}

export function Heading({
  children,
  level = 2,
  size,
  weight = 'bold',
  as,
  tracking = 'normal',
  className,
  ...props
}: HeadingProps) {
  // Map level to default size if size is not provided
  const defaultSizeByLevel = {
    1: '4xl',
    2: '3xl',
    3: '2xl',
    4: 'xl',
    5: 'lg',
    6: 'md',
  };

  const finalSize = size || defaultSizeByLevel[level as 1 | 2 | 3 | 4 | 5 | 6];

  // Style maps
  const sizeClasses = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'md': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };

  const weightClasses = {
    'normal': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold',
  };

  const trackingClasses = {
    'tighter': 'tracking-tighter',
    'tight': 'tracking-tight',
    'normal': 'tracking-normal',
    'wide': 'tracking-wide',
    'wider': 'tracking-wider',
    'widest': 'tracking-widest',
  };

  // Determine the HTML element to render
  const Component = as || (`h${level}` as ElementType);

  return (
    <Component
      className={cn(
        sizeClasses[finalSize as keyof typeof sizeClasses],
        weightClasses[weight],
        trackingClasses[tracking],
        'leading-tight',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}