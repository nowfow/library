<template>
  <v-container class="collections-page">
    <!-- Заголовок -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Мои коллекции</h1>
        <p class="text-body-1 text-medium-emphasis">
          Управляйте своими коллекциями музыкальных произведений
        </p>
      </div>

      <v-btn
        color="primary"
        size="large"
        @click="showCreateDialog = true"
        prepend-icon="mdi-plus"
      >
        Создать коллекцию
      </v-btn>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="48"
      />
      <p class="text-body-2 text-medium-emphasis mt-4">Загрузка коллекций...</p>
    </div>

    <!-- Пустое состояние -->
    <v-card v-else-if="collections.length === 0" class="pa-8 text-center">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">
        mdi-folder-plus
      </v-icon>
      <h3 class="text-h6 mb-2">У вас пока нет коллекций</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Создайте свою первую коллекцию для организации любимых произведений
      </p>
      <v-btn
        color="primary"
        size="large"
        @click="showCreateDialog = true"
        prepend-icon="mdi-plus"
      >
        Создать первую коллекцию
      </v-btn>
    </v-card>

    <!-- Список коллекций -->
    <v-row v-else>
      <v-col
        v-for="collection in collections"
        :key="collection.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          class="collection-card h-100"
          hover
          @click="openCollection(collection)"
        >
          <!-- Заголовок коллекции -->
          <v-card-title class="d-flex align-center pa-4 pb-2">
            <v-icon class="mr-2" color="primary">
              {{ collection.is_public ? 'mdi-folder-open' : 'mdi-folder' }}
            </v-icon>
            <span class="text-truncate">{{ collection.name }}</span>
          </v-card-title>

          <!-- Описание -->
          <v-card-text class="pt-0 pb-2">
            <p v-if="collection.description" class="text-body-2 text-medium-emphasis mb-2 line-clamp-2">
              {{ collection.description }}
            </p>
            
            <!-- Статистика -->
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-icon size="16" class="mr-1">mdi-music-note-multiple</v-icon>
                <span class="text-caption">{{ collection.works_count || 0 }} произведений</span>
              </div>

              <v-chip
                v-if="collection.is_public"
                size="x-small"
                color="success"
                variant="elevated"
              >
                Публичная
              </v-chip>
            </div>
          </v-card-text>

          <!-- Действия -->
          <v-card-actions class="px-4 pb-4">
            <v-btn
              variant="text"
              size="small"
              @click.stop="editCollection(collection)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>

            <v-btn
              variant="text"
              size="small"
              color="error"
              @click.stop="deleteCollection(collection)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>

            <v-spacer />

            <v-btn
              variant="text"
              size="small"
              @click.stop="shareCollection(collection)"
              v-if="collection.is_public"
            >
              <v-icon>mdi-share</v-icon>
            </v-btn>

            <span class="text-caption text-medium-emphasis">
              {{ formatDate(collection.updated_at) }}
            </span>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Диалог создания/редактирования коллекции -->
    <v-dialog v-model="showCreateDialog" max-width="500">
      <v-card>
        <v-card-title>
          {{ editingCollection ? 'Редактировать коллекцию' : 'Создать коллекцию' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="collectionForm">
            <v-text-field
              v-model="collectionForm.name"
              label="Название коллекции"
              variant="outlined"
              :rules="nameRules"
              required
              class="mb-4"
            />

            <v-textarea
              v-model="collectionForm.description"
              label="Описание (необязательно)"
              variant="outlined"
              rows="3"
              class="mb-4"
            />

            <v-checkbox
              v-model="collectionForm.is_public"
              label="Сделать коллекцию публичной"
              density="compact"
              hide-details
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeDialog"
          >
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            @click="saveCollection"
          >
            {{ editingCollection ? 'Сохранить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог подтверждения удаления -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          Удалить коллекцию?
        </v-card-title>

        <v-card-text>
          Вы уверены, что хотите удалить коллекцию "{{ deletingCollection?.name }}"?
          Это действие нельзя отменить.
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
            Отмена
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="confirmDelete"
          >
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection as deleteCollectionAPI
} from '../services/collections.js'

const router = useRouter()

// Состояние
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const collections = ref([])

// Диалоги
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingCollection = ref(null)
const deletingCollection = ref(null)

// Форма коллекции
const collectionForm = reactive({
  name: '',
  description: '',
  is_public: false
})

// Правила валидации
const nameRules = [
  v => !!v || 'Название коллекции обязательно',
  v => v.length >= 2 || 'Название должно содержать минимум 2 символа',
  v => v.length <= 200 || 'Название слишком длинное'
]

// Загрузка коллекций
async function loadCollections() {
  loading.value = true

  try {
    const response = await getCollections()
    collections.value = response.data.collections || []
  } catch (error) {
    console.error('Ошибка загрузки коллекций:', error)
    window.showToast('Ошибка загрузки коллекций', 'error')
  } finally {
    loading.value = false
  }
}

// Открытие коллекции
function openCollection(collection) {
  router.push({
    name: 'CollectionItems',
    params: { id: collection.id }
  })
}

// Редактирование коллекции
function editCollection(collection) {
  editingCollection.value = collection
  collectionForm.name = collection.name
  collectionForm.description = collection.description || ''
  collectionForm.is_public = collection.is_public
  showCreateDialog.value = true
}

// Удаление коллекции
function deleteCollection(collection) {
  deletingCollection.value = collection
  showDeleteDialog.value = true
}

// Сохранение коллекции
async function saveCollection() {
  saving.value = true

  try {
    if (editingCollection.value) {
      // Обновление существующей коллекции
      await updateCollection(editingCollection.value.id, collectionForm)
      window.showToast('Коллекция обновлена', 'success')
    } else {
      // Создание новой коллекции
      await createCollection(
        collectionForm.name,
        collectionForm.description,
        collectionForm.is_public
      )
      window.showToast('Коллекция создана', 'success')
    }

    closeDialog()
    await loadCollections()
  } catch (error) {
    console.error('Ошибка сохранения коллекции:', error)
    window.showToast('Ошибка сохранения коллекции', 'error')
  } finally {
    saving.value = false
  }
}

// Подтверждение удаления
async function confirmDelete() {
  deleting.value = true

  try {
    await deleteCollectionAPI(deletingCollection.value.id)
    window.showToast('Коллекция удалена', 'success')
    
    showDeleteDialog.value = false
    deletingCollection.value = null
    await loadCollections()
  } catch (error) {
    console.error('Ошибка удаления коллекции:', error)
    window.showToast('Ошибка удаления коллекции', 'error')
  } finally {
    deleting.value = false
  }
}

// Закрытие диалога
function closeDialog() {
  showCreateDialog.value = false
  editingCollection.value = null
  collectionForm.name = ''
  collectionForm.description = ''
  collectionForm.is_public = false
}

// Поделиться коллекцией
function shareCollection(collection) {
  const url = `${window.location.origin}/collections/${collection.id}`
  navigator.clipboard.writeText(url).then(() => {
    window.showToast('Ссылка скопирована в буфер обмена', 'success')
  }).catch(() => {
    window.showToast('Не удалось скопировать ссылку', 'error')
  })
}

// Утилиты
function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('ru-RU')
}

onMounted(() => {
  loadCollections()
})
</script>

<style scoped>
.collections-page {
  max-width: 1200px;
  margin: 0 auto;
}

.collection-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.collection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>