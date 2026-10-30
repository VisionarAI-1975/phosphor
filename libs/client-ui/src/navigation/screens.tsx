import {
  ArtifactsIcon,
  MachinesIcon,
  SkillsIcon,
  ClockIcon,
  GearIcon,
  FileIcon,
  ChangesIcon,
  BranchIcon,
  TerminalIcon,
  SidebarToggleIcon,
  PlusIcon,
} from '@/components/icons'
import { lazy, Suspense, type ComponentType } from 'react'
import type { GlobalPage } from '@/stores/layout'
import type { LanePane, Page } from './location'

const Machines = lazy(() =>
  import('@/features/machines/MachinesPage').then((m) => ({ default: m.MachinesPage })),
)
const Routines = lazy(() =>
  import('@/features/routines/RoutinesPage').then((m) => ({ default: m.RoutinesPage })),
)
const Skills = lazy(() =>
  import('@/features/skills/SkillsPage').then((m) => ({ default: m.SkillsPage })),
)
const Artifacts = lazy(() =>
  import('@/features/artifacts/ArtifactsPage').then((m) => ({ default: m.ArtifactsPage })),
)

interface Screen {
  title: string
  icon: ComponentType<{ size?: number; className?: string }>
  component?: ComponentType<{ workspacePath: string }>
  scope: 'remote' | 'both'
  expanded: 'page' | 'pane' | 'modal' | 'sidebar' | 'home'
  compact: 'page' | 'pane' | { notYet: string }
}
/** Every shared screen has a place in both shells, or an explicit platform gap. */
export const SCREENS = {
  lanes: {
    title: 'Carriles',
    icon: SidebarToggleIcon,
    scope: 'both',
    expanded: 'sidebar',
    compact: 'page',
  },
  new: { title: 'Nuevo', icon: PlusIcon, scope: 'both', expanded: 'home', compact: 'page' },
  machines: {
    icon: MachinesIcon,
    component: Machines,
    title: 'Máquinas',
    scope: 'both',
    expanded: 'page',
    compact: 'page',
  },
  routines: {
    icon: ClockIcon,
    component: Routines,
    title: 'Rutinas',
    scope: 'both',
    expanded: 'page',
    compact: 'page',
  },
  skills: {
    icon: SkillsIcon,
    component: Skills,
    title: 'Habilidades',
    scope: 'both',
    expanded: 'page',
    compact: 'page',
  },
  artifacts: {
    icon: ArtifactsIcon,
    component: Artifacts,
    title: 'Artefactos',
    scope: 'both',
    expanded: 'page',
    compact: 'page',
  },
  settings: {
    icon: GearIcon,
    title: 'Ajustes',
    scope: 'both',
    expanded: 'modal',
    compact: 'page',
  },
  chat: {
    icon: SidebarToggleIcon,
    title: 'Chat',
    scope: 'both',
    expanded: 'pane',
    compact: 'pane',
  },
  files: { icon: FileIcon, title: 'Archivos', scope: 'both', expanded: 'pane', compact: 'pane' },
  changes: {
    icon: ChangesIcon,
    title: 'Cambios',
    scope: 'both',
    expanded: 'pane',
    compact: 'pane',
  },
  subagents: {
    icon: BranchIcon,
    title: 'Subagentes',
    scope: 'both',
    expanded: 'pane',
    compact: { notYet: 'La inspección de subagentes aún no está disponible en carriles remotos.' },
  },
  terminal: {
    icon: TerminalIcon,
    title: 'Terminal',
    scope: 'both',
    expanded: 'pane',
    compact: 'pane',
  },
} satisfies Record<Page | LanePane | 'lanes' | 'new', Screen>

export function GlobalScreen({
  page,
  workspacePath,
}: {
  page: GlobalPage
  workspacePath: string
}): React.JSX.Element {
  const Component = SCREENS[page].component
  return (
    <Suspense
      fallback={
        <p role="status" className="p-4">
          Cargando {SCREENS[page].title}…
        </p>
      }
    >
      <Component workspacePath={workspacePath} />
    </Suspense>
  )
}
