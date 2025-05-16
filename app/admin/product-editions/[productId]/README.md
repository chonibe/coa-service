# Product Editions Management

## Feature Overview
The Product Editions Management feature allows administrators to manage the status and edition numbers of line items for each product. This includes the ability to toggle the active/removed status of editions and automatically resequence edition numbers when needed.

## Technical Implementation

### Status Toggle Component
The `StatusToggle` component (`StatusToggle.tsx`) provides the following functionality:
- Toggle switch to change edition status between "active" and "removed"
- Visual feedback with color indicators (green for active, red for removed)
- Tooltip showing active and total edition counts
- Confirmation dialog for status changes
- Prevention of removing the last active edition

### API Integration
The status toggle functionality is integrated with the following API endpoints:
- `POST /api/update-line-item-status`: Updates the status of a line item and handles edition resequencing
- Parameters:
  - `lineItemId`: ID of the line item to update
  - `orderId`: ID of the associated order
  - `status`: New status ("active" or "removed")

### Database Operations
When a status change occurs:
1. The line item's status is updated in the database
2. If the status is changed to "removed":
   - Remaining active editions are fetched
   - Edition numbers are resequenced to maintain continuity
   - Updates are performed in a transaction to ensure data consistency

## UI/UX Considerations
- Clear visual feedback for current status
- Confirmation dialog to prevent accidental changes
- Tooltip showing edition counts for context
- Disabled state for last active edition to prevent removal
- Error handling with toast notifications

## Testing Requirements
1. Status Toggle Functionality:
   - Toggle between active and removed states
   - Verify color changes
   - Check tooltip information
   - Test confirmation dialog

2. Edition Resequencing:
   - Remove an edition and verify resequencing
   - Check that last active edition cannot be removed
   - Verify edition numbers remain sequential

3. Error Handling:
   - Test network error scenarios
   - Verify error messages
   - Check state recovery after errors

## Known Limitations
- Edition numbers are resequenced only when an edition is removed
- The last active edition cannot be removed
- Status changes require a page refresh to update the list

## Future Improvements
1. Real-time Updates:
   - Implement WebSocket for live status updates
   - Remove need for page refresh

2. Enhanced Validation:
   - Add more sophisticated validation rules
   - Implement batch status updates

3. UI Enhancements:
   - Add animation for status changes
   - Implement drag-and-drop for manual resequencing
   - Add bulk status update functionality

## Deployment Considerations
- Ensure database transactions are properly handled
- Monitor performance during edition resequencing
- Implement proper error logging
- Consider adding rate limiting for status updates 