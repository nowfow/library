#!/usr/bin/env node

import { executeQuery, initializeTables } from './src/db.js';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const FILES_BASE_PATH = process.env.FILES_PATH || path.join(process.cwd(), '../files');

// Функция для парсинга структуры файлов и заполнения базы данных
async function populateDatabase() {
  console.log('🚀 Начинаем заполнение базы данных...');
  
  try {
    // Инициализируем таблицы
    await initializeTables();
    
    // Очищаем существующие данные произведений
    await executeQuery('DELETE FROM works');
    console.log('🗑️ Очищены существующие данные произведений');
    
    // Сканируем файловую структуру
    const works = await scanMusicLibrary(FILES_BASE_PATH);
    
    if (works.length === 0) {
      console.log('⚠️ Произведения не найдены');
      return;
    }
    
    console.log(`📁 Найдено ${works.length} произведений`);
    
    // Заполняем базу данных
    let successCount = 0;
    let errorCount = 0;
    
    for (const work of works) {
      try {
        await executeQuery(`
          INSERT INTO works (category, subcategory, composer, work_title, file_path, file_type, file_size)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          work.category,
          work.subcategory,
          work.composer,
          work.work_title,
          work.file_path,
          work.file_type,
          work.file_size
        ]);
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`✅ Обработано ${successCount} произведений...`);
        }
      } catch (error) {
        console.error(`❌ Ошибка добавления произведения ${work.file_path}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`✅ Успешно добавлено: ${successCount} произведений`);
    if (errorCount > 0) {
      console.log(`❌ Ошибок: ${errorCount}`);
    }
    
    // Заполняем тестовые термины
    await populateTerms();
    
    console.log('🎉 Заполнение базы данных завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка заполнения базы данных:', error);
    process.exit(1);
  }
}

// Функция сканирования музыкальной библиотеки
async function scanMusicLibrary(basePath) {
  const works = [];
  
  console.log(`🔍 Сканирование директории: ${basePath}`);
  
  async function scanDirectory(currentPath, pathParts = []) {
    try {
      const items = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item.name);
        
        if (item.isDirectory()) {
          // Рекурсивно сканируем поддиректории
          await scanDirectory(itemPath, [...pathParts, item.name]);
        } else if (item.isFile() && path.extname(item.name).toLowerCase() === '.pdf') {
          // Обрабатываем PDF файл
          const work = await parseWorkFromPath([...pathParts, item.name], itemPath);
          if (work) {
            works.push(work);
          }
        }
      }
    } catch (err) {
      console.warn(`⚠️ Не удалось прочитать директорию: ${currentPath}`);
    }
  }
  
  await scanDirectory(basePath);
  return works;
}

// Функция парсинга произведения из пути файла
async function parseWorkFromPath(pathParts, fullPath) {
  if (pathParts.length < 2) {
    return null; // Минимум нужна категория и файл
  }
  
  try {
    const stats = await fs.stat(fullPath);
    const fileName = pathParts[pathParts.length - 1];
    const fileExt = path.extname(fileName).toLowerCase();
    
    let category, subcategory, composer, workTitle;
    
    if (pathParts.length === 2) {
      // Category/File (файл прямо в категории)
      category = pathParts[0];
      subcategory = null;
      composer = 'Разные';
      workTitle = path.basename(fileName, fileExt);
    } else if (pathParts.length === 3) {
      // Category/Composer/Work
      category = pathParts[0];
      subcategory = null;
      composer = pathParts[1];
      workTitle = path.basename(fileName, fileExt);
    } else if (pathParts.length === 4) {
      // Category/Subcategory/Composer/Work
      category = pathParts[0];
      subcategory = pathParts[1];
      composer = pathParts[2];
      workTitle = path.basename(fileName, fileExt);
    } else {
      // Category/Subcategory/Subsubcategory/Composer/Work (или глубже)
      category = pathParts[0];
      subcategory = pathParts.slice(1, -2).join('/'); // Все промежуточные части
      composer = pathParts[pathParts.length - 2];
      workTitle = path.basename(fileName, fileExt);
    }
    
    // Определяем тип файла
    let fileType = 'other';
    switch (fileExt) {
      case '.pdf':
        fileType = 'pdf';
        break;
      case '.mp3':
        fileType = 'mp3';
        break;
      case '.sib':
        fileType = 'sib';
        break;
      case '.mus':
        fileType = 'mus';
        break;
    }
    
    return {
      category: category.trim(),
      subcategory: subcategory ? subcategory.trim() : null,
      composer: composer.trim(),
      work_title: workTitle.trim(),
      file_path: path.relative(process.cwd(), fullPath).replace(/\\/g, '/'),
      file_type: fileType,
      file_size: stats.size
    };
  } catch (error) {
    console.warn(`⚠️ Ошибка обработки файла ${fullPath}:`, error.message);
    return null;
  }
}

// Функция заполнения тестовых терминов
async function populateTerms() {
  console.log('📚 Заполнение музыкальных терминов...');
  
  const terms = [
    {
      term: 'Валторна',
      definition: 'Медный духовой музыкальный инструмент, состоящий из конической трубки, свернутой в кольцо и оканчивающейся раструбом.'
    },
    {
      term: 'Концерт',
      definition: 'Музыкальное произведение для солирующего инструмента (или группы инструментов) с оркестром.'
    },
    {
      term: 'Соната',
      definition: 'Музыкальная форма, состоящая обычно из трех или четырех частей, предназначенная для одного или двух инструментов.'
    },
    {
      term: 'Этюд',
      definition: 'Инструментальная пьеса, предназначенная для развития техники исполнителя.'
    },
    {
      term: 'Транспонирование',
      definition: 'Перенос музыкального произведения в другую тональность.'
    },
    {
      term: 'Амбушюр',
      definition: 'Положение губ, языка и лицевых мышц при игре на духовых инструментах.'
    },
    {
      term: 'Натуральный строй',
      definition: 'Звуки, которые можно извлечь на валторне без использования вентилей, основанные на натуральном звукоряде.'
    },
    {
      term: 'Сурдина',
      definition: 'Приспособление для изменения тембра и уменьшения громкости звука музыкального инструмента.'
    },
    {
      term: 'Глиссандо',
      definition: 'Скользящий переход от одного звука к другому с проведением через все промежуточные высоты.'
    },
    {
      term: 'Тремоло',
      definition: 'Быстрое многократное повторение одного звука или быстрое чередование двух звуков.'
    }
  ];
  
  // Очищаем существующие термины
  await executeQuery('DELETE FROM terms');
  
  for (const term of terms) {
    try {
      await executeQuery(
        'INSERT INTO terms (term, definition) VALUES (?, ?)',
        [term.term, term.definition]
      );
    } catch (error) {
      console.error(`❌ Ошибка добавления термина ${term.term}:`, error.message);
    }
  }
  
  console.log(`📚 Добавлено ${terms.length} музыкальных терминов`);
}

// Запуск скрипта
if (import.meta.url === `file://${process.argv[1]}`) {
  populateDatabase()
    .then(() => {
      console.log('✅ Скрипт завершен успешно');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Ошибка выполнения скрипта:', error);
      process.exit(1);
    });
}