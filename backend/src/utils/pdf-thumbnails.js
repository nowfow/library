import PDFDocument from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { executeQuery } from '../db.js';
import logger from '../utils/logger.js';

// Конфигурация для миниатюр
const THUMBNAIL_CONFIG = {
  width: 200,
  height: 280,
  quality: 0.8,
  format: 'jpeg'
};

const THUMBNAILS_DIR = path.join(process.cwd(), 'thumbnails');

// Создаем директорию для миниатюр
async function ensureThumbnailsDir() {
  try {
    await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
  } catch (error) {
    logger.error('Ошибка создания директории миниатюр', { error: error.message });
  }
}

// Функция для создания миниатюры PDF
export async function generatePDFThumbnail(pdfPath, workId) {
  try {
    await ensureThumbnailsDir();
    
    const thumbnailPath = path.join(THUMBNAILS_DIR, `work_${workId}.jpg`);
    
    // Проверяем, существует ли уже миниатюра
    try {
      await fs.access(thumbnailPath);
      return `/thumbnails/work_${workId}.jpg`;
    } catch {
      // Миниатюра не существует, создаем новую
    }
    
    // Читаем PDF файл
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Получаем первую страницу
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      throw new Error('PDF файл не содержит страниц');
    }
    
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Вычисляем размеры миниатюры с сохранением пропорций
    const aspectRatio = width / height;
    let thumbnailWidth = THUMBNAIL_CONFIG.width;
    let thumbnailHeight = THUMBNAIL_CONFIG.height;
    
    if (aspectRatio > thumbnailWidth / thumbnailHeight) {
      thumbnailHeight = thumbnailWidth / aspectRatio;
    } else {
      thumbnailWidth = thumbnailHeight * aspectRatio;
    }
    
    // Создаем canvas для рендеринга
    const canvas = createCanvas(thumbnailWidth, thumbnailHeight);
    const context = canvas.getContext('2d');
    
    // Рендерим первую страницу PDF в canvas
    // Это упрощенная версия - в реальном проекте нужен pdf2pic или подобная библиотека
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, thumbnailWidth, thumbnailHeight);
    
    // Добавляем текст-заглушку (для демонстрации)
    context.fillStyle = '#333333';
    context.font = '14px Arial';
    context.textAlign = 'center';
    context.fillText('PDF', thumbnailWidth / 2, thumbnailHeight / 2);
    context.fillText('Preview', thumbnailWidth / 2, thumbnailHeight / 2 + 20);
    
    // Сохраняем миниатюру
    const buffer = canvas.toBuffer('image/jpeg', { quality: THUMBNAIL_CONFIG.quality });
    await fs.writeFile(thumbnailPath, buffer);
    
    // Обновляем информацию в базе данных
    await executeQuery(
      'UPDATE works SET thumbnail_path = ?, pages_count = ? WHERE id = ?',
      [`/thumbnails/work_${workId}.jpg`, pages.length, workId]
    );
    
    logger.info('Миниатюра PDF создана', { workId, pdfPath, thumbnailPath });
    return `/thumbnails/work_${workId}.jpg`;
    
  } catch (error) {
    logger.error('Ошибка создания миниатюры PDF', {
      error: error.message,
      pdfPath,
      workId
    });
    return null;
  }
}

// Функция для пакетной генерации миниатюр
export async function generateThumbnailsForAllWorks() {
  try {
    const works = await executeQuery(
      'SELECT id, file_path FROM works WHERE file_type = "pdf" AND thumbnail_path IS NULL'
    );
    
    logger.info(`Начинаем создание миниатюр для ${works.length} произведений`);
    
    let processed = 0;
    let errors = 0;
    
    for (const work of works) {
      try {
        const fullPath = path.resolve(process.env.FILES_PATH || '../files', work.file_path);
        await generatePDFThumbnail(fullPath, work.id);
        processed++;
        
        if (processed % 10 === 0) {
          logger.info(`Обработано миниатюр: ${processed}/${works.length}`);
        }
      } catch (error) {
        logger.error('Ошибка создания миниатюры для произведения', {
          workId: work.id,
          filePath: work.file_path,
          error: error.message
        });
        errors++;
      }
    }
    
    logger.info('Генерация миниатюр завершена', {
      total: works.length,
      processed,
      errors
    });
    
    return { total: works.length, processed, errors };
  } catch (error) {
    logger.error('Ошибка пакетной генерации миниатюр', { error: error.message });
    throw error;
  }
}

// API эндпоинт для получения миниатюры
export async function getThumbnail(workId) {
  try {
    const works = await executeQuery(
      'SELECT thumbnail_path, file_path FROM works WHERE id = ?',
      [workId]
    );
    
    if (works.length === 0) {
      return null;
    }
    
    const work = works[0];
    
    // Если миниатюра уже существует
    if (work.thumbnail_path) {
      const thumbnailFullPath = path.join(process.cwd(), 'public', work.thumbnail_path);
      try {
        await fs.access(thumbnailFullPath);
        return work.thumbnail_path;
      } catch {
        // Миниатюра не найдена, создаем заново
      }
    }
    
    // Создаем миниатюру
    const fullPath = path.resolve(process.env.FILES_PATH || '../files', work.file_path);
    return await generatePDFThumbnail(fullPath, workId);
    
  } catch (error) {
    logger.error('Ошибка получения миниатюры', {
      workId,
      error: error.message
    });
    return null;
  }
}

// Функция для очистки старых миниатюр
export async function cleanupThumbnails() {
  try {
    const files = await fs.readdir(THUMBNAILS_DIR);
    const workIds = await executeQuery('SELECT id FROM works');
    const validIds = new Set(workIds.map(work => `work_${work.id}.jpg`));
    
    let deletedCount = 0;
    
    for (const file of files) {
      if (!validIds.has(file)) {
        await fs.unlink(path.join(THUMBNAILS_DIR, file));
        deletedCount++;
      }
    }
    
    logger.info('Очистка миниатюр завершена', { deletedCount });
    return deletedCount;
  } catch (error) {
    logger.error('Ошибка очистки миниатюр', { error: error.message });
    throw error;
  }
}