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
      query += ' AND c.name LIKE ? COLLATE utf8mb4_unicode_ci';
      params.push(`%${composer}%`);
    }
    if (work) {
      query += ' AND w.name LIKE ? COLLATE utf8mb4_unicode_ci';
      params.push(`%${work}%`);
    }
    query += ' ORDER BY c.name, w.name';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения произведений', details: err.message });
  }
});

export default router; 