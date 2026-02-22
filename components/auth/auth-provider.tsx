'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiRequest, ApiError } from '@/lib/api-client'

type AuthUser = {
  id: string
  fullName: string
  email: string
  role: string
  status?: string
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (input: { email: string; password: string; rememberMe?: boolean }) => Promise<void>
  register: (input: {
    fullName: string
    email: string
    password: string
  }) => Promise<void>
  logout: () => void
}

type AuthResponse = {
  token: string
  user: AuthUser
}

const AUTH_TOKEN_KEY = 'kursach.auth.token'
const AuthContext = createContext<AuthContextValue | null>(null)

function persistToken(token: string, rememberMe: boolean) {
  if (rememberMe) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    return
  }

  sessionStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

function readStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY)
}

function clearStoredToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const setSession = useCallback((sessionToken: string, sessionUser: AuthUser, rememberMe = true) => {
    persistToken(sessionToken, rememberMe)
    setToken(sessionToken)
    setUser(sessionUser)
  }, [])

  const clearSession = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }, [])

  const login = useCallback(
    async (input: { email: string; password: string; rememberMe?: boolean }) => {
      const data = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: {
          email: input.email,
          password: input.password,
        },
      })

      setSession(data.token, data.user, input.rememberMe ?? false)
    },
    [setSession],
  )

  const register = useCallback(
    async (input: { fullName: string; email: string; password: string }) => {
      const data = await apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: input,
      })

      setSession(data.token, data.user, true)
    },
    [setSession],
  )

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedToken = readStoredToken()

      if (!storedToken) {
        setIsLoading(false)
        return
      }

      try {
        const profile = await apiRequest<AuthUser>('/users/me', {
          token: storedToken,
        })
        setToken(storedToken)
        setUser(profile)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession()
        } else {
          clearSession()
        }
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrapAuth()
  }, [clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      register,
      logout,
    }),
    [isLoading, login, logout, register, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
