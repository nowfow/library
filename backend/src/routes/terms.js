import express from 'express';
import pool from '../db.js';

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
    // Универсальный поиск по первой букве для похожих букв латиницы и кириллицы
    const similarLetters = {
      'A': 'А', 'a': 'а',
      'B': 'В', 'E': 'Е', 'e': 'е',
      'K': 'К', 'M': 'М', 'H': 'Н',
      'O': 'О', 'o': 'о',
      'P': 'Р', 'C': 'С', 'c': 'с',
      'T': 'Т', 'X': 'Х', 'x': 'х',
      'Y': 'У', 'y': 'у'
    };
    function getLetterVariants(char) {
      const variants = [char];
      for (const [lat, cyr] of Object.entries(similarLetters)) {
        if (char === lat && !variants.includes(cyr)) variants.push(cyr);
        if (char === cyr && !variants.includes(lat)) variants.push(lat);
      }
      return variants;
    }
    const firstChar = q.charAt(0);
    const rest = q.slice(1);
    const firstCharVariants = getLetterVariants(firstChar);
    const likeQueries = [`%${q}%`];
    for (const variant of firstCharVariants) {
      if (variant !== firstChar) {
        likeQueries.push(`%${variant + rest}%`);
      }
    }
    const placeholders = likeQueries.map(() => 'term LIKE ? COLLATE utf8mb4_unicode_ci').join(' OR ');
    const [rows] = await pool.query(
      `SELECT term, description FROM terms WHERE ${placeholders}`,
      likeQueries
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка поиска по термину', details: err.message });
  }
});

export default router;
