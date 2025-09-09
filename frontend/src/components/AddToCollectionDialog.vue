<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title>
        <v-icon class="mr-2">mdi-plus</v-icon>
        Добавить в коллекцию
      </v-card-title>

      <v-card-text>
        <div v-if="work" class="mb-4">
          <div class="text-body-2 text-medium-emphasis mb-1">Произведение:</div>
          <div class="font-weight-medium">{{ work.work_title }}</div>
          <div class="text-body-2 text-primary">{{ work.composer }}</div>
        </div>

        <!-- Загрузка коллекций -->
        <div v-if="loadingCollections" class="text-center py-4">
          <v-progress-circular indeterminate color="primary" />
          <p class="text-body-2 mt-2">Загрузка коллекций...</p>
        </div>

        <!-- Список коллекций -->
        <div v-else-if="collections.length">
          <div class="text-body-2 text-medium-emphasis mb-2">Выберите коллекцию:</div>
          <v-list density="compact">
            <v-list-item
              v-for="collection in collections"
              :key="collection.id"
              @click="selectCollection(collection)"
              :class="{ 'bg-primary-lighten-5': selectedCollection?.id === collection.id }"
            >
              <template v-slot:prepend>
                <v-icon>{{ collection.is_public ? 'mdi-folder-open' : 'mdi-folder' }}</v-icon>
              </template>
              
              <v-list-item-title>{{ collection.name }}</v-list-item-title>
              
              <template v-slot:append>
                <v-chip size="x-small" variant="outlined">
                  {{ collection.works_count || 0 }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </div>

        <!-- Создание новой коллекции -->
        <div class="mt-4">
          <v-divider class="mb-4" />
          
          <div class="text-body-2 text-medium-emphasis mb-2">Или создайте новую:</div>
          
          <v-text-field
            v-model="newCollectionName"
            label="Название новой коллекции"
            variant="outlined"
            density="compact"
            :rules="nameRules"
            hide-details
            class="mb-2"
          />
          
          <v-btn
            variant="outlined"
            size="small"
            @click="createNewCollection"
            :loading="creatingCollection"
            :disabled="!newCollectionName"
            prepend-icon="mdi-plus"
          >
            Создать коллекцию
          </v-btn>
        </div>

        <!-- Ошибка -->
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mt-4"
          closable
          @click:close="error = ''"
        >
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="close"
        >
          Отмена
        </v-btn>
        <v-btn
          color="primary"
          :loading="adding"
          :disabled="!selectedCollection"
          @click="addToCollection"
        >
          Добавить
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { 
  getCollections, 
  createCollection, 
  addWorkToCollection 
} from '../services/collections.js'

const props = defineProps({
  modelValue: Boolean,
  work: Object
})

const emit = defineEmits(['update:modelValue', 'added'])

// Состояние
const dialog = ref(false)
const loadingCollections = ref(false)
const adding = ref(false)
const creatingCollection = ref(false)
const error = ref('')

// Данные
const collections = ref([])
const selectedCollection = ref(null)
const newCollectionName = ref('')

// Правила валидации
const nameRules = [
  v => !!v || 'Название обязательно',
  v => v.length >= 2 || 'Минимум 2 символа'
]

// Отслеживание изменения dialog
watch(() => props.modelValue, (value) => {
  dialog.value = value
  if (value) {
    loadCollections()
  } else {
    resetForm()
  }
})

watch(dialog, (value) => {
  emit('update:modelValue', value)
})

// Загрузка коллекций
async function loadCollections() {
  loadingCollections.value = true
  error.value = ''

  try {
    const response = await getCollections()
    collections.value = response.data.collections || []
  } catch (err) {
    console.error('Ошибка загрузки коллекций:', err)
    error.value = 'Ошибка загрузки коллекций'
  } finally {
    loadingCollections.value = false
  }
}

// Выбор коллекции
function selectCollection(collection) {
  selectedCollection.value = collection
}

// Создание новой коллекции
async function createNewCollection() {
  if (!newCollectionName.value) return

  creatingCollection.value = true
  error.value = ''

  try {
    const response = await createCollection(newCollectionName.value)
    const newCollection = response.data
    
    // Добавляем в список и выбираем
    collections.value.unshift(newCollection)
    selectedCollection.value = newCollection
    newCollectionName.value = ''
    
    window.showToast('Коллекция создана', 'success')
  } catch (err) {
    console.error('Ошибка создания коллекции:', err)
    error.value = 'Ошибка создания коллекции'
  } finally {
    creatingCollection.value = false
  }
}

// Добавление в коллекцию
async function addToCollection() {
  if (!selectedCollection.value || !props.work) return

  adding.value = true
  error.value = ''

  try {
    await addWorkToCollection(selectedCollection.value.id, props.work.id)
    
    emit('added', {
      collection: selectedCollection.value,
      work: props.work
    })
    
    close()
  } catch (err) {
    console.error('Ошибка добавления в коллекцию:', err)
    
    if (err.response?.status === 409) {
      error.value = 'Произведение уже есть в этой коллекции'
    } else {
      error.value = 'Ошибка добавления в коллекцию'
    }
  } finally {
    adding.value = false
  }
}

// Закрытие диалога
function close() {
  dialog.value = false
}

// Сброс формы
function resetForm() {
  selectedCollection.value = null
  newCollectionName.value = ''
  error.value = ''
}
</script>

<style scoped>
.v-list-item {
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 4px;
}

.v-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.bg-primary-lighten-5 {
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>