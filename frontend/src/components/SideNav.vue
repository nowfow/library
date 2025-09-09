<template>
  <v-navigation-drawer
    v-model="drawer"
    permanent
    app
    width="280"
    class="drawer-border"
  >
    <!-- Заголовок приложения -->
    <v-list-item class="pa-4">
      <v-list-item-content>
        <v-list-item-title class="text-h6 font-weight-bold text-primary">
          <v-icon class="mr-2">mdi-music-note</v-icon>
          Музыкальная библиотека
        </v-list-item-title>
        <v-list-item-subtitle class="text-caption">
          Библиотека нот для валторны
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-divider />

    <!-- Информация о пользователе -->
    <v-list-item v-if="isAuthenticated" class="pa-4">
      <v-list-item-avatar>
        <v-icon size="40" color="primary">mdi-account-circle</v-icon>
      </v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title class="text-body-2 font-weight-medium">
          {{ user?.name || 'Пользователь' }}
        </v-list-item-title>
        <v-list-item-subtitle class="text-caption">
          {{ user?.email }}
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-divider v-if="isAuthenticated" />

    <!-- Главное меню -->
    <v-list nav dense>
      <v-list-item
        v-for="item in menuItems"
        :key="item.name"
        :to="item.to"
        :disabled="item.requiresAuth && !isAuthenticated"
        color="primary"
        class="ma-1 rounded"
      >
        <template v-slot:prepend>
          <v-icon>{{ item.icon }}</v-icon>
        </template>
        <v-list-item-title>{{ item.title }}</v-list-item-title>
        <template v-slot:append v-if="item.badge">
          <v-chip size="small" color="primary" variant="elevated">
            {{ item.badge }}
          </v-chip>
        </template>
      </v-list-item>
    </v-list>

    <v-divider class="my-4" />

    <!-- Быстрые действия -->
    <v-list nav dense>
      <v-list-subheader class="text-uppercase text-caption font-weight-bold">
        Быстрые действия
      </v-list-subheader>
      
      <v-list-item
        v-if="!isAuthenticated"
        to="/login"
        color="success"
        class="ma-1 rounded"
      >
        <template v-slot:prepend>
          <v-icon>mdi-login</v-icon>
        </template>
        <v-list-item-title>Войти</v-list-item-title>
      </v-list-item>

      <v-list-item
        v-if="isAuthenticated"
        @click="handleLogout"
        color="error"
        class="ma-1 rounded"
      >
        <template v-slot:prepend>
          <v-icon>mdi-logout</v-icon>
        </template>
        <v-list-item-title>Выйти</v-list-item-title>
      </v-list-item>
    </v-list>

    <!-- Подвал -->
    <template v-slot:append>
      <v-divider />
      <v-list dense>
        <v-list-item class="pa-2">
          <v-list-item-content class="text-center">
            <v-list-item-subtitle class="text-caption">
              © 2024 Музыкальная библиотека
            </v-list-item-subtitle>
            <v-list-item-subtitle class="text-caption">
              Версия 1.0.0
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { isAuthenticated, logout, getMe } from '../services/auth.js'

const router = useRouter()
const route = useRoute()
const drawer = ref(true)
const user = ref(null)

// Пункты меню
const menuItems = computed(() => [
  {
    title: 'Главная',
    icon: 'mdi-home',
    to: '/',
    name: 'Home'
  },
  {
    title: 'Поиск произведений',
    icon: 'mdi-magnify',
    to: '/',
    name: 'Home'
  },
  {
    title: 'Музыкальные термины',
    icon: 'mdi-book-open-variant',
    to: '/terms',
    name: 'Terms'
  },
  {
    title: 'Файлы из облака',
    icon: 'mdi-cloud',
    to: '/cloud',
    name: 'CloudFiles'
  },
  {
    title: 'Мои коллекции',
    icon: 'mdi-folder-multiple',
    to: '/collections',
    name: 'Collections',
    requiresAuth: true,
    badge: user.value?.collectionsCount || null
  }
])

// Загрузка информации о пользователе
async function loadUser() {
  if (isAuthenticated()) {
    try {
      const response = await getMe()
      user.value = response.data.user
    } catch (error) {
      console.error('Ошибка загрузки информации о пользователе:', error)
    }
  }
}

// Выход из системы
async function handleLogout() {
  try {
    await logout()
    user.value = null
    router.push('/login')
    window.showToast('Вы успешно вышли из системы', 'success')
  } catch (error) {
    console.error('Ошибка выхода из системы:', error)
    window.showToast('Ошибка при выходе из системы', 'error')
  }
}

onMounted(() => {
  loadUser()
})
</script>

<style scoped>
.drawer-border {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.v-list-item--active {
  background-color: rgba(25, 118, 210, 0.08);
}

.v-list-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>