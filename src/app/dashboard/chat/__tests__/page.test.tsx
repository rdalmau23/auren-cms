import React from 'react';
import { render, screen, waitFor, fireEvent } from '@/utils/test-utils';
import ChatPage from '../page';
import '@testing-library/jest-dom';

// Mock daily-co
jest.mock('@daily-co/daily-js', () => ({
  createFrame: jest.fn(() => ({
    join: jest.fn(),
    leave: jest.fn(),
    destroy: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('ChatPage', () => {
  it('renders chat interface and loads conversations via MSW', async () => {
    render(<ChatPage />);

    // MSW will return a mock conversation for 'John Doe'
    // Wait for conversations to load
    const conversation = await screen.findByText('John Doe');
    expect(conversation).toBeInTheDocument();

    // Click on the conversation to select it and load messages
    fireEvent.click(conversation);

    // Check last message
    expect(await screen.findByText('Hola doctor')).toBeInTheDocument();
  });
});
