import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock global browser APIs
Object.defineProperty(window, 'NDEFReader', {
  value: jest.fn(),
  configurable: true,
  writable: true,
})

// Suppress specific warnings or errors
const originalConsoleError = console.error
console.error = (msg, ...args) => {
  if (
    msg.includes('Warning: An update inside a test was not wrapped in act') ||
    msg.includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return
  }
  originalConsoleError(msg, ...args)
} 