import { createApp } from 'vue';
import App from './App.vue';
import './index.css';

import { createRouter, createWebHistory } from 'vue-router';
import MainAndSearch from './components/MainAndSearch.vue';
import WorkDetails from './components/WorkDetails.vue';
import TermsPage from './components/TermsPage.vue';
import CloudFiles from './components/CloudFiles.vue';
import LoginRegister from './components/LoginRegister.vue';
import CollectionsPage from './components/CollectionsPage.vue';
import CollectionItems from './components/CollectionItems.vue';
import { isAuthenticated } from './services/auth.js';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: MainAndSearch
  },
  {
    path: '/work/:composer/:work',
    name: 'WorkDetails',
    component: WorkDetails
  },
  {
    path: '/terms',
    name: 'Terms',
    component: TermsPage
  },
  {
    path: '/cloud',
    name: 'CloudFiles',
    component: CloudFiles
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginRegister
  },
  {
    path: '/collections',
    name: 'Collections',
    component: CollectionsPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/collections/:id',
    name: 'CollectionItems',
    component: CollectionItems,
    meta: { requiresAuth: true },
    props: route => ({ collection: { id: Number(route.params.id), name: '' } })
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({ name: 'Login' });
  } else {
    next();
  }
});

const app = createApp(App);
app.use(router);
app.mount('#app'); 