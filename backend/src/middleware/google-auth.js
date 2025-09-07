import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { executeQuery } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Конфигурация Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Проверяем, существует ли пользователь с таким Google ID
    let existingUser = await executeQuery(
      'SELECT * FROM users WHERE google_id = ? AND is_active = TRUE',
      [profile.id]
    );

    if (existingUser.length > 0) {
      // Пользователь существует, обновляем информацию
      await executeQuery(
        'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE google_id = ?',
        [profile.displayName, profile.id]
      );
      
      return done(null, existingUser[0]);
    }

    // Проверяем, есть ли пользователь с таким email
    const emailUser = await executeQuery(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [profile.emails[0].value]
    );

    if (emailUser.length > 0) {
      // Пользователь с таким email уже существует, связываем с Google
      await executeQuery(
        'UPDATE users SET google_id = ?, name = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
        [profile.id, profile.displayName, profile.emails[0].value]
      );
      
      const updatedUser = await executeQuery(
        'SELECT * FROM users WHERE email = ?',
        [profile.emails[0].value]
      );
      
      return done(null, updatedUser[0]);
    }

    // Создаем нового пользователя
    const newUserId = await executeQuery(
      'INSERT INTO users (email, name, google_id, role, is_active) VALUES (?, ?, ?, ?, ?)',
      [
        profile.emails[0].value,
        profile.displayName,
        profile.id,
        'user',
        true
      ]
    );

    const newUser = await executeQuery(
      'SELECT * FROM users WHERE id = ?',
      [newUserId.insertId]
    );

    return done(null, newUser[0]);
  } catch (error) {
    console.error('Ошибка Google OAuth:', error);
    return done(error, null);
  }
}));

// Сериализация/десериализация пользователя для сессий
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const users = await executeQuery(
      'SELECT id, email, name, role, google_id FROM users WHERE id = ? AND is_active = TRUE',
      [id]
    );
    done(null, users[0] || null);
  } catch (error) {
    done(error, null);
  }
});

// Middleware для создания JWT токена после Google OAuth
export function generateJWTFromGoogle(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export default passport;