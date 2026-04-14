<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

type CloseReason = 'programmatic' | 'backdrop' | 'escape' | 'button';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    title?: string;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
    width?: string;
  }>(),
  {
    show: false,
    title: '',
    closeOnBackdrop: true,
    closeOnEscape: true,
    showCloseButton: true,
    width: '42rem',
  },
);

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'open'): void;
  (e: 'opened'): void;
  (e: 'close', reason: CloseReason): void;
  (e: 'closed', reason: CloseReason): void;
}>();

const dialogRef = ref<HTMLDialogElement | null>(null);
const isOpen = ref(false);
const isClosing = ref(false);

const dialogStyle = computed(() => ({
  '--modal-width': props.width,
}));

async function open(): Promise<void> {
  const dialog = dialogRef.value;
  if (!dialog || dialog.open) return;

  isOpen.value = false;
  isClosing.value = false;
  dialog.showModal();
  emit('open');

  await nextTick();
  requestAnimationFrame(() => {
    isOpen.value = true;
    emit('opened');
  });
}

function finalizeClose(reason: CloseReason): void {
  const dialog = dialogRef.value;
  if (!dialog?.open) return;

  isClosing.value = false;
  isOpen.value = false;
  dialog.close();
  emit('update:show', false);
  emit('closed', reason);
}

function close(reason: CloseReason = 'programmatic'): void {
  const dialog = dialogRef.value;
  if (!dialog?.open || isClosing.value) return;

  isClosing.value = true;
  isOpen.value = false;
  emit('close', reason);

  window.setTimeout(() => {
    finalizeClose(reason);
  }, 180);
}

function onCancel(event: Event): void {
  if (!props.closeOnEscape) {
    event.preventDefault();
    return;
  }

  event.preventDefault();
  close('escape');
}

function onBackdropClick(event: MouseEvent): void {
  if (!props.closeOnBackdrop) return;
  if (event.target !== dialogRef.value) return;
  close('backdrop');
}

function onNativeClose(): void {
  emit('update:show', false);
}

watch(
  () => props.show,
  (show) => {
    if (show) {
      void open();
    } else if (dialogRef.value?.open) {
      close('programmatic');
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (dialogRef.value?.open) {
    dialogRef.value.close();
  }
});

defineExpose({
  open,
  close: (reason?: CloseReason) => close(reason ?? 'programmatic'),
});
</script>

<template>
  <dialog ref="dialogRef" class="modal" :class="{
    'is-open': isOpen,
    'is-closing': isClosing,
  }" :style="dialogStyle" @cancel="onCancel" @click="onBackdropClick" @close="onNativeClose">
    <div class="modal-panel" role="document" aria-modal="true">
      <header v-if="title || showCloseButton || $slots.header" class="modal-header">
        <slot name="header">
          <h2 v-if="title" class="modal-title">{{ title }}</h2>
        </slot>

        <button v-if="showCloseButton" type="button" class="modal-close" aria-label="Close" @click="close('button')">
          ×
        </button>
      </header>

      <section class="modal-body">
        <slot />
      </section>

      <footer v-if="$slots.actions" class="modal-actions">
        <slot name="actions" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped lang="scss">
.modal {
  border: 0;
  padding: 0;
  background: transparent;
  max-width: none;
  max-height: none;
  overflow: visible;

  &::backdrop {
    background: rgb(0 0 0 / 0%);
    transition: background 180ms ease;
  }

  &.is-open::backdrop {
    background: rgb(0 0 0 / 45%);
  }

  &-panel {
    width: min(var(--modal-width), calc(100vw - 2rem));
    max-height: calc(100vh - 2rem);
    margin: auto;
    overflow: auto;
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: 12px;
    background: var(--color-bg, #1f1f1f);
    color: var(--color-text, #e8e8e8);
    box-shadow: 0 18px 60px rgb(0 0 0 / 35%);
    transform: translateY(16px) scale(0.98);
    opacity: 0;
    transition:
      transform 180ms ease,
      opacity 180ms ease;
  }

  &.is-open &-panel {
    transform: translateY(0) scale(1);
    opacity: 1;
  }

  &.is-closing &-panel {
    transform: translateY(8px) scale(0.985);
    opacity: 0;
  }

  &-header,
  &-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1rem 0;
  }

  &-header {
    justify-content: space-between;
  }

  &-body {
    padding: 1rem;
  }

  &-actions {
    justify-content: flex-end;
    padding: 0 1rem 1rem;
  }

  &-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
  }

  &-close {
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    opacity: 0.8;

    &:hover {
      opacity: 1;
    }
  }
}
</style>
