'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { toast } from '@/hooks/use-toast'

type GuardProps = {
  children: ReactNode
  fallbackPath?: string
}

type RoleGuardProps = GuardProps & {
  roles: string[]
}

function LoadingState() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground">
      Загрузка...
    </div>
  )
}

export function RequireGuest({ children, fallbackPath = '/' }: GuardProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(fallbackPath)
    }
  }, [fallbackPath, isAuthenticated, isLoading, router])

  if (isLoading || isAuthenticated) {
    return <LoadingState />
  }

  return <>{children}</>
}

export function RequireAuth({ children, fallbackPath = '/login' }: GuardProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(fallbackPath)
    }
  }, [fallbackPath, isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
    return <LoadingState />
  }

  return <>{children}</>
}

export function RequireRole({ children, roles, fallbackPath = '/' }: RoleGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const hasShownAccessDenied = useRef(false)

  const hasAccess = Boolean(user && roles.includes(user.role))

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAccess && !hasShownAccessDenied.current) {
      hasShownAccessDenied.current = true
      toast({
        title: 'Нет доступа',
        description: 'У вас нет прав для входа в админ-панель.',
        variant: 'destructive',
      })
    }

    if (!isLoading && (!isAuthenticated || !hasAccess)) {
      router.replace(fallbackPath)
    }
  }, [fallbackPath, hasAccess, isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated || !hasAccess) {
    return <LoadingState />
  }

  return <>{children}</>
}
