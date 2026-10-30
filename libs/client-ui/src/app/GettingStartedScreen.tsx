import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/form'
import { CatalogueCards } from '@/features/settings/CatalogueCards'
import { usePackageJob } from '@/features/settings/usePackageJob'
import { JobOutput } from '@/features/settings/JobOutput'

/**
 * One-time step after Phosphor itself installed pi: recommend providers and
 * curated extensions before entering the app. Everything here is reachable
 * again later via Settings → Extensions / Agent.
 */
export function GettingStartedScreen({ onDone }: { onDone: () => void }): React.JSX.Element {
  const [installedSpecs, setInstalledSpecs] = useState<string[]>([])
  const [claudeDetected, setClaudeDetected] = useState<boolean | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const [list, detect] = await Promise.all([
        window.phosphor.invoke('packages:list'),
        window.phosphor.invoke('packages:detect'),
      ])
      setInstalledSpecs(list.map((entry) => entry.spec))
      setClaudeDetected(detect.claude)
    } catch {
      // Recommendations are best-effort on a machine that just got pi.
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const job = usePackageJob(() => void refresh())

  return (
    <div className="titlebar-drag flex h-full flex-col items-center justify-center px-8">
      <div className="bg-surface border-border w-full max-w-2xl overflow-y-auto rounded-lg border p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">pi está listo</h1>
        <p className="text-text-secondary mt-2 text-lg leading-relaxed">
          Dos cosas lo hacen útil: un proveedor de modelos y, opcionalmente, algunas extensiones.
        </p>

        <h2 className="mt-6 text-lg font-semibold">Conecta un proveedor</h2>
        <p className="text-text-secondary mt-1 text-base leading-relaxed">
          Suscripciones (ChatGPT/Codex, Claude Pro/Max, GitHub Copilot, xAI, OpenRouter): ejecuta{' '}
          <code className="bg-code-bg rounded px-1 font-mono text-base">pi</code> en una terminal y
          escribe <code className="bg-code-bg rounded px-1 font-mono text-base">/login</code>. Las
          API keys (Anthropic, OpenAI, Google, …) funcionan con variables de entorno o en Ajustes →
          Agente. Los tokens se comparten con Phosphor automáticamente.
        </p>

        <h2 className="mt-6 text-lg font-semibold">Extensiones recomendadas</h2>
        <div className="mt-2.5">
          <CatalogueCards
            installedSpecs={installedSpecs}
            claudeDetected={claudeDetected}
            busy={job.running}
            onInstall={(spec) =>
              void job.start(() =>
                window.phosphor.invoke('packages:run', 'install', spec, 'global', undefined),
              )
            }
          />
        </div>
        <JobOutput running={job.running} output={job.output} exitCode={job.exitCode} />

        <div className="mt-7 flex justify-end">
          <Button variant="primary" size="lg" onClick={onDone} disabled={job.running}>
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
