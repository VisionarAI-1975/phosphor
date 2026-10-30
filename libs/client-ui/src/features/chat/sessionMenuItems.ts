import type { ContextMenuItem } from '@/components/ContextMenu'
import { remoteControlHint } from '@/features/sessions/remoteLaneActions'
import { exportSessionHtml } from '@/features/sessions/sessionActions'
import { piCallOk } from '@/lib/rpc'
import { useChatStore } from '@/stores/chat'
import { promptText } from '@/stores/prompt'
import { REMOTE_UNAVAILABLE, useRemoteLanesStore } from '@/stores/remoteLanes'
import { useSessionsStore } from '@/stores/sessions'
import type { QueueMode, RpcSessionState } from '@shared/rpc'

export const SESSION_OPTIONS = 'Opciones de sesión'

/**
 * Auto-retry state isn't reported by get_state, so Phosphor tracks the last
 * value it set per session (pi defaults to enabled).
 */
const autoRetryLocal = new Map<string, boolean>()

const QUEUE_MODE_HINT: Record<QueueMode, string> = {
  all: 'todos a la vez',
  'one-at-a-time': 'de uno en uno',
}

export interface SessionMenuState {
  sessionId: string
  meta: RpcSessionState | null | undefined
  /** The session is a Host lane: pi runs on that Host, so Export (a This Mac save) is off. */
  remote: boolean
  /**
   * Why this client may not send the session commands, or undefined when it
   * may. Host lanes fence them to the controller (`remoteControlHint`).
   */
  controlHint: string | undefined
}

/**
 * The session's options: Export, Compact now, the two toggles and the two queue
 * modes, with current values as hints. One list for every surface (Desktop's top
 * bar, the wide browser's lane tabs, the phone lane sheet); they differ only in
 * how they present it.
 */
export function sessionMenuItems({
  sessionId,
  meta,
  remote,
  controlHint,
}: SessionMenuState): ContextMenuItem[] {
  const blocked = controlHint !== undefined
  const autoCompaction = meta?.autoCompactionEnabled ?? true
  const autoRetry = autoRetryLocal.get(sessionId) ?? true
  const steering = meta?.steeringMode ?? 'all'
  const followUp = meta?.followUpMode ?? 'all'
  const setting = (on: boolean): string => controlHint ?? (on ? 'activado' : 'desactivado')
  const mode = (value: QueueMode): string => controlHint ?? QUEUE_MODE_HINT[value]
  return [
    {
      label: 'Exportar HTML…',
      disabled: remote,
      hint: remote ? REMOTE_UNAVAILABLE : undefined,
      onClick: () => void exportSessionHtml(sessionId, meta?.sessionName ?? 'session'),
    },
    {
      label: 'Compactar ahora…',
      disabled: blocked,
      hint: controlHint,
      onClick: () => void compactNow(sessionId),
    },
    {
      label: 'Auto-compactación',
      separatorAbove: true,
      disabled: blocked,
      hint: setting(autoCompaction),
      onClick: () => void setAutoCompaction(sessionId, !autoCompaction),
    },
    {
      label: 'Auto-reintento',
      disabled: blocked,
      hint: setting(autoRetry),
      onClick: () => void setAutoRetry(sessionId, !autoRetry),
    },
    {
      label: 'Dirección',
      separatorAbove: true,
      disabled: blocked,
      hint: mode(steering),
      onClick: () => void setSteeringMode(sessionId, nextMode(steering)),
    },
    {
      label: 'Seguimientos',
      disabled: blocked,
      hint: mode(followUp),
      onClick: () => void setFollowUpMode(sessionId, nextMode(followUp)),
    },
  ]
}

/** The session's options as they stand now, read from the stores at call time. */
export function currentSessionMenuItems(sessionId: string): ContextMenuItem[] {
  const entry = useSessionsStore.getState().live[sessionId]
  const meta = useChatStore.getState().sessions[sessionId]?.meta
  if (entry?.target?.kind !== 'remote')
    return sessionMenuItems({ sessionId, meta, remote: false, controlHint: undefined })
  const host = useRemoteLanesStore.getState().hosts[entry.target.hostId]
  const lane = host?.lanes.find((item) => item.laneId === entry.laneId)
  const controlHint = remoteControlHint(
    host?.state === 'ready',
    !!host?.capabilities.includes('sessions.control'),
    lane?.control.controller?.self === true,
  )
  return sessionMenuItems({ sessionId, meta, remote: true, controlHint })
}

const nextMode = (mode: QueueMode): QueueMode => (mode === 'all' ? 'one-at-a-time' : 'all')

async function setAutoRetry(sessionId: string, enabled: boolean): Promise<void> {
  if (await piCallOk(sessionId, { type: 'set_auto_retry', enabled }))
    autoRetryLocal.set(sessionId, enabled)
}

async function setAutoCompaction(sessionId: string, enabled: boolean): Promise<void> {
  if (await piCallOk(sessionId, { type: 'set_auto_compaction', enabled }))
    useChatStore.getState().patchMeta(sessionId, { autoCompactionEnabled: enabled })
}

async function setSteeringMode(sessionId: string, mode: QueueMode): Promise<void> {
  if (await piCallOk(sessionId, { type: 'set_steering_mode', mode }))
    useChatStore.getState().patchMeta(sessionId, { steeringMode: mode })
}

async function setFollowUpMode(sessionId: string, mode: QueueMode): Promise<void> {
  if (await piCallOk(sessionId, { type: 'set_follow_up_mode', mode }))
    useChatStore.getState().patchMeta(sessionId, { followUpMode: mode })
}

async function compactNow(sessionId: string): Promise<void> {
  const instructions = await promptText({
    title: 'Compactar contexto ahora',
    message: 'Opcional: instrucciones personalizadas para el resumen de compactación (deja en blanco para usar la predeterminada)',
    allowEmpty: true,
  })
  if (instructions === undefined) return
  await piCallOk(sessionId, {
    type: 'compact',
    ...(instructions ? { customInstructions: instructions } : {}),
  })
}
