import { withAuth } from "next-auth/middleware";

const authMiddleware = withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: '/api/auth/signin/keycloak',
  },
});

export default function middleware(req: any, event: any) {
  if (process.env.NEXT_PUBLIC_E2E_TEST === 'true') {
    return;
  }
  return (authMiddleware as any)(req, event);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
