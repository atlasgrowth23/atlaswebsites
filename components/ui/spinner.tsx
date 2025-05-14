import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'white'
}

export function Spinner({ 
  className, 
  size = 'md', 
  color = 'primary',
  ...props 
}: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  }
  
  const colorClasses = {
    primary: 'border-primary/30 border-t-primary',
    secondary: 'border-secondary/30 border-t-secondary',
    white: 'border-white/30 border-t-white',
  }
  
  return (
    <div className={cn("animate-spin rounded-full", sizeClasses[size], colorClasses[color], className)} {...props}>
      <span className="sr-only">Loading...</span>
    </div>
  )
}