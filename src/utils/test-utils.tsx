import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { name: 'Dr. Test' }, accessToken: 'mock-token' } }),
  getSession: jest.fn().mockResolvedValue({ user: { name: 'Dr. Test' }, accessToken: 'mock-token' }),
  SessionProvider: ({ children }: any) => <>{children}</>,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

import { ConfirmDialogProvider } from '@/components/providers/ConfirmDialogProvider';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmDialogProvider>
          {children}
      </ConfirmDialogProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
