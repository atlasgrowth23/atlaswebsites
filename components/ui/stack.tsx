import React from 'react';
import { cn } from '@/lib/utils';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
}

export function Stack({
  children,
  spacing = 'md',
  direction = 'column',
  align = 'start',
  justify = 'start',
  wrap = false,
  className,
  ...props
}: StackProps) {
  const spacingClasses = {
    none: direction === 'column' ? '' : '',
    xs: direction === 'column' ? 'space-y-1' : 'space-x-1',
    sm: direction === 'column' ? 'space-y-2' : 'space-x-2',
    md: direction === 'column' ? 'space-y-4' : 'space-x-4',
    lg: direction === 'column' ? 'space-y-6' : 'space-x-6',
    xl: direction === 'column' ? 'space-y-8' : 'space-x-8',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  return (
    <div
      className={cn(
        'flex',
        direction === 'column' ? 'flex-col' : 'flex-row',
        spacingClasses[spacing],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}