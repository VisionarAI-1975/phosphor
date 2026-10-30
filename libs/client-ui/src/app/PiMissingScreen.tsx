import { piInstallLocation, type PiHealth } from '@shared/models'
import { Button } from '@/components/form'
import { usePackageJob } from '@/features/settings/usePackageJob'
import { JobOutput } from '@/features/settings/JobOutput'

export function PiMissingScreen({
  health,
  onRetry,
  onInstalled,
}: {
  health: PiHealth
  onRetry: () => void
  /** Called when the one-click install finishes successfully (fresh setup). */
  onInstalled: () => void
}): React.JSX.Element {
  const tooOld = health.reason === 'too-old'
  const title = tooOld ? 'pi necesita una actualización' : 'pi no está instalado'

  const job = usePackageJob((exitCode) => {
    if (exitCode === 0) {
      onInstalled()
      onRetry()
    }
  })

  return (
    <div className="titlebar-drag flex h-full flex-col items-center justify-center gap-6 px-8">
      <div className="bg-surface border-border w-full max-w-lg rounded-lg border p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-text-secondary mt-3 text-lg leading-relaxed">
          Phosphor funciona sobre el agente de código pi. {health.message}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => void job.start(() => window.phosphor.invoke('packages:installPi'))}
            disabled={job.running}
          >
            {job.running ? 'Instalando…' : tooOld ? 'Actualizar pi' : 'Instalar pi'}
          </Button>
          <Button size="lg" onClick={onRetry} disabled={job.running}>
            Comprobar de nuevo
          </Button>
        </div>

        <JobOutput running={job.running} output={job.output} exitCode={job.exitCode} />

        <p className="text-text-tertiary mt-5 text-base">O instálalo tú mismo:</p>
        <div className="bg-code-bg border-border mt-1.5 rounded-md border px-4 py-3">
          <code className="font-mono text-lg">npm install -g @earendil-works/pi-coding-agent</code>
        </div>

        {health.version && (
          <p className="text-text-tertiary mt-3 text-base">
            Versión encontrada: {health.version} en {piInstallLocation(health)}; la mínima soportada es{' '}
            {health.minVersion}.
          </p>
        )}
      </div>
    </div>
  )
}
