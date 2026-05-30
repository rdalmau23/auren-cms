import { withAuth } from "next-auth/middleware";

const authMiddleware = withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export default function middleware(req: any, event: any) {
  return (authMiddleware as any)(req, event);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
