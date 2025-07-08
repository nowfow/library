import { createClient } from 'webdav';
import 'dotenv/config';

const webdavClient = createClient(
  process.env.WEBDAV_URL,
  {
    username: process.env.WEBDAV_USER,
    password: process.env.WEBDAV_PASSWORD,
  }
);

export async function downloadFile(remotePath) {
  try {
    console.log('[WebDAV] Скачивание файла:', remotePath);
    return await webdavClient.getFileContents(remotePath);
  } catch (err) {
    throw new Error('Ошибка загрузки файла с WebDAV: ' + err.message);
  }
}

export async function listFiles(remotePath = "/") {
  try {
    console.log('[WebDAV] Получение списка файлов:', remotePath);
    const result = await webdavClient.getDirectoryContents(remotePath);
    console.log('[WebDAV] Ответ:', JSON.stringify(result, null, 2));
    return result;
  } catch (err) {
    console.error('[WebDAV] Ошибка:', err);
    throw new Error('Ошибка получения списка файлов с WebDAV: ' + err.message);
  }
} 