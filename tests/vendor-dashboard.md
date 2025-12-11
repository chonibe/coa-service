## Vendor Dashboard Manual Test Plan

### Scope
- Navigation collapse/unread badges
- Dashboard metrics/time ranges/banking
- Payouts refresh and pending items
- Analytics USD formatting and loading states
- Profile dirty guard and link copy/preview
- Products drag/drop ordering and open-box pagination/search

### Preconditions
- Vendor user logged in with sample data (orders, payouts, series/artworks).

### Test Cases
1) **Sidebar collapse & badges**
   - Toggle collapse/expand on desktop; state persists on reload.
   - Verify unread badges show on messages/notifications in header, sidebar, and mobile nav.
2) **Pull-to-refresh guard**
   - Start editing profile form; attempt pull-to-refresh. Expect refresh blocked, no data loss.
3) **Dashboard metrics & time range (USD)**
   - Switch ranges 7d/30d/90d/custom; metrics update, last-updated shown; trends stay in USD.
   - Simulate analytics error (e.g., block `/api/vendor/sales-analytics`); stats still render, error banner appears with retry.
4) **Banking widget**
   - If collector identifier missing, see retry + contact support CTA; retry fetch works when API recovers.
5) **Payouts**
   - Manual refresh updates last-updated; visibility toggle (tab hide/show) pauses/resumes auto refresh.
   - Pending items error path shows retry; filters pills show applied status/date/search.
6) **Analytics**
   - Metrics skeletons shown while loading; charts show empty states when no data.
   - Product performance uses USD formatting; export CSV still available when history exists.
7) **Profile**
   - Edit fields sets dirty badge; save clears dirty and updates last saved; cancel resets changes; copy/preview link opens correct URL.
8) **Products**
   - Drag/drop within series and to open box shows “Saving ordering…” badge; errors toast.
   - Available artworks search filters open box; pagination buttons change visible items; count reflects filtered total.

### Expected Results
- No page reloads during pull-to-refresh when forms are dirty.
- All currency displays remain USD.
- Errors are localized with retry buttons; main data remains visible where applicable.

