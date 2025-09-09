<template>
  <v-app>
    <!-- Боковая навигация для десктопа -->
    <SideNav v-if="!$vuetify.display.mobile" />
    
    <!-- Основное содержимое -->
    <v-main>
      <v-container fluid class="pa-0">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- Нижняя навигация для мобильных -->
    <BottomNav v-if="$vuetify.display.mobile" />

    <!-- Глобальные уведомления -->
    <Toast ref="toast" />
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import SideNav from './components/SideNav.vue'
import BottomNav from './components/BottomNav.vue'
import Toast from './components/Toast.vue'

const toast = ref(null)

// Глобальное управление уведомлениями
window.showToast = (message, type = 'info') => {
  if (toast.value) {
    toast.value.show(message, type)
  }
}
</script>

<style>
/* Переходы между страницами */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>