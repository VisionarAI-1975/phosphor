import clsx from 'clsx'
import { TooltipButton } from '@/components/Tooltip'
import { NumberField, Row } from '@/components/form'
import { useSettingsStore } from '@/stores/settings'

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
] as const

/** Device-local preferences supported by both the browser bridge and Desktop. */
export function AppearancePreferences(): React.JSX.Element {
  const fonts = useSettingsStore((s) => s.fonts)
  const setFonts = useSettingsStore((s) => s.setFonts)
  return (
    <>
      <ThemePreference />
      <Row title="Tamaño de fuente del chat" description="Tamaño del texto de los mensajes en la conversación.">
        <label>
          <span className="sr-only">Chat font size</span>
          <NumberField
            value={fonts.chatFontSize}
            suffix="px"
            min={11}
            max={20}
            step={0.5}
            onChange={(v) => setFonts({ chatFontSize: v })}
          />
        </label>
      </Row>
      <Row
        title="Fuente monoespaciada"
        description="JetBrains Mono is bundled. Other choices use installed fonts."
      >
        <select
          aria-label="Fuente monoespaciada"
          value={fonts.monoFont}
          onChange={(e) => setFonts({ monoFont: e.target.value })}
          className="border-border bg-surface text-text max-w-full rounded-lg border px-2.5 py-1.5 text-base outline-none"
        >
          {['JetBrains Mono', 'Fira Code', 'SF Mono', 'Menlo', 'Cascadia Code', 'monospace'].map(
            (font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ),
          )}
        </select>
      </Row>
    </>
  )
}

function ThemePreference(): React.JSX.Element {
  const theme = useSettingsStore((s) => s.theme)
  return (
    <Row title="Tema" description="Se aplica en vivo a esta app en este dispositivo.">
      <div
        className="border-border flex flex-wrap overflow-hidden rounded-lg border"
        role="group"
        aria-label="Tema"
      >
        {THEME_OPTIONS.map(({ value, label }) => (
          <TooltipButton
            key={value}
            aria-pressed={theme === value}
            onClick={() => useSettingsStore.getState().setTheme(value)}
            className={clsx(
              'px-3 py-1.5 text-base font-medium transition-colors',
              theme === value
                ? 'bg-accent text-accent-text'
                : 'text-text-secondary hover:text-text',
            )}
          >
            {label}
          </TooltipButton>
        ))}
      </div>
    </Row>
  )
}
