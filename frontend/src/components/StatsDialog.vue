<template>
  <v-dialog v-model="dialog" max-width="600">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-chart-bar</v-icon>
        Статистика {{ typeTitle }}
      </v-card-title>

      <v-card-text>
        <!-- Загрузка -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" />
          <p class="text-body-2 mt-2">Загрузка статистики...</p>
        </div>

        <!-- Статистика произведений -->
        <div v-else-if="type === 'works' && worksStats">
          <v-row>
            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="text-center pa-4">
                <div class="text-h4 font-weight-bold text-primary">
                  {{ worksStats.totalWorks }}
                </div>
                <div class="text-caption">Всего произведений</div>
              </v-card>
            </v-col>

            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="text-center pa-4">
                <div class="text-h4 font-weight-bold text-success">
                  {{ worksStats.totalComposers }}
                </div>
                <div class="text-caption">Композиторов</div>
              </v-card>
            </v-col>

            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="text-center pa-4">
                <div class="text-h4 font-weight-bold text-info">
                  {{ worksStats.totalCategories }}
                </div>
                <div class="text-caption">Категорий</div>
              </v-card>
            </v-col>

            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="text-center pa-4">
                <div class="text-h4 font-weight-bold text-warning">
                  {{ formatFileSize(worksStats.totalSize) }}
                </div>
                <div class="text-caption">Общий размер</div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Топ композиторы -->
          <div class="mt-6">
            <h3 class="text-h6 mb-3">Топ композиторы</h3>
            <v-list density="compact">
              <v-list-item
                v-for="composer in worksStats.topComposers"
                :key="composer.composer"
              >
                <v-list-item-title>{{ composer.composer }}</v-list-item-title>
                <template v-slot:append>
                  <v-chip size="small" color="primary" variant="elevated">
                    {{ composer.count }} произв.
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <!-- Распределение по категориям -->
          <div class="mt-6">
            <h3 class="text-h6 mb-3">Распределение по категориям</h3>
            <v-list density="compact">
              <v-list-item
                v-for="category in worksStats.categoriesDistribution"
                :key="category.category"
              >
                <v-list-item-title>{{ category.category }}</v-list-item-title>
                <template v-slot:append>
                  <v-chip size="small" color="info" variant="outlined">
                    {{ category.count }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </div>
        </div>

        <!-- Статистика терминов -->
        <div v-else-if="type === 'terms' && termsStats">
          <v-row>
            <v-col cols="6">
              <v-card variant="outlined" class="text-center pa-4">
                <div class="text-h4 font-weight-bold text-primary">
                  {{ termsStats.total }}
                </div>
                <div class="text-caption">Всего терминов</div>
              </v-card>
            </v-col>

            <v-col cols="6">
              <v-card variant="outlined" class="text-center pa-4">
                <div class="text-h4 font-weight-bold text-success">
                  {{ termsStats.averageDefinitionLength }}
                </div>
                <div class="text-caption">Средняя длина определения</div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Последние добавленные термины -->
          <div class="mt-6">
            <h3 class="text-h6 mb-3">Последние добавленные термины</h3>
            <v-list density="compact">
              <v-list-item
                v-for="term in termsStats.recentTerms"
                :key="term.id"
              >
                <v-list-item-title class="font-weight-medium">
                  {{ term.term }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ term.definition.substring(0, 100) }}...
                </v-list-item-subtitle>
                <template v-slot:append>
                  <span class="text-caption text-medium-emphasis">
                    {{ formatDate(term.created_at) }}
                  </span>
                </template>
              </v-list-item>
            </v-list>
          </div>
        </div>

        <!-- Статистика файлов -->
        <div v-else-if="type === 'files' && filesStats">
          <v-row>
            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="text-center pa-4">
                <div class="text-h4 font-weight-bold text-primary">
                  {{ filesStats.totalFiles }}
                </div>
                <div class="text-caption">Всего файлов</div>
              </v-card>
            </v-col>

            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="text-center pa-4">
                <div class="text-h4 font-weight-bold text-success">
                  {{ filesStats.totalDirectories }}
                </div>
                <div class="text-caption">Папок</div>
              </v-card>
            </v-col>

            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="text-center pa-4">
                <div class="text-h4 font-weight-bold text-info">
                  {{ formatFileSize(filesStats.totalSize) }}
                </div>
                <div class="text-caption">Общий размер</div>
              </v-card>
            </v-col>

            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="text-center pa-4">
                <div class="text-h4 font-weight-bold text-warning">
                  {{ filesStats.averageFileSize }}
                </div>
                <div class="text-caption">Средний размер</div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Типы файлов -->
          <div class="mt-6">
            <h3 class="text-h6 mb-3">Типы файлов</h3>
            <v-list density="compact">
              <v-list-item
                v-for="fileType in filesStats.fileTypes"
                :key="fileType.extension"
              >
                <template v-slot:prepend>
                  <v-icon :color="getFileTypeColor(fileType.extension)">
                    {{ getFileTypeIcon(fileType.extension) }}
                  </v-icon>
                </template>
                
                <v-list-item-title>
                  {{ fileType.extension.toUpperCase() }}
                </v-list-item-title>
                
                <template v-slot:append>
                  <v-chip size="small" color="primary" variant="outlined">
                    {{ fileType.count }} файлов
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </div>
        </div>

        <!-- Ошибка -->
        <v-alert
          v-else-if="error"
          type="error"
          variant="tonal"
        >
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          @click="close"
        >
          Закрыть
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getWorksStats } from '../services/works.js'
import { getTermsStats } from '../services/terms.js'
import { getFilesStats } from '../services/files.js'

