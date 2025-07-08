<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">Хранилище</h2>
    <div class="mb-2 flex items-center space-x-2 text-sm text-gray-600">
      <span @click="goToRoot" class="cursor-pointer hover:underline">/</span>
      <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
        <span>/</span>
        <span @click="goToCrumb(idx)" class="cursor-pointer hover:underline">{{ crumb }}</span>
      </template>
    </div>
    <input v-model="search" type="text" placeholder="Поиск..." class="mb-4 px-2 py-1 border rounded w-full max-w-xs" />
    <div v-if="isLoading" class="text-gray-500">Загрузка...</div>
    <div v-else-if="hasError" class="text-red-500">Ошибка: {{ errorMessage }}</div>
    <ul v-else class="space-y-2">
      <li v-for="file in filteredFiles" :key="file.filename || file.basename" class="flex items-center border rounded p-2 bg-white shadow-sm">
        <span class="mr-2">
          <span v-if="file.type === 'directory'">📁</span>
          <span v-else>📄</span>
        </span>
        <span
          v-if="file.type === 'directory'"
          class="text-blue-600 cursor-pointer hover:underline"
          @click="enterDir(file.basename || file.filename)"
        >
          {{ file.basename || file.filename }}
        </span>
        <span v-else class="flex-1">{{ file.basename || file.filename }}</span>
        <button v-if="file.type !== 'directory'" @click="downloadFile(file)" class="ml-4 text-blue-500 hover:underline text-xs">Скачать</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const files = ref([]);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');
const path = ref(['/']);
const search = ref('');

const breadcrumbs = computed(() => path.value.slice(1));

const currentPath = computed(() =>
  path.value.length === 1 ? '/' : path.value.join('/').replace(/\\/g, '/')
);

const filteredFiles = computed(() => {
  let arr = [...files.value];
  arr = arr.filter(f => {
    // Не показывать папку внутри самой себя
    if (f.type === 'directory') {
      const filePath = String(f.filename).replace(/^\/+|\/+$/g, '');
      const current = String(currentPath.value).replace(/^\/+|\/+$/g, '');
      if (filePath === current) return false;
    }
    // Не показывать папку /thumbnails и все её содержимое
    const filePathNorm = String(f.filename).replace(/^\/+|\/+$/g, '');
    if (filePathNorm === 'thumbnails' || filePathNorm.startsWith('thumbnails/') || filePathNorm.startsWith('thumbnails\\')) return false;
    if (filePathNorm.startsWith('thumbnails')) return false;
    if (filePathNorm.startsWith('thumbnails')) return false;
    if (filePathNorm.startsWith('thumbnails')) return false;
    if (filePathNorm.split('/')[0] === 'thumbnails') return false;
    return true;
  });
  // Сортировка: папки сверху, потом файлы, оба по алфавиту
  arr.sort((a, b) => {
    if (a.type === b.type) {
      return (a.basename || a.filename).localeCompare(b.basename || b.filename, 'ru');
    }
    return a.type === 'directory' ? -1 : 1;
  });
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    arr = arr.filter(f => (f.basename || f.filename).toLowerCase().includes(q));
  }
  return arr;
});

async function fetchFiles() {
  isLoading.value = true;
  hasError.value = false;
  try {
    const res = await fetch(`/api/files/cloud/list?path=${encodeURIComponent(currentPath.value)}`);
    if (!res.ok) throw new Error('Ошибка загрузки: ' + res.status);
    files.value = await res.json();
    console.log('FILES:', files.value, 'currentPath:', currentPath.value);
    files.value.forEach(f => console.log('FILE_OBJ:', f));
  } catch (err) {
    hasError.value = true;
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

function enterDir(dir) {
  path.value.push(dir);
  fetchFiles();
}
function goToRoot() {
  path.value = ['/'];
  fetchFiles();
}
function goToCrumb(idx) {
  path.value = path.value.slice(0, idx + 2);
  fetchFiles();
}
async function downloadFile(file) {
  const filePath = (currentPath.value === '/' ? '' : currentPath.value + '/') + (file.basename || file.filename);
  const url = `/api/files/pdf?pdf_path=${encodeURIComponent(filePath)}`;
  window.open(url, '_blank');
}

fetchFiles();
</script>

<style scoped>
li:hover { background: #f3f4f6; }
</style> 