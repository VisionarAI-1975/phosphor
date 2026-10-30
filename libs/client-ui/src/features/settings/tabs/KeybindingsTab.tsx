import { SectionTitle } from '@/components/form'
import { formatShortcut, hostPlatform } from '@/lib/shortcuts'
import { clipboardModifiers } from '@/features/terminal/clipboardKeys'
import { FORMATTING_ACTIONS, formattingKeys } from '@/features/chat/composer/formattingActions'

/**
 * Static reference table of the keyboard shortcuts, grouped by where they
 * apply. Bindings that exist in Claude Code or Claude Desktop keep those
 * spellings — Esc Esc to rewind, ↑ for prompt history and ⌃O for verbose
 * output — so muscle memory carries over.
 */

export type Binding = [parts: string[], action: string]

const APP: Binding[] = [
  [['F6'], 'Enfocar composer / controles del panel'],
  [['mod', 'N'], 'Nueva sesión'],
  [['mod', 'K'], 'Paleta de comandos'],
  [['mod', 'P'], 'Ir al archivo'],
  [['mod', 'F'], 'Buscar en sesión o artefacto'],
  [['mod', 'shift', 'F'], 'Buscar en archivos del espacio de trabajo'],
  [['mod', 'B'], 'Mostrar/ocultar barra lateral'],
  [['mod', '`'], 'Mostrar/ocultar panel de terminal'],
  [['mod', 'shift', 'E'], 'Mostrar/ocultar panel de archivos'],
  [['mod', 'shift', 'G'], 'Mostrar/ocultar panel de cambios'],
  [['mod', ','], 'Ajustes'],
  [['mod', '/'], 'Esta lista de atajos'],
  [['mod', '+'], 'Ampliar'],
  [['mod', '-'], 'Reducir'],
  [['mod', '0'], 'Restablecer zoom'],
]

const CHAT: Binding[] = [
  [['Enter'], 'Enviar prompt (dirigir mientras transmite)'],
  [['alt', 'Enter'], 'Encolar seguimiento mientras transmite'],
  [['mod', 'Enter'], 'Encolar seguimiento mientras transmite (alternativa)'],
  [['shift', 'Enter'], 'Nueva línea / continuar lista en el composer'],
  [['mod', 'shift', 'X'], 'Expandir / contraer el composer enfocado'],
  [['mod', 'Z'], 'Deshacer edición de entrada'],
  [['mod', 'shift', 'Z'], 'Rehacer edición de entrada'],
  [['Tab / Shift+Tab'], 'Indentar / desindentar una lista; si no, mover el foco'],
  [['Esc'], 'Detener el agente / cerrar superposiciones'],
  [['Esc Esc'], 'Retroceder a un mensaje anterior'],
  [['↑'], 'Prompt anterior (composer vacío)'],
  [['↓'], 'Prompt siguiente'],
  [['ctrl', 'O'], 'Expandir / contraer salida de herramienta'],
]

const EDITOR: Binding[] = [
  [['mod', 'S'], 'Guardar archivo en el editor'],
  [['mod', 'alt', 'S'], 'Guardar todos los archivos abiertos (panel de archivos)'],
  [['mod', 'W'], 'Cerrar pestaña del editor (panel de archivos)'],
  [['mod', 'shift', 'T'], 'Reabrir pestaña cerrada del editor (panel de archivos)'],
  [['ctrl', 'Tab'], 'Siguiente pestaña del editor (Shift invierte)'],
  [['mod', 'F'], 'Buscar en el editor / terminal'],
]

/*
 * Terminal copy/paste is the one pair whose KEYS differ per platform, not just
 * their spelling: Ctrl+C has to stay SIGINT off macOS, so copy moves to
 * Ctrl+Shift+C there (see features/terminal/clipboardKeys.ts).
 */
function clipboardBindings(): Binding[] {
  const mod = clipboardModifiers(hostPlatform())
  return [
    [[...mod, 'C'], 'Copiar selección de terminal'],
    [[...mod, 'V'], 'Pegar en la terminal'],
  ]
}

/** Settings → Writing → Autocomplete. Taking one word is ⌥→ on macOS, Ctrl+→ elsewhere. */
function autocompleteBindings(): Binding[] {
  return [
    [['Tab / →'], 'Aceptar sugerencia de autocompletado'],
    [[hostPlatform() === 'darwin' ? 'alt' : 'ctrl', '→'], 'Aceptar una palabra de la sugerencia'],
  ]
}

/** The tables this tab shows, in order. Settings search indexes the same ones. */
export function keybindingGroups(): Array<{ title: string; bindings: Binding[] }> {
  return [
    { title: 'App', bindings: APP },
    { title: 'Chat', bindings: [...CHAT, ...autocompleteBindings()] },
    {
      title: 'Formato',
      bindings: FORMATTING_ACTIONS.map<Binding>((binding) => [
        formattingKeys(binding),
        binding.label,
      ]),
    },
    { title: 'Editor y terminal', bindings: [...EDITOR, ...clipboardBindings()] },
  ]
}

export function KeybindingsTab(): React.JSX.Element {
  return (
    <div className="space-y-5">
      <p className="text-text-secondary text-base">
        La navegación de la app funciona desde el composer; Ir al archivo también desde el editor. Los
        diálogos bloquean la navegación; el zoom sigue funcionando. En un panel a pantalla completa,
        F6 enfoca su control de salida.
      </p>
      {keybindingGroups().map((group) => (
        <Group key={group.title} {...group} />
      ))}
    </div>
  )
}

function Group({ title, bindings }: { title: string; bindings: Binding[] }): React.JSX.Element {
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <div className="border-border divide-border divide-y overflow-hidden rounded-xl border">
        {bindings.map(([parts, action]) => (
          <div
            key={action}
            data-setting-row
            className="bg-surface flex items-center justify-between gap-4 px-4 py-2"
          >
            <span className="text-base">{action}</span>
            <kbd className="bg-bg-secondary border-border rounded-md border px-2 py-0.5 font-mono text-sm">
              {formatShortcut(...parts)}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  )
}