const props = defineProps({
  modelValue: Boolean,
  type: {
    type: String,
    default: 'works',
    validator: value => ['works', 'terms', 'files'].includes(value)
  }
})

const emit = defineEmits(['update:modelValue'])

// Состояние
const dialog = ref(false)
const loading = ref(false)
const error = ref('')

// Данные
const worksStats = ref(null)
const termsStats = ref(null)
const filesStats = ref(null)

// Вычисляемые свойства
const typeTitle = computed(() => {
  const titles = {
    works: 'произведений',
    terms: 'терминов',
    files: 'файлов'
  }
  return titles[props.type] || 'данных'
})

// Отслеживание изменений
watch(() => props.modelValue, (value) => {
  dialog.value = value
  if (value) {
    loadStats()
  }
})

watch(dialog, (value) => {
  emit('update:modelValue', value)
})

// Загрузка статистики
async function loadStats() {
  loading.value = true
  error.value = ''

  try {
    let response
    
    switch (props.type) {
      case 'works':
        response = await getWorksStats()
        worksStats.value = response.data
        break
      case 'terms':
        response = await getTermsStats()
        termsStats.value = response.data
        break
      case 'files':
        response = await getFilesStats()
        filesStats.value = response.data
        break
    }
  } catch (err) {
    console.error('Ошибка загрузки статистики:', err)
    error.value = 'Ошибка загрузки статистики'
  } finally {
    loading.value = false
  }
}

// Закрытие диалога
function close() {
  dialog.value = false
}

// Утилиты
function formatFileSize(bytes) {
  if (!bytes) return '0 Б'
  
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU')
}

function getFileTypeColor(extension) {
  const colors = {
    '.pdf': 'red',
    '.mp3': 'green',
    '.sib': 'blue',
    '.mus': 'purple'
  }
  return colors[extension] || 'grey'
}

function getFileTypeIcon(extension) {
  const icons = {
    '.pdf': 'mdi-file-pdf-box',
    '.mp3': 'mdi-music',
    '.sib': 'mdi-music-note',
    '.mus': 'mdi-music-clef-treble'
  }
  return icons[extension] || 'mdi-file'
}
</script>

<style scoped>
.v-card.pa-4 {
  height: 100%;
}
</style>