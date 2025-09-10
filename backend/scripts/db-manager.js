#!/usr/bin/env node

/**
 * Утилита для управления базой данных
 */

import { executeQuery, initializeTables, pool, testDatabaseConnection } from '../src/db.js';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const commands = {
  init: {
    description: 'Инициализация таблиц базы данных',
    action: initDatabase
  },
  drop: {
    description: 'Удаление всех таблиц (ОСТОРОЖНО!)',
    action: dropDatabase
  },
  reset: {
    description: 'Сброс базы данных (удаление и создание заново)',
    action: resetDatabase
  },
  status: {
    description: 'Показать статус базы данных',
    action: showStatus
  },
  backup: {
    description: 'Создать резервную копию базы данных',
    action: backupDatabase
  },
  'import-terms': {
    description: 'Импорт терминов из CSV файла',
    action: importTermsFromCSV
  },
  'create-admin': {
    description: 'Создать администратора',
    action: createAdminUser
  }
};

async function initDatabase() {
  console.log('🔧 Инициализация таблиц базы данных...');
  try {
    await testDatabaseConnection();
    await initializeTables();
    console.log('✅ Таблицы успешно инициализированы');
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error.message);
    process.exit(1);
  }
}

async function dropDatabase() {
  console.log('⚠️  ВНИМАНИЕ: Это удалит ВСЕ данные!');
  
  const tables = ['collection_works', 'user_collections', 'works', 'terms', 'users'];
  
  try {
    await testDatabaseConnection();
    
    // Отключаем проверку внешних ключей
    await executeQuery('SET FOREIGN_KEY_CHECKS = 0');
    
    for (const table of tables) {
      try {
        await executeQuery(`DROP TABLE IF EXISTS ${table}`);
        console.log(`🗑️  Удалена таблица: ${table}`);
      } catch (error) {
        console.warn(`⚠️  Не удалось удалить таблицу ${table}:`, error.message);
      }
    }
    
    // Включаем обратно проверку внешних ключей
    await executeQuery('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ База данных очищена');
  } catch (error) {
    console.error('❌ Ошибка очистки базы данных:', error.message);
    process.exit(1);
  }
}

async function resetDatabase() {
  console.log('🔄 Сброс базы данных...');
  await dropDatabase();
  await initDatabase();
  console.log('✅ База данных сброшена и инициализирована');
}

async function showStatus() {
  console.log('📊 Статус базы данных:');
  
  try {
    await testDatabaseConnection();
    
    const tables = ['users', 'terms', 'works', 'user_collections', 'collection_works'];
    
    for (const table of tables) {
      try {
        const result = await executeQuery(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  📋 ${table}: ${result[0].count} записей`);
      } catch (error) {
        console.log(`  ❌ ${table}: таблица не существует`);
      }
    }
    
    // Показываем информацию о базе данных
    const dbInfo = await executeQuery('SELECT VERSION() as version, DATABASE() as database');
    console.log(`\n📍 MySQL версия: ${dbInfo[0].version}`);
    console.log(`📍 База данных: ${dbInfo[0].database}`);
    
  } catch (error) {
    console.error('❌ Ошибка получения статуса:', error.message);
    process.exit(1);
  }
}

async function backupDatabase() {
  console.log('💾 Создание резервной копии...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  
  try {
    // Создаем директорию для бэкапов
    await fs.mkdir(backupDir, { recursive: true });
    
    const tables = ['users', 'terms', 'works', 'user_collections', 'collection_works'];
    const backup = {
      timestamp: new Date().toISOString(),
      tables: {}
    };
    
    await testDatabaseConnection();
    
    for (const table of tables) {
      try {
        const data = await executeQuery(`SELECT * FROM ${table}`);
        backup.tables[table] = data;
        console.log(`📋 Сохранено ${data.length} записей из таблицы ${table}`);
      } catch (error) {
        console.warn(`⚠️  Не удалось создать бэкап таблицы ${table}:`, error.message);
      }
    }
    
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    await fs.writeFile(backupFile, JSON.stringify(backup, null, 2), 'utf8');
    
    console.log(`✅ Резервная копия создана: ${backupFile}`);
  } catch (error) {
    console.error('❌ Ошибка создания резервной копии:', error.message);
    process.exit(1);
  }
}

async function importTermsFromCSV() {
  const csvFile = process.argv[4] || 'terms.csv';
  
  console.log(`📚 Импорт терминов из файла: ${csvFile}`);
  
  try {
    if (!await fs.access(csvFile).then(() => true).catch(() => false)) {
      throw new Error(`Файл ${csvFile} не найден`);
    }
    
    const csvContent = await fs.readFile(csvFile, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    await testDatabaseConnection();
    
    let imported = 0;
    let skipped = 0;
    
    for (const line of lines) {
      const [term, definition] = line.split(',').map(item => item.trim().replace(/^"|"$/g, ''));
      
      if (!term || !definition) {
        skipped++;
        continue;
      }
      
      try {
        await executeQuery(
          'INSERT INTO terms (term, definition) VALUES (?, ?) ON DUPLICATE KEY UPDATE definition = VALUES(definition)',
          [term, definition]
        );
        imported++;
      } catch (error) {
        console.warn(`⚠️  Не удалось импортировать термин "${term}":`, error.message);
        skipped++;
      }
    }
    
    console.log(`✅ Импорт завершен: ${imported} импортировано, ${skipped} пропущено`);
  } catch (error) {
    console.error('❌ Ошибка импорта терминов:', error.message);
    process.exit(1);
  }
}

async function createAdminUser() {
  const email = process.argv[4] || 'admin@example.com';
  const password = process.argv[5] || 'admin123';
  const name = process.argv[6] || 'Администратор';
  
  console.log(`👤 Создание администратора: ${email}`);
  
  try {
    await testDatabaseConnection();
    
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);
    
    await executeQuery(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE role = "admin"',
      [email, passwordHash, name, 'admin']
    );
    
    console.log('✅ Администратор создан успешно');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Пароль: ${password}`);
  } catch (error) {
    console.error('❌ Ошибка создания администратора:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log('🔧 Утилита управления базой данных\n');
  console.log('Использование: node scripts/db-manager.js <команда> [параметры]\n');
  console.log('Доступные команды:');
  
  for (const [command, info] of Object.entries(commands)) {
    console.log(`  ${command.padEnd(15)} - ${info.description}`);
  }
  
  console.log('\nПримеры:');
  console.log('  node scripts/db-manager.js init');
  console.log('  node scripts/db-manager.js import-terms terms.csv');
  console.log('  node scripts/db-manager.js create-admin admin@test.com password123 "Имя Админа"');
}

async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help' || command === '--help') {
    showHelp();
    return;
  }
  
  if (!commands[command]) {
    console.error(`❌ Неизвестная команда: ${command}`);
    console.log('Используйте "help" для просмотра доступных команд');
    process.exit(1);
  }
  
  try {
    await commands[command].action();
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Запуск утилиты
main().catch(error => {
  console.error('💥 Неожиданная ошибка:', error);
  process.exit(1);
});