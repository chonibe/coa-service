import React from 'react'
import { render, screen } from '@testing-library/react'
import { AddressModal } from './AddressModal'
import { useMobile } from '@/hooks/use-mobile'

jest.mock('@/hooks/use-mobile')
jest.mock('@/app/(store)/shop/experience-v2/ExperienceThemeContext', () => ({
  useExperienceTheme: () => ({ theme: 'light' }),
}))
jest.mock('@/lib/shop/useSaveAddressToAccount', () => ({
  useSaveAddressToAccount: () => ({
    saveShippingAddress: jest.fn(),
    saveBillingAddress: jest.fn(),
    addAddress: jest.fn(),
  }),
}))
jest.mock('@/lib/shop/useSavedAddresses', () => ({
  useSavedAddresses: () => ({ addresses: [] }),
}))
jest.mock('@/lib/shop/useShippingCountries', () => ({
  useShippingCountries: () => [{ code: 'US', name: 'United States' }],
}))
jest.mock('./GooglePlacesAddressInput', () => ({
  GooglePlacesAddressInput: (props: { id?: string }) => (
    <input id={props.id} data-testid="mock-google-places" readOnly aria-label="Street address" />
  ),
}))

const mockedUseMobile = useMobile as jest.MockedFunction<typeof useMobile>

function mockViewportWiderThanPhoneSheet() {
  const mql = {
    matches: false,
    media: '(max-width: 639px)',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }
  window.matchMedia = jest.fn().mockImplementation((query: string) =>
    query === '(max-width: 639px)' ? mql : { ...mql, matches: false, media: query }
  )
}

const initialWithExpandedAddress = {
  email: 'a@b.com',
  fullName: 'Jane Doe',
  country: 'US',
  addressLine1: '123 Main St',
  addressLine2: '',
  city: 'NYC',
  state: 'NY',
  postalCode: '10001',
  phoneCountryCode: '+1',
  phoneNumber: '',
}

describe('AddressModal phone input', () => {
  beforeEach(() => {
    mockViewportWiderThanPhoneSheet()
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/api/geo/country')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ country: 'US' }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
    }) as jest.Mock
  })

  it('uses type text on desktop to avoid system phone / Contacts picker', () => {
    mockedUseMobile.mockReturnValue(false)
    render(
      <AddressModal
        open
        onOpenChange={() => {}}
        onSave={() => {}}
        initialAddress={initialWithExpandedAddress}
        addressType="shipping"
      />
    )
    const phone = screen.getByTestId('address-phone')
    expect(phone).toHaveAttribute('type', 'text')
    expect(phone).toHaveAttribute('inputMode', 'tel')
  })

  it('uses type tel on mobile for telephone keyboard', () => {
    mockedUseMobile.mockReturnValue(true)
    render(
      <AddressModal
        open
        onOpenChange={() => {}}
        onSave={() => {}}
        initialAddress={initialWithExpandedAddress}
        addressType="shipping"
      />
    )
    const phone = screen.getByTestId('address-phone')
    expect(phone).toHaveAttribute('type', 'tel')
  })

  it('uses inline Select for country code when viewport is sm+ even if useMobile is true (640–767px gap)', () => {
    mockedUseMobile.mockReturnValue(true)
    mockViewportWiderThanPhoneSheet()
    render(
      <AddressModal
        open
        onOpenChange={() => {}}
        onSave={() => {}}
        initialAddress={initialWithExpandedAddress}
        addressType="shipping"
      />
    )
    expect(screen.queryByText('Phone country code')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Change phone country code' })
    ).not.toBeInTheDocument()
  })
})
