import '@testing-library/jest-dom'

// Mock Web NFC API globally
Object.defineProperty(global, 'NDEFReader', {
  value: class NDEFReader {
    scan = jest.fn()
    write = jest.fn()
  },
  configurable: true
})

// Mock fetch globally
Object.defineProperty(global, 'fetch', {
  value: jest.fn(() => 
    Promise.resolve({
      json: () => Promise.resolve({ success: true })
    })
  ),
  configurable: true
})

// Suppress console errors during testing
console.error = jest.fn()
console.warn = jest.fn() 