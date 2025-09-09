<template>
  <v-container class="collection-items-page">
    <!-- Заголовок и навигация -->
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
        <h1 class="text-h4 font-weight-bold mb-1">
          {{ collectionData?.name || 'Коллекция' }}
        </h1>
        <p v-if="collectionData?.description" class="text-body-1 text-medium-emphasis">
          {{ collectionData.description }}
        </p>
        <div class="d-flex align-center mt-2">
          <v-chip
            v-if="collectionData?.is_public"
            size="small"
            color="success"
            variant="elevated"
            class="mr-2"
          >
            Публичная
          </v-chip>
          <span class="text-caption text-medium-emphasis">
            {{ items.length }} произведений
          </span>
        </div>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="48"
      />
      <p class="text-body-2 text-medium-emphasis mt-4">Загрузка произведений...</p>
    </div>

    <!-- Пустая коллекция -->
    <v-card v-else-if="items.length === 0" class="pa-8 text-center">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">
        mdi-folder-open
      </v-icon>
      <h3 class="text-h6 mb-2">Коллекция пуста</h3>
      <p class="text-body-2 text-medium-emphasis">
        В этой коллекции пока нет произведений
      </p>
    </v-card>

    <!-- Список произведений -->
    <v-row v-else>
      <v-col
        v-for="item in items"
        :key="item.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="work-item-card h-100" hover>
          <!-- Миниатюра -->
          <div class="thumbnail-container">
            <LazyThumbnail
              :work-id="item.id"
              :alt="`${item.composer} - ${item.work_title}`"
              class="work-thumbnail"
            />

            <!-- Кнопка удаления -->
            <v-btn
              icon
              size="small"
              color="error"
              variant="elevated"
              class="remove-btn"
              @click="removeItem(item)"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>

          <!-- Информация о произведении -->
          <v-card-text class="pa-3">
            <div class="text-overline text-primary mb-1">
              {{ item.category }}
              <span v-if="item.subcategory" class="text-medium-emphasis">
                / {{ item.subcategory }}
              </span>
            </div>
            
            <h3 class="text-body-1 font-weight-bold mb-1 line-clamp-2">
              {{ item.work_title }}
            </h3>
            
            <p class="text-body-2 text-medium-emphasis mb-2 line-clamp-1">
              {{ item.composer }}
            </p>

            <!-- Метаданные -->
            <div class="d-flex justify-space-between align-center">
              <v-chip
                size="x-small"
                :color="getFileTypeColor(item.file_type)"
                variant="elevated"
              >
                {{ item.file_type.toUpperCase() }}
              </v-chip>

              <span v-if="item.added_at" class="text-caption text-medium-emphasis">
                {{ formatDate(item.added_at) }}
              </span>
            </div>
          </v-card-text>

          <!-- Действия -->
          <v-card-actions class="px-3 pb-3">
            <v-btn
              variant="text"
              size="small"
              @click="openWorkDetails(item)"
            >
              <v-icon left>mdi-eye</v-icon>
              Просмотр
            </v-btn>

            <v-spacer />

            <v-btn
              icon
              size="small"
              @click="downloadFile(item)"
            >
              <v-icon>mdi-download</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Диалог подтверждения удаления -->
    <v-dialog v-model="showRemoveDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          Удалить из коллекции?
        </v-card-title>

        <v-card-text>
          Удалить произведение "{{ removingItem?.work_title }}" из коллекции?
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showRemoveDialog = false"
          >
            Отмена
          </v-btn>
          <v-btn
            color="error"
            :loading="removing"
            @click="confirmRemove"
          >
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getCollection, getCollectionWorks, removeWorkFromCollection } from '../services/collections.js'
import { getDownloadUrl } from '../services/files.js'
import LazyThumbnail from './LazyThumbnail.vue'

const router = useRouter()
const route = useRoute()

const props = defineProps({
  collection: {
    type: Object,
    required: true
  }
})

// Состояние
const loading = ref(false)
const removing = ref(false)
const collectionData = ref(null)
const items = ref([])

// Диалоги
const showRemoveDialog = ref(false)
const removingItem = ref(null)

// Вычисляемые свойства
const collectionId = computed(() => {
  return props.collection?.id || route.params.id
})

// Загрузка данных коллекции
async function loadCollection() {
  try {
    const response = await getCollection(collectionId.value)
    collectionData.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки коллекции:', error)
    window.showToast('Ошибка загрузки коллекции', 'error')
  }
}

// Загрузка произведений коллекции
async function loadItems() {
  loading.value = true

  try {
    const response = await getCollectionWorks(collectionId.value)
    items.value = response.data || []
  } catch (error) {
    console.error('Ошибка загрузки произведений:', error)
    window.showToast('Ошибка загрузки произведений', 'error')
  } finally {
    loading.value = false
  }
}

// Удаление произведения из коллекции
function removeItem(item) {
  removingItem.value = item
  showRemoveDialog.value = true
}

// Подтверждение удаления
async function confirmRemove() {
  removing.value = true

  try {
    await removeWorkFromCollection(collectionId.value, removingItem.value.id)
    
    // Удаляем из локального списка
    const index = items.value.findIndex(item => item.id === removingItem.value.id)
    if (index !== -1) {
      items.value.splice(index, 1)
    }

    window.showToast('Произведение удалено из коллекции', 'success')
    showRemoveDialog.value = false
    removingItem.value = null
  } catch (error) {
    console.error('Ошибка удаления произведения:', error)
    window.showToast('Ошибка удаления произведения', 'error')
  } finally {
    removing.value = false
  }
}

// Открытие деталей произведения
function openWorkDetails(item) {
  router.push({
    name: 'WorkDetails',
    params: {
      composer: item.composer,
      work: item.work_title
    }
  })
}

// Скачивание файла
function downloadFile(item) {
  const url = getDownloadUrl(item.file_path)
  window.open(url, '_blank')
}

// Возврат назад
function goBack() {
  router.back()
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

function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU')
}

onMounted(async () => {
  await Promise.all([
    loadCollection(),
    loadItems()
  ])
})
</script>

<style scoped>
.collection-items-page {
  max-width: 1200px;
  margin: 0 auto;
}

.work-item-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.work-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.thumbnail-container {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.work-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.work-item-card:hover .remove-btn {
  opacity: 1;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>