<template>
  <transition name="toast-fade">
    <div v-if="visible" class="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded shadow-lg z-50 min-w-[200px] flex items-center">
      <span>{{ message }}</span>
      <button class="ml-4 text-white/70 hover:text-white" @click="close">✕</button>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';
const visible = ref(false);
const message = ref('');
let timeout = null;

function show(msg, duration = 2500) {
  message.value = msg;
  visible.value = true;
  clearTimeout(timeout);
  timeout = setTimeout(() => { visible.value = false; }, duration);
}
function close() {
  visible.value = false;
  clearTimeout(timeout);
}

defineExpose({ show });
</script>

<style scoped>
.toast-fade-enter-active, .toast-fade-leave-active {
  transition: opacity 0.3s;
}
.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
}
</style> 