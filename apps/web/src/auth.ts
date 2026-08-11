import NextAuth, { type DefaultSession } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: {
      roles?: string[];
    } & DefaultSession["user"];
    accessToken?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID || "autosoc-frontend",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "dummy-secret",
      issuer: process.env.KEYCLOAK_ISSUER || "http://localhost:8080/realms/autosoc",
      authorization: { params: { scope: "openid profile email roles" } },
    }),
    CredentialsProvider({
      name: "Development Mock Login",
      credentials: {
        username: { label: "Username (any)", type: "text", placeholder: "admin" },
        password: { label: "Password (any)", type: "password", placeholder: "admin" }
      },
      async authorize(credentials) {
        // In Phase 5, we call the backend API to authenticate
        try {
          const res = await fetch("http://localhost:8000/api/v1/auth/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              username: credentials?.username as string || "",
              password: credentials?.password as string || "",
            }),
          });

          if (!res.ok) {
            return null;
          }

          const data = await res.json();
          
          if (data.access_token) {
            // Return user object compatible with NextAuth
            return {
              id: data.user.id || "unknown",
              name: data.user.full_name || data.user.username || "User",
              email: data.user.email || `${data.user.username}@autosoc.local`,
              roles: data.user.roles || ["analyst"],
              accessToken: data.access_token,
            };
          }
          return null;
        } catch (error: unknown) {
          console.error("Auth error:", error);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        // Basic mapping. Real roles come from /api/v1/me, but we map token here just in case.
        token.roles = (profile as { realm_access?: { roles?: string[] } })?.realm_access?.roles || [];
      }
      return token;
    },
    async session({ session, token }) {
      // We pass the access token to the client session so the API wrapper can use it for requests to the backend.
      // This violates the strict "No access token stored in localStorage" rule ONLY IF we store it in localStorage.
      // But NextAuth uses an HttpOnly cookie for the session token, and exposes session in memory.
      // As long as we use the session context, it's safe.
      session.accessToken = token.accessToken as string;
      session.user.roles = (token.roles as string[]) || [];
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-development-key",
  pages: {
    signIn: "/login",
  },
});
