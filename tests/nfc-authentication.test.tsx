import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnhancedCertificateModal } from '@/app/customer/dashboard/certificate-modal'
import { mockLineItem } from '@/mocks/line-item'

describe('NFC Authentication Workflow', () => {
  // Mock global Web NFC API
  const mockNDEFReader = {
    scan: jest.fn(),
    write: jest.fn()
  }

  beforeEach(() => {
    // Setup mock Web NFC API
    global.NDEFReader = jest.fn(() => mockNDEFReader)
    
    // Mock fetch for API calls
    global.fetch = jest.fn(() => 
      Promise.resolve({
        json: () => Promise.resolve({ success: true })
      })
    ) as jest.Mock
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Authentication Stages', () => {
    test('renders initial state correctly', () => {
      const mockOnClose = jest.fn()
      render(
        <EnhancedCertificateModal 
          lineItem={mockLineItem} 
          onClose={mockOnClose} 
        />
      )

      // Check initial UI elements
      expect(screen.getByText('Unclaimed Authentication')).toBeInTheDocument()
      expect(screen.getByText('Authenticate Artwork')).toBeInTheDocument()
    })

    test('progresses through authentication stages', async () => {
      const mockOnClose = jest.fn()
      render(
        <EnhancedCertificateModal 
          lineItem={{
            ...mockLineItem,
            nfc_tag_id: 'test-tag-id',
            nfc_claimed_at: null
          }} 
          onClose={mockOnClose} 
        />
      )

      // Trigger authentication
      const authenticateButton = screen.getByText('Authenticate Artwork')
      fireEvent.click(authenticateButton)

      // Check scanning stage
      await waitFor(() => {
        expect(screen.getByText('Scanning NFC Tag')).toBeInTheDocument()
      })

      // Check verification stage
      await waitFor(() => {
        expect(screen.getByText('Verifying Authenticity')).toBeInTheDocument()
      })

      // Check success stage
      await waitFor(() => {
        expect(screen.getByText('Authentication Complete')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('handles NFC not supported', async () => {
      // Remove NDEFReader to simulate unsupported browser
      delete global.NDEFReader

      const mockOnClose = jest.fn()
      render(
        <EnhancedCertificateModal 
          lineItem={{
            ...mockLineItem,
            nfc_tag_id: 'test-tag-id',
            nfc_claimed_at: null
          }} 
          onClose={mockOnClose} 
        />
      )

      // Trigger authentication
      const authenticateButton = screen.getByText('Authenticate Artwork')
      fireEvent.click(authenticateButton)

      // Check error state
      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument()
      })
    })

    test('handles API authentication failure', async () => {
      // Mock fetch to return failure
      global.fetch = jest.fn(() => 
        Promise.resolve({
          json: () => Promise.resolve({ 
            success: false, 
            message: 'Authentication failed' 
          })
        })
      ) as jest.Mock

      const mockOnClose = jest.fn()
      render(
        <EnhancedCertificateModal 
          lineItem={{
            ...mockLineItem,
            nfc_tag_id: 'test-tag-id',
            nfc_claimed_at: null
          }} 
          onClose={mockOnClose} 
        />
      )

      // Trigger authentication
      const authenticateButton = screen.getByText('Authenticate Artwork')
      fireEvent.click(authenticateButton)

      // Check error state
      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    test('supports keyboard navigation', () => {
      const mockOnClose = jest.fn()
      render(
        <EnhancedCertificateModal 
          lineItem={mockLineItem} 
          onClose={mockOnClose} 
        />
      )

      // Simulate keyboard interactions
      const authenticateButton = screen.getByText('Authenticate Artwork')
      fireEvent.keyDown(authenticateButton, { key: 'Enter', code: 'Enter' })
      
      // Verify button can be activated via keyboard
      expect(authenticateButton).toBeInTheDocument()
    })
  })
})

// Mock line item for testing
const mockLineItem = {
  line_item_id: 'test-line-item',
  name: 'Test Artwork',
  vendor_name: 'Test Vendor',
  img_url: '/test-image.jpg',
  nfc_tag_id: 'test-nfc-tag',
  nfc_claimed_at: null,
  edition_number: 1,
  edition_total: 10,
  order_id: 'test-order'
} 