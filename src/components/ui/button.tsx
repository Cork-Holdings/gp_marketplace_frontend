import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';

import { cn } from '@/lib/utils';
import { hoverTap, springs } from '@/lib/motion';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-sans font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      variant: {
        // Flat cobalt — use bg-primary (proven HSL token), not gradient
        primary: 'bg-primary text-primary-foreground shadow-btn-flat hover:bg-cobalt-dark',
        secondary: 'border border-border bg-background text-foreground hover:bg-muted',
        danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        ghost: 'text-muted-foreground shadow-none hover:bg-muted hover:text-foreground',
      },
      size: {
        sm: 'min-h-[40px] px-3 py-2 text-xs',
        md: 'min-h-[44px] px-4 py-2.5 text-sm',
        lg: 'min-h-[48px] px-6 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'
    >,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Disable spring hover/tap (e.g. inside tight table cells) */
  disableMotion?: boolean;
}

const MotionButton = motion.button;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      type = 'button',
      disableMotion = false,
      disabled,
      ...props
    },
    ref,
  ) => {
    const reducedMotion = useReducedMotion();
    const classes = cn(buttonVariants({ variant, size }), className);

    if (asChild) {
      return <Slot className={classes} ref={ref} {...props} />;
    }

    if (disableMotion || disabled || reducedMotion) {
      return (
        <button ref={ref} type={type} disabled={disabled} className={classes} {...props} />
      );
    }

    const springProps =
      variant === 'secondary' || variant === 'ghost'
        ? hoverTap.secondaryButton
        : hoverTap.primaryButton;

    return (
      <MotionButton
        ref={ref}
        type={type}
        disabled={disabled}
        className={classes}
        whileHover={springProps.whileHover}
        whileTap={springProps.whileTap}
        transition={springs.button}
        {...(props as HTMLMotionProps<'button'>)}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
export default Button;
