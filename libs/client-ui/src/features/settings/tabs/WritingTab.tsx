import { useEffect } from 'react'
import { Button, Row, SectionTitle, Toggle } from '@/components/form'
import { formatShortcut, hostPlatform } from '@/lib/shortcuts'
import { useWritingStore } from '@/stores/writing'

/** Spelling and autocomplete in Phosphor's text fields. Phosphor-local, no model involved. */
export function WritingTab(): React.JSX.Element {
  const prefs = useWritingStore((s) => s.prefs)
  const learned = useWritingStore((s) => s.learned)
  const setPrefs = useWritingStore((s) => s.setPrefs)

  useEffect(() => {
    void useWritingStore.getState().load()
  }, [])

  const wordKey = formatShortcut(hostPlatform() === 'darwin' ? 'alt' : 'ctrl', '→')

  return (
    <div>
      <SectionTitle>Escritura</SectionTitle>

      <Row
        title="Revisar ortografía"
        description="Subraya las palabras mal escritas en los campos de texto. Haz clic derecho en una para ver sugerencias o añadirla a tu diccionario."
      >
        <Toggle on={prefs.spellcheck} onChange={(on) => void setPrefs({ spellcheck: on })} />
      </Row>

      <Row
        title="Autocompletado"
        description={`Sugiere el resto de una palabra o frase mientras escribes en el composer, aprendiendo de los prompts que envíes de ahora en adelante. Tab o → la acepta, ${wordKey} toma una palabra, Esc la oculta. Se ejecuta en esta computadora; no se envía nada a ningún lado.`}
      >
        <Toggle on={prefs.autocomplete} onChange={(on) => void setPrefs({ autocomplete: on })} />
      </Row>

      <Row
        title="Prompts aprendidos"
        description={
          learned === null
            ? 'Prompts que el autocompletado guardó en esta computadora.'
            : `${learned} ${learned === 1 ? 'prompt' : 'prompts'} guardados en esta computadora, hasta los últimos 2.000. Solo se guardan mientras el autocompletado está activo.`
        }
      >
        <Button
          size="sm"
          disabled={!learned}
          onClick={() => void useWritingStore.getState().clearPrompts()}
        >
          Borrar
        </Button>
      </Row>
    </div>
  )
}
