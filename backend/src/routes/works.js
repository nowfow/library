import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Получить все произведения
router.get('/', async (req, res) => {
  const { composer, work } = req.query;
  try {
    let query = 'SELECT w.name AS title, c.name AS composer, f.path AS pdf_path FROM works w JOIN composers c ON w.composer_id = c.id JOIN files f ON f.work_id = w.id WHERE 1=1';
    const params = [];
    if (composer) {
      const latinA = composer.replace(/^./, 'A');
      const cyrillicA = composer.replace(/^./, 'А');
      const latinLowerA = composer.replace(/^./, 'a');
      const cyrillicLowerA = composer.replace(/^./, 'а');
      query += ' AND (' +
        'c.name LIKE ? COLLATE utf8mb4_unicode_ci OR ' +
        'c.name LIKE ? COLLATE utf8mb4_unicode_ci OR ' +
        'c.name LIKE ? COLLATE utf8mb4_unicode_ci OR ' +
        'c.name LIKE ? COLLATE utf8mb4_unicode_ci)';
      params.push(`%${latinA}%`, `%${cyrillicA}%`, `%${latinLowerA}%`, `%${cyrillicLowerA}%`);
    }
    if (work) {
      const latinA = work.replace(/^./, 'A');
      const cyrillicA = work.replace(/^./, 'А');
      const latinLowerA = work.replace(/^./, 'a');
      const cyrillicLowerA = work.replace(/^./, 'а');
      query += ' AND (' +
        'w.name LIKE ? COLLATE utf8mb4_unicode_ci OR ' +
        'w.name LIKE ? COLLATE utf8mb4_unicode_ci OR ' +
        'w.name LIKE ? COLLATE utf8mb4_unicode_ci OR ' +
        'w.name LIKE ? COLLATE utf8mb4_unicode_ci)';
      params.push(`%${latinA}%`, `%${cyrillicA}%`, `%${latinLowerA}%`, `%${cyrillicLowerA}%`);
    }
    query += ' ORDER BY c.name, w.name';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения произведений', details: err.message });
  }
});

export default router; 