// Animation variants for Framer Motion
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
}

export const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    y: 20,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
}

export const slideInFromRight = {
  hidden: { x: 20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    x: 20,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
}

export const scaleButton = {
  tap: {
    scale: 0.97,
    transition: { duration: 0.1, ease: [0.22, 1, 0.36, 1] },
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
}

export const cardHover = {
  rest: {
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
  hover: {
    scale: 1.02,
    y: -5,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
}

export const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
}
