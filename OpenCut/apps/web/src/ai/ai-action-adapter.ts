import {
  createActionPreviews as createSharedActionPreviews,
  type ActionPreview,
  type ActionPreviewStatus,
} from '@opencut-studio/ai-editor-adapter'
import type { EditorAction } from './ai-command'

export type { ActionPreview, ActionPreviewStatus }

export function createActionPreviews(actions: EditorAction[]): ActionPreview[] {
  return createSharedActionPreviews(actions).previews
}
