import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Получить все коллекции пользователя
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const [collections] = await pool.query('SELECT * FROM collections WHERE user_id = ?', [userId]);
  res.json(collections);
});

// Создать коллекцию
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Имя коллекции обязательно' });
  await pool.query('INSERT INTO collections (user_id, name) VALUES (?, ?)', [userId, name]);
  res.status(201).json({ message: 'Коллекция создана' });
});

// Удалить коллекцию
router.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  await pool.query('DELETE FROM collections WHERE id = ? AND user_id = ?', [id, userId]);
  res.json({ message: 'Коллекция удалена' });
});

// Получить элементы коллекции
router.get('/:id/items', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  // Проверяем, что коллекция принадлежит пользователю
  const [collections] = await pool.query('SELECT * FROM collections WHERE id = ? AND user_id = ?', [id, userId]);
  if (collections.length === 0) return res.status(404).json({ message: 'Коллекция не найдена' });
  const [items] = await pool.query(`
    SELECT ci.id, ci.work_id, w.name AS title, c.name AS composer
    FROM collection_items ci
    JOIN works w ON ci.work_id = w.id
    JOIN composers c ON w.composer_id = c.id
    WHERE ci.collection_id = ?
  `, [id]);
  res.json(items);
});

// Добавить ноту в коллекцию
router.post('/:id/items', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { work_id } = req.body;
  if (!work_id) return res.status(400).json({ message: 'work_id обязателен' });
  // Проверяем, что коллекция принадлежит пользователю
  const [collections] = await pool.query('SELECT * FROM collections WHERE id = ? AND user_id = ?', [id, userId]);
  if (collections.length === 0) return res.status(404).json({ message: 'Коллекция не найдена' });
  await pool.query('INSERT INTO collection_items (collection_id, work_id) VALUES (?, ?)', [id, work_id]);
  res.status(201).json({ message: 'Нота добавлена в коллекцию' });
});

// Удалить ноту из коллекции
router.delete('/:id/items/:itemId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { id, itemId } = req.params;
  // Проверяем, что коллекция принадлежит пользователю
  const [collections] = await pool.query('SELECT * FROM collections WHERE id = ? AND user_id = ?', [id, userId]);
  if (collections.length === 0) return res.status(404).json({ message: 'Коллекция не найдена' });
  await pool.query('DELETE FROM collection_items WHERE id = ? AND collection_id = ?', [itemId, id]);
  res.json({ message: 'Нота удалена из коллекции' });
});

export default router; 