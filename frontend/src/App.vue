<template>
  <div class="md:pl-48">
    <SideNav />
    <router-view />
    <BottomNav />
  </div>
</template>

<script setup>
import BottomNav from './components/BottomNav.vue';
import SideNav from './components/SideNav.vue';
// Можно добавить глобальные стили, навигацию и т.д.
</script> 