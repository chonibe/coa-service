import React from 'react'
import { render, screen } from '@testing-library/react'
import { EnhancedCertificateModal } from '../enhanced-certificate-modal'

describe('EnhancedCertificateModal', () => {
  const mockArtwork = {
    id: '1',
    name: 'Test Artwork',
    artist: 'Test Artist',
    editionNumber: 1,
    totalEdition: 10,
    imageUrl: 'https://example.com/image.jpg',
    description: 'A test artwork description',
    nfcTagId: 'test-nfc-tag',
    nfcClaimedAt: '2023-06-17T00:00:00Z'
  }

  it('renders the modal when artwork is provided', () => {
    render(
      <EnhancedCertificateModal 
        artwork={mockArtwork} 
        onClose={() => {}} 
      />
    )

    // Check for key artwork details
    const artworkTitles = screen.queryAllByText('Test Artwork')
    expect(artworkTitles.length).toBeGreaterThan(0)

    const artistNames = screen.queryAllByText('Test Artist')
    expect(artistNames.length).toBeGreaterThan(0)

    const editionTexts = screen.queryAllByText(/Edition 1\/10/)
    expect(editionTexts.length).toBeGreaterThan(0)
  })

  it('does not render when no artwork is provided', () => {
    const { container } = render(
      <EnhancedCertificateModal 
        artwork={null} 
        onClose={() => {}} 
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('displays NFC authentication status', () => {
    render(
      <EnhancedCertificateModal 
        artwork={mockArtwork} 
        onClose={() => {}} 
      />
    )

    const authenticatedTexts = screen.queryAllByText('Authenticated')
    expect(authenticatedTexts.length).toBeGreaterThan(0)
  })
}) 