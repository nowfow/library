<template>
  <div class="min-h-screen bg-gray-50 pb-14 md:pb-0">
    <header class="bg-white shadow p-4 flex justify-between items-center md:flex">
      <h1 class="text-2xl font-bold">Библиотека</h1>
      <nav class="space-x-4 hidden md:block">
        <button @click="page = 'carousel'" :class="navBtn('carousel')">Поиск</button>
        <button @click="page = 'terms'" :class="navBtn('terms')">Термины</button>
        <button @click="page = 'cloud'" :class="navBtn('cloud')">Облако</button>
      </nav>
    </header>
    <main class="p-4">
      <NoteCarousel v-if="page === 'carousel'" />
      <TermsPage v-else-if="page === 'terms'" />
      <CloudFiles v-else />
    </main>
    <BottomNav :current="page" @navigate="page = $event" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import NoteCarousel from './components/NoteCarousel.vue';
import TermsPage from './components/TermsPage.vue';
import CloudFiles from './components/CloudFiles.vue';
import BottomNav from './components/BottomNav.vue';

const page = ref('carousel');
const navBtn = (p) =>
  `px-4 py-2 rounded ${page.value === p ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`;
</script> 