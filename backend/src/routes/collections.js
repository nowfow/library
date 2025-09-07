import express from 'express';
import { executeQuery } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Получение всех коллекций пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const collections = await executeQuery(`
      SELECT 
        uc.*,
        COUNT(cw.work_id) as works_count
      FROM user_collections uc
      LEFT JOIN collection_works cw ON uc.id = cw.collection_id
      WHERE uc.user_id = ?
      GROUP BY uc.id
      ORDER BY uc.updated_at DESC
    `, [req.user.userId]);
    
    res.json({ collections });
  } catch (error) {
    console.error('Ошибка получения коллекций:', error);
    res.status(500).json({ 
      error: 'Ошибка получения коллекций',
      details: error.message 
    });
  }
});

// Получение публичных коллекций
router.get('/public', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const collections = await executeQuery(`
      SELECT 
        uc.*,
        u.name as author_name,
        COUNT(cw.work_id) as works_count
      FROM user_collections uc
      JOIN users u ON uc.user_id = u.id
      LEFT JOIN collection_works cw ON uc.id = cw.collection_id
      WHERE uc.is_public = TRUE
      GROUP BY uc.id
      ORDER BY uc.updated_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);
    
    const [countResult] = await executeQuery(
      'SELECT COUNT(*) as total FROM user_collections WHERE is_public = TRUE'
    );
    
    res.json({ 
      collections,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < countResult.total
      }
    });
  } catch (error) {
    console.error('Ошибка получения публичных коллекций:', error);
    res.status(500).json({ 
      error: 'Ошибка получения публичных коллекций',
      details: error.message 
    });
  }
});

// Создание новой коллекции
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, is_public = false } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Название коллекции обязательно' });
    }
    
    if (name.length > 255) {
      return res.status(400).json({ error: 'Название коллекции слишком длинное (максимум 255 символов)' });
    }
    
    // Проверяем, нет ли уже коллекции с таким названием у пользователя
    const existing = await executeQuery(
      'SELECT id FROM user_collections WHERE user_id = ? AND name = ?',
      [req.user.userId, name.trim()]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        error: 'У вас уже есть коллекция с таким названием' 
      });
    }
    
    const result = await executeQuery(
      'INSERT INTO user_collections (user_id, name, description, is_public) VALUES (?, ?, ?, ?)',
      [req.user.userId, name.trim(), description || null, Boolean(is_public)]
    );
    
    // Получаем созданную коллекцию
    const newCollection = await executeQuery(
      'SELECT * FROM user_collections WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      message: 'Коллекция успешно создана',
      collection: { ...newCollection[0], works_count: 0 }
    });
  } catch (error) {
    console.error('Ошибка создания коллекции:', error);
    res.status(500).json({ 
      error: 'Ошибка создания коллекции',
      details: error.message 
    });
  }
});

// Получение конкретной коллекции
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { include_works = true } = req.query;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный ID коллекции' });
    }
    
    // Получаем коллекцию
    let query = `
      SELECT 
        uc.*,
        u.name as author_name,
        COUNT(cw.work_id) as works_count
      FROM user_collections uc
      JOIN users u ON uc.user_id = u.id
      LEFT JOIN collection_works cw ON uc.id = cw.collection_id
      WHERE uc.id = ?
    `;
    
    // Проверяем права доступа если пользователь авторизован
    if (req.headers.authorization) {
      try {
        authenticateToken(req, res, () => {});
        if (req.user) {
          query += ' AND (uc.is_public = TRUE OR uc.user_id = ?)';
        }
      } catch (err) {
        // Если токен невалидный, показываем только публичные
        query += ' AND uc.is_public = TRUE';
      }
    } else {
      // Неавторизованные пользователи видят только публичные коллекции
      query += ' AND uc.is_public = TRUE';
    }
    
    query += ' GROUP BY uc.id';
    
    const params = req.user ? [parseInt(id), req.user.userId] : [parseInt(id)];
    const collections = await executeQuery(query, params);
    
    if (collections.length === 0) {
      return res.status(404).json({ error: 'Коллекция не найдена или недоступна' });
    }
    
    const collection = collections[0];
    
    // Если запрошены произведения, получаем их
    if (include_works === 'true' || include_works === true) {
      const works = await executeQuery(`
        SELECT 
          w.*,
          cw.added_at
        FROM collection_works cw
        JOIN works w ON cw.work_id = w.id
        WHERE cw.collection_id = ?
        ORDER BY cw.added_at DESC
      `, [parseInt(id)]);
      
      collection.works = works;
    }
    
    res.json({ collection });
  } catch (error) {
    console.error('Ошибка получения коллекции:', error);
    res.status(500).json({ 
      error: 'Ошибка получения коллекции',
      details: error.message 
    });
  }
});

// Обновление коллекции
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_public } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный ID коллекции' });
    }
    
    // Проверяем, принадлежит ли коллекция пользователю
    const collections = await executeQuery(
      'SELECT * FROM user_collections WHERE id = ? AND user_id = ?',
      [parseInt(id), req.user.userId]
    );
    
    if (collections.length === 0) {
      return res.status(404).json({ error: 'Коллекция не найдена' });
    }
    
    // Подготавливаем данные для обновления
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Название коллекции обязательно' });
      }
      if (name.length > 255) {
        return res.status(400).json({ error: 'Название коллекции слишком длинное' });
      }
      
      // Проверяем уникальность названия
      const existing = await executeQuery(
        'SELECT id FROM user_collections WHERE user_id = ? AND name = ? AND id != ?',
        [req.user.userId, name.trim(), parseInt(id)]
      );
      
      if (existing.length > 0) {
        return res.status(409).json({ 
          error: 'У вас уже есть коллекция с таким названием' 
        });
      }
      
      updates.push('name = ?');
      params.push(name.trim());
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description || null);
    }
    
    if (is_public !== undefined) {
      updates.push('is_public = ?');
      params.push(Boolean(is_public));
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(parseInt(id), req.user.userId);
    
    await executeQuery(
      `UPDATE user_collections SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );
    
    // Возвращаем обновленную коллекцию
    const updatedCollection = await executeQuery(`
      SELECT 
        uc.*,
        COUNT(cw.work_id) as works_count
      FROM user_collections uc
      LEFT JOIN collection_works cw ON uc.id = cw.collection_id
      WHERE uc.id = ? AND uc.user_id = ?
      GROUP BY uc.id
    `, [parseInt(id), req.user.userId]);
    
    res.json({
      message: 'Коллекция успешно обновлена',
      collection: updatedCollection[0]
    });
  } catch (error) {
    console.error('Ошибка обновления коллекции:', error);
    res.status(500).json({ 
      error: 'Ошибка обновления коллекции',
      details: error.message 
    });
  }
});

