import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Button, Row, SectionTitle } from '@/components/form'
import { piInstallLocation, type PiHealth } from '@shared/models'
import type { PiResources } from '@shared/models'
import { ConfigFileEditor, piConfigFile } from '../ConfigFileEditor'
import { MaintenanceSection } from './MaintenanceSection'

/** pi install health, discovered resources, and raw config file editing. */

export function AdvancedTab(): React.JSX.Element {
  const [health, setHealth] = useState<PiHealth | null>(null)
  const [resources, setResources] = useState<PiResources | null>(null)
  const [editing, setEditing] = useState<'settings' | 'models' | null>(null)
  useEffect(() => {
    void window.phosphor.invoke('pi:health').then(setHealth)
    void window.phosphor.invoke('pi:listResources').then(setResources)
  }, [])

  return (
    <div>
      <SectionTitle>Avanzado</SectionTitle>

      <Row
        title="Salud de pi"
        description={
          health
            ? `${piInstallLocation(health) ?? 'no encontrado'} — mínimo soportado ${health.minVersion}`
            : 'comprobando…'
        }
      >
        <span
          className={clsx(
            'rounded-md px-2 py-1 font-mono text-sm font-medium',
            health?.ok ? 'bg-success/15 text-success' : 'bg-danger-soft text-danger',
          )}
        >
          {health ? (health.ok ? `v${health.version}` : (health.reason ?? 'error')) : '…'}
        </span>
      </Row>

      <Row
        title="pi settings.json"
        description="Editor directo de ~/.pi/agent/settings.json. Reinicia las sesiones para aplicar."
      >
        <Button onClick={() => setEditing('settings')}>Editar…</Button>
      </Row>
      <Row
        title="pi models.json"
        description="Proveedores y modelos personalizados (los endpoints locales viven aquí)."
      >
        <Button onClick={() => setEditing('models')}>Editar…</Button>
      </Row>

      <MaintenanceSection />

      <SectionTitle small>
        Recursos locales de pi (archivos sueltos — los paquetes están en la pestaña Extensiones; las
        skills tienen su propia página: barra lateral → Habilidades)
      </SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        {(['extensions', 'prompts', 'themes'] as const).map((kind) => (
          <div key={kind} className="border-border bg-surface rounded-xl border p-3">
            <div className="text-text-tertiary text-xs font-semibold font-mono uppercase tracking-wider">
              {kind}
            </div>
            <div className="mt-1.5 space-y-0.5">
              {(resources?.[kind] ?? []).slice(0, 8).map((name) => (
                <div key={name} className="truncate font-mono text-sm">
                  {name}
                </div>
              ))}
              {resources && resources[kind].length === 0 && (
                <div className="text-text-tertiary text-sm">ninguno</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-text-tertiary mt-3 text-sm">
        Phosphor nunca lee ni muestra auth.json.
      </p>

      {editing && (
        <ConfigFileEditor source={piConfigFile(editing)} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
