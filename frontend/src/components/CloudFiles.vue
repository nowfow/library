<template>
  <v-container class="cloud-files-page">
    <!-- Заголовок -->
    <div class="d-flex align-center mb-6">
      <div class="flex-grow-1">
        <h1 class="text-h4 font-weight-bold mb-2">Файлы из облака</h1>
        <p class="text-body-1 text-medium-emphasis">
          Просмотр файловой структуры музыкальной библиотеки
        </p>
      </div>

      <!-- Действия -->
      <div class="d-flex gap-2">
        <v-btn
          variant="outlined"
          @click="refreshFiles"
          :loading="loading"
          prepend-icon="mdi-refresh"
        >
          Обновить
        </v-btn>

        <v-btn
          color="primary"
          variant="elevated"
          @click="showStatsDialog = true"
          prepend-icon="mdi-chart-bar"
        >
          Статистика
        </v-btn>
      </div>
    </div>

    <!-- Навигация по путям -->
    <v-card class="mb-4" variant="outlined">
      <v-card-text class="py-2">
        <v-breadcrumbs
          :items="breadcrumbs"
          class="pa-0"
        >
          <template v-slot:item="{ item }">
            <v-breadcrumbs-item
              :disabled="item.disabled"
              @click="navigateToPath(item.href)"
              class="text-body-2"
            >
              {{ item.title }}
            </v-breadcrumbs-item>
          </template>
        </v-breadcrumbs>
      </v-card-text>
    </v-card>

    <!-- Поиск -->
    <v-card class="mb-6" elevation="2">
      <v-card-text>
        <v-text-field
          v-model="searchQuery"
          placeholder="Поиск файлов..."
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          clearable
          @input="onSearchInput"
          @keyup.enter="performSearch"
        />

        <div class="d-flex align-center mt-4 flex-wrap gap-4">
          <v-select
            v-model="fileTypeFilter"
            :items="fileTypes"
            label="Тип файла"
            variant="outlined"
            density="compact"
            style="max-width: 200px"
            clearable
            hide-details
          />

          <div class="d-flex align-center">
            <v-switch
              v-model="showDirectoriesOnly"
              label="Только папки"
              density="compact"
              hide-details
              class="mr-4"
            />
            
            <v-switch
              v-model="recursiveSearch"
              label="Поиск в подпапках"
              density="compact"
              hide-details
            />
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="48"
      />
      <p class="text-body-2 text-medium-emphasis mt-4">
        {{ searchPerformed ? 'Поиск файлов...' : 'Загрузка файлов...' }}
      </p>
    </div>

    <!-- Список файлов -->
    <div v-else-if="files.length">
      <!-- Заголовок с сортировкой -->
      <div class="d-flex justify-space-between align-center mb-4">
        <h2 class="text-h6">
          {{ searchPerformed ? 'Результаты поиска' : 'Содержимое папки' }}
          <v-chip v-if="totalFiles" color="primary" variant="elevated" size="small" class="ml-2">
            {{ totalFiles }}
          </v-chip>
        </h2>

        <v-select
          v-model="sortBy"
          :items="sortOptions"
          label="Сортировка"
          variant="outlined"
          density="compact"
          style="max-width: 200px"
          hide-details
          @update:model-value="sortFiles"
        />
      </div>

      <!-- Сетка файлов -->
      <v-row>
        <v-col
          v-for="file in sortedFiles"
          :key="file.path"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            class="file-card h-100"
            hover
            @click="handleFileClick(file)"
          >
            <!-- Иконка файла -->
            <div class="file-icon-container pa-4 text-center">
              <v-icon
                :size="file.type === 'directory' ? 48 : 40"
                :color="getFileColor(file)"
                class="mb-2"
              >
                {{ getFileIcon(file) }}
              </v-icon>
              
              <h3 class="text-body-1 font-weight-medium line-clamp-2">
                {{ file.name }}
              </h3>
            </div>

            <!-- Метаданные -->
            <v-card-text class="pt-0 pb-2">
              <div class="d-flex align-center justify-space-between text-caption text-medium-emphasis">
                <span>{{ file.type === 'directory' ? 'Папка' : getFileTypeName(file.extension) }}</span>
                <span v-if="file.size">{{ formatFileSize(file.size) }}</span>
              </div>
              
              <div class="text-caption text-medium-emphasis mt-1">
                {{ formatDate(file.modified) }}
              </div>
            </v-card-text>

            <!-- Действия -->
            <v-card-actions class="px-3 pb-3" v-if="file.type === 'file'">
              <v-btn
                variant="text"
                size="small"
                @click.stop="downloadFile(file)"
              >
                <v-icon>mdi-download</v-icon>
              </v-btn>

              <v-spacer />

              <v-btn
                variant="text"
                size="small"
                @click.stop="previewFile(file)"
                v-if="canPreview(file)"
              >
                <v-icon>mdi-eye</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Пустое состояние -->
    <v-card v-else class="pa-8 text-center">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">
        {{ searchPerformed ? 'mdi-file-search' : 'mdi-folder-open' }}
      </v-icon>
      <h3 class="text-h6 mb-2">
        {{ searchPerformed ? 'Файлы не найдены' : 'Папка пуста' }}
      </h3>
      <p class="text-body-2 text-medium-emphasis">
        {{ searchPerformed 
          ? 'Попробуйте изменить параметры поиска' 
          : 'В этой папке нет файлов'
        }}
      </p>
    </v-card>

    <!-- Диалог статистики -->
    <StatsDialog v-model="showStatsDialog" type="files" />

    <!-- Диалог предварительного просмотра -->
    <FilePreviewDialog
      v-model="showPreviewDialog"
      :file="previewFile"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { debounce } from 'lodash'
