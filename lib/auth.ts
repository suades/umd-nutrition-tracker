import { cookies } from "next/headers"
import { db, type User } from "./db"

// Simple authentication functions
// In a real app, you would use a proper authentication system like NextAuth.js or Auth.js

export const auth = {
  login: (email: string, password: string) => {
    const user = db.getUserByEmail(email)

    if (!user || user.password !== password) {
      return null
    }

    // Set a cookie to maintain the session
    const cookieStore = cookies()
    cookieStore.set("userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return user
  },

  register: (userData: Omit<User, "id" | "createdAt">) => {
    // Check if user already exists
    const existingUser = db.getUserByEmail(userData.email)
    if (existingUser) {
      return null
    }

    // Create new user
    const newUser = db.createUser(userData)

    // Set a cookie to maintain the session
    const cookieStore = cookies()
    cookieStore.set("userId", newUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return newUser
  },

  logout: () => {
    const cookieStore = cookies()
    cookieStore.delete("userId")
    return true
  },

  getCurrentUser: () => {
    const cookieStore = cookies()
    const userId = cookieStore.get("userId")?.value

    if (!userId) {
      return null
    }

    return db.getUser(userId)
  },
}
