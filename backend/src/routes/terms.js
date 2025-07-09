import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Получить все термины
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT term, description FROM terms ORDER BY term');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения терминов', details: err.message });
  }
});

// Поиск по термину
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Не указан поисковый запрос' });
  try {
    const likeQuery = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT term, description FROM terms 
       WHERE term LIKE ?`,
      [likeQuery]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка поиска по термину', details: err.message });
  }
});

export default router;
