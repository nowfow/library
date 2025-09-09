import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Импорт стилей
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import './index.css'

// Импорт компонентов
import App from './App.vue'
import MainAndSearch from './components/MainAndSearch.vue'
import WorkDetails from './components/WorkDetails.vue'
import TermsPage from './components/TermsPage.vue'
import CloudFiles from './components/CloudFiles.vue'
import LoginRegister from './components/LoginRegister.vue'
import CollectionsPage from './components/CollectionsPage.vue'
import CollectionItems from './components/CollectionItems.vue'

// Импорт сервисов
import { isAuthenticated } from './services/auth.js'

// Конфигурация Vuetify
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976d2',
          secondary: '#424242',
          accent: '#82b1ff',
          error: '#ff5252',
          info: '#2196f3',
          success: '#4caf50',
          warning: '#fb8c00',
        }
      }
    }
  }
})

// Конфигурация маршрутов
const routes = [
  {
    path: '/',
    name: 'Home',
    component: MainAndSearch,
    meta: { title: 'Главная - Поиск произведений' }
  },
  {
    path: '/work/:composer/:work',
    name: 'WorkDetails',
    component: WorkDetails,
    meta: { title: 'Детали произведения' },
    props: route => ({
      composer: route.params.composer,
      workTitle: route.params.work
    })
  },
  {
    path: '/terms',
    name: 'Terms',
    component: TermsPage,
    meta: { title: 'Музыкальные термины' }
  },
  {
    path: '/cloud',
    name: 'CloudFiles',
    component: CloudFiles,
    meta: { title: 'Файлы из облака' }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginRegister,
    meta: { title: 'Вход в систему' }
  },
  {
    path: '/collections',
    name: 'Collections',
    component: CollectionsPage,
    meta: { requiresAuth: true, title: 'Мои коллекции' }
  },
  {
    path: '/collections/:id',
    name: 'CollectionItems',
    component: CollectionItems,
    meta: { requiresAuth: true, title: 'Коллекция' },
    props: route => ({ 
      collection: { 
        id: Number(route.params.id), 
        name: '' 
      } 
    })
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

// Создание роутера
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Навигационные охранники
router.beforeEach((to, from, next) => {
  // Обновление заголовка страницы
  if (to.meta.title) {
    document.title = `${to.meta.title} - Музыкальная библиотека`
  }

  // Проверка аутентификации
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

// Создание и монтирование приложения
const app = createApp(App)

app.use(vuetify)
app.use(router)

// Глобальные свойства
app.config.globalProperties.$apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

app.mount('#app')