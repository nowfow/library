import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { executeQuery } from '../db.js';
import passport, { generateJWTFromGoogle } from '../middleware/google-auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Middleware для проверки JWT токена
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Токен доступа не предоставлен' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Ошибка верификации токена:', err.message);
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    
    req.user = user;
    next();
  });
}

// Регистрация нового пользователя
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Валидация входных данных
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Все поля обязательны для заполнения' 
      });
    }
    
    // Проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Некорректный формат email' 
      });
    }
    
    // Проверка сложности пароля
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Пароль должен содержать минимум 6 символов' 
      });
    }
    
    // Проверка, существует ли уже пользователь с таким email
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    
    if (existingUser.length > 0) {
      return res.status(409).json({ 
        error: 'Пользователь с таким email уже существует' 
      });
    }
    
    // Хеширование пароля
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Создание пользователя
    const result = await executeQuery(
      'INSERT INTO users (email, password_hash, name, role, is_active) VALUES (?, ?, ?, ?, ?)',
      [email.toLowerCase(), hashedPassword, name, 'user', true]
    );
    
    // Получение созданного пользователя
    const newUser = await executeQuery(
      'SELECT id, email, name, role, is_active, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    
    // Создание JWT токена
    const token = jwt.sign(
      { 
        userId: newUser[0].id, 
        email: newUser[0].email, 
        role: newUser[0].role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: newUser[0],
      token
    });
  } catch (error) {
    console.error('Ошибка регистрации пользователя:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Пользователь с таким email уже существует' 
      });
    }
    
    res.status(500).json({ 
      error: 'Ошибка регистрации пользователя',
      details: error.message 
    });
  }
});

// Авторизация пользователя
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email и пароль обязательны для заполнения' 
      });
    }
    
    // Поиск пользователя по email
    const users = await executeQuery(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email.toLowerCase()]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Неверный email или пароль' 
      });
    }
    
    const user = users[0];
    
    // Проверка пароля
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        error: 'Неверный email или пароль' 
      });
    }
    
    // Создание JWT токена
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Возвращаем информацию о пользователе без пароля
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Успешная авторизация',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ 
      error: 'Ошибка авторизации',
      details: error.message 
    });
  }
});

// Получение информации о текущем пользователе
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const users = await executeQuery(
      'SELECT id, email, name, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Ошибка получения информации о пользователе:', error);
    res.status(500).json({ 
      error: 'Ошибка получения информации о пользователе',
      details: error.message 
    });
  }
});

// Google OAuth маршруты
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: process.env.FRONTEND_URL + '/login?error=google_auth_failed',
    session: false
  }),
  async (req, res) => {
    try {
      // Генерируем JWT токен для пользователя
      const token = generateJWTFromGoogle(req.user);
      
      // Перенаправляем на фронтенд с токеном
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendURL}/auth/google/success?token=${token}`);
    } catch (error) {
      console.error('Ошибка Google OAuth callback:', error);
      res.redirect(process.env.FRONTEND_URL + '/login?error=token_generation_failed');
    }
  }
);

// Связывание существующего аккаунта с Google
router.post('/link-google', authenticateToken, async (req, res) => {
  try {
    const { googleToken } = req.body;
    
    if (!googleToken) {
      return res.status(400).json({ error: 'Google токен обязателен' });
    }
    
    // Здесь можно добавить проверку Google токена
    // Для демонстрации просто возвращаем успех
    
    res.json({ 
      message: 'Аккаунт успешно связан с Google',
      linked: true 
    });
  } catch (error) {
    console.error('Ошибка связывания с Google:', error);
    res.status(500).json({ 
      error: 'Ошибка связывания с Google',
      details: error.message 
    });
  }
});

// Обновление профиля пользователя
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Имя обязательно для заполнения' });
    }
    
    let updateQuery = 'UPDATE users SET name = ?';
    let params = [name];
    
    // Если пользователь хочет изменить пароль
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          error: 'Для изменения пароля необходимо указать текущий пароль' 
        });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          error: 'Новый пароль должен содержать минимум 6 символов' 
        });
      }
      
      // Проверяем текущий пароль
      const users = await executeQuery(
        'SELECT password_hash FROM users WHERE id = ?',
        [req.user.userId]
      );
      
      const passwordMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Неверный текущий пароль' });
      }
      
      // Хешируем новый пароль
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      updateQuery += ', password_hash = ?';
      params.push(hashedNewPassword);
    }
    
    updateQuery += ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    params.push(req.user.userId);
    
    await executeQuery(updateQuery, params);
    
    // Возвращаем обновленную информацию о пользователе
    const updatedUser = await executeQuery(
      'SELECT id, email, name, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    res.json({
      message: 'Профиль успешно обновлен',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ 
      error: 'Ошибка обновления профиля',
      details: error.message 
    });
  }
});

// Проверка действительности токена
router.post('/verify-token', authenticateToken, (req, res) => {
  res.json({ 
    valid: true,
    user: {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Обновление токена
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    // Проверяем, что пользователь все еще активен
    const users = await executeQuery(
      'SELECT id, email, role, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [req.user.userId]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден или неактивен' });
    }
    
    const user = users[0];
    
    // Создаем новый токен
    const newToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      message: 'Токен успешно обновлен',
      token: newToken
    });
  } catch (error) {
    console.error('Ошибка обновления токена:', error);
    res.status(500).json({ 
      error: 'Ошибка обновления токена',
      details: error.message 
    });
  }
});

// Выход из системы (в данной реализации просто возвращаем успех)
router.post('/logout', authenticateToken, (req, res) => {
  // В JWT-based системе логаут происходит на клиенте путем удаления токена
  // Для более продвинутой реализации можно вести blacklist токенов
  res.json({ message: 'Успешный выход из системы' });
});

export default router;