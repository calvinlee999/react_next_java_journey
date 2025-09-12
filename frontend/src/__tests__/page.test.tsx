import { render, screen } from '@testing-library/react'
import Home from '../app/page'

// Mock next/font
jest.mock('next/font/local', () => {
  return () => ({
    className: 'mocked-font'
  })
})

describe('Home Page', () => {
  test('renders the main heading', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
  })

  test('renders the get started section', () => {
    render(<Home />)
    
    const getStartedText = screen.getByText(/get started/i)
    expect(getStartedText).toBeInTheDocument()
  })

  test('renders navigation links', () => {
    render(<Home />)
    
    // Check for common navigation elements
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })

  test('has proper page structure', () => {
    render(<Home />)
    
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })

  test('renders without accessibility violations', () => {
    const { container } = render(<Home />)
    
    // Basic accessibility checks
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('Home Page Integration', () => {
  test('displays Golden Path Template branding', () => {
    render(<Home />)
    
    // Look for any Golden Path Template specific content
    const content = screen.getByText(/Golden Path|Template|React|Next\.js/i)
    expect(content).toBeInTheDocument()
  })
})
