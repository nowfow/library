<template>
  <div class="pl-2 md:pl-0 mt-4 md:mt-8 md:ml-56">
    <h2 class="text-xl font-semibold mb-4">Поиск</h2>
    <div class="mb-2 flex gap-4 items-center">
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="advanced" />
        <span>Расширенный поиск</span>
      </label>
    </div>
    <form @submit.prevent="fetchWorks" class="mb-4 flex gap-2 flex-wrap md:flex-nowrap">
      <template v-if="advanced">
        <input v-model="composer" placeholder="Композитор (например, Mozart)" class="border px-2 py-1 rounded w-full max-w-xs box-border" />
        <input v-model="work" placeholder="Произведение (например, Lacrimosa)" class="border px-2 py-1 rounded w-full max-w-xs box-border" />
      </template>
      <template v-else>
        <input v-model="composer" placeholder="Поиск по композитору и/или произведению (например, Mozart Lacrimosa)" class="border px-2 py-1 rounded w-full max-w-md box-border" />
      </template>
      <button type="submit" class="bg-blue-500 text-white px-4 py-1 rounded">Показать</button>
    </form>
    <div v-if="loading" class="text-gray-500">Загрузка...</div>
    <div v-else-if="error" class="text-red-500">Ошибка: {{ error }}</div>
    <div v-else-if="works.length === 0" class="text-gray-400">Нет данных</div>
    <div v-else class="flex gap-4 overflow-x-auto py-2">
      <div v-for="work in works" :key="work.title" class="bg-white rounded shadow p-2 min-w-[200px] flex flex-col items-center">
        <LazyThumbnail
          :api-url="apiUrl"
          :pdf-path="getApiPath(work.pdf_path)"
          endpoint="/api/files/thumbnail"
          alt="Миниатюра ноты"
        />
        <div class="font-bold">{{ work.title }}</div>
        <div class="text-sm text-gray-600">{{ work.composer }}</div>
        <div v-if="work.category || work.subcategory || work.subsubcategory" class="text-xs text-gray-500 mt-1 text-center">
          <span v-if="work.category">{{ work.category }}</span>
          <span v-if="work.subcategory"> &rarr; {{ work.subcategory }}</span>
          <span v-if="work.subsubcategory"> &rarr; {{ work.subsubcategory }}</span>
        </div>
        <router-link
          :to="{ name: 'WorkDetails', params: { composer: work.composer, work: work.title } }"
          class="mt-2 text-blue-600 underline"
        >Открыть карточку</router-link>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import LazyThumbnail from './LazyThumbnail.vue';
const composer = ref('Mozart');
const work = ref('');
const works = ref([]);
const loading = ref(false);
const error = ref('');
const advanced = ref(false);
const apiUrl = import.meta.env.VITE_API_URL || '';

function getApiPath(fullPath) {
  // Удаляем домен, все ведущие слэши, добавляем один
  return '/' + fullPath.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+/, '');
}

async function fetchWorks() {
  loading.value = true;
  error.value = '';
  works.value = [];
  try {
    let url = '';
    if (advanced.value) {
      url = `${apiUrl}/api/works?composer=${encodeURIComponent(composer.value)}&work=${encodeURIComponent(work.value)}`;
    } else {
      url = `${apiUrl}/api/works?composer=${encodeURIComponent(composer.value)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Ошибка запроса: ' + res.status);
    works.value = await res.json();
  } catch (e) {
    error.value = 'Не удалось загрузить данные: ' + e.message;
  } finally {
    loading.value = false;
  }
}
</script> 