<template>
  <div class="max-w-sm mx-auto mt-10 p-6 bg-white rounded shadow">
    <h2 class="text-xl font-bold mb-4">{{ isLogin ? 'Вход' : 'Регистрация' }}</h2>
    <form @submit.prevent="handleSubmit">
      <input v-model="email" type="email" placeholder="Email" class="input mb-2 w-full" required />
      <input v-model="password" type="password" placeholder="Пароль" class="input mb-4 w-full" required />
      <button class="btn w-full" :disabled="loading">
        {{ isLogin ? 'Войти' : 'Зарегистрироваться' }}
      </button>
      <div v-if="error" class="text-red-500 mt-2">{{ error }}</div>
    </form>
    <div class="mt-4 text-center">
      <button class="text-blue-600 underline" @click="isLogin = !isLogin">
        {{ isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { login, register } from '../services/auth.js';

const emit = defineEmits(['auth-success']);
const isLogin = ref(true);
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    if (isLogin.value) {
      await login(email.value, password.value);
      window.location.reload(); // Перезагрузка страницы после входа
    } else {
      await register(email.value, password.value);
      isLogin.value = true;
      window.location.reload(); // Перезагрузка после регистрации
    }
  } catch (e) {
    error.value = e.response?.data?.message || 'Ошибка';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.input {
  @apply border rounded px-3 py-2;
}
.btn {
  @apply bg-blue-600 text-white rounded px-4 py-2 font-bold hover:bg-blue-700 transition;
}
</style> 