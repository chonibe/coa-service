/**
 * Impact Theme Components
 * 
 * A complete component library matching the Shopify Impact theme design system.
 * These components ensure pixel-perfect visual fidelity when migrating
 * the storefront to Next.js.
 */

// UI Components
export { Button, buttonVariants } from './Button'
export type { ButtonProps } from './Button'

export { Input, Textarea, Select, inputVariants, textareaVariants } from './Input'
export type { InputProps, TextareaProps, SelectProps } from './Input'

export { Badge, ProductBadge, StatusBadge, badgeVariants } from './Badge'
export type { BadgeProps, ProductBadgeProps, StatusBadgeProps } from './Badge'

export { Card, CardHeader, CardContent, CardFooter, CardImage, ProductCard, cardVariants } from './Card'
export type { CardProps, CardHeaderProps, CardImageProps, ProductCardProps } from './Card'

// Layout Components
export { SectionWrapper, SectionHeader, SectionDivider, sectionVariants } from './SectionWrapper'
export type { SectionWrapperProps, SectionHeaderProps, SectionDividerProps } from './SectionWrapper'

export { Container, GridContainer, FlexContainer, Stack, Inline, containerVariants } from './Container'
export type { ContainerProps, GridContainerProps, FlexContainerProps, StackProps, InlineProps } from './Container'

export { EmptyState, LoadingState, NoArticlesFound, NoResultsFound, PageNotFound } from './EmptyState'
export type { EmptyStateProps, LoadingStateProps } from './EmptyState'

export { Header, AnnouncementBar } from './Header'
export type { HeaderProps, NavItem, AnnouncementBarProps } from './Header'

export { ScrollingAnnouncementBar, defaultAnnouncementMessages } from './ScrollingAnnouncementBar'
export type { ScrollingAnnouncementBarProps } from './ScrollingAnnouncementBar'

export { Footer, SimpleFooter } from './Footer'
export type { FooterProps, FooterLink, FooterSection, SocialLink, SimpleFooterProps } from './Footer'

export { CartDrawer, MiniCart } from './CartDrawer'
export type { CartDrawerProps, MiniCartProps } from './CartDrawer'

export { SearchDrawer } from './SearchDrawer'
export type { SearchDrawerProps, SearchResult } from './SearchDrawer'

export { MobileMenuDrawer } from './MobileMenuDrawer'
export type { MobileMenuDrawerProps } from './MobileMenuDrawer'

export { Toast, ToastContainer, useToast } from './Toast'
export type { ToastProps, ToastContainerProps } from './Toast'
