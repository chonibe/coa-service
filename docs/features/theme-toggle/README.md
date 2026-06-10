# Site-wide Light/Dark Theme Toggle

**Version:** 1.0.0 · **Last updated:** 2026-06-10

## Overview

The site now supports both light and dark modes everywhere, with **dark as the
default** for new visitors. A sun/moon toggle in the footer switches the theme;
the choice is persisted by `next-themes` (localStorage `theme` key) and applied
as a `dark` class on `<html>` (Tailwind `darkMode: ["class"]`).

## Implementation

| Concern | File |
|---|---|
| Provider config (default dark, class attribute) | [`app/layout.tsx`](../../../app/layout.tsx) |
| next-themes wrapper | [`components/theme-provider.tsx`](../../../components/theme-provider.tsx) |
| Toggle button (footer) | [`components/theme/ThemeToggle.tsx`](../../../components/theme/ThemeToggle.tsx) |
| Footer integration | [`components/impact/Footer.tsx`](../../../components/impact/Footer.tsx) |
| Theme-aware store shell backgrounds | [`app/(store)/layout.tsx`](../../../app/(store)/layout.tsx) |
| Experience pages adapter (delegates to global theme) | [`app/(store)/shop/experience-v2/ExperienceThemeContext.tsx`](../../../app/(store)/shop/experience-v2/ExperienceThemeContext.tsx) |
| Light tokens (`:root`) and dark tokens (`.dark`) | [`app/globals.css`](../../../app/globals.css) |

### How it works

1. `app/layout.tsx` renders `ThemeProvider` with
   `attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange`.
   The previous `forcedTheme="light"` was removed — that prop had disabled all
   theme switching.
2. `ThemeToggle` calls `useTheme()` and flips between `light`/`dark`. It is
   hydration-safe: it renders the moon icon until mounted (matching the dark
   default) so SSR and client markup agree.
3. `ExperienceThemeProvider` (used on `/shop/experience*`) no longer keeps its
   own localStorage key (`experience-theme`) or a local `.dark` wrapper div; it
   is a thin adapter over the global theme, so the experience in-page toggle
   and the footer toggle stay in sync.
4. The store shell in `app/(store)/layout.tsx` uses
   `bg-background dark:bg-[#171515]` so landing/home-v2 shells follow the theme.

## UI/UX considerations

- Toggle lives in the footer bottom bar next to the copyright line, styled to
  the footer's peach-on-maroon palette, 44×44px touch target, `aria-label`.
- No system-preference syncing (`enableSystem={false}`) — explicit dark default
  per product decision.

## Testing

- Manual: load any page fresh (cleared localStorage) → dark; click footer
  toggle → light tokens apply; reload → choice persists; `/shop/experience`
  toggle and footer toggle stay in sync; no hydration warnings in console.
- No automated test files for this feature (pure presentation toggle).

## Known limitations

- ~69 components hard-code dark hex colors (home-v2 sections, street-collector
  hero, some blog visuals). These remain dark in light mode until each is
  refactored to dual-theme styling (Phase 2).
- The footer itself keeps its maroon brand styling in both modes by design.

## Future improvements

- Phase 2: convert hard-coded dark sections to token/`dark:`-based styling.
- Optional: `enableSystem` to follow OS preference for first-time visitors.

## Changelog

- **1.0.0 (2026-06-10):** Initial release — un-forced light theme, dark
  default, footer toggle, experience theme adapter, theme-aware store shell.
