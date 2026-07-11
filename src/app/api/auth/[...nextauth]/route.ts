import NextAuth, { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID || "auren-cms",
      clientSecret: process.env.KEYCLOAK_SECRET || "dummy-secret-not-used-by-public-client",
      issuer: process.env.KEYCLOAK_ISSUER || "http://localhost:8180/realms/auren",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        try {
          if (account.access_token) {
            const payload = parseJwt(account.access_token);
            if (payload?.realm_access?.roles) {
              token.roles = payload.realm_access.roles;
            }
          }
        } catch (e) {
          console.error("Error parsing JWT:", e);
        }
        if (!token.roles && profile) {
          token.roles = (profile as any).realm_access?.roles || [];
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Inject access token and roles into session object so we can use it in client calls
      (session as any).accessToken = token.accessToken;
      (session as any).idToken = token.idToken;
      (session as any).roles = token.roles || [];
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
