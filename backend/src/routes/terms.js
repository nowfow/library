import express from 'express';
import { executeQuery } from '../db.js';

const router = express.Router();

// Получение всех терминов с возможностью поиска
router.get('/', async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM terms';
    let params = [];
    
    if (search) {
      // Используем FULLTEXT поиск для лучшей производительности
      query += ' WHERE MATCH(term, definition) AGAINST(? IN NATURAL LANGUAGE MODE)';
      params.push(search);
    }
    
    query += ' ORDER BY term ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const terms = await executeQuery(query, params);
    
    // Получаем общее количество для пагинации
    let countQuery = 'SELECT COUNT(*) as total FROM terms';
    let countParams = [];
    
    if (search) {
      countQuery = 'SELECT COUNT(*) as total FROM terms WHERE MATCH(term, definition) AGAINST(? IN NATURAL LANGUAGE MODE)';
      countParams.push(search);
    }
    
    const [countResult] = await executeQuery(countQuery, countParams);
    const total = countResult.total;
    
    res.json({
      terms,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('Ошибка получения терминов:', error);
    res.status(500).json({ 
      error: 'Ошибка получения терминов',
      details: error.message 
    });
  }
});

// Поиск терминов (альтернативный эндпоинт с расширенным поиском)
router.get('/search', async (req, res) => {
  try {
    const { q, exact = false } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Параметр поиска q обязателен' });
    }
    
    let query;
    let params;
    
    if (exact === 'true') {
      // Точный поиск
      query = 'SELECT * FROM terms WHERE term = ? OR definition LIKE ?';
      params = [q, `%${q}%`];
    } else {
      // Поиск с FULLTEXT и дополнительный LIKE поиск для коротких запросов
      if (q.length >= 3) {
        query = `
          SELECT *, 
                 MATCH(term, definition) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
          FROM terms 
          WHERE MATCH(term, definition) AGAINST(? IN NATURAL LANGUAGE MODE)
             OR term LIKE ? 
             OR definition LIKE ?
          ORDER BY relevance DESC, term ASC
        `;
        params = [q, q, `%${q}%`, `%${q}%`];
      } else {
        // Для коротких запросов используем только LIKE
        query = `
          SELECT * FROM terms 
          WHERE term LIKE ? OR definition LIKE ?
          ORDER BY 
            CASE WHEN term LIKE ? THEN 1 ELSE 2 END,
            term ASC
        `;
        params = [`%${q}%`, `%${q}%`, `${q}%`];
      }
    }
    
    const terms = await executeQuery(query, params);
    
    res.json({
      query: q,
      exact,
      found: terms.length,
      terms
    });
  } catch (error) {
    console.error('Ошибка поиска терминов:', error);
    res.status(500).json({ 
      error: 'Ошибка поиска терминов',
      details: error.message 
    });
  }
});

// Получение конкретного термина по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный ID термина' });
    }
    
    const terms = await executeQuery(
      'SELECT * FROM terms WHERE id = ?',
      [parseInt(id)]
    );
    
    if (terms.length === 0) {
      return res.status(404).json({ error: 'Термин не найден' });
    }
    
    res.json(terms[0]);
  } catch (error) {
    console.error('Ошибка получения термина:', error);
    res.status(500).json({ 
      error: 'Ошибка получения термина',
      details: error.message 
    });
  }
});

// Добавление нового термина (требует аутентификации в будущем)
router.post('/', async (req, res) => {
  try {
    const { term, definition } = req.body;
    
    if (!term || !definition) {
      return res.status(400).json({ 
        error: 'Поля term и definition обязательны' 
      });
    }
    
    // Проверяем, не существует ли уже такой термин
    const existing = await executeQuery(
      'SELECT id FROM terms WHERE term = ?',
      [term]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        error: 'Термин с таким названием уже существует' 
      });
    }
    
    const result = await executeQuery(
      'INSERT INTO terms (term, definition) VALUES (?, ?)',
      [term, definition]
    );
    
    // Получаем созданный термин
    const newTerm = await executeQuery(
      'SELECT * FROM terms WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      message: 'Термин успешно добавлен',
      term: newTerm[0]
    });
  } catch (error) {
    console.error('Ошибка добавления термина:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Термин с таким названием уже существует' 
      });
    }
    
    res.status(500).json({ 
      error: 'Ошибка добавления термина',
      details: error.message 
    });
  }
});

// Статистика терминов
router.get('/stats/summary', async (req, res) => {
  try {
    const [totalCount] = await executeQuery('SELECT COUNT(*) as total FROM terms');
    const [avgLength] = await executeQuery('SELECT AVG(LENGTH(definition)) as avg_length FROM terms');
    const recentTerms = await executeQuery(
      'SELECT * FROM terms ORDER BY created_at DESC LIMIT 5'
    );
    
    res.json({
      total: totalCount.total,
      averageDefinitionLength: Math.round(avgLength.avg_length || 0),
      recentTerms
    });
  } catch (error) {
    console.error('Ошибка получения статистики терминов:', error);
    res.status(500).json({ 
      error: 'Ошибка получения статистики',
      details: error.message 
    });
  }
});

export default router;