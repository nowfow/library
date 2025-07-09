<template>
  <nav class="hidden md:flex flex-col w-48 h-screen bg-white border-r shadow-md py-6 px-2 fixed top-0 left-0 z-40">
    <router-link to="/" class="flex items-center gap-3 px-3 py-2 rounded mb-2" :class="isActive('/')">
      <span class="text-2xl">🎼</span>
      <span class="font-medium">Поиск</span>
    </router-link>
    <router-link to="/terms" class="flex items-center gap-3 px-3 py-2 rounded mb-2" :class="isActive('/terms')">
      <span class="text-2xl">📖</span>
      <span class="font-medium">Термины</span>
    </router-link>
    <router-link to="/cloud" class="flex items-center gap-3 px-3 py-2 rounded mb-2" :class="isActive('/cloud')">
      <span class="text-2xl">☁️</span>
      <span class="font-medium">Хранилище</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router';
const route = useRoute();
function isActive(path) {
  return route.path === path ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-100';
}
</script> 