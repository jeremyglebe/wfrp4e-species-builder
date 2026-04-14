<script setup lang="ts">
import { computed, ref } from 'vue';

type FoundryDragData = Record<string, unknown> & {
  type?: string;
  uuid?: string;
  id?: string;
  pack?: string;
};

type DroppedDocument = ClientDocument | null;

interface DocumentDropPayload {
  dragData: FoundryDragData;
  document: DroppedDocument;
}

const props = withDefaults(
  defineProps<{
    label?: string;
    acceptedDragTypes?: string[];
    resolveDocument?: boolean;
    disabled?: boolean;
  }>(),
  {
    label: 'Drop document here',
    acceptedDragTypes: () => [],
    resolveDocument: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'drop-document', payload: DocumentDropPayload): void;
  (e: 'drop-invalid', payload: { dragData: FoundryDragData | null; reason: string }): void;
}>();

const isDragging = ref(false);

const helpText = computed(() => {
  if (!props.acceptedDragTypes.length) return props.label;
  return `${props.label} (${props.acceptedDragTypes.join(', ')})`;
});

function onDragEnter(event: DragEvent): void {
  if (props.disabled) return;
  event.preventDefault();
  isDragging.value = true;
}

function onDragOver(event: DragEvent): void {
  if (props.disabled) return;
  event.preventDefault();
}

function onDragLeave(event: DragEvent): void {
  if (props.disabled) return;

  const currentTarget = event.currentTarget as HTMLElement | null;
  const relatedTarget = event.relatedTarget as Node | null;

  if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
    return;
  }

  isDragging.value = false;
}

async function onDrop(event: DragEvent): Promise<void> {
  if (props.disabled) return;

  event.preventDefault();
  isDragging.value = false;

  const dragData = getFoundryDragData(event);

  if (!dragData) {
    emit('drop-invalid', {
      dragData: null,
      reason: 'Could not read drag data.',
    });
    return;
  }

  if (props.acceptedDragTypes.length > 0) {
    const droppedType = String(dragData.type ?? '');

    if (!props.acceptedDragTypes.includes(droppedType)) {
      emit('drop-invalid', {
        dragData,
        reason: `Unsupported drag type: ${droppedType || 'unknown'}`,
      });
      return;
    }
  }

  const document = props.resolveDocument ? await resolveDroppedDocument(dragData) : null;

  emit('drop-document', {
    dragData,
    document,
  });
}

function getFoundryDragData(event: DragEvent): FoundryDragData | null {
  try {
    return TextEditor.getDragEventData(event) as FoundryDragData;
  } catch {
    return null;
  }
}

async function resolveDroppedDocument(dragData: FoundryDragData): Promise<DroppedDocument> {
  const uuid = String(dragData.uuid ?? '').trim();
  if (!uuid) return null;

  try {
    const resolved = await fromUuid(uuid);
    return (resolved as DroppedDocument) ?? null;
  } catch {
    return null;
  }
}
</script>

<template>
  <div
    class="document-drop-zone"
    :class="{
      'is-dragging': isDragging,
      'is-disabled': disabled,
    }"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <slot>
      <p class="document-drop-zone__label">{{ helpText }}</p>
    </slot>
  </div>
</template>

<style scoped lang="scss">
.document-drop-zone {
  border: 2px dashed rgb(255 255 255 / 12%);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  background: rgb(255 255 255 / 2%);
  transition:
    border-color 140ms ease,
    background 140ms ease;

  &.is-dragging {
    border-color: rgb(255 255 255 / 28%);
    background: rgb(255 255 255 / 6%);
  }

  &.is-disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &__label {
    margin: 0;
  }
}
</style>
