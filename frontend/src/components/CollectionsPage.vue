<template>
  <div class="max-w-2xl mx-auto mt-8 p-4 bg-white rounded shadow">
    <h2 class="text-2xl font-bold mb-4">Мои коллекции</h2>
    <form @submit.prevent="create" class="flex mb-4 gap-2">
      <input v-model="newName" class="input flex-1" placeholder="Название коллекции" required />
      <button class="btn" :disabled="loading">Создать</button>
    </form>
    <div v-if="error" class="text-red-500 mb-2">{{ error }}</div>
    <ul>
      <li v-for="col in collections" :key="col.id" class="flex items-center justify-between border-b py-2">
        <router-link :to="{ name: 'CollectionItems', params: { id: col.id } }" class="text-blue-600 hover:underline font-medium">
          {{ col.name }}
        </router-link>
        <button class="text-red-600 hover:underline" @click="remove(col.id)" :disabled="loading">Удалить</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getCollections, createCollection, deleteCollection } from '../services/collections.js';

const collections = ref([]);
const newName = ref('');
const error = ref('');
const loading = ref(false);

async function load() {
  try {
    const res = await getCollections();
    collections.value = res.data;
  } catch (e) {
    error.value = e.response?.data?.message || 'Ошибка';
  }
}

async function create() {
  error.value = '';
  loading.value = true;
  try {
    await createCollection(newName.value);
    newName.value = '';
    await load();
  } catch (e) {
    error.value = e.response?.data?.message || 'Ошибка';
  } finally {
    loading.value = false;
  }
}

async function remove(id) {
  error.value = '';
  loading.value = true;
  try {
    await deleteCollection(id);
    await load();
  } catch (e) {
    error.value = e.response?.data?.message || 'Ошибка';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.input {
  @apply border rounded px-3 py-2;
}
.btn {
  @apply bg-blue-600 text-white rounded px-4 py-2 font-bold hover:bg-blue-700 transition;
}
</style> 