import React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
}

export function Tabs({ defaultValue, className, children, ...props }: TabsProps & React.HTMLAttributes<HTMLDivElement>) {
  const [value, setValue] = React.useState(defaultValue);
  
  return (
    <TabsContext.Provider value={{ value, onValueChange: setValue }}>
      <div className={cn("", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export function TabsList({ className, children, ...props }: TabsListProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex border-b border-gray-200 overflow-x-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps & React.HTMLAttributes<HTMLButtonElement>) {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isActive = selectedValue === value;
  
  return (
    <button
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap",
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps & React.HTMLAttributes<HTMLDivElement>) {
  const { value: selectedValue } = useTabsContext();
  const isActive = selectedValue === value;
  
  if (!isActive) {
    return null;
  }
  
  return (
    <div
      className={cn("mt-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}