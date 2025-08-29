<template>
  <div class="max-w-xl mx-auto p-4">
    <button @click="goBack" class="mb-4 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm flex items-center">
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      Назад
    </button>
    <h1 class="text-2xl font-bold mb-2">{{ workTitle }}<span v-if="composer"> — {{ composer }}</span></h1>
    <button v-if="isAuthenticated()" class="mb-4 btn" @click="openAddModal">Добавить в коллекцию</button>
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
    <!-- Модалка выбора коллекции -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div class="bg-white rounded shadow p-6 w-full max-w-xs relative">
        <button class="absolute top-2 right-2 text-gray-400 hover:text-black" @click="showAddModal = false">✕</button>
        <h3 class="text-lg font-bold mb-2">Добавить в коллекцию</h3>
        <div v-if="collections.length === 0" class="text-gray-500 mb-2">Нет коллекций</div>
        <div v-else>
          <select v-model="selectedCollectionId" class="input w-full mb-2">
            <option disabled value="">Выберите коллекцию</option>
            <option v-for="col in collections" :key="col.id" :value="col.id">{{ col.name }}</option>
          </select>
          <button class="btn w-full" :disabled="!selectedCollectionId || addLoading" @click="addToCollection">Добавить</button>
        </div>
        <div v-if="addError" class="text-red-500 mt-2">{{ addError }}</div>
        <div v-if="addSuccess" class="text-green-600 mt-2">{{ addSuccess }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import LazyThumbnail from './LazyThumbnail.vue';
import { isAuthenticated } from '../services/auth.js';
import { getCollections, addItemToCollection } from '../services/collections.js';

const apiUrl = import.meta.env.VITE_API_URL || '';

const route = useRoute();
const router = useRouter();
const composer = route.params.composer;
const workTitle = route.params.work;

const files = ref([]);
const isLoading = ref(true);
const error = ref('');

const showAddModal = ref(false);
const collections = ref([]);
const addError = ref('');
const addSuccess = ref('');
const addLoading = ref(false);
const selectedCollectionId = ref(null);
const showToast = inject('showToast');

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

function openAddModal() {
  showAddModal.value = true;
  addError.value = '';
  addSuccess.value = '';
  selectedCollectionId.value = null;
  loadCollections();
}

async function loadCollections() {
  try {
    const res = await getCollections();
    collections.value = res.data;
  } catch (e) {
    collections.value = [];
  }
}

async function addToCollection() {
  if (!selectedCollectionId.value) return;
  addLoading.value = true;
  addError.value = '';
  addSuccess.value = '';
  try {
    const workId = files.value[0]?.work_id;
    if (!workId) throw new Error('work_id не найден');
    await addItemToCollection(selectedCollectionId.value, workId);
    addSuccess.value = 'Добавлено!';
    showToast && showToast('Добавлено в коллекцию!');
    setTimeout(() => { showAddModal.value = false; }, 1000);
  } catch (e) {
    addError.value = e.response?.data?.message || 'Ошибка';
    showToast && showToast(addError.value, 3000);
  } finally {
    addLoading.value = false;
  }
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
    files.value = data;
  } catch (e) {
    error.value = 'Ошибка загрузки данных о произведении или файлах.';
    files.value = [];
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
.btn {
  @apply bg-blue-600 text-white rounded px-4 py-2 font-bold hover:bg-blue-700 transition;
}
.input {
  @apply border rounded px-3 py-2;
}
</style> 