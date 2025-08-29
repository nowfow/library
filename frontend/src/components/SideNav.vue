<template>
  <nav class="hidden md:flex fixed left-0 top-0 h-full w-48 bg-gray-100 p-4 flex-col gap-4 shadow">
    <router-link to="/">Поиск нот</router-link>
    <router-link to="/terms">Термины</router-link>
    <router-link to="/cloud">Файлы</router-link>
    <router-link to="/collections">Мои коллекции</router-link>
    <div v-if="isAuth" class="text-xs text-gray-500 mb-2">{{ userEmail }}</div>
    <button v-if="isAuth" @click="logoutAndGo" class="text-red-600 text-left">Выйти</button>
    <router-link v-else to="/login">Вход / Регистрация</router-link>
  </nav>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { isAuthenticated, logout, getToken } from '../services/auth.js';

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}

const router = useRouter();
const isAuth = ref(isAuthenticated());
const userEmail = ref('');

function updateUser() {
  isAuth.value = isAuthenticated();
  if (isAuth.value) {
    const token = getToken();
    const payload = parseJwt(token);
    userEmail.value = payload.email || '';
  } else {
    userEmail.value = '';
  }
}

router.afterEach(updateUser);
updateUser();

function logoutAndGo() {
  logout();
  updateUser();
  router.push('/login');
}
</script> 