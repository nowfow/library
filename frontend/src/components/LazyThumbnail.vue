<template>
  <div class="lazy-thumbnail" :class="{ loading: isLoading }">
    <!-- Загрузочный спиннер -->
    <div v-if="isLoading" class="loading-state">
      <v-progress-circular
        indeterminate
        color="primary"
        size="32"
      />
    </div>

    <!-- Изображение миниатюры -->
    <img
      v-else-if="imageUrl && !error"
      :src="imageUrl"
      :alt="alt"
      @load="onImageLoad"
      @error="onImageError"
      class="thumbnail-image"
    />

    <!-- Плейсхолдер при ошибке -->
    <div v-else class="error-state">
      <v-icon size="48" color="grey-lighten-2">
        mdi-file-music
      </v-icon>
      <div class="text-caption text-center mt-2 text-medium-emphasis">
        Нет миниатюры
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getThumbnailUrl } from '../services/works.js'

const props = defineProps({
  workId: {
    type: [Number, String],
    required: true
  },
  alt: {
    type: String,
    default: 'Миниатюра произведения'
  },
  endpoint: {
    type: String,
    default: null
  }
})

const isLoading = ref(true)
const imageUrl = ref(null)
const error = ref(false)
const isVisible = ref(false)
const observer = ref(null)
const element = ref(null)

// Загрузка миниатюры
async function loadThumbnail() {
  if (!isVisible.value || imageUrl.value) return

  isLoading.value = true
  error.value = false

  try {
    // Используем либо кастомный endpoint, либо стандартный
    const url = props.endpoint || getThumbnailUrl(props.workId)
    
    // Проверяем доступность изображения
    const response = await fetch(url, { method: 'HEAD' })
    
    if (response.ok) {
      imageUrl.value = url
    } else {
      throw new Error('Thumbnail not available')
    }
  } catch (err) {
    console.warn('Ошибка загрузки миниатюры:', err)
    error.value = true
  } finally {
    isLoading.value = false
  }
}

// Обработчики событий изображения
function onImageLoad() {
  isLoading.value = false
  error.value = false
}

function onImageError() {
  isLoading.value = false
  error.value = true
}

// Настройка Intersection Observer для ленивой загрузки
function setupIntersectionObserver() {
  if (!window.IntersectionObserver) {
    // Fallback для старых браузеров
    isVisible.value = true
    loadThumbnail()
    return
  }

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isVisible.value) {
          isVisible.value = true
          loadThumbnail()
          
          // Отключаем наблюдение после загрузки
          if (observer.value) {
            observer.value.unobserve(entry.target)
          }
        }
      })
    },
    {
      rootMargin: '50px' // Начинаем загрузку за 50px до появления в viewport
    }
  )

  // Начинаем наблюдение за элементом
  if (element.value) {
    observer.value.observe(element.value)
  }
}

onMounted(() => {
  setupIntersectionObserver()
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<template>
  <div ref="element" class="lazy-thumbnail">
    <!-- Контент компонента -->
  </div>
</template>

<style scoped>
.lazy-thumbnail {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 16px;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.loading .thumbnail-image {
  opacity: 0;
}

/* Анимация загрузки */
.loading-state::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
</style>