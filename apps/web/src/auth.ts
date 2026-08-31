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
      clientSecret:
        process.env.KEYCLOAK_CLIENT_SECRET || "dummy-secret",
      issuer:
        process.env.KEYCLOAK_ISSUER ||
        "http://localhost:8080/realms/autosoc",
      authorization: {
        params: {
          scope: "openid profile email roles",
        },
      },
    }),

    CredentialsProvider({
      name: "Development Mock Login",

      credentials: {
        username: {
          label: "Username (any)",
          type: "text",
          placeholder: "admin",
        },
        password: {
          label: "Password (any)",
          type: "password",
          placeholder: "admin",
        },
      },

      async authorize(credentials) {
        try {
          const res = await fetch(
            "http://localhost:8000/api/v1/auth/token",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                username:
                  (credentials?.username as string) || "",
                password:
                  (credentials?.password as string) || "",
              }),
            }
          );

          if (!res.ok) {
            return null;
          }

          const data = await res.json();

          if (data.access_token) {
            return {
              id: data.user.id || "unknown",
              name:
                data.user.full_name ||
                data.user.username ||
                "User",
              email:
                data.user.email ||
                `${data.user.username}@autosoc.local`,
              roles: data.user.roles || ["analyst"],
              accessToken: data.access_token,
            };
          }

          return null;
        } catch (error: unknown) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Keycloak login
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      // Credentials login
      if (user && "accessToken" in user) {
        token.accessToken = user.accessToken as string;
      }

      // Keycloak roles
      if (profile) {
        token.roles =
          (
            profile as {
              realm_access?: {
                roles?: string[];
              };
            }
          )?.realm_access?.roles || [];
      }

      // Credentials roles
      if (user && "roles" in user) {
        token.roles = (user.roles as string[]) || [];
      }

      return token;
    },

    async session({ session, token }) {
      // Expose the backend access token to the client session
      session.accessToken = token.accessToken as string;

      // Expose roles to the client session
      session.user.roles =
        (token.roles as string[]) || [];

      return session;
    },
  },

  session: {
    strategy: "jwt",
  },

  secret:
    process.env.NEXTAUTH_SECRET ||
    "super-secret-development-key",

  pages: {
    signIn: "/login",
  },
});