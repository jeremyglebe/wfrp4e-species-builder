<template>
    <NpcBuilderApp :on-close="onClose" />
</template>

<script setup lang="ts">
import NpcBuilderApp from './npc-builder/NpcBuilderApp.vue';

type CloseCallback = () => void;

defineProps<{
    onClose?: CloseCallback;
}>();
</script>
