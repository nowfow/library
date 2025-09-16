import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { executeQuery } from '../db.js';

const router = express.Router();

// Базовый путь к файлам (будет храниться локально на сервере)
const FILES_BASE_PATH = process.env.FILES_PATH || path.join(process.cwd(), '../files');

// Получение информации о файловой структуре
router.get('/structure', async (req, res) => {
  try {
    const { path: requestedPath = '/' } = req.query;
    
    const fullPath = path.join(FILES_BASE_PATH, requestedPath);
    
    // Проверяем, что путь находится в пределах базовой директории (безопасность)
    const resolvedPath = path.resolve(fullPath);
    const resolvedBasePath = path.resolve(FILES_BASE_PATH);
    
    if (!resolvedPath.startsWith(resolvedBasePath)) {
      return res.status(403).json({ error: 'Доступ к указанному пути запрещен' });
    }
    
    try {
      const stats = await fs.stat(resolvedPath);
      
      if (!stats.isDirectory()) {
        return res.status(400).json({ error: 'Указанный путь не является директорией' });
      }
      
      const items = await fs.readdir(resolvedPath, { withFileTypes: true });
      
      const structure = await Promise.all(
        items.map(async (item) => {
          const itemPath = path.join(resolvedPath, item.name);
          const itemStats = await fs.stat(itemPath);
          const relativePath = path.relative(FILES_BASE_PATH, itemPath);
          
          const result = {
            name: item.name,
            path: relativePath.replace(/\\/g, '/'), // Нормализуем путь для фронтенда
            type: item.isDirectory() ? 'directory' : 'file',
            size: itemStats.size,
            modified: itemStats.mtime,
            created: itemStats.birthtime
          };
          
          // Для PDF файлов добавляем дополнительную информацию
          if (item.isFile() && path.extname(item.name).toLowerCase() === '.pdf') {
            result.fileType = 'pdf';
            result.downloadUrl = `/api/files/download/${encodeURIComponent(relativePath.replace(/\\/g, '/'))}`;
          }
          
          // Для директорий считаем количество элементов
          if (item.isDirectory()) {
            try {
              const subItems = await fs.readdir(itemPath);
              result.itemsCount = subItems.length;
            } catch (err) {
              result.itemsCount = 0;
            }
          }
          
          return result;
        })
      );
      
      // Сортируем: сначала директории, потом файлы, оба по алфавиту
      structure.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name, 'ru');
      });
      
      res.json({
        currentPath: requestedPath,
        items: structure,
        totalItems: structure.length,
        directories: structure.filter(item => item.type === 'directory').length,
        files: structure.filter(item => item.type === 'file').length
      });
      
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Директория не найдена' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Ошибка получения структуры файлов:', error);
    res.status(500).json({ 
      error: 'Ошибка получения структуры файлов',
      details: error.message 
    });
  }
});

// Скачивание файла
router.get('/download/:path(*)', async (req, res) => {
  try {
    const requestedPath = req.params.path;
    const fullPath = path.join(FILES_BASE_PATH, requestedPath);
    
    // Проверяем безопасность пути
    const resolvedPath = path.resolve(fullPath);
    const resolvedBasePath = path.resolve(FILES_BASE_PATH);
    
    if (!resolvedPath.startsWith(resolvedBasePath)) {
      return res.status(403).json({ error: 'Доступ к указанному файлу запрещен' });
    }
    
    try {
      const stats = await fs.stat(resolvedPath);
      
      if (!stats.isFile()) {
        return res.status(400).json({ error: 'Указанный путь не является файлом' });
      }
      
      // Определяем MIME тип
      const ext = path.extname(requestedPath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.mp3':
          contentType = 'audio/mpeg';
          break;
        case '.sib':
          contentType = 'application/x-sibelius-score';
          break;
        case '.mus':
          contentType = 'application/x-finale-music';
          break;
        case '.mid':
        case '.midi':
          contentType = 'audio/midi';
          break;
      }
      
      // Устанавливаем заголовки
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(requestedPath)}"`);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Кешируем на 1 день
      
      // Поддержка Range requests для больших файлов
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = (end - start) + 1;
        
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunksize);
        
        const stream = require('fs').createReadStream(resolvedPath, { start, end });
        stream.pipe(res);
      } else {
        // Обычная отдача файла
        const stream = require('fs').createReadStream(resolvedPath);
        stream.pipe(res);
      }
      
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Файл не найден' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Ошибка скачивания файла:', error);
    res.status(500).json({ 
      error: 'Ошибка скачивания файла',
      details: error.message 
    });
  }
});

