import { TooltipButton } from '@/components/Tooltip'
import { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import { useSettingsWorkspace } from '../SettingsMachineScope'
import { useExtensionUiStore } from '@/stores/extensionUi'
import { Row, SectionTitle, NumberField, TextField, Toggle } from '@/components/form'
import type { ConfigFileHealth } from '@shared/models'
import { useSettingsUiStore } from '../settingsUiStore'
import { DirectivesSection } from './DirectivesSection'
import { ContextBudgetSection } from './ContextBudgetSection'
import { errorText } from '@shared/errors'

/** Agent defaults written into pi's own settings.json (global or per project). */

export function AgentTab(): React.JSX.Element {
  const currentWorkspace = useSettingsWorkspace()
  const [scope, setScope] = useState<'global' | 'project'>('global')
  const [scoped, setScoped] = useState<{
    global: Record<string, unknown>
    project: Record<string, unknown> | null
  } | null>(null)
  const [health, setHealth] = useState<ConfigFileHealth | null>(null)
  const [saving, setSaving] = useState(false)

  const workspaceArg = scope === 'project' ? (currentWorkspace ?? undefined) : undefined

  const reload = useCallback((): void => {
    // Unmerged per-scope reads: the editor must show what each file actually
    // contains, or a project override would silently absorb inherited global
    // values on the next edit.
    void window.phosphor
      .invoke('pi:agentSettingsScoped', currentWorkspace ?? undefined)
      .then(setScoped)
    void window.phosphor.invoke('pi:checkAgentSettings', workspaceArg).then((result) => {
      setHealth(
        scope === 'global'
          ? result.global
          : (result.project ?? { exists: false, malformed: false }),
      )
    })
  }, [currentWorkspace, workspaceArg, scope])

  useEffect(() => reload(), [reload])

  const patch = async (partial: Record<string, unknown>): Promise<void> => {
    setSaving(true)
    try {
      await window.phosphor.invoke('pi:patchAgentSettings', scope, workspaceArg, partial)
      setScoped((s) =>
        s === null
          ? s
          : scope === 'global'
            ? { ...s, global: { ...s.global, ...partial } }
            : { ...s, project: { ...(s.project ?? {}), ...partial } },
      )
      useExtensionUiStore.getState().pushToast('Saved — applies to newly started sessions', 'info')
    } catch (error) {
      // Malformed existing config: main refuses to write rather than clobber it.
      useExtensionUiStore.getState().pushToast(errorText(error), 'error')
      reload()
    } finally {
      setSaving(false)
    }
  }

  const blocked = health?.malformed === true

  /** The active scope's own file contents (never merged). */
  const settings = scoped === null ? null : scope === 'global' ? scoped.global : scoped.project
  /** What the other scope would contribute — placeholder/fallback material. */
  const inherited = scope === 'project' ? (scoped?.global ?? {}) : {}

  const compaction = (settings?.compaction ?? {}) as Record<string, unknown>
  const retry = (settings?.retry ?? {}) as Record<string, unknown>
  const inheritedCompaction = (inherited.compaction ?? {}) as Record<string, unknown>
  const inheritedRetry = (inherited.retry ?? {}) as Record<string, unknown>
  /** Label for "no explicit value here": inherited value in project scope. */
  const fallbackLabel = (key: string): string => {
    const value = inherited[key]
    return typeof value === 'string' && value ? `hereda "${value}"` : '(predeterminado de pi)'
  }

  return (
    <div>
      <SectionTitle>Valores del agente</SectionTitle>
      <p className="text-text-tertiary -mt-2 mb-4 text-base">
        Escribe el <code className="font-mono">settings.json</code> de pi. Los cambios se aplican a{' '}
        <b>new</b> sessions (pi reads config at spawn).{saving ? ' Guardando…' : ''}
      </p>

      {blocked && (
        <div className="bg-danger-soft border-danger/30 mb-4 rounded-lg border px-3.5 py-3 text-base">
          <div className="text-danger font-medium">
            Este settings.json de {scope === 'global' ? 'global' : 'espacio de trabajo'} no es JSON válido.
          </div>
          <div className="text-text-secondary mt-1 leading-relaxed">
            La edición está deshabilitada para que Phosphor no sobrescriba y pierda tu configuración
            existente. pi también ignora el archivo roto y vuelve a sus valores predeterminados.
            {health?.error ? ` (${health.error})` : ''}
          </div>
          <TooltipButton
            onClick={() => useSettingsUiStore.getState().setTab('advanced')}
            className="border-danger/40 text-danger hover:bg-danger/10 mt-2 rounded-md border px-2.5 py-1 text-sm font-medium transition-colors"
          >
            Córrigelo en Avanzado →
          </TooltipButton>
        </div>
      )}

      {/* Scope stays enabled even when a file is broken, so you can inspect
          the other scope. */}
      <Row
        title="Ámbito"
        description="Global (~/.pi/agent) o una anulación para este espacio de trabajo (.pi/settings.json)."
      >
        <div
          className="border-border flex overflow-hidden rounded-lg border"
          role="group"
          aria-label="Ámbito de los ajustes"
        >
          {(
            [
              { value: 'global', label: 'Global' },
              { value: 'project', label: 'Proyecto' },
            ] as const
          ).map(({ value, label }) => (
            <TooltipButton
              key={value}
              aria-pressed={scope === value}
              disabled={value === 'project' && !currentWorkspace}
              onClick={() => setScope(value)}
              className={clsx(
                'px-3 py-1.5 text-base font-medium transition-colors disabled:opacity-40',
                scope === value
                  ? 'bg-accent text-accent-text'
                  : 'text-text-secondary hover:text-text',
              )}
            >
              {label}
            </TooltipButton>
          ))}
        </div>
      </Row>

      <fieldset
        disabled={blocked}
        className={clsx('contents', blocked && 'pointer-events-none opacity-50')}
      >
        <Row title="Modelo predeterminado" description='p. ej. "claude-sonnet-4-5" o un id de models.json.'>
          <TextField
            defaultValue={(settings?.defaultModel as string) ?? ''}
            placeholder={fallbackLabel('defaultModel')}
            onCommit={(v) => void patch({ defaultModel: v || undefined })}
          />
        </Row>
        <Row
          title="Proveedor predeterminado"
          description='p. ej. "anthropic", "openai", o un proveedor personalizado.'
        >
          <TextField
            defaultValue={(settings?.defaultProvider as string) ?? ''}
            placeholder={fallbackLabel('defaultProvider')}
            onCommit={(v) => void patch({ defaultProvider: v || undefined })}
          />
        </Row>
        <Row
          title="Nivel de razonamiento predeterminado"
          description="off · minimal · low · medium · high · xhigh · max"
        >
          <select
            value={(settings?.defaultThinkingLevel as string) ?? ''}
            onChange={(e) => void patch({ defaultThinkingLevel: e.target.value || undefined })}
            className="border-border bg-surface text-text rounded-lg border px-2.5 py-1.5 text-base outline-none"
          >
            <option value="">{fallbackLabel('defaultThinkingLevel')}</option>
            {['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'].map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </Row>
        <Row
          title="Ocultar bloques de razonamiento"
          description="Colapsa el razonamiento del modelo fuera de la transcripción."
        >
          <Toggle
            on={(settings?.hideThinkingBlock ?? inherited.hideThinkingBlock) === true}
            onChange={(on) => void patch({ hideThinkingBlock: on })}
          />
        </Row>
        <Row title="Entrega de dirección" description="Cómo se inyectan los mensajes de dirección encolados.">
          <ModeSelect
            value={(settings?.steeringMode as string) ?? ''}
            fallback={fallbackLabel('steeringMode')}
            onChange={(v) => void patch({ steeringMode: v || undefined })}
          />
        </Row>
        <Row title="Entrega de seguimientos" description="Cómo se inyectan los seguimientos encolados.">
          <ModeSelect
            value={(settings?.followUpMode as string) ?? ''}
            fallback={fallbackLabel('followUpMode')}
            onChange={(v) => void patch({ followUpMode: v || undefined })}
          />
        </Row>

        <SectionTitle small>Compactación</SectionTitle>
        <Row
          title="Auto-compactación"
          description="Compacta el contexto automáticamente cerca del límite de ventana, o en el presupuesto de contexto de abajo si llega antes."
        >
          <Toggle
            on={(compaction.enabled ?? inheritedCompaction.enabled) !== false}
            onChange={(on) => void patch({ compaction: { enabled: on } })}
          />
        </Row>
        <Row title="Tokens de reserva" description="Margen que se mantiene libre para la respuesta del modelo.">
          <NumberField
            value={Number(compaction.reserveTokens ?? inheritedCompaction.reserveTokens ?? 16384)}
            min={1024}
            max={131072}
            step={1024}
            onChange={(v) => void patch({ compaction: { reserveTokens: v } })}
          />
        </Row>
        <Row
          title="Mantener tokens recientes"
          description="Conversación reciente que se conserva textualmente durante la compactación."
        >
          <NumberField
            value={Number(
              compaction.keepRecentTokens ?? inheritedCompaction.keepRecentTokens ?? 20000,
            )}
            min={1024}
            max={131072}
            step={1024}
            onChange={(v) => void patch({ compaction: { keepRecentTokens: v } })}
          />
        </Row>
      </fieldset>

      {/* A Phosphor pref, not settings.json: unscoped, and still editable
          while a broken file blocks the rows around it. */}
      <ContextBudgetSection />

      <fieldset
        disabled={blocked}
        className={clsx('contents', blocked && 'pointer-events-none opacity-50')}
      >
        <SectionTitle small>Auto-reintento</SectionTitle>
        <Row
          title="Reintentar ante errores transitorios"
          description="Respuestas de sobrecarga / límite de tasa / 5xx."
        >
          <Toggle
            on={(retry.enabled ?? inheritedRetry.enabled) !== false}
            onChange={(on) => void patch({ retry: { enabled: on } })}
          />
        </Row>
        <Row title="Reintentos máximos" description="Intentos antes de rendirse.">
          <NumberField
            value={Number(retry.maxRetries ?? inheritedRetry.maxRetries ?? 3)}
            min={1}
            max={10}
            step={1}
            onChange={(v) => void patch({ retry: { maxRetries: v } })}
          />
        </Row>
        <Row title="Retardo base (ms)" description="Retardo del primer reintento; crece exponencialmente.">
          <NumberField
            value={Number(retry.baseDelayMs ?? inheritedRetry.baseDelayMs ?? 2000)}
            min={250}
            max={60000}
            step={250}
            onChange={(v) => void patch({ retry: { baseDelayMs: v } })}
          />
        </Row>
      </fieldset>

      <DirectivesSection />
    </div>
  )
}

function ModeSelect({
  value,
  fallback,
  onChange,
}: {
  value: string
  /** Label for the empty option: "(pi default)" or the inherited value. */
  fallback: string
  onChange: (v: string) => void
}): React.JSX.Element {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border-border bg-surface text-text rounded-lg border px-2.5 py-1.5 text-base outline-none"
    >
      <option value="">{fallback}</option>
      <option value="one-at-a-time">one-at-a-time</option>
      <option value="all">all</option>
    </select>
  )
}
