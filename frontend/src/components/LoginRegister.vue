<template>
  <v-container class="auth-page">
    <v-row justify="center" align="center" class="min-height-screen">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="auth-card" elevation="8" rounded="xl">
          <v-card-text class="pa-8">
            <!-- Заголовок -->
            <div class="text-center mb-6">
              <v-icon size="64" color="primary" class="mb-4">
                mdi-music-note
              </v-icon>
              <h1 class="text-h4 font-weight-bold text-primary mb-2">
                Музыкальная библиотека
              </h1>
              <p class="text-body-2 text-medium-emphasis">
                {{ isLoginMode ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт' }}
              </p>
            </div>

            <!-- Переключатель режимов -->
            <v-tabs
              v-model="activeTab"
              bg-color="transparent"
              color="primary"
              grow
              class="mb-6"
            >
              <v-tab value="login">Вход</v-tab>
              <v-tab value="register">Регистрация</v-tab>
            </v-tabs>

            <!-- Форма входа -->
            <v-window v-model="activeTab">
              <v-window-item value="login">
                <v-form ref="loginForm" @submit.prevent="handleLogin">
                  <v-text-field
                    v-model="loginData.email"
                    label="Email"
                    type="email"
                    variant="outlined"
                    prepend-inner-icon="mdi-email"
                    :rules="emailRules"
                    required
                    class="mb-4"
                  />

                  <v-text-field
                    v-model="loginData.password"
                    label="Пароль"
                    :type="showPassword ? 'text' : 'password'"
                    variant="outlined"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword = !showPassword"
                    :rules="passwordRules"
                    required
                    class="mb-4"
                  />

                  <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    block
                    :loading="loading"
                    class="mb-4"
                  >
                    Войти
                  </v-btn>
                </v-form>
              </v-window-item>

              <!-- Форма регистрации -->
              <v-window-item value="register">
                <v-form ref="registerForm" @submit.prevent="handleRegister">
                  <v-text-field
                    v-model="registerData.name"
                    label="Имя"
                    variant="outlined"
                    prepend-inner-icon="mdi-account"
                    :rules="nameRules"
                    required
                    class="mb-4"
                  />

                  <v-text-field
                    v-model="registerData.email"
                    label="Email"
                    type="email"
                    variant="outlined"
                    prepend-inner-icon="mdi-email"
                    :rules="emailRules"
                    required
                    class="mb-4"
                  />

                  <v-text-field
                    v-model="registerData.password"
                    label="Пароль"
                    :type="showPassword ? 'text' : 'password'"
                    variant="outlined"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword = !showPassword"
                    :rules="passwordRules"
                    required
                    class="mb-4"
                  />

                  <v-text-field
                    v-model="registerData.confirmPassword"
                    label="Подтвердите пароль"
                    :type="showPassword ? 'text' : 'password'"
                    variant="outlined"
                    prepend-inner-icon="mdi-lock-check"
                    :rules="confirmPasswordRules"
                    required
                    class="mb-4"
                  />

                  <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    block
                    :loading="loading"
                    class="mb-4"
                  >
                    Зарегистрироваться
                  </v-btn>
                </v-form>
              </v-window-item>
            </v-window>

            <!-- Альтернативные методы входа -->
            <v-divider class="my-6">
              <span class="text-caption text-medium-emphasis px-4">или</span>
            </v-divider>

            <v-btn
              variant="outlined"
              size="large"
              block
              @click="handleGoogleAuth"
              class="mb-4"
            >
              <v-icon left>mdi-google</v-icon>
              Войти через Google
            </v-btn>

            <!-- Сообщение об ошибке -->
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
        </v-card>

        <!-- Ссылка на вход без регистрации -->
        <div class="text-center mt-4">
          <v-btn
            variant="text"
            color="primary"
            @click="continueAsGuest"
          >
            Продолжить без регистрации
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { login, register } from '../services/auth.js'

const router = useRouter()

// Состояние формы
const activeTab = ref('login')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

// Данные форм
const loginData = reactive({
  email: '',
  password: ''
})

const registerData = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Вычисляемые свойства
const isLoginMode = computed(() => activeTab.value === 'login')

// Правила валидации
const emailRules = [
  v => !!v || 'Email обязателен',
  v => /.+@.+\..+/.test(v) || 'Email должен быть корректным'
]

const passwordRules = [
  v => !!v || 'Пароль обязателен',
  v => v.length >= 6 || 'Пароль должен содержать минимум 6 символов'
]

const nameRules = [
  v => !!v || 'Имя обязательно',
  v => v.length >= 2 || 'Имя должно содержать минимум 2 символа'
]

const confirmPasswordRules = [
  v => !!v || 'Подтверждение пароля обязательно',
  v => v === registerData.password || 'Пароли не совпадают'
]

// Обработчики форм
async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    await login(loginData.email, loginData.password)
    window.showToast('Успешный вход в систему!', 'success')
    
    // Перенаправляем на главную страницу
    await router.push('/')
    
    // Перезагружаем страницу для обновления состояния
    window.location.reload()
  } catch (err) {
    console.error('Ошибка входа:', err)
    error.value = err.response?.data?.error || 'Ошибка входа в систему'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  error.value = ''
  loading.value = true

  try {
    await register(registerData.email, registerData.password, registerData.name)
    window.showToast('Регистрация прошла успешно!', 'success')
    
    // Перенаправляем на главную страницу
    await router.push('/')
    
    // Перезагружаем страницу для обновления состояния
    window.location.reload()
  } catch (err) {
    console.error('Ошибка регистрации:', err)
    error.value = err.response?.data?.error || 'Ошибка регистрации'
  } finally {
    loading.value = false
  }
}

// Google OAuth (заглушка)
function handleGoogleAuth() {
  window.showToast('Google OAuth временно недоступен', 'info')
  // TODO: Реализовать Google OAuth
}

// Продолжить без регистрации
function continueAsGuest() {
  router.push('/')
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
}

.min-height-screen {
  min-height: 100vh;
}

.auth-card {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.v-tab {
  text-transform: none;
}
</style>