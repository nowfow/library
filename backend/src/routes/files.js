import express from 'express';
import { downloadFile, listFiles } from '../webdav-client.js';
import { pool } from '../db.js';
import path from 'path';
import mime from 'mime-types'; // npm install mime-types

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

// Получить файл по pdf_path (универсально для pdf, mp3, sib, mus и др.)
router.get('/pdf', async (req, res) => {
  const { pdf_path } = req.query;
  if (!pdf_path) {
    return res.status(400).json({ error: 'Не указан pdf_path' });
  }
  try {
    let decodedPath = decodeURIComponent(pdf_path);
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
      if (err1.message.includes('403')) {
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