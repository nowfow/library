<template>
  <v-dialog v-model="dialog" max-width="800">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-eye</v-icon>
        Предварительный просмотр
        <v-spacer />
        <v-btn
          icon
          variant="text"
          @click="close"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text v-if="file" class="pa-0">
        <!-- Информация о файле -->
        <div class="px-4 py-2 bg-grey-lighten-4">
          <div class="d-flex align-center">
            <v-icon :color="getFileColor(file)" class="mr-2">
              {{ getFileIcon(file) }}
            </v-icon>
            <div class="flex-grow-1">
              <div class="font-weight-medium">{{ file.name }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ getFileTypeName(file.extension) }} • {{ formatFileSize(file.size) }}
              </div>
            </div>
            <v-btn
              variant="outlined"
              size="small"
              @click="downloadFile"
              prepend-icon="mdi-download"
            >
              Скачать
            </v-btn>
          </div>
        </div>

        <!-- Содержимое предварительного просмотра -->
        <div class="preview-container">
          <!-- PDF просмотр -->
          <iframe
            v-if="file.extension === '.pdf'"
            :src="getPreviewUrl(file)"
            class="preview-frame"
            frameborder="0"
            @error="onPreviewError"
          />

          <!-- Изображения -->
          <div v-else-if="isImage(file)" class="image-preview">
            <img
              :src="getPreviewUrl(file)"
              :alt="file.name"
              @error="onPreviewError"
              class="preview-image"
            />
          </div>

          <!-- Аудио файлы -->
          <div v-else-if="isAudio(file)" class="audio-preview">
            <v-icon size="64" color="green" class="mb-4">mdi-music</v-icon>
            <h3 class="text-h6 mb-2">{{ file.name }}</h3>
            <audio
              controls
              class="audio-player"
              @error="onPreviewError"
            >
              <source :src="getPreviewUrl(file)" type="audio/mpeg">
              Ваш браузер не поддерживает воспроизведение аудио.
            </audio>
          </div>

          <!-- Другие файлы -->
          <div v-else class="unsupported-preview">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">
              {{ getFileIcon(file) }}
            </v-icon>
            <h3 class="text-h6 mb-2">Предварительный просмотр недоступен</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Файлы типа {{ getFileTypeName(file.extension) }} не поддерживают просмотр в браузере
            </p>
            <v-btn
              color="primary"
              @click="downloadFile"
              prepend-icon="mdi-download"
            >
              Скачать файл
            </v-btn>
          </div>

          <!-- Ошибка загрузки -->
          <div v-if="previewError" class="error-preview">
            <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
            <h3 class="text-h6 mb-2">Ошибка загрузки</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Не удалось загрузить предварительный просмотр файла
            </p>
            <v-btn
              color="primary"
              @click="downloadFile"
              prepend-icon="mdi-download"
            >
              Скачать файл
            </v-btn>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="close"
        >
          Закрыть
        </v-btn>
        <v-btn
          color="primary"
          @click="downloadFile"
          prepend-icon="mdi-download"
        >
          Скачать
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getDownloadUrl } from '../services/files.js'

const props = defineProps({
  modelValue: Boolean,
  file: Object
})

const emit = defineEmits(['update:modelValue'])

// Состояние
const dialog = ref(false)
const previewError = ref(false)

// Отслеживание изменений
watch(() => props.modelValue, (value) => {
  dialog.value = value
  if (value) {
    previewError.value = false
  }
})

watch(dialog, (value) => {
  emit('update:modelValue', value)
})

// Методы
function close() {
  dialog.value = false
}

function downloadFile() {
  if (props.file) {
    const url = getDownloadUrl(props.file.path)
    window.open(url, '_blank')
  }
}

function getPreviewUrl(file) {
  return getDownloadUrl(file.path)
}

function onPreviewError() {
  previewError.value = true
}

// Утилиты определения типов файлов
function isImage(file) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  return imageExtensions.includes(file.extension?.toLowerCase())
}

function isAudio(file) {
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a']
  return audioExtensions.includes(file.extension?.toLowerCase())
}

function getFileIcon(file) {
  const ext = file.extension?.toLowerCase()
  const icons = {
    '.pdf': 'mdi-file-pdf-box',
    '.mp3': 'mdi-music',
    '.sib': 'mdi-music-note',
    '.mus': 'mdi-music-clef-treble',
    '.jpg': 'mdi-image',
    '.jpeg': 'mdi-image',
    '.png': 'mdi-image',
    '.gif': 'mdi-image',
    '.webp': 'mdi-image'
  }
  return icons[ext] || 'mdi-file'
}

function getFileColor(file) {
  const ext = file.extension?.toLowerCase()
  const colors = {
    '.pdf': 'red',
    '.mp3': 'green',
    '.sib': 'blue',
    '.mus': 'purple',
    '.jpg': 'orange',
    '.jpeg': 'orange',
    '.png': 'orange',
    '.gif': 'orange',
    '.webp': 'orange'
  }
  return colors[ext] || 'grey'
}

function getFileTypeName(extension) {
  if (!extension) return 'Файл'
  
  const names = {
    '.pdf': 'PDF документ',
    '.mp3': 'Аудио файл',
    '.sib': 'Sibelius файл',
    '.mus': 'Finale файл',
    '.jpg': 'Изображение JPEG',
    '.jpeg': 'Изображение JPEG',
    '.png': 'Изображение PNG',
    '.gif': 'Анимация GIF',
    '.webp': 'Изображение WebP'
  }
  return names[extension.toLowerCase()] || extension.toUpperCase() + ' файл'
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.preview-container {
  min-height: 400px;
  max-height: 600px;
  overflow: hidden;
}

.preview-frame {
  width: 100%;
  height: 500px;
  border: none;
}

.image-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #f5f5f5;
}

.preview-image {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
  border-radius: 8px;
}

.audio-preview,
.unsupported-preview,
.error-preview {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  text-align: center;
  min-height: 400px;
}

.audio-player {
  width: 100%;
  max-width: 400px;
  margin-top: 16px;
}
</style>