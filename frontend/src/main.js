import { createApp } from 'vue';
import App from './App.vue';
import './index.css';

import { createRouter, createWebHistory } from 'vue-router';
import MainAndSearch from './components/MainAndSearch.vue';
import WorkDetails from './components/WorkDetails.vue';
import TermsPage from './components/TermsPage.vue';
import CloudFiles from './components/CloudFiles.vue';

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
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

const app = createApp(App);
app.use(router);
app.mount('#app'); 