<template>
  <div class="panel">
    <h2>Hello from Vue 👋</h2>

    <p>Count: {{ count }}</p>

    <button @click="increment">
      Increment
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);

function increment() {
  count.value++;
}
</script>

<style scoped>
#root {
  padding: 1rem;
}

.panel {
  padding: 0.5rem;
  border: 1px solid;
}
</style>
