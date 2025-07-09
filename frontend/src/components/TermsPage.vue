<template>
  <div>
    <h2 class="text-xl font-semibold mb-4">Музыкальные термины</h2>
    <form @submit.prevent="fetchTerms" class="mb-4 flex gap-2">
      <input v-model="query" placeholder="Поиск по термину..." class="border px-2 py-1 rounded w-64" />
      <button type="submit" class="bg-blue-500 text-white px-4 py-1 rounded">Поиск</button>
    </form>
    <div v-if="loading" class="text-gray-500">Загрузка...</div>
    <div v-else-if="error" class="text-red-500">Ошибка: {{ error }}</div>
    <div v-else-if="terms.length === 0" class="text-gray-400">Нет данных</div>
    <ul v-else class="space-y-2">
      <li v-for="term in terms" :key="term.term" class="bg-white rounded shadow p-2">
        <div class="font-bold">{{ term.term }}</div>
        <div class="text-gray-700">{{ term.description }}</div>
      </li>
    </ul>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const query = ref('');
const terms = ref([]);
const loading = ref(false);
const error = ref('');
const apiUrl = import.meta.env.VITE_API_URL || '';

async function fetchTerms() {
  loading.value = true;
  error.value = '';
  terms.value = [];
  try {
    const res = await fetch(`${apiUrl}/api/terms/search?q=${encodeURIComponent(query.value)}`);
    if (!res.ok) throw new Error('Ошибка запроса: ' + res.status);
    terms.value = await res.json();
  } catch (e) {
    error.value = 'Не удалось загрузить данные: ' + e.message;
  } finally {
    loading.value = false;
  }
}
</script> 