import { getFileStructure, searchFiles, getDownloadUrl } from '../services/files.js'
import StatsDialog from './StatsDialog.vue'
import FilePreviewDialog from './FilePreviewDialog.vue'

// Состояние
const loading = ref(false)
const searchPerformed = ref(false)
const currentPath = ref('/')
const searchQuery = ref('')
const fileTypeFilter = ref(null)
const showDirectoriesOnly = ref(false)
const recursiveSearch = ref(true)

// Данные
const files = ref([])
const totalFiles = ref(0)
const sortBy = ref('name')

// Диалоги
const showStatsDialog = ref(false)
const showPreviewDialog = ref(false)
const previewFileData = ref(null)

// Константы
const fileTypes = ref([
  { title: 'PDF', value: '.pdf' },
  { title: 'MP3', value: '.mp3' },
  { title: 'Sibelius', value: '.sib' },
  { title: 'Finale', value: '.mus' }
])

const sortOptions = ref([
  { title: 'По имени', value: 'name' },
  { title: 'По типу', value: 'type' },
  { title: 'По размеру', value: 'size' },
  { title: 'По дате', value: 'modified' }
])

// Вычисляемые свойства
const breadcrumbs = computed(() => {
  const parts = currentPath.value.split('/').filter(Boolean)
  const crumbs = [
    { title: 'Корень', href: '/', disabled: currentPath.value === '/' }
  ]
  
  let path = ''
  parts.forEach(part => {
    path += '/' + part
    crumbs.push({
      title: part,
      href: path,
      disabled: path === currentPath.value
    })
  })
  
  return crumbs
})

const sortedFiles = computed(() => {
  const filesCopy = [...files.value]
  
  return filesCopy.sort((a, b) => {
    // Папки всегда сверху
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1
    }
    
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name, 'ru')
      case 'size':
        return (b.size || 0) - (a.size || 0)
      case 'modified':
        return new Date(b.modified) - new Date(a.modified)
      default:
        return 0
    }
  })
})

