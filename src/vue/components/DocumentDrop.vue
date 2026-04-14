<script setup lang="ts">
import { computed, ref } from 'vue';

type FoundryDragData = Record<string, unknown> & {
  type?: string;
  uuid?: string;
  id?: string;
};

const props = withDefaults(
  defineProps<{
    label?: string;
    acceptedTypes?: string[];
    disabled?: boolean;
  }>(),
  {
    label: 'Drop document here',
    acceptedTypes: () => [],
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'drop-document', data: FoundryDragData): void;
  (e: 'drop-invalid', data: FoundryDragData | null): void;
}>();

const isDragging = ref(false);

const helpText = computed(() => {
  if (!props.acceptedTypes.length) return props.label;
  return `${props.label} (${props.acceptedTypes.join(', ')})`;
});

function onDragEnter(event: DragEvent) {
  if (props.disabled) return;
  event.preventDefault();
  isDragging.value = true;
}

function onDragOver(event: DragEvent) {
  if (props.disabled) return;
  event.preventDefault();
}

function onDragLeave(event: DragEvent) {
  if (props.disabled) return;

  const currentTarget = event.currentTarget as HTMLElement | null;
  const relatedTarget = event.relatedTarget as Node | null;

  if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
    return;
  }

  isDragging.value = false;
}

function onDrop(event: DragEvent) {
  if (props.disabled) return;

  event.preventDefault();
  isDragging.value = false;

  const dragData = getFoundryDragData(event);

  if (!dragData) {
    emit('drop-invalid', null);
    return;
  }

  if (props.acceptedTypes.length > 0) {
    const droppedType = String(dragData.type ?? '');
    if (!props.acceptedTypes.includes(droppedType)) {
      emit('drop-invalid', dragData);
      return;
    }
  }

  emit('drop-document', dragData);
}

function getFoundryDragData(event: DragEvent): FoundryDragData | null {
  try {
    return TextEditor.getDragEventData(event) as FoundryDragData;
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
    border-color: rgb(255 255 255 / 30%);
    background: rgb(255 255 255 / 6%);
  }

  &.is-disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &__label {
    margin: 0;
    font-size: 0.95rem;
  }
}
</style>
