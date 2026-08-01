import React from 'react';
import { render, screen } from '@testing-library/react';
import { CopilotCard } from '../CopilotCard';

// Mocks
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { name: 'Dr. Test' }, centerId: 'auren' } }),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  BrainCircuit: () => <div data-testid="brain-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  ShieldCheck: () => <div data-testid="shield-check-icon" />,
}));

const mockUseQuery = require('@tanstack/react-query').useQuery;

describe('CopilotCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    mockUseQuery.mockReturnValue({ isLoading: true });

    render(<CopilotCard patientId="123" />);

    expect(screen.getByTestId('brain-icon')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    mockUseQuery.mockReturnValue({ isLoading: false, isError: true, data: undefined, error: new Error('AI Error') });

    const { container } = render(<CopilotCard patientId="123" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders summary and LOW risk level correctly', () => {
    mockUseQuery.mockReturnValue({ 
      isLoading: false, 
      isError: false,
      data: {
        summary: 'Patient is stable.',
        risk_level: 'LOW',
        key_factors: ['Sleep', 'Medication']
      }
    });

    render(<CopilotCard patientId="123" />);

    expect(screen.getByText('Patient is stable.')).toBeInTheDocument();
    const riskBadge = screen.getByText('Riesgo: LOW');
    expect(riskBadge).toBeInTheDocument();
    // Assuming the class for LOW is 'text-green-600' or similar
    expect(riskBadge.parentElement?.className).toContain('text-emerald-700');
  });

  it('renders CRITICAL risk level with red color', () => {
    mockUseQuery.mockReturnValue({ 
      isLoading: false, 
      isError: false,
      data: {
        summary: 'Needs immediate attention.',
        risk_level: 'CRITICAL',
        key_factors: ['Severe anxiety']
      }
    });

    render(<CopilotCard patientId="123" />);

    const riskBadge = screen.getByText('Riesgo: CRITICAL');
    expect(riskBadge).toBeInTheDocument();
    // Assuming the class for CRITICAL is 'text-red-600'
    expect(riskBadge.parentElement?.className).toContain('text-red-700');
  });
});
