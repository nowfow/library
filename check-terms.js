#!/usr/bin/env node

/**
 * Простая проверка файла terms.csv
 */

import { promises as fs } from 'fs';
import path from 'path';

async function checkTermsCSV() {
  console.log('🔍 Проверка файла terms.csv...');
  
  const csvPath = 'files/terms.csv';
  
  try {
    // Проверяем существование файла
    await fs.access(csvPath);
    console.log('✅ Файл terms.csv найден');
    
    // Читаем содержимое
    const content = await fs.readFile(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    console.log(`📊 Найдено ${lines.length} строк в файле`);
    
    // Проверяем первые несколько строк
    console.log('\n📋 Первые 5 строк файла:');
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      console.log(`${i + 1}: ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
    }
    
    // Простой анализ структуры
    let validCount = 0;
    let invalidCount = 0;
    
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      
      // Простая проверка: есть ли запятая (разделитель)
      if (line.includes(',')) {
        validCount++;
      } else {
        invalidCount++;
        console.log(`⚠️ Строка ${i + 1} не содержит разделитель запятую`);
      }
    }
    
    console.log(`\n📈 Анализ первых 10 строк:`);
    console.log(`✅ Корректных: ${validCount}`);
    console.log(`❌ Некорректных: ${invalidCount}`);
    
    if (validCount > invalidCount) {
      console.log('\n🎉 Файл terms.csv выглядит корректно и готов к импорту!');
      
      console.log('\n💡 Для импорта терминов в базу данных выполните:');
      console.log('   cd backend');
      console.log('   npm install');
      console.log('   node import-terms.js ../files/terms.csv');
      
      console.log('\n💡 Или используйте комплексный скрипт заполнения БД:');
      console.log('   cd backend');
      console.log('   node populate-db.js');
      
    } else {
      console.log('\n❌ Файл может содержать ошибки форматирования');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке файла:', error.message);
    
    if (error.code === 'ENOENT') {
      console.log('\n💡 Файл terms.csv не найден. Убедитесь, что он находится в папке files/');
    }
  }
}

// Запуск проверки
checkTermsCSV();