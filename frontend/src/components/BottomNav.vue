<template>
  <v-bottom-navigation
    v-model="activeTab"
    app
    color="primary"
    grow
    height="70"
  >
    <v-btn
      v-for="item in navItems"
      :key="item.name"
      :value="item.name"
      :to="item.to"
      :disabled="item.requiresAuth && !isAuthenticated"
      stacked
      class="text-caption"
    >
      <v-icon size="24">{{ item.icon }}</v-icon>
      <span class="mt-1">{{ item.title }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { isAuthenticated } from '../services/auth.js'

const route = useRoute()
const activeTab = ref(null)

// Элементы навигации
const navItems = computed(() => [
  {
    title: 'Главная',
    icon: 'mdi-home',
    to: '/',
    name: 'home'
  },
  {
    title: 'Термины',
    icon: 'mdi-book-open-variant',
    to: '/terms',
    name: 'terms'
  },
  {
    title: 'Облако',
    icon: 'mdi-cloud',
    to: '/cloud',
    name: 'cloud'
  },
  {
    title: 'Коллекции',
    icon: 'mdi-folder-multiple',
    to: '/collections',
    name: 'collections',
    requiresAuth: true
  },
  {
    title: isAuthenticated() ? 'Профиль' : 'Вход',
    icon: isAuthenticated() ? 'mdi-account' : 'mdi-login',
    to: isAuthenticated() ? '/profile' : '/login',
    name: 'auth'
  }
])

// Отслеживание текущего маршрута
watch(
  () => route.path,
  (newPath) => {
    // Определяем активную вкладку на основе текущего пути
    if (newPath === '/') {
      activeTab.value = 'home'
    } else if (newPath.startsWith('/terms')) {
      activeTab.value = 'terms'
    } else if (newPath.startsWith('/cloud')) {
      activeTab.value = 'cloud'
    } else if (newPath.startsWith('/collections')) {
      activeTab.value = 'collections'
    } else if (newPath.startsWith('/login') || newPath.startsWith('/profile')) {
      activeTab.value = 'auth'
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.v-bottom-navigation {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}
</style>