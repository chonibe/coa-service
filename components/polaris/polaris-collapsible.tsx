"use client";

import React from "react";

export interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open = false, onOpenChange, children, className = "" }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open);

    React.useEffect(() => {
      setIsOpen(open);
    }, [open]);

    const handleToggle = () => {
      const newState = !isOpen;
      setIsOpen(newState);
      onOpenChange?.(newState);
    };

    return (
      <div ref={ref} className={className} data-state={isOpen ? "open" : "closed"}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              isOpen,
              onToggle: handleToggle
            });
          }
          return child;
        })}
      </div>
    );
  }
);

Collapsible.displayName = "Collapsible";

export interface CollapsibleTriggerProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ children, className = "", isOpen, onToggle }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`cursor-pointer ${className}`}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        {children}
      </button>
    );
  }
);

CollapsibleTrigger.displayName = "CollapsibleTrigger";

export interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}

export const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ children, className = "", isOpen }, ref) => {
    return (
      <div
        ref={ref}
        className={`overflow-hidden transition-all ${isOpen ? 'block' : 'hidden'} ${className}`}
        data-state={isOpen ? "open" : "closed"}
      >
        {children}
      </div>
    );
  }
);

CollapsibleContent.displayName = "CollapsibleContent";
