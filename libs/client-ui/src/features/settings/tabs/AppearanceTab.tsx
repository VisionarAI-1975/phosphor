import { AppearancePreferences } from '../AppearancePreferences'
import { clampUiScale, UI_SCALE_MAX, UI_SCALE_MIN } from '@shared/models'
import { useSettingsStore } from '@/stores/settings'
import { formatShortcut } from '@/lib/shortcuts'
import { Row, SectionTitle, NumberField } from '@/components/form'
import { usePlatform } from '@/platform/Platform'

/** Theme, UI scale and font preferences (phosphor-local, not pi settings). */

export function AppearanceTab(): React.JSX.Element {
  const fonts = useSettingsStore((s) => s.fonts)
  const setFonts = useSettingsStore((s) => s.setFonts)
  const { pageZoom, terminal, savedFontPrefs } = usePlatform()

  return (
    <div>
      <SectionTitle>Apariencia</SectionTitle>
      {!savedFontPrefs && (
        <p className="text-text-secondary -mt-2 mb-2 text-base">
          El tema se guarda en este dispositivo. Los cambios de fuente duran hasta recargar. Nada se sincroniza.
        </p>
      )}

      <AppearancePreferences />
      {pageZoom && (
        <Row
          title="Escala de la interfaz"
          description={`Amplía toda la interfaz: texto, iconos y espaciado. ${formatShortcut('mod', '+')} / ${formatShortcut('mod', '-')} para ajustar, ${formatShortcut('mod', '0')} para restablecer.`}
        >
          <NumberField
            value={Math.round(fonts.uiScale * 100)}
            suffix="%"
            min={UI_SCALE_MIN * 100}
            max={UI_SCALE_MAX * 100}
            step={5}
            onChange={(v) => setFonts({ uiScale: clampUiScale(v / 100) })}
          />
        </Row>
      )}
      <Row
        title="Tamaño de fuente del editor"
        description="Editor Monaco y diffs. Se aplica en vivo a las vistas abiertas."
      >
        <NumberField
          value={fonts.editorFontSize}
          suffix="px"
          min={10}
          max={20}
          step={0.5}
          onChange={(v) => setFonts({ editorFontSize: v })}
        />
      </Row>
      {terminal && (
        <Row title="Tamaño de fuente de la terminal" description="Se aplica en vivo a las pestañas de terminal abiertas.">
          <NumberField
            value={fonts.terminalFontSize}
            suffix="px"
            min={10}
            max={20}
            step={0.5}
            onChange={(v) => setFonts({ terminalFontSize: v })}
          />
        </Row>
      )}
    </div>
  )
}
