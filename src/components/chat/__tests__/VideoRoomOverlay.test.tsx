import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoRoomOverlay } from '../VideoRoomOverlay';

// Mocks
jest.mock('@daily-co/daily-react', () => ({
  DailyProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="daily-provider">{children}</div>,
  useCallObject: () => ({
    leave: jest.fn()
  }),
  useLocalSessionId: () => 'local-123',
  useParticipantIds: () => ['remote-123'],
  useVideoTrack: () => ({ persistentTrack: null, state: 'playable' }),
  useAudioTrack: () => ({ persistentTrack: null, state: 'playable' }),
  useDailyEvent: jest.fn()
}));

jest.mock('@daily-co/daily-js', () => ({
  createCallObject: () => ({
    join: jest.fn().mockResolvedValue(true),
    leave: jest.fn(),
    destroy: jest.fn()
  })
}));

const mockOnLeave = jest.fn();

describe('VideoRoomOverlay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and calls onLeave when clicking Leave Room', () => {
    render(
      <VideoRoomOverlay 
        roomUrl="https://auren.daily.co/test" 
        onLeave={mockOnLeave} 
      />
    );

    // Verify it renders the DailyProvider mock
    expect(screen.getByTestId('daily-provider')).toBeInTheDocument();

    // The leave button is the one with the PhoneOff icon (bg-red-500)
    const buttons = screen.getAllByRole('button');
    const leaveButton = buttons[buttons.length - 1]; // It's the last button
    expect(leaveButton).toBeInTheDocument();

    // Click leave
    fireEvent.click(leaveButton);

    // Verify callback was called
    expect(mockOnLeave).toHaveBeenCalledTimes(1);
  });
});
