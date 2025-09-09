<template>
  <v-container class="work-details-page">
    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="48"
      />
      <p class="text-body-2 text-medium-emphasis mt-4">Загрузка произведения...</p>
    </div>

    <!-- Контент -->
    <div v-else-if="workData">
      <!-- Навигация -->
      <div class="d-flex align-center mb-6">
        <v-btn
          icon
          variant="text"
          @click="goBack"
          class="mr-4"
        >
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>

        <div class="flex-grow-1">
          <nav class="text-caption text-medium-emphasis">
            <span>{{ workData.category }}</span>
            <span v-if="workData.subcategory"> / {{ workData.subcategory }}</span>
            <span> / {{ workData.composer }}</span>
          </nav>
        </div>

        <!-- Действия -->
        <div class="d-flex gap-2">
          <v-btn
            color="primary"
            variant="elevated"
            @click="downloadFile"
            prepend-icon="mdi-download"
          >
            Скачать
          </v-btn>

          <v-btn
            v-if="isAuthenticated"
            color="secondary"
            variant="outlined"
            @click="showAddDialog = true"
            prepend-icon="mdi-plus"
          >
            В коллекцию
          </v-btn>
        </div>
      </div>

      <!-- Основная информация -->
      <v-row class="mb-6">
        <!-- Левая колонка - миниатюра и метаданные -->
        <v-col cols="12" md="4">
          <v-card elevation="4" rounded="xl">
            <!-- Миниатюра -->
            <div class="thumbnail-container">
              <LazyThumbnail
                :work-id="workData.id"
                :alt="`${workData.composer} - ${workData.work_title}`"
                class="work-thumbnail"
              />
            </div>

            <!-- Метаданные -->
            <v-card-text class="pa-4">
              <v-list density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-file</v-icon>
                  </template>
                  <v-list-item-title>Тип файла</v-list-item-title>
                  <template v-slot:append>
                    <v-chip
                      size="small"
                      :color="getFileTypeColor(workData.file_type)"
                      variant="elevated"
                    >
                      {{ workData.file_type.toUpperCase() }}
                    </v-chip>
                  </template>
                </v-list-item>

                <v-list-item v-if="workData.file_size">
                  <template v-slot:prepend>
                    <v-icon>mdi-scale</v-icon>
                  </template>
                  <v-list-item-title>Размер файла</v-list-item-title>
                  <template v-slot:append>
                    <span>{{ formatFileSize(workData.file_size) }}</span>
                  </template>
                </v-list-item>

                <v-list-item v-if="workData.pages_count">
                  <template v-slot:prepend>
                    <v-icon>mdi-file-document</v-icon>
                  </template>
                  <v-list-item-title>Страниц</v-list-item-title>
                  <template v-slot:append>
                    <span>{{ workData.pages_count }}</span>
                  </template>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-calendar-plus</v-icon>
                  </template>
                  <v-list-item-title>Добавлено</v-list-item-title>
                  <template v-slot:append>
                    <span>{{ formatDate(workData.created_at) }}</span>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Правая колонка - информация и просмотр -->
        <v-col cols="12" md="8">
          <!-- Заголовок произведения -->
          <div class="mb-6">
            <h1 class="text-h3 font-weight-bold mb-2">
              {{ workData.work_title }}
            </h1>
            <h2 class="text-h5 text-primary mb-4">
              {{ workData.composer }}
            </h2>
            
            <!-- Категория и теги -->
            <div class="d-flex flex-wrap gap-2 mb-4">
              <v-chip color="primary" variant="elevated">
                {{ workData.category }}
              </v-chip>
              <v-chip v-if="workData.subcategory" color="secondary" variant="outlined">
                {{ workData.subcategory }}
              </v-chip>
            </div>
          </div>

          <!-- Просмотр PDF -->
          <v-card v-if="workData.file_type === 'pdf'" elevation="2" rounded="lg">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-file-pdf-box</v-icon>
              Просмотр нот
              <v-spacer />
              <v-btn
                icon
                variant="text"
                @click="openInNewTab"
                title="Открыть в новой вкладке"
              >
                <v-icon>mdi-open-in-new</v-icon>
              </v-btn>
            </v-card-title>
            
            <v-card-text class="pa-0">
              <iframe
                :src="pdfUrl"
                class="pdf-viewer"
                frameborder="0"
                @error="onPdfError"
              />
            </v-card-text>
          </v-card>

          <!-- Для других типов файлов -->
          <v-card v-else elevation="2" rounded="lg" class="pa-8 text-center">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">
              {{ getFileIcon(workData.file_type) }}
            </v-icon>
            <h3 class="text-h6 mb-2">{{ getFileTypeName(workData.file_type) }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Нажмите кнопку "Скачать" чтобы открыть файл
            </p>
            <v-btn
              color="primary"
              size="large"
              @click="downloadFile"
              prepend-icon="mdi-download"
            >
              Скачать файл
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <!-- Похожие произведения -->
      <div v-if="similarWorks.length" class="mb-6">
        <h3 class="text-h6 mb-4">Похожие произведения</h3>
        <v-row>
          <v-col
            v-for="work in similarWorks"
            :key="work.id"
            cols="12"
            sm="6"
            md="3"
          >
            <WorkCard
              :work="work"
              @open-details="openWorkDetails"
              @add-to-collection="openAddToCollectionDialog"
            />
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- Ошибка -->
    <v-card v-else class="pa-8 text-center">
      <v-icon size="64" color="error" class="mb-4">
        mdi-alert-circle
      </v-icon>
      <h3 class="text-h6 mb-2">Произведение не найдено</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Запрашиваемое произведение не существует или было удалено
      </p>
      <v-btn color="primary" @click="goBack">
        Вернуться назад
      </v-btn>
    </v-card>

    <!-- Диалог добавления в коллекцию -->
    <AddToCollectionDialog
      v-model="showAddDialog"
      :work="workData"
      @added="onWorkAddedToCollection"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getWorksByComposer } from '../services/works.js'
