<template>
  <div class="main-search-page">
    <!-- Заголовок и поиск -->
    <v-container class="py-8">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <div class="text-center mb-8">
            <h1 class="text-h3 font-weight-bold mb-4 text-primary">
              Музыкальная библиотека
            </h1>
            <p class="text-h6 text-medium-emphasis">
              Поиск нот для валторны
            </p>
          </div>

          <!-- Панель поиска -->
          <v-card rounded="xl" elevation="4" class="pa-4">
            <v-text-field
              v-model="searchQuery"
              placeholder="Поиск по композитору, произведению или категории..."
              variant="outlined"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              @keyup.enter="performSearch"
              @input="onSearchInput"
              class="mb-4"
            />

            <!-- Фильтры -->
            <v-row v-if="showFilters" class="mt-2">
              <v-col cols="12" sm="6" md="4">
                <v-select
                  v-model="selectedCategory"
                  :items="categories"
                  label="Категория"
                  variant="outlined"
                  density="compact"
                  clearable
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-select
                  v-model="selectedComposer"
                  :items="composers"
                  label="Композитор"
                  variant="outlined"
                  density="compact"
                  clearable
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-select
                  v-model="selectedFileType"
                  :items="fileTypes"
                  label="Тип файла"
                  variant="outlined"
                  density="compact"
                  clearable
                  hide-details
                />
              </v-col>
            </v-row>

            <!-- Кнопки действий -->
            <div class="d-flex justify-space-between align-center mt-4">
              <v-btn
                variant="text"
                @click="showFilters = !showFilters"
                class="text-none"
              >
                <v-icon left>{{ showFilters ? 'mdi-chevron-up' : 'mdi-filter-variant' }}</v-icon>
                {{ showFilters ? 'Скрыть фильтры' : 'Показать фильтры' }}
              </v-btn>

              <v-btn
                color="primary"
                size="large"
                @click="performSearch"
                :loading="loading"
                class="text-none"
              >
                <v-icon left>mdi-magnify</v-icon>
                Найти
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Результаты поиска -->
    <v-container v-if="searchPerformed">
      <div class="d-flex justify-space-between align-center mb-4">
        <h2 class="text-h5">
          Результаты поиска
          <v-chip v-if="totalResults" color="primary" variant="elevated" class="ml-2">
            {{ totalResults }}
          </v-chip>
        </h2>

        <!-- Сортировка -->
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          label="Сортировка"
          variant="outlined"
          density="compact"
          style="max-width: 200px"
          hide-details
          @update:model-value="performSearch"
        />
      </div>

      <!-- Список произведений -->
      <v-row v-if="works.length">
        <v-col
          v-for="work in works"
          :key="work.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <WorkCard
            :work="work"
            @open-details="openWorkDetails"
            @add-to-collection="openAddToCollectionDialog"
          />
        </v-col>
      </v-row>

      <!-- Пустой результат -->
      <v-card v-else-if="!loading" class="pa-8 text-center">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">
          mdi-music-note-off
        </v-icon>
        <h3 class="text-h6 mb-2">Произведения не найдены</h3>
        <p class="text-body-2 text-medium-emphasis">
          Попробуйте изменить параметры поиска или очистить фильтры
        </p>
        <v-btn
          color="primary"
          variant="text"
          @click="clearSearch"
          class="mt-4"
        >
          Очистить поиск
        </v-btn>
      </v-card>

      <!-- Пагинация -->
      <div v-if="totalPages > 1" class="d-flex justify-center mt-6">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          @update:model-value="performSearch"
          total-visible="7"
          rounded="circle"
        />
      </div>
    </v-container>

    <!-- Быстрые ссылки (показываются без поиска) -->
    <v-container v-else>
      <h2 class="text-h5 mb-4">Быстрый доступ</h2>
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card
            color="primary"
            variant="elevated"
            class="pa-4 text-center text-white"
            hover
            @click="navigateTo('/terms')"
          >
            <v-icon size="48" class="mb-2">mdi-book-open-variant</v-icon>
            <h3 class="text-h6">Музыкальные термины</h3>
            <p class="text-body-2 mt-2">Словарь музыкальных терминов</p>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card
            color="success"
            variant="elevated"
            class="pa-4 text-center text-white"
            hover
            @click="navigateTo('/cloud')"
          >
            <v-icon size="48" class="mb-2">mdi-cloud</v-icon>
            <h3 class="text-h6">Файлы из облака</h3>
            <p class="text-body-2 mt-2">Просмотр файловой структуры</p>
          </v-card>
        </v-col>

        <v-col v-if="isAuthenticated" cols="12" sm="6" md="3">
          <v-card
            color="info"
            variant="elevated"
            class="pa-4 text-center text-white"
            hover
            @click="navigateTo('/collections')"
          >
            <v-icon size="48" class="mb-2">mdi-folder-multiple</v-icon>
            <h3 class="text-h6">Мои коллекции</h3>
            <p class="text-body-2 mt-2">Управление коллекциями</p>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card
            color="warning"
            variant="elevated"
            class="pa-4 text-center text-white"
            hover
            @click="showStatsDialog = true"
          >
            <v-icon size="48" class="mb-2">mdi-chart-bar</v-icon>
            <h3 class="text-h6">Статистика</h3>
            <p class="text-body-2 mt-2">Статистика библиотеки</p>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Диалог добавления в коллекцию -->
    <AddToCollectionDialog
      v-model="showAddDialog"
      :work="selectedWork"
      @added="onWorkAddedToCollection"
    />

    <!-- Диалог статистики -->
    <StatsDialog v-model="showStatsDialog" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash'
