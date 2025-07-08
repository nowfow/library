<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-14 shadow-md md:hidden z-50">
    <button @click="$emit('navigate', 'carousel')" :class="btnClass('carousel')">
      <span class="text-xl">🎼</span>
      <span class="text-xs block">Поиск</span>
    </button>
    <button @click="$emit('navigate', 'terms')" :class="btnClass('terms')">
      <span class="text-xl">📖</span>
      <span class="text-xs block">Термины</span>
    </button>
    <button @click="$emit('navigate', 'cloud')" :class="btnClass('cloud')">
      <span class="text-xl">☁️</span>
      <span class="text-xs block">Хранилище</span>
    </button>
  </nav>
</template>

<script setup>
import { defineProps } from 'vue';
const props = defineProps({
  current: String
});
const btnClass = (p) =>
  `flex flex-col items-center flex-1 py-1 ${props.current === p ? 'text-blue-600 font-bold' : 'text-gray-500'}`;
</script>

<style scoped>
button:active { background: #f3f4f6; }
</style> 