import { getPdfViewUrl, getDownloadUrl } from '../services/files.js'
import { isAuthenticated } from '../services/auth.js'
import LazyThumbnail from './LazyThumbnail.vue'
import WorkCard from './WorkCard.vue'
import AddToCollectionDialog from './AddToCollectionDialog.vue'

const router = useRouter()
const route = useRoute()

const props = defineProps({
  composer: String,
  workTitle: String
})

// Состояние
const loading = ref(false)
const workData = ref(null)
const similarWorks = ref([])
const showAddDialog = ref(false)

// Вычисляемые свойства
const pdfUrl = computed(() => {
  if (workData.value?.file_path) {
    return getPdfViewUrl(workData.value.file_path)
  }
  return null
})

// Загрузка данных произведения
async function loadWork() {
  loading.value = true

  try {
    // Ищем произведение по композитору и названию
    const response = await getWorksByComposer(props.composer)
    const works = response.data.works || response.data || []
    
    // Находим нужное произведение
    workData.value = works.find(work => 
      work.work_title === props.workTitle || 
      work.work_title.includes(props.workTitle)
    )

    if (workData.value) {
      // Загружаем похожие произведения
      loadSimilarWorks()
    }
  } catch (error) {
    console.error('Ошибка загрузки произведения:', error)
    window.showToast('Ошибка загрузки произведения', 'error')
  } finally {
    loading.value = false
  }
}

// Загрузка похожих произведений
async function loadSimilarWorks() {
  try {
    const response = await getWorksByComposer(props.composer, {
      limit: 4
    })
    
    const works = response.data.works || response.data || []
    similarWorks.value = works
      .filter(work => work.id !== workData.value.id)
      .slice(0, 3)
  } catch (error) {
    console.error('Ошибка загрузки похожих произведений:', error)
  }
}

// Действия
function goBack() {
  router.back()
}

function downloadFile() {
  if (workData.value?.file_path) {
    const url = getDownloadUrl(workData.value.file_path)
    window.open(url, '_blank')
  }
}

function openInNewTab() {
  if (pdfUrl.value) {
    window.open(pdfUrl.value, '_blank')
  }
}

function openWorkDetails(work) {
  router.push({
    name: 'WorkDetails',
    params: {
      composer: work.composer,
      work: work.work_title
    }
  })
}

function openAddToCollectionDialog(work) {
  showAddDialog.value = true
}

function onWorkAddedToCollection() {
  window.showToast('Произведение добавлено в коллекцию', 'success')
}

function onPdfError() {
  window.showToast('Ошибка загрузки PDF файла', 'error')
}

// Утилиты
function getFileTypeColor(fileType) {
  const colors = {
    pdf: 'red',
    mp3: 'green',
    sib: 'blue',
    mus: 'purple'
  }
  return colors[fileType] || 'grey'
}

function getFileIcon(fileType) {
  const icons = {
    pdf: 'mdi-file-pdf-box',
    mp3: 'mdi-music',
    sib: 'mdi-music-note',
    mus: 'mdi-music-clef-treble'
  }
  return icons[fileType] || 'mdi-file'
}

function getFileTypeName(fileType) {
  const names = {
    pdf: 'PDF документ',
    mp3: 'Аудио файл',
    sib: 'Sibelius файл',
    mus: 'Finale файл'
  }
  return names[fileType] || 'Файл'
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

onMounted(() => {
  loadWork()
})
</script>

<style scoped>
.work-details-page {
  max-width: 1400px;
  margin: 0 auto;
}

.thumbnail-container {
  height: 300px;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}

.work-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pdf-viewer {
  width: 100%;
  height: 600px;
  border: none;
  border-radius: 0 0 8px 8px;
}

@media (max-width: 768px) {
  .pdf-viewer {
    height: 400px;
  }
}
</style>