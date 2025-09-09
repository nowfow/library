<template>
  <v-container class="terms-page">
    <!-- Заголовок -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Музыкальные термины</h1>
        <p class="text-body-1 text-medium-emphasis">
          Словарь музыкальных терминов и их определений
        </p>
      </div>

      <!-- Статистика -->
      <v-card v-if="stats" variant="outlined" class="pa-4 text-center">
        <div class="text-h6 font-weight-bold text-primary">{{ stats.total }}</div>
        <div class="text-caption text-medium-emphasis">терминов</div>
      </v-card>
    </div>

    <!-- Поиск -->
    <v-card class="mb-6" elevation="2">
      <v-card-text>
        <v-text-field
          v-model="searchQuery"
          placeholder="Поиск терминов..."
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          clearable
          @input="onSearchInput"
          @keyup.enter="performSearch"
        />

        <div class="d-flex align-center mt-4">
          <v-checkbox
            v-model="exactSearch"
            label="Точный поиск"
            density="compact"
            hide-details
            class="mr-4"
          />
          
          <v-checkbox
            v-model="smartSearch"
            label="Умный поиск (исправление опечаток)"
            density="compact"
            hide-details
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Результаты поиска -->
    <div v-if="searchPerformed && searchQuery" class="mb-4">
      <h2 class="text-h6 mb-3">
        Результаты поиска
        <v-chip v-if="totalResults" color="primary" variant="elevated" size="small" class="ml-2">
          {{ totalResults }}
        </v-chip>
      </h2>
    </div>

    <!-- Список терминов -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="48"
      />
      <p class="text-body-2 text-medium-emphasis mt-4">Загрузка терминов...</p>
    </div>

    <div v-else-if="terms.length === 0 && searchPerformed" class="text-center py-8">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">
        mdi-book-search
      </v-icon>
      <h3 class="text-h6 mb-2">Термины не найдены</h3>
      <p class="text-body-2 text-medium-emphasis">
        Попробуйте изменить поисковый запрос или отключить точный поиск
      </p>
    </div>

    <v-row v-else>
      <v-col
        v-for="term in terms"
        :key="term.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          class="term-card h-100"
          variant="outlined"
          hover
        >
          <v-card-text class="pa-4">
            <h3 class="text-h6 font-weight-bold text-primary mb-3">
              {{ term.term }}
            </h3>
            
            <p class="text-body-2 mb-4">
              {{ term.definition }}
            </p>

            <!-- Метрики для умного поиска -->
            <div v-if="term.similarity_score" class="d-flex align-center">
              <v-chip
                size="x-small"
                :color="getSimilarityColor(term.similarity_score)"
                variant="elevated"
                class="mr-2"
              >
                {{ Math.round(term.similarity_score * 100) }}% совпадение
              </v-chip>
              
              <v-chip
                v-if="term.match_type"
                size="x-small"
                color="info"
                variant="outlined"
              >
                {{ term.match_type === 'term' ? 'по термину' : 'по определению' }}
              </v-chip>
            </div>

            <!-- Дата создания -->
            <div class="text-caption text-medium-emphasis mt-2">
              Добавлено: {{ formatDate(term.created_at) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Пагинация -->
    <div v-if="totalPages > 1" class="d-flex justify-center mt-6">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        @update:model-value="loadTerms"
        total-visible="7"
        rounded="circle"
      />
    </div>

    <!-- Кнопка "Загрузить ещё" для мобильных -->
    <div v-if="hasMore && $vuetify.display.mobile" class="text-center mt-6">
      <v-btn
        color="primary"
        variant="outlined"
        :loading="loading"
        @click="loadMore"
      >
        Загрузить ещё
      </v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { debounce } from 'lodash'
import { getTerms, searchTerms, smartSearchTerms, getTermsStats } from '../services/terms.js'

// Состояние компонента
const loading = ref(false)
const searchQuery = ref('')
const searchPerformed = ref(false)
const exactSearch = ref(false)
const smartSearch = ref(true)

// Данные
const terms = ref([])
const stats = ref(null)
const totalResults = ref(0)
const currentPage = ref(1)
const totalPages = ref(0)
const hasMore = ref(false)
const pageSize = ref(50)

// Загрузка терминов
async function loadTerms(page = 1) {
  loading.value = true

  try {
    let response

    if (searchQuery.value) {
      searchPerformed.value = true
      
      if (smartSearch.value) {
        response = await smartSearchTerms(searchQuery.value, {
          limit: pageSize.value,
          offset: (page - 1) * pageSize.value
        })
      } else {
        response = await searchTerms(searchQuery.value, exactSearch.value)
      }
    } else {
      response = await getTerms({
        limit: pageSize.value,
        offset: (page - 1) * pageSize.value
      })
    }

    if (page === 1) {
      terms.value = response.data.terms || response.data || []
    } else {
      terms.value.push(...(response.data.terms || response.data || []))
    }

    // Обновляем пагинацию
    if (response.data.pagination) {
      totalResults.value = response.data.pagination.total
      totalPages.value = Math.ceil(totalResults.value / pageSize.value)
      hasMore.value = response.data.pagination.hasMore
    } else {
      totalResults.value = terms.value.length
      totalPages.value = 1
      hasMore.value = false
    }

    currentPage.value = page
  } catch (error) {
    console.error('Ошибка загрузки терминов:', error)
    window.showToast('Ошибка загрузки терминов', 'error')
  } finally {
    loading.value = false
  }
}

// Загрузка статистики
async function loadStats() {
  try {
    const response = await getTermsStats()
    stats.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error)
  }
}

// Поиск с дебаунсом
const onSearchInput = debounce(() => {
  if (searchQuery.value && searchQuery.value.length >= 2) {
    currentPage.value = 1
    loadTerms(1)
  } else if (!searchQuery.value) {
    searchPerformed.value = false
    currentPage.value = 1
    loadTerms(1)
  }
}, 500)

// Выполнение поиска
function performSearch() {
  currentPage.value = 1
  loadTerms(1)
}

// Загрузка дополнительных терминов
function loadMore() {
  if (hasMore.value && !loading.value) {
    loadTerms(currentPage.value + 1)
  }
}

// Утилиты
function getSimilarityColor(score) {
  if (score >= 0.8) return 'success'
  if (score >= 0.6) return 'warning'
  return 'error'
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU')
}

// Отслеживание изменений настроек поиска
watch([exactSearch, smartSearch], () => {
  if (searchQuery.value && searchPerformed.value) {
    currentPage.value = 1
    loadTerms(1)
  }
})

onMounted(() => {
  loadTerms(1)
  loadStats()
})
</script>

<style scoped>
.terms-page {
  max-width: 1200px;
  margin: 0 auto;
}

.term-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.term-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>