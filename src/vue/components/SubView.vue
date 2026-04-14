<template>
  <Transition name="subview-panel">
    <section v-if="show" class="subview-panel">
      <header class="subview-panel__header">
        <div class="subview-panel__header-left">
          <button
            v-if="showBackButton"
            type="button"
            class="subview-panel__button"
            @click="handleBack"
          >
            ← Back
          </button>

          <div class="subview-panel__title-wrap">
            <p v-if="eyebrow" class="subview-panel__eyebrow">{{ eyebrow }}</p>
            <h2 v-if="title" class="subview-panel__title">{{ title }}</h2>
          </div>
        </div>

        <button
          v-if="showCloseButton"
          type="button"
          class="subview-panel__button subview-panel__button--ghost"
          @click="handleClose"
        >
          Close
        </button>
      </header>

      <div class="subview-panel__body">
        <slot />
      </div>
    </section>
  </Transition>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    show?: boolean;
    title?: string;
    eyebrow?: string;
    showBackButton?: boolean;
    showCloseButton?: boolean;
  }>(),
  {
    show: false,
    title: '',
    eyebrow: '',
    showBackButton: true,
    showCloseButton: false,
  },
);

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'back'): void;
  (e: 'close'): void;
}>();

function handleBack(): void {
  emit('back');
  emit('update:show', false);
}

function handleClose(): void {
  emit('close');
  emit('update:show', false);
}
</script>

<style scoped lang="scss">
.subview-panel {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: linear-gradient(180deg, rgb(39 28 22 / 98%), rgb(27 19 15 / 98%));
  border-left: 1px solid rgb(137 103 77 / 72%);
  box-shadow: -16px 0 24px rgb(0 0 0 / 28%);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.9rem 1rem;
    border-bottom: 1px solid rgb(137 103 77 / 55%);
    background: linear-gradient(180deg, rgb(90 64 47 / 24%), rgb(46 34 27 / 82%));
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  &__title-wrap {
    min-width: 0;
  }

  &__eyebrow {
    margin: 0 0 0.15rem;
    color: #d3bb9f;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.7rem;
  }

  &__title {
    margin: 0;
    color: #f9ebda;
    font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
    letter-spacing: 0.03em;
    font-size: 1.1rem;
  }

  &__body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 1rem;
  }

  &__button {
    border: 1px solid rgb(201 145 75 / 70%);
    border-radius: 7px;
    padding: 0.42rem 0.72rem;
    cursor: pointer;
    font: inherit;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #27190f;
    background: linear-gradient(180deg, #e8ba72, #c28a3d);
    transition:
      transform 0.15s ease,
      filter 0.15s ease,
      border-color 0.15s ease;

    &:hover {
      transform: translateY(-1px);
      filter: brightness(1.07);
    }

    &--ghost {
      border-color: rgb(205 103 89 / 60%);
      color: #f7d4ca;
      background: rgb(148 60 50 / 26%);
    }
  }
}

.subview-panel-enter-active,
.subview-panel-leave-active {
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}

.subview-panel-enter-from,
.subview-panel-leave-to {
  transform: translateX(24px);
  opacity: 0;
}

.subview-panel-enter-to,
.subview-panel-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>
