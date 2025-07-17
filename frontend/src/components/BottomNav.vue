<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-14 shadow-md md:hidden z-50">
    <router-link to="/" class="flex flex-col items-center flex-1 py-1" :class="isActive('/')">
      <span class="text-xl">🎼</span>
      <span class="text-xs block">Поиск</span>
    </router-link>
    <router-link to="/terms" class="flex flex-col items-center flex-1 py-1" :class="isActive('/terms')">
      <span class="text-xl">📖</span>
      <span class="text-xs block">Термины</span>
    </router-link>
    <router-link to="/cloud" class="flex flex-col items-center flex-1 py-1" :class="isActive('/cloud')">
      <span class="text-xl">☁️</span>
      <span class="text-xs block">Файлы</span>
    </router-link>
    <router-link to="/collections" class="flex flex-col items-center flex-1 py-1" :class="isActive('/collections')">
      <span class="text-xl">📚</span>
      <span class="text-xs block">Коллекции</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router';
const route = useRoute();
function isActive(path) {
  return route.path === path ? 'text-blue-600 font-bold' : 'text-gray-500';
}
</script>

<style scoped>
button:active, .router-link-active { background: #f3f4f6; }
</style> 