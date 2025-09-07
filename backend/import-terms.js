#!/usr/bin/env node

/**
 * Утилита для импорта терминов из CSV файла
 * Использование: node import-terms.js [путь_к_csv_файлу]
 */

import { executeQuery, initializeTables } from './src/db.js';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

/**
 * Функция для парсинга CSV строки с учетом кавычек и экранирования
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Экранированная кавычка
        current += '"';
        i += 2;
      } else {
        // Начало или конец кавычек
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Разделитель вне кавычек
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Добавляем последний элемент
  result.push(current);
  
  return result;
}

/**
 * Основная функция импорта терминов
 */
async function importTerms(csvFilePath) {
  console.log('📚 Импорт музыкальных терминов из CSV файла');
  console.log('=' * 50);
  
  try {
    // Инициализируем таблицы
    await initializeTables();
    
    // Проверяем существование файла
    const csvExists = await fs.access(csvFilePath).then(() => true).catch(() => false);
    if (!csvExists) {
      console.error(`❌ Файл не найден: ${csvFilePath}`);
      process.exit(1);
    }
    
    console.log(`📄 Читаем файл: ${csvFilePath}`);
    
    // Читаем CSV файл
    const csvContent = await fs.readFile(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📊 Найдено ${lines.length} строк в CSV файле`);
    
    // Создаем резервную копию существующих терминов
    const existingTerms = await executeQuery('SELECT COUNT(*) as count FROM terms');
    const existingCount = existingTerms[0].count;
    
    if (existingCount > 0) {
      console.log(`💾 Найдено ${existingCount} существующих терминов`);
      console.log('🔄 Создаем резервную копию...');
      
      const backupPath = `terms_backup_${new Date().toISOString().split('T')[0]}.sql`;
      const backupTerms = await executeQuery('SELECT * FROM terms');
      
      let backupSQL = '-- Резервная копия терминов\n';
      backupSQL += 'CREATE TABLE IF NOT EXISTS terms_backup AS SELECT * FROM terms;\n';
      
      for (const term of backupTerms) {
        const escapedTerm = term.term.replace(/'/g, "''");
        const escapedDef = term.definition.replace(/'/g, "''");
        backupSQL += `INSERT INTO terms (term, definition) VALUES ('${escapedTerm}', '${escapedDef}');\n`;
      }
      
      await fs.writeFile(backupPath, backupSQL);
      console.log(`✅ Резервная копия сохранена: ${backupPath}`);
    }
    
    // Очищаем существующие термины
    await executeQuery('DELETE FROM terms');
    console.log('🗑️ Очищены существующие термины');
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    console.log('\n🔄 Обработка CSV данных...');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        skippedCount++;
        continue;
      }
      
      try {
        // Парсим CSV строку
        const parsedLine = parseCSVLine(line);
        
        if (parsedLine.length >= 2) {
          const term = parsedLine[0].trim();
          const definition = parsedLine[1].trim();
          
          if (term && definition) {
            // Проверяем длину термина и определения
            if (term.length > 255) {
              console.warn(`⚠️ Термин слишком длинный (>${255} символов), строка ${i + 1}: ${term.substring(0, 50)}...`);
              errorCount++;
              continue;
            }
            
            if (definition.length < 10) {
              console.warn(`⚠️ Определение слишком короткое (<10 символов), строка ${i + 1}: ${term}`);
              errorCount++;
              continue;
            }
            
            await executeQuery(
              'INSERT INTO terms (term, definition) VALUES (?, ?)',
              [term, definition]
            );
            successCount++;
            
            if (successCount % 100 === 0) {
              console.log(`   ✅ Обработано ${successCount} терминов...`);
            }
          } else {
            console.warn(`⚠️ Пустой термин или определение, строка ${i + 1}`);
            errorCount++;
          }
        } else {
          console.warn(`⚠️ Неверный формат строки ${i + 1}: ${line.substring(0, 100)}...`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Ошибка обработки строки ${i + 1}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Результаты импорта:');
    console.log(`   ✅ Успешно импортировано: ${successCount} терминов`);
    console.log(`   ⚠️ Пропущено строк: ${skippedCount}`);
    console.log(`   ❌ Ошибок: ${errorCount}`);
    
    if (successCount > 0) {
      // Получаем статистику
      const stats = await executeQuery(`
        SELECT 
          COUNT(*) as total,
          AVG(LENGTH(term)) as avg_term_length,
          AVG(LENGTH(definition)) as avg_def_length,
          MAX(LENGTH(term)) as max_term_length,
          MAX(LENGTH(definition)) as max_def_length
        FROM terms
      `);
      
      const stat = stats[0];
      console.log('\n📈 Статистика терминов:');
      console.log(`   📚 Всего терминов: ${stat.total}`);
      console.log(`   📏 Средняя длина термина: ${Math.round(stat.avg_term_length)} символов`);
      console.log(`   📏 Средняя длина определения: ${Math.round(stat.avg_def_length)} символов`);
      console.log(`   📏 Максимальная длина термина: ${stat.max_term_length} символов`);
      console.log(`   📏 Максимальная длина определения: ${stat.max_def_length} символов`);
    }
    
    console.log('\n🎉 Импорт терминов завершен успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка импорта терминов:', error);
    process.exit(1);
  }
}

/**
 * Функция для валидации CSV файла
 */
async function validateCSV(csvFilePath) {
  console.log('🔍 Валидация CSV файла...');
  
  try {
    const csvContent = await fs.readFile(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    let validLines = 0;
    let invalidLines = 0;
    
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parsedLine = parseCSVLine(line);
      if (parsedLine.length >= 2 && parsedLine[0].trim() && parsedLine[1].trim()) {
        validLines++;
        console.log(`✅ Строка ${i + 1}: "${parsedLine[0].substring(0, 30)}..." -> "${parsedLine[1].substring(0, 50)}..."`);
      } else {
        invalidLines++;
        console.log(`❌ Строка ${i + 1}: неверный формат`);
      }
    }
    
    console.log(`📊 Проверено ${Math.min(lines.length, 10)} строк из ${lines.length}`);
    console.log(`✅ Корректных: ${validLines}`);
    console.log(`❌ Некорректных: ${invalidLines}`);
    
    return invalidLines === 0;
    
  } catch (error) {
    console.error('❌ Ошибка валидации:', error.message);
    return false;
  }
}

// Главная функция
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📚 Утилита импорта музыкальных терминов');
    console.log('');
    console.log('Использование:');
    console.log('  node import-terms.js <путь_к_csv_файлу>');
    console.log('  node import-terms.js --validate <путь_к_csv_файлу>');
    console.log('');
    console.log('Примеры:');
    console.log('  node import-terms.js ../files/terms.csv');
    console.log('  node import-terms.js --validate ../files/terms.csv');
    console.log('');
    console.log('Формат CSV файла:');
    console.log('  - Первая колонка: название термина');
    console.log('  - Вторая колонка: определение термина');
    console.log('  - Поддерживаются кавычки и экранирование');
    process.exit(1);
  }
  
  if (args[0] === '--validate') {
    if (args.length < 2) {
      console.error('❌ Не указан путь к CSV файлу для валидации');
      process.exit(1);
    }
    
    const isValid = await validateCSV(args[1]);
    process.exit(isValid ? 0 : 1);
  } else {
    await importTerms(args[0]);
  }
}

// Запуск утилиты
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('✅ Утилита завершена успешно');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Ошибка выполнения утилиты:', error);
      process.exit(1);
    });
}

export { importTerms, parseCSVLine, validateCSV };