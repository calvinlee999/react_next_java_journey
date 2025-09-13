// NextAuth.js authentication configuration
// File: /frontend/src/pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions } from 'next-auth'
import { JWT } from 'next-auth/jwt'

export const authOptions: NextAuthOptions = {
  providers: [
    // Configure your authentication providers here
    // For now, using a simple configuration
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.sessionId = `session_${Date.now()}`
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

export default NextAuth(authOptions)