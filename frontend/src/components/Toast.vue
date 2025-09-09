<template>
  <v-snackbar
    v-model="show"
    :color="color"
    :timeout="timeout"
    location="top right"
    variant="elevated"
    rounded="pill"
  >
    <div class="d-flex align-center">
      <v-icon class="mr-2">{{ icon }}</v-icon>
      <span>{{ message }}</span>
    </div>
    
    <template v-slot:actions>
      <v-btn
        variant="text"
        icon="mdi-close"
        size="small"
        @click="hide"
      />
    </template>
  </v-snackbar>
</template>

<script setup>
import { ref, computed } from 'vue'

const show = ref(false)
const message = ref('')
const type = ref('info')
const timeout = ref(4000)

// Определение цвета и иконки на основе типа
const color = computed(() => {
  const colors = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info'
  }
  return colors[type.value] || 'info'
})

const icon = computed(() => {
  const icons = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information'
  }
  return icons[type.value] || 'mdi-information'
})

// Методы для управления уведомлением
function showToast(msg, msgType = 'info', duration = 4000) {
  message.value = msg
  type.value = msgType
  timeout.value = duration
  show.value = true
}

function hide() {
  show.value = false
}

// Экспортируем методы для использования в родительском компоненте
defineExpose({
  show: showToast,
  hide
})
</script>

<style scoped>
.v-snackbar {
  z-index: 9999;
}
</style>