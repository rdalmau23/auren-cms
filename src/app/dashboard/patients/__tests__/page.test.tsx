import React from 'react';
import { render, screen, waitFor } from '@/utils/test-utils';
import PatientsPage from '../page';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('PatientsPage', () => {
  it('renders the patients table and loads data via MSW', async () => {
    render(<PatientsPage />);

    // Shows loading state initially
    expect(screen.getByText(/Cargando directorio de pacientes/i)).toBeInTheDocument();

    // MSW will return John Doe and Jane Smith
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Check risk levels rendered
    expect(screen.getByText('Bajo')).toBeInTheDocument();
    expect(screen.getByText('Alto')).toBeInTheDocument();
  });
});
