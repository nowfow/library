import express from 'express';
import { downloadFile, listFiles } from '../webdav-client.js';
import { pool } from '../db.js';

const router = express.Router();

// Получить миниатюру по pdf_path
router.get('/thumbnail', async (req, res) => {
  const { pdf_path } = req.query;
  if (!pdf_path) {
    return res.status(400).json({ error: 'Не указан pdf_path' });
  }
  try {
    const [rows] = await pool.query('SELECT thumbnail_path FROM thumbnails WHERE pdf_path = ?', [pdf_path]);
    const row = rows[0];
    if (!row || !row.thumbnail_path) {
      return res.status(404).json({ error: 'Миниатюра не найдена' });
    }
    let thumbPath = row.thumbnail_path;
    thumbPath = '/' + thumbPath.replace(/^\/+/, '');
    const fileBuffer = await downloadFile(thumbPath);
    res.setHeader('Content-Type', 'image/webp');
    res.send(fileBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения миниатюры' });
  }
});

// Получить PDF-файл по pdf_path
router.get('/pdf', async (req, res) => {
  const { pdf_path } = req.query;
  if (!pdf_path) {
    return res.status(400).json({ error: 'Не указан pdf_path' });
  }
  try {
    let decodedPath = decodeURIComponent(pdf_path);
    decodedPath = '/' + decodedPath.replace(/^\/+/, '');
    try {
      const fileBuffer = await downloadFile(decodedPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="score.pdf"');
      return res.send(fileBuffer);
    } catch (err1) {
      // Если 403, пробуем без ведущего слэша
      if (err1.message.includes('403')) {
        const altPath = decodedPath.replace(/^\//, '');
        try {
          const fileBuffer = await downloadFile(altPath);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename="score.pdf"');
          return res.send(fileBuffer);
        } catch (err2) {
          return res.status(500).json({ error: 'Ошибка получения PDF-файла', details: err2.message, tried: [decodedPath, altPath] });
        }
      } else {
        throw err1;
      }
    }
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения PDF-файла', details: err.message });
  }
});

// Получить список файлов с WebDAV
router.get('/cloud/list', async (req, res) => {
  const { path = "/" } = req.query;
  try {
    const files = await listFiles(path);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения списка файлов с WebDAV', details: err.message });
  }
});

export default router; 