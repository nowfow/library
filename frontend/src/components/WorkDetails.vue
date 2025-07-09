<template>
  <div class="max-w-xl mx-auto p-4">
    <button @click="goBack" class="mb-4 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm flex items-center">
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      Назад
    </button>
    <h1 class="text-2xl font-bold mb-2">{{ workTitle }}<span v-if="composer"> — {{ composer }}</span></h1>
    <div v-if="isSingleFile">
      <div class="flex items-center justify-between py-4">
        <span class="truncate max-w-xs">{{ workTitle }}</span>
        <a
          :href="`${apiUrl}/api/works/download?path=${encodeURIComponent(workTitle)}`"
          class="text-blue-600 hover:underline px-2 py-1 rounded hover:bg-blue-50 transition"
          download
        >
          Скачать
        </a>
      </div>
    </div>
    <template v-else>
      <div v-if="isLoading" class="text-gray-500 flex items-center"><svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Загрузка...</div>
      <div v-if="error" class="bg-red-100 text-red-700 px-3 py-2 rounded mb-4">{{ error }}</div>
      <div v-else-if="!isLoading">
        <div v-if="files.length > 0" class="mb-4 flex justify-center">
          <LazyThumbnail
            :api-url="apiUrl"
            :pdf-path="files[0].pdf_path"
            endpoint="/api/works/thumbnail"
            alt="Миниатюра"
          />
        </div>
        <ul class="divide-y">
          <li v-for="file in files" :key="file.pdf_path" class="flex items-center justify-between py-2">
            <div class="flex items-center">
              <svg v-if="getFileExt(file.pdf_path)==='pdf'" class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.828A2 2 0 0015.828 6L12 2.172A2 2 0 0010.828 2H6zm2 2h2v4a1 1 0 001 1h4v9a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1h2zm2 0v4h4l-4-4z"/></svg>
              <span class="truncate max-w-xs">{{ getFileName(file.pdf_path) }}</span>
            </div>
            <a
              :href="`${apiUrl}/api/works/download?path=${encodeURIComponent(file.pdf_path)}`"
              class="text-blue-600 hover:underline px-2 py-1 rounded hover:bg-blue-50 transition"
              download
            >
              Скачать
            </a>
          </li>
        </ul>
        <div v-if="files.length === 0" class="text-gray-500 mt-4">Нет файлов нот для этого произведения.</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import LazyThumbnail from './LazyThumbnail.vue';

const apiUrl = import.meta.env.VITE_API_URL || '';

const route = useRoute();
const router = useRouter();
const composer = route.params.composer;
const workTitle = route.params.work;

const files = ref([]);
const isLoading = ref(true);
const error = ref('');

const isSingleFile = computed(() => workTitle && workTitle.toLowerCase().endsWith('.pdf'));

function getFileName(path) {
  return path.split('/').pop();
}
function getFileExt(path) {
  return path.split('.').pop().toLowerCase();
}
function goBack() {
  router.back();
}

onMounted(async () => {
  if (isSingleFile.value) {
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  error.value = '';
  try {
    const { data } = await axios.get(`${apiUrl}/api/works/files`, {
      params: { composer, work: workTitle }
    });
    console.log('API /api/works/files data:', data);
    files.value = data;
    // Не показываем ошибку, если просто нет файлов
  } catch (e) {
    error.value = 'Ошибка загрузки данных о произведении или файлах.';
    files.value = [];
    console.error('API /api/works/files error:', e);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 