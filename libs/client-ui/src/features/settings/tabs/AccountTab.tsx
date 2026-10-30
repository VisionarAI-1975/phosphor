import { useState } from 'react'
import { Button, Row, SectionTitle } from '@/components/form'
import { AccountAvatar } from '@/features/account/AccountFooter'
import { useAccount } from '../useAccount'

/** The Phosphor account this client is signed in with, and signing out of it. */
export function AccountTab(): React.JSX.Element {
  const { view, error: loadError } = useAccount()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const account = view?.account ?? { status: 'signed-out' as const }
  const user = account.status === 'signed-in' ? account.user : undefined
  const run = (channel: 'account:signIn' | 'account:signOut', failure: string): void => {
    setBusy(true)
    setError(null)
    void window.phosphor
      .invoke(channel)
      .catch(() => setError(failure))
      .finally(() => setBusy(false))
  }
  return (
    <div>
      <SectionTitle>Cuenta de Phosphor</SectionTitle>
      {user ? (
        <Row
          title="Sesión iniciada"
          description={[user.name, user.login && `@${user.login}`, user.email]
            .filter(Boolean)
            .join(' · ')}
        >
          <div className="flex items-center gap-3">
            <AccountAvatar user={user} />
            <Button
              disabled={busy}
              onClick={() => run('account:signOut', 'No se pudo cerrar la sesión. Inténtalo de nuevo.')}
            >
              {busy ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </Button>
          </div>
        </Row>
      ) : (
        <Row
          title="Sesión no iniciada"
          description="Inicia sesión con GitHub para acceder a los Hosts de tu cuenta."
        >
          <Button
            disabled={busy || account.status === 'signing-in'}
            onClick={() => run('account:signIn', 'No se pudo iniciar el inicio de sesión. Inténtalo de nuevo.')}
          >
            {account.status === 'signing-in' ? 'Termina en tu navegador…' : 'Iniciar sesión con GitHub'}
          </Button>
        </Row>
      )}
      {(error ?? loadError) && (
        <p role="alert" className="text-danger mt-2 text-sm">
          {error ?? loadError}
        </p>
      )}
    </div>
  )
}