// Загрузка файлов
async function loadFiles(path = currentPath.value) {
  loading.value = true
  searchPerformed.value = false

  try {
    const response = await getFileStructure(path)
    files.value = response.data.items || []
    totalFiles.value = response.data.totalItems || files.value.length
    currentPath.value = path
  } catch (error) {
    console.error('Ошибка загрузки файлов:', error)
    window.showToast('Ошибка загрузки файлов', 'error')
  } finally {
    loading.value = false
  }
}

// Поиск файлов
async function performSearch() {
  if (!searchQuery.value) {
    loadFiles()
    return
  }

  loading.value = true
  searchPerformed.value = true

  try {
    const options = {
      type: showDirectoriesOnly.value ? 'directory' : undefined,
      extension: fileTypeFilter.value,
      recursive: recursiveSearch.value
    }

    const response = await searchFiles(searchQuery.value, options)
    files.value = response.data || []
    totalFiles.value = files.value.length
  } catch (error) {
    console.error('Ошибка поиска файлов:', error)
    window.showToast('Ошибка поиска файлов', 'error')
  } finally {
    loading.value = false
  }
}

// Дебаунсированный поиск
const onSearchInput = debounce(() => {
  if (searchQuery.value && searchQuery.value.length >= 2) {
    performSearch()
  } else if (!searchQuery.value) {
    loadFiles()
  }
}, 500)

// Навигация
function navigateToPath(path) {
  if (path !== currentPath.value) {
    loadFiles(path)
  }
}

function handleFileClick(file) {
  if (file.type === 'directory') {
    navigateToPath(file.path)
  } else {
    previewFile(file)
  }
}

// Действия с файлами
function downloadFile(file) {
  const url = getDownloadUrl(file.path)
  window.open(url, '_blank')
}

function previewFile(file) {
  if (canPreview(file)) {
    previewFileData.value = file
    showPreviewDialog.value = true
  }
}

function canPreview(file) {
  const previewableTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.gif']
  return previewableTypes.includes(file.extension?.toLowerCase())
}

function refreshFiles() {
  loadFiles()
}

function sortFiles() {
  // Сортировка происходит автоматически через computed
}

// Утилиты
function getFileIcon(file) {
  if (file.type === 'directory') {
    return 'mdi-folder'
  }
  
  const ext = file.extension?.toLowerCase()
  const icons = {
    '.pdf': 'mdi-file-pdf-box',
    '.mp3': 'mdi-music',
    '.sib': 'mdi-music-note',
    '.mus': 'mdi-music-clef-treble',
    '.jpg': 'mdi-image',
    '.jpeg': 'mdi-image',
    '.png': 'mdi-image',
    '.gif': 'mdi-image'
  }
  
  return icons[ext] || 'mdi-file'
}

function getFileColor(file) {
  if (file.type === 'directory') {
    return 'primary'
  }
  
  const ext = file.extension?.toLowerCase()
  const colors = {
    '.pdf': 'red',
    '.mp3': 'green',
    '.sib': 'blue',
    '.mus': 'purple',
    '.jpg': 'orange',
    '.jpeg': 'orange',
    '.png': 'orange',
    '.gif': 'orange'
  }
  
  return colors[ext] || 'grey'
}

function getFileTypeName(extension) {
  if (!extension) return 'Файл'
  
  const names = {
    '.pdf': 'PDF',
    '.mp3': 'Аудио',
    '.sib': 'Sibelius',
    '.mus': 'Finale',
    '.jpg': 'Изображение',
    '.jpeg': 'Изображение',
    '.png': 'Изображение',
    '.gif': 'Анимация'
  }
  
  return names[extension.toLowerCase()] || extension.toUpperCase()
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU')
}

// Отслеживание изменений фильтров
watch([fileTypeFilter, showDirectoriesOnly, recursiveSearch], () => {
  if (searchQuery.value && searchPerformed.value) {
    performSearch()
  }
})

onMounted(() => {
  loadFiles()
})
</script>

<style scoped>
.cloud-files-page {
  max-width: 1200px;
  margin: 0 auto;
}

.file-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.file-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.file-icon-container {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>