// Удаление коллекции
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный ID коллекции' });
    }
    
    // Проверяем, принадлежит ли коллекция пользователю
    const collections = await executeQuery(
      'SELECT name FROM user_collections WHERE id = ? AND user_id = ?',
      [parseInt(id), req.user.userId]
    );
    
    if (collections.length === 0) {
      return res.status(404).json({ error: 'Коллекция не найдена' });
    }
    
    const collectionName = collections[0].name;
    
    // Удаляем коллекцию (связанные записи удалятся автоматически благодаря CASCADE)
    await executeQuery(
      'DELETE FROM user_collections WHERE id = ? AND user_id = ?',
      [parseInt(id), req.user.userId]
    );
    
    res.json({
      message: `Коллекция "${collectionName}" успешно удалена`
    });
  } catch (error) {
    console.error('Ошибка удаления коллекции:', error);
    res.status(500).json({ 
      error: 'Ошибка удаления коллекции',
      details: error.message 
    });
  }
});

// Добавление произведения в коллекцию
router.post('/:id/works', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { work_id } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный ID коллекции' });
    }
    
    if (!work_id || isNaN(work_id)) {
      return res.status(400).json({ error: 'Некорректный ID произведения' });
    }
    
    // Проверяем, принадлежит ли коллекция пользователю
    const collections = await executeQuery(
      'SELECT id FROM user_collections WHERE id = ? AND user_id = ?',
      [parseInt(id), req.user.userId]
    );
    
    if (collections.length === 0) {
      return res.status(404).json({ error: 'Коллекция не найдена' });
    }
    
    // Проверяем, существует ли произведение
    const works = await executeQuery(
      'SELECT id, composer, work_title FROM works WHERE id = ?',
      [parseInt(work_id)]
    );
    
    if (works.length === 0) {
      return res.status(404).json({ error: 'Произведение не найдено' });
    }
    
    // Проверяем, не добавлено ли уже произведение в коллекцию
    const existing = await executeQuery(
      'SELECT id FROM collection_works WHERE collection_id = ? AND work_id = ?',
      [parseInt(id), parseInt(work_id)]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        error: 'Произведение уже добавлено в коллекцию' 
      });
    }
    
    // Добавляем произведение в коллекцию
    await executeQuery(
      'INSERT INTO collection_works (collection_id, work_id) VALUES (?, ?)',
      [parseInt(id), parseInt(work_id)]
    );
    
    // Обновляем timestamp коллекции
    await executeQuery(
      'UPDATE user_collections SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [parseInt(id)]
    );
    
    res.status(201).json({
      message: `Произведение "${works[0].composer} - ${works[0].work_title}" добавлено в коллекцию`
    });
  } catch (error) {
    console.error('Ошибка добавления произведения в коллекцию:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Произведение уже добавлено в коллекцию' 
      });
    }
    
    res.status(500).json({ 
      error: 'Ошибка добавления произведения в коллекцию',
      details: error.message 
    });
  }
});

// Удаление произведения из коллекции
router.delete('/:id/works/:work_id', authenticateToken, async (req, res) => {
  try {
    const { id, work_id } = req.params;
    
    if (!id || isNaN(id) || !work_id || isNaN(work_id)) {
      return res.status(400).json({ error: 'Некорректные ID коллекции или произведения' });
    }
    
    // Проверяем, принадлежит ли коллекция пользователю
    const collections = await executeQuery(
      'SELECT id FROM user_collections WHERE id = ? AND user_id = ?',
      [parseInt(id), req.user.userId]
    );
    
    if (collections.length === 0) {
      return res.status(404).json({ error: 'Коллекция не найдена' });
    }
    
    // Удаляем произведение из коллекции
    const result = await executeQuery(
      'DELETE FROM collection_works WHERE collection_id = ? AND work_id = ?',
      [parseInt(id), parseInt(work_id)]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Произведение не найдено в коллекции' 
      });
    }
    
    // Обновляем timestamp коллекции
    await executeQuery(
      'UPDATE user_collections SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [parseInt(id)]
    );
    
    res.json({
      message: 'Произведение удалено из коллекции'
    });
  } catch (error) {
    console.error('Ошибка удаления произведения из коллекции:', error);
    res.status(500).json({ 
      error: 'Ошибка удаления произведения из коллекции',
      details: error.message 
    });
  }
});

export default router;