import { searchWorks, getCategories, getComposers } from '../services/works.js'
import { isAuthenticated } from '../services/auth.js'
import WorkCard from './WorkCard.vue'
import AddToCollectionDialog from './AddToCollectionDialog.vue'
import StatsDialog from './StatsDialog.vue'

const router = useRouter()

// Состояние поиска
const searchQuery = ref('')
const searchPerformed = ref(false)
const loading = ref(false)
const showFilters = ref(false)

// Фильтры
const selectedCategory = ref(null)
const selectedComposer = ref(null)
const selectedFileType = ref(null)

// Данные для фильтров
const categories = ref([])
const composers = ref([])
const fileTypes = ref([
  { title: 'PDF', value: 'pdf' },
  { title: 'MP3', value: 'mp3' },
  { title: 'Sibelius', value: 'sib' },
  { title: 'Finale', value: 'mus' }
])

// Результаты поиска
const works = ref([])
const totalResults = ref(0)
const currentPage = ref(1)
const totalPages = ref(0)
const pageSize = ref(20)

// Сортировка
const sortBy = ref('composer')
const sortOptions = ref([
  { title: 'По композитору', value: 'composer' },
  { title: 'По названию', value: 'work_title' },
  { title: 'По категории', value: 'category' },
  { title: 'По дате добавления', value: 'created_at' }
])

// Диалоги
const showAddDialog = ref(false)
const showStatsDialog = ref(false)
const selectedWork = ref(null)

// Загрузка данных для фильтров
async function loadFilterData() {
  try {
    const [categoriesRes, composersRes] = await Promise.all([
      getCategories(),
      getComposers()
    ])
    
    categories.value = categoriesRes.data.map(cat => ({
      title: cat.category,
      value: cat.category
    }))
    
    composers.value = composersRes.data.map(comp => ({
      title: comp.composer,
      value: comp.composer
    }))
  } catch (error) {
    console.error('Ошибка загрузки данных для фильтров:', error)
  }
}

// Выполнение поиска
async function performSearch() {
  if (!searchQuery.value && !selectedCategory.value && !selectedComposer.value && !selectedFileType.value) {
    return
  }

  loading.value = true
  searchPerformed.value = true

  try {
    const params = {
      q: searchQuery.value,
      category: selectedCategory.value,
      composer: selectedComposer.value,
      file_type: selectedFileType.value,
      sort_by: sortBy.value,
      sort_order: 'ASC',
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value
    }

    const response = await searchWorks(searchQuery.value, params)
    
    works.value = response.data.works || []
    totalResults.value = response.data.pagination?.total || 0
    totalPages.value = Math.ceil(totalResults.value / pageSize.value)
  } catch (error) {
    console.error('Ошибка поиска:', error)
    window.showToast('Ошибка при выполнении поиска', 'error')
  } finally {
    loading.value = false
  }
}

// Дебаунсированный поиск при вводе
const onSearchInput = debounce(() => {
  if (searchQuery.value && searchQuery.value.length >= 2) {
    currentPage.value = 1
    performSearch()
  }
}, 500)

// Очистка поиска
function clearSearch() {
  searchQuery.value = ''
  selectedCategory.value = null
  selectedComposer.value = null
  selectedFileType.value = null
  searchPerformed.value = false
  works.value = []
  currentPage.value = 1
}

// Открытие деталей произведения
function openWorkDetails(work) {
  router.push({
    name: 'WorkDetails',
    params: {
      composer: work.composer,
      work: work.work_title
    }
  })
}

// Открытие диалога добавления в коллекцию
function openAddToCollectionDialog(work) {
  selectedWork.value = work
  showAddDialog.value = true
}

// Обработка добавления в коллекцию
function onWorkAddedToCollection() {
  window.showToast('Произведение добавлено в коллекцию', 'success')
}

// Навигация
function navigateTo(path) {
  router.push(path)
}

// Отслеживание изменений фильтров
watch([selectedCategory, selectedComposer, selectedFileType], () => {
  if (searchPerformed.value) {
    currentPage.value = 1
    performSearch()
  }
})

onMounted(() => {
  loadFilterData()
})
</script>

<style scoped>
.main-search-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f5f5f5, #ffffff);
}

.v-card:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}
</style>