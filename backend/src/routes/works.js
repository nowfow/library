import express from 'express';
import pool from '../db.js';
import { downloadFile } from '../webdav-client.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types'; // npm install mime-types

const router = express.Router();

// Получить все произведения
router.get('/', async (req, res) => {
  const { composer, work } = req.query;
  try {
    // ВРЕМЕННОЕ ЛОГИРОВАНИЕ
    console.log('[API /api/works] params:', { composer, work });
    let query = `SELECT w.id AS work_id, w.name AS title, c.name AS composer, f.path AS pdf_path,
      categories.name AS category,
      subcategories.name AS subcategory,
      subsubcategories.name AS subsubcategory
      FROM works w
      JOIN composers c ON w.composer_id = c.id
      JOIN files f ON f.work_id = w.id
      LEFT JOIN categories ON f.category_id = categories.id
      LEFT JOIN subcategories ON f.subcategory_id = subcategories.id
      LEFT JOIN subsubcategories ON f.subsubcategory_id = subsubcategories.id
      WHERE 1=1`;
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
    // ВРЕМЕННОЕ ЛОГИРОВАНИЕ
    console.log('[API /api/works] SQL:', query, params);
    const [rows] = await pool.query(query, params);
    // ВРЕМЕННОЕ ЛОГИРОВАНИЕ
    console.log('[API /api/works] rows:', rows);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения произведений', details: err.message });
  }
});

// Получить только файлы для точного произведения и композитора (гибкий поиск)
router.get('/files', async (req, res) => {
  const { composer, work } = req.query;
  // Логирование для диагностики несовпадений
  console.log('composer param:', composer, 'HEX:', Buffer.from(composer, 'utf8').toString('hex'));
  console.log('work param:', work, 'HEX:', Buffer.from(work, 'utf8').toString('hex'));
  try {
    if (!composer || !work) return res.status(400).json({ error: 'Не заданы composer и work' });
    // Найти id композитора (гибко)
    const [composerRows] = await pool.query('SELECT id FROM composers WHERE TRIM(name) LIKE TRIM(?) COLLATE utf8mb4_unicode_ci', [composer]);
    if (!composerRows.length) return res.json([]);
    const composerId = composerRows[0].id;
    // Найти id произведения (гибко)
    const [workRows] = await pool.query('SELECT id FROM works WHERE TRIM(name) LIKE TRIM(?) AND composer_id = ? COLLATE utf8mb4_unicode_ci', [work, composerId]);
    if (!workRows.length) return res.json([]);
    const workId = workRows[0].id;
    // Найти файлы
    const [files] = await pool.query('SELECT path AS pdf_path FROM files WHERE work_id = ?', [workId]);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения файлов', details: err.message });
  }
});

// Прокси для скачивания файла с WebDAV
router.get('/download', async (req, res) => {
  const { path: filePath } = req.query;
  if (!filePath) {
    return res.status(400).json({ error: 'Не указан путь к файлу' });
  }
  try {
    let decodedPath = decodeURIComponent(filePath);
    decodedPath = '/' + decodedPath.replace(/^\/+/,'');
    const filename = decodeURIComponent(path.basename(decodedPath));
    const contentType = mime.lookup(filename) || 'application/octet-stream';
    try {
      const fileBuffer = await downloadFile(decodedPath);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      return res.send(fileBuffer);
    } catch (err1) {
      // Если 403, пробуем без ведущего слэша
      if (err1.message && err1.message.includes('403')) {
        const altPath = decodedPath.replace(/^\//, '');
        try {
          const fileBuffer = await downloadFile(altPath);
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
          return res.send(fileBuffer);
        } catch (err2) {
          return res.status(500).json({ error: 'Ошибка получения файла', details: err2.message, tried: [decodedPath, altPath] });
        }
      } else {
        throw err1;
      }
    }
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения файла', details: err.message });
  }
});

// Endpoint для получения миниатюры по pdf_path
router.get('/thumbnail', async (req, res) => {
  const { pdf_path } = req.query;
  if (!pdf_path) return res.status(400).json({ error: 'Не указан путь к PDF' });
  try {
    const [rows] = await pool.query('SELECT thumbnail_path FROM thumbnails WHERE pdf_path = ?', [pdf_path]);
    if (!rows.length) return res.status(404).json({ error: 'Миниатюра не найдена' });
    // Можно вернуть путь или сразу проксировать картинку, если нужно
    res.json({ thumbnail_path: rows[0].thumbnail_path });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения миниатюры', details: err.message });
  }
});

export default router; 