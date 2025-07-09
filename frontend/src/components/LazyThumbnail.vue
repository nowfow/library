<template>
  <div ref="container" class="flex justify-center items-center min-h-[160px] min-w-[80px]">
    <img
      v-if="isVisible && imageUrl"
      :src="imageUrl"
      :alt="alt"
      class="w-32 h-40 object-contain border rounded shadow transition-opacity duration-300"
      :class="{ 'opacity-0': isLoading, 'opacity-100': !isLoading }"
      @load="isLoading = false"
      loading="lazy"
    />
    <div v-else class="w-32 h-40 bg-gray-100 animate-pulse rounded flex items-center justify-center text-xs text-gray-400">
      <span v-if="error">Ошибка<br>{{ error }}</span>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
  apiUrl: { type: String, required: true },
  pdfPath: { type: String, required: true },
  alt: { type: String, default: 'Миниатюра' },
  endpoint: { type: String, default: '/api/files/thumbnail' }, // или /api/works/thumbnail
});

const container = ref(null);
const isVisible = ref(false);
const isLoading = ref(true);
const imageUrl = ref('');
const error = ref('');
let observer = null;

function fetchThumbnail() {
  isLoading.value = true;
  error.value = '';
  axios.get(`${props.apiUrl}${props.endpoint}`, {
    params: { pdf_path: props.pdfPath },
    responseType: 'blob'
  })
    .then(resp => {
      console.log('Thumbnail API response:', resp);
      imageUrl.value = URL.createObjectURL(resp.data);
    })
    .catch(e => {
      error.value = e?.response?.data?.error || e.message || 'Ошибка';
      imageUrl.value = '';
    })
    .finally(() => { isLoading.value = false; });
}

function handleIntersect(entries) {
  if (entries[0].isIntersecting) {
    isVisible.value = true;
    fetchThumbnail();
    if (observer) observer.disconnect();
  }
}

onMounted(() => {
  observer = new window.IntersectionObserver(handleIntersect, { threshold: 0.1, rootMargin: '0px 2000px' });
  if (container.value) observer.observe(container.value);
});
onBeforeUnmount(() => {
  if (observer) observer.disconnect();
});

watch(() => props.pdfPath, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    imageUrl.value = '';
    isVisible.value = false;
    isLoading.value = true;
    if (container.value && observer) observer.observe(container.value);
  }
});
</script> 