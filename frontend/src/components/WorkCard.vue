<template>
  <v-card
    class="work-card"
    elevation="2"
    hover
    @click="$emit('open-details', work)"
  >
    <!-- Миниатюра -->
    <div class="thumbnail-container">
      <LazyThumbnail
        :work-id="work.id"
        :alt="`${work.composer} - ${work.work_title}`"
        class="work-thumbnail"
      />
      
      <!-- Оверлей с действиями -->
      <div class="overlay">
        <v-btn
          icon
          size="small"
          color="white"
          variant="elevated"
          @click.stop="$emit('add-to-collection', work)"
          v-if="isAuthenticated"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
        
        <v-btn
          icon
          size="small"
          color="white"
          variant="elevated"
          @click.stop="downloadFile"
        >
          <v-icon>mdi-download</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Информация о произведении -->
    <v-card-text class="pa-3">
      <div class="text-overline text-primary mb-1">
        {{ work.category }}
        <span v-if="work.subcategory" class="text-medium-emphasis">
          / {{ work.subcategory }}
        </span>
      </div>
      
      <h3 class="text-body-1 font-weight-bold mb-1 line-clamp-2">
        {{ work.work_title }}
      </h3>
      
      <p class="text-body-2 text-medium-emphasis mb-2 line-clamp-1">
        {{ work.composer }}
      </p>

      <!-- Метаданные -->
      <div class="d-flex justify-space-between align-center">
        <div class="d-flex align-center">
          <v-chip
            size="x-small"
            :color="getFileTypeColor(work.file_type)"
            variant="elevated"
            class="mr-2"
          >
            {{ work.file_type.toUpperCase() }}
          </v-chip>
          
          <span v-if="work.file_size" class="text-caption text-medium-emphasis">
            {{ formatFileSize(work.file_size) }}
          </span>
        </div>

        <v-rating
          v-if="work.rating"
          :model-value="work.rating"
          size="x-small"
          readonly
          density="compact"
          color="amber"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { isAuthenticated } from '../services/auth.js'
import { getDownloadUrl } from '../services/files.js'
import LazyThumbnail from './LazyThumbnail.vue'

const props = defineProps({
  work: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['open-details', 'add-to-collection'])

// Цвета для типов файлов
function getFileTypeColor(fileType) {
  const colors = {
    pdf: 'red',
    mp3: 'green',
    sib: 'blue',
    mus: 'purple'
  }
  return colors[fileType] || 'grey'
}

// Форматирование размера файла
function formatFileSize(bytes) {
  if (!bytes) return ''
  
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// Скачивание файла
function downloadFile() {
  const url = getDownloadUrl(props.work.file_path)
  window.open(url, '_blank')
}
</script>

<style scoped>
.work-card {
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.work-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.thumbnail-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.work-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.work-card:hover .overlay {
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