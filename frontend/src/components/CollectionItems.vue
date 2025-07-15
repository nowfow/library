<template>
  <div v-if="collection" class="max-w-2xl mx-auto mt-8 p-4 bg-white rounded shadow">
    <h2 class="text-xl font-bold mb-4">{{ collection.name }}</h2>
    <div v-if="error" class="text-red-500 mb-2">{{ error }}</div>
    <div v-if="items.length === 0" class="text-gray-500">В коллекции пока нет произведений.</div>
    <div v-else class="grid gap-4 grid-cols-1 md:grid-cols-2">
      <div v-for="item in items" :key="item.id" class="bg-white rounded shadow p-2 flex flex-col items-center relative">
        <LazyThumbnail
          :api-url="apiUrl"
          :pdf-path="item.pdf_path"
          endpoint="/api/files/thumbnail"
          alt="Миниатюра ноты"
        />
        <div class="font-bold mt-2">{{ item.title }}</div>
        <div class="text-sm text-gray-600">{{ item.composer }}</div>
        <div v-if="item.category || item.subcategory || item.subsubcategory" class="text-xs text-gray-500 mt-1 text-center">
          <span v-if="item.category">{{ item.category }}</span>
          <span v-if="item.subcategory"> &rarr; {{ item.subcategory }}</span>
          <span v-if="item.subsubcategory"> &rarr; {{ item.subsubcategory }}</span>
        </div>
        <router-link
          :to="{ name: 'WorkDetails', params: { composer: item.composer, work: item.title } }"
          class="mt-2 text-blue-600 underline"
        >Открыть карточку</router-link>
        <button class="absolute top-2 right-2 text-red-600 hover:underline text-xs" @click="remove(item.id)" :disabled="loading">Удалить</button>
      </div>
    </div>
    <button class="mt-4 btn" @click="$emit('back')">Назад к коллекциям</button>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { getCollectionItems, removeItemFromCollection } from '../services/collections.js';
import LazyThumbnail from './LazyThumbnail.vue';
import axios from 'axios';

const props = defineProps({
  collection: Object
});
const emit = defineEmits(['back']);
const items = ref([]);
const error = ref('');
const loading = ref(false);
const apiUrl = import.meta.env.VITE_API_URL || '';

async function load() {
  if (!props.collection) return;
  try {
    const res = await getCollectionItems(props.collection.id);
    // Для каждого item получаем pdf_path и категории через API /api/works?composer=...&work=...
    const enriched = await Promise.all(res.data.map(async (item) => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/works`, {
          params: { composer: item.composer, work: item.title }
        });
        // Берём первый результат (точное совпадение)
        if (data && data.length > 0) {
          return { ...item, ...data[0] };
        }
      } catch {}
      return item;
    }));
    items.value = enriched;
  } catch (e) {
    error.value = e.response?.data?.message || 'Ошибка';
  }
}

async function remove(itemId) {
  error.value = '';
  loading.value = true;
  try {
    await removeItemFromCollection(props.collection.id, itemId);
    await load();
  } catch (e) {
    error.value = e.response?.data?.message || 'Ошибка';
  } finally {
    loading.value = false;
  }
}

watch(() => props.collection, load, { immediate: true });
</script>

<style scoped>
.btn {
  @apply bg-blue-600 text-white rounded px-4 py-2 font-bold hover:bg-blue-700 transition;
}
</style> 