// Получение информации о файле
router.get('/info/:path(*)', async (req, res) => {
  try {
    const requestedPath = req.params.path;
    const fullPath = path.join(FILES_BASE_PATH, requestedPath);
    
    // Проверяем безопасность пути
    const resolvedPath = path.resolve(fullPath);
    const resolvedBasePath = path.resolve(FILES_BASE_PATH);
    
    if (!resolvedPath.startsWith(resolvedBasePath)) {
      return res.status(403).json({ error: 'Доступ к указанному файлу запрещен' });
    }
    
    try {
      const stats = await fs.stat(resolvedPath);
      
      const fileInfo = {
        name: path.basename(requestedPath),
        path: requestedPath,
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
        type: stats.isDirectory() ? 'directory' : 'file',
        extension: path.extname(requestedPath).toLowerCase(),
        modified: stats.mtime,
        created: stats.birthtime,
        accessed: stats.atime
      };
      
      // Для PDF файлов пытаемся получить дополнительную информацию из БД
      if (fileInfo.extension === '.pdf') {
        try {
          const works = await executeQuery(
            'SELECT * FROM works WHERE file_path LIKE ?',
            [`%${requestedPath}%`]
          );
          
          if (works.length > 0) {
            fileInfo.workInfo = works[0];
          }
        } catch (dbError) {
          console.warn('Не удалось получить информацию о произведении из БД:', dbError.message);
        }
      }
      
      res.json(fileInfo);
      
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Файл не найден' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Ошибка получения информации о файле:', error);
    res.status(500).json({ 
      error: 'Ошибка получения информации о файле',
      details: error.message 
    });
  }
});

// Поиск файлов по имени и пути
router.get('/search', async (req, res) => {
  try {
    const { q, type, extension } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Поисковый запрос должен содержать минимум 2 символа' });
    }
    
    const searchResults = await searchFiles(FILES_BASE_PATH, q, { type, extension });
    
    res.json({
      query: q,
      filters: { type, extension },
      found: searchResults.length,
      results: searchResults
    });
  } catch (error) {
    console.error('Ошибка поиска файлов:', error);
    res.status(500).json({ 
      error: 'Ошибка поиска файлов',
      details: error.message 
    });
  }
});

// Функция рекурсивного поиска файлов
async function searchFiles(basePath, query, options = {}) {
  const results = [];
  
  async function searchRecursive(currentPath) {
    try {
      const items = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item.name);
        const relativePath = path.relative(basePath, itemPath);
        
        // Проверяем, соответствует ли элемент поисковому запросу
        const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
        
        if (item.isFile() && matchesQuery) {
          // Проверяем фильтры
          if (options.type && options.type !== 'file') continue;
          if (options.extension) {
            const ext = path.extname(item.name).toLowerCase();
            if (ext !== options.extension.toLowerCase()) continue;
          }
          
          const stats = await fs.stat(itemPath);
          results.push({
            name: item.name,
            path: relativePath.replace(/\\/g, '/'),
            type: 'file',
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            extension: path.extname(item.name).toLowerCase(),
            modified: stats.mtime,
            downloadUrl: `/api/files/download/${encodeURIComponent(relativePath.replace(/\\/g, '/'))}`
          });
        } else if (item.isDirectory()) {
          if (matchesQuery && (!options.type || options.type === 'directory')) {
            const stats = await fs.stat(itemPath);
            results.push({
              name: item.name,
              path: relativePath.replace(/\\/g, '/'),
              type: 'directory',
              modified: stats.mtime
            });
          }
          
          // Рекурсивно ищем в поддиректориях
          await searchRecursive(itemPath);
        }
      }
    } catch (err) {
      // Игнорируем директории без доступа
      console.warn(`Нет доступа к директории: ${currentPath}`);
    }
  }
  
  await searchRecursive(basePath);
  return results;
}

// Утилита для форматирования размера файла
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Статистика файлов
router.get('/stats', async (req, res) => {
  try {
    const stats = await getDirectoryStats(FILES_BASE_PATH);
    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики файлов:', error);
    res.status(500).json({ 
      error: 'Ошибка получения статистики файлов',
      details: error.message 
    });
  }
});

// Функция для получения статистики директории
async function getDirectoryStats(dirPath) {
  const stats = {
    totalFiles: 0,
    totalDirectories: 0,
    totalSize: 0,
    fileTypes: {},
    largestFiles: []
  };
  
  const largestFilesLimit = 10;
  
  async function calculateStats(currentPath) {
    try {
      const items = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item.name);
        
        if (item.isFile()) {
          stats.totalFiles++;
          const itemStats = await fs.stat(itemPath);
          stats.totalSize += itemStats.size;
          
          const ext = path.extname(item.name).toLowerCase() || 'no-extension';
          stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
          
          // Отслеживаем самые большие файлы
          const relativePath = path.relative(dirPath, itemPath);
          stats.largestFiles.push({
            name: item.name,
            path: relativePath.replace(/\\/g, '/'),
            size: itemStats.size,
            sizeFormatted: formatFileSize(itemStats.size)
          });
          
          // Оставляем только топ файлов
          if (stats.largestFiles.length > largestFilesLimit) {
            stats.largestFiles.sort((a, b) => b.size - a.size);
            stats.largestFiles = stats.largestFiles.slice(0, largestFilesLimit);
          }
        } else if (item.isDirectory()) {
          stats.totalDirectories++;
          await calculateStats(itemPath);
        }
      }
    } catch (err) {
      console.warn(`Нет доступа к директории: ${currentPath}`);
    }
  }
  
  await calculateStats(dirPath);
  
  // Финальная сортировка самых больших файлов
  stats.largestFiles.sort((a, b) => b.size - a.size);
  stats.totalSizeFormatted = formatFileSize(stats.totalSize);
  
  return stats;
}

export default router;