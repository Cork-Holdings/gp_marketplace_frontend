import type { Transition, Variants } from 'framer-motion';

/** Shared spring / easing constants for the GeePay Marketplace design system. */

export const easeSpring = [0.16, 1, 0.3, 1] as const;

export const springs = {
  /** Primary / secondary buttons */
  button: { type: 'spring', stiffness: 500, damping: 30 } satisfies Transition,
  /** Icon-only toolbar control */
  iconToolbar: { type: 'spring', stiffness: 500, damping: 30 } satisfies Transition,
  /** Labeled toolbar control */
  labeledToolbar: { type: 'spring', stiffness: 500, damping: 30 } satisfies Transition,
  /** Navigable card lift */
  card: { type: 'spring', stiffness: 400, damping: 28 } satisfies Transition,
  /** Inline table-row icon action */
  inlineIcon: { type: 'spring', stiffness: 600, damping: 32 } satisfies Transition,
  /** Selectable list / table row / sidebar nav */
  row: { type: 'spring', stiffness: 400, damping: 30 } satisfies Transition,
  /** Active pill (layoutId) */
  pill: { type: 'spring', stiffness: 400, damping: 28 } satisfies Transition,
  /** Count badge scale-in */
  badge: { type: 'spring', stiffness: 500, damping: 25 } satisfies Transition,
} as const;

export const hoverTap = {
  primaryButton: { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } },
  secondaryButton: { whileHover: { scale: 1.01 }, whileTap: { scale: 0.98 } },
  iconToolbar: { whileHover: { scale: 1.1 }, whileTap: { scale: 0.88 } },
  labeledToolbar: { whileHover: { scale: 1.04 }, whileTap: { scale: 0.94 } },
  card: { whileHover: { y: -3 }, whileTap: { scale: 0.99 } },
  inlineIcon: { whileHover: { scale: 1.15 }, whileTap: { scale: 0.85 } },
  row: { whileHover: { x: 2 } },
  sidebarNav: { whileHover: { x: 3 } },
} as const;

export const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.25, ease: easeSpring },
} as const;

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeSpring },
  },
};

/** Elevation levels for interactive chrome */
export const elevation = {
  0: 'bg-gray-50/80',
  1: 'bg-white shadow-sm',
  2: 'bg-white shadow-md',
  3: 'bg-white shadow-lg',
  4: 'bg-white shadow-2xl',
} as const;
