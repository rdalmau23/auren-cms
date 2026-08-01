'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { EventTracker } from '@/lib/analytics';

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const hasTrackedLogin = useRef(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user && !hasTrackedLogin.current) {
      hasTrackedLogin.current = true;
      const roles = (session.user as any).roles || [];
      const primaryRole = roles.length > 0 ? roles[0] : 'UNKNOWN';
      
      EventTracker.track({
        name: 'Login_Success',
        properties: { role: primaryRole }
      });
    }
  }, [session, status]);

  return <>{children}</>;
}
