import express from 'express';
import { executeQuery } from '../db.js';
import { promises as fs } from 'fs';
import path from 'path';
import { smartSearchWorks, getSearchSuggestions } from '../utils/smart-search.js';
import { getThumbnail } from '../utils/pdf-thumbnails.js';

const router = express.Router();

// Получение всех произведений с фильтрацией и поиском
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      subcategory, 
      composer, 
      file_type, 
      limit = 50, 
      offset = 0,
      sort_by = 'composer',
      sort_order = 'ASC'
    } = req.query;
    
    let query = 'SELECT * FROM works WHERE 1=1';
    let params = [];
    
    // Фильтры
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (subcategory) {
      query += ' AND subcategory = ?';
      params.push(subcategory);
    }
    
    if (composer) {
      query += ' AND composer LIKE ?';
      params.push(`%${composer}%`);
    }
    
    if (file_type) {
      query += ' AND file_type = ?';
      params.push(file_type);
    }
    
    // Поиск
    if (search) {
      query += ' AND (MATCH(composer, work_title, category, subcategory) AGAINST(? IN NATURAL LANGUAGE MODE) OR composer LIKE ? OR work_title LIKE ?)';
      params.push(search, `%${search}%`, `%${search}%`);
    }
    
    // Сортировка
    const allowedSortFields = ['composer', 'work_title', 'category', 'created_at', 'file_size'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'composer';
    const sortDirection = ['ASC', 'DESC'].includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'ASC';
    
    query += ` ORDER BY ${sortField} ${sortDirection}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const works = await executeQuery(query, params);
    
    // Подсчет общего количества
    let countQuery = 'SELECT COUNT(*) as total FROM works WHERE 1=1';
    let countParams = [];
    
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }
    if (subcategory) {
      countQuery += ' AND subcategory = ?';
      countParams.push(subcategory);
    }
    if (composer) {
      countQuery += ' AND composer LIKE ?';
      countParams.push(`%${composer}%`);
    }
    if (file_type) {
      countQuery += ' AND file_type = ?';
      countParams.push(file_type);
    }
    if (search) {
      countQuery += ' AND (MATCH(composer, work_title, category, subcategory) AGAINST(? IN NATURAL LANGUAGE MODE) OR composer LIKE ? OR work_title LIKE ?)';
      countParams.push(search, `%${search}%`, `%${search}%`);
    }
    
    const [countResult] = await executeQuery(countQuery, countParams);
    const total = countResult.total;
    
    res.json({
      works,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      },
      filters: {
        category,
        subcategory, 
        composer,
        file_type,
        search
      }
    });
  } catch (error) {
    console.error('Ошибка получения произведений:', error);
    res.status(500).json({ 
      error: 'Ошибка получения произведений',
      details: error.message 
    });
  }
});

// Получение уникальных категорий
router.get('/categories', async (req, res) => {
  try {
    const categories = await executeQuery(`
      SELECT 
        category,
        COUNT(*) as count,
        COUNT(DISTINCT composer) as composers_count
      FROM works 
      GROUP BY category 
      ORDER BY category ASC
    `);
    
    res.json({ categories });
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({ 
      error: 'Ошибка получения категорий',
      details: error.message 
    });
  }
});

// Получение подкатегорий для определенной категории
router.get('/categories/:category/subcategories', async (req, res) => {
  try {
    const { category } = req.params;
    
    const subcategories = await executeQuery(`
      SELECT 
        subcategory,
        COUNT(*) as count,
        COUNT(DISTINCT composer) as composers_count
      FROM works 
      WHERE category = ? AND subcategory IS NOT NULL AND subcategory != ''
      GROUP BY subcategory 
      ORDER BY subcategory ASC
    `, [category]);
    
    res.json({ 
      category,
      subcategories 
    });
  } catch (error) {
    console.error('Ошибка получения подкатегорий:', error);
    res.status(500).json({ 
      error: 'Ошибка получения подкатегорий',
      details: error.message 
    });
  }
});

// Получение композиторов с возможностью фильтрации по категории
router.get('/composers', async (req, res) => {
  try {
    const { category, subcategory, search } = req.query;
    
    let query = `
      SELECT 
        composer,
        COUNT(*) as works_count,
        COUNT(DISTINCT category) as categories_count,
        GROUP_CONCAT(DISTINCT category ORDER BY category ASC) as categories
      FROM works 
      WHERE 1=1
    `;
    let params = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (subcategory) {
      query += ' AND subcategory = ?';
      params.push(subcategory);
    }
    
    if (search) {
      query += ' AND composer LIKE ?';
      params.push(`%${search}%`);
    }
    
    query += ' GROUP BY composer ORDER BY composer ASC';
    
    const composers = await executeQuery(query, params);
    
    // Преобразуем строку категорий в массив
    const processedComposers = composers.map(composer => ({
      ...composer,
      categories: composer.categories ? composer.categories.split(',') : []
    }));
    
    res.json({ 
      composers: processedComposers,
      filters: { category, subcategory, search }
    });
  } catch (error) {
    console.error('Ошибка получения композиторов:', error);
    res.status(500).json({ 
      error: 'Ошибка получения композиторов',
      details: error.message 
    });
  }
});

// Получение произведений конкретного композитора
router.get('/composer/:composer', async (req, res) => {
  try {
    const { composer } = req.params;
    const { category, subcategory } = req.query;
    
    let query = 'SELECT * FROM works WHERE composer = ?';
    let params = [composer];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (subcategory) {
      query += ' AND subcategory = ?';
      params.push(subcategory);
    }
    
    query += ' ORDER BY work_title ASC';
    
    const works = await executeQuery(query, params);
    
    if (works.length === 0) {
      return res.status(404).json({ 
        error: 'Произведения данного композитора не найдены' 
      });
    }
    
    // Группируем по категориям для удобства
    const groupedWorks = works.reduce((acc, work) => {
      const key = work.subcategory ? `${work.category}/${work.subcategory}` : work.category;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(work);
      return acc;
    }, {});
    
    res.json({
      composer,
      totalWorks: works.length,
      categories: Object.keys(groupedWorks).length,
      works: groupedWorks
    });
  } catch (error) {
    console.error('Ошибка получения произведений композитора:', error);
    res.status(500).json({ 
      error: 'Ошибка получения произведений композитора',
      details: error.message 
    });
  }
});

// Получение конкретного произведения по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный ID произведения' });
    }
    
    const works = await executeQuery(
      'SELECT * FROM works WHERE id = ?',
      [parseInt(id)]
    );
    
    if (works.length === 0) {
      return res.status(404).json({ error: 'Произведение не найдено' });
    }
    
    const work = works[0];
    
    // Проверяем существование файла
    let fileExists = false;
    try {
      await fs.access(work.file_path);
      fileExists = true;
    } catch (err) {
      console.warn(`Файл не найден: ${work.file_path}`);
    }
    
    res.json({
      ...work,
      file_exists: fileExists
    });
  } catch (error) {
    console.error('Ошибка получения произведения:', error);
    res.status(500).json({ 
      error: 'Ошибка получения произведения',
      details: error.message 
    });
  }
});

// Поиск произведений с расширенными параметрами
router.get('/search/advanced', async (req, res) => {
  try {
    const { 
      q,
      composer_search,
      work_search,
      category_search,
      fuzzy = false
    } = req.query;
    
    if (!q && !composer_search && !work_search && !category_search) {
      return res.status(400).json({ 
        error: 'Необходимо указать хотя бы один параметр поиска' 
      });
    }
    
    let query = 'SELECT *, MATCH(composer, work_title, category, subcategory) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance FROM works WHERE';
    let conditions = [];
    let params = [];
    
    if (q) {
      if (fuzzy === 'true') {
        conditions.push('(MATCH(composer, work_title, category, subcategory) AGAINST(? IN NATURAL LANGUAGE MODE) OR composer LIKE ? OR work_title LIKE ? OR category LIKE ?)');
        params.push(q, `%${q}%`, `%${q}%`, `%${q}%`);
      } else {
        conditions.push('MATCH(composer, work_title, category, subcategory) AGAINST(? IN NATURAL LANGUAGE MODE)');
        params.push(q);
      }
    }
    
    if (composer_search) {
      conditions.push('composer LIKE ?');
      params.push(`%${composer_search}%`);
    }
    
    if (work_search) {
      conditions.push('work_title LIKE ?');
      params.push(`%${work_search}%`);
    }
    
    if (category_search) {
      conditions.push('(category LIKE ? OR subcategory LIKE ?)');
      params.push(`%${category_search}%`, `%${category_search}%`);
    }
    
    query += ' ' + conditions.join(' AND ');
    query += ' ORDER BY relevance DESC, composer ASC, work_title ASC';
    
    // Добавляем параметр для MATCH в начало если есть общий поиск
    if (q) {
      params.unshift(q);
    } else {
      // Если нет общего поиска, убираем relevance из SELECT
      query = query.replace('MATCH(composer, work_title, category, subcategory) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance', '0 as relevance');
      query = query.replace('ORDER BY relevance DESC,', 'ORDER BY');
    }
    
    const works = await executeQuery(query, params);
    
    res.json({
      query: { q, composer_search, work_search, category_search, fuzzy },
      found: works.length,
      works
    });
  } catch (error) {
    console.error('Ошибка расширенного поиска:', error);
    res.status(500).json({ 
      error: 'Ошибка расширенного поиска',
      details: error.message 
    });
  }
});

// Статистика произведений
router.get('/stats/summary', async (req, res) => {
  try {
    const [totalWorks] = await executeQuery('SELECT COUNT(*) as total FROM works');
    const [totalComposers] = await executeQuery('SELECT COUNT(DISTINCT composer) as total FROM works');
    const [totalCategories] = await executeQuery('SELECT COUNT(DISTINCT category) as total FROM works');
    
    const fileTypeStats = await executeQuery(`
      SELECT 
        file_type,
        COUNT(*) as count,
        ROUND(AVG(file_size)) as avg_size,
        SUM(file_size) as total_size
      FROM works 
      GROUP BY file_type 
      ORDER BY count DESC
    `);
    
    const categoryStats = await executeQuery(`
      SELECT 
        category,
        COUNT(*) as works_count,
        COUNT(DISTINCT composer) as composers_count
      FROM works 
      GROUP BY category 
      ORDER BY works_count DESC 
      LIMIT 10
    `);
    
    res.json({
      totals: {
        works: totalWorks.total,
        composers: totalComposers.total,
        categories: totalCategories.total
      },
      fileTypes: fileTypeStats,
      topCategories: categoryStats
    });
  } catch (error) {
    console.error('Ошибка получения статистики произведений:', error);
    res.status(500).json({ 
      error: 'Ошибка получения статистики',
      details: error.message 
    });
  }
});

// Умный поиск произведений с исправлением опечаток
router.get('/search/smart', async (req, res) => {
  try {
    const { 
      q,
      page = 1,
      limit = 20,
      min_similarity = 0.6 
    } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Поисковый запрос должен содержать минимум 2 символа' 
      });
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const searchResult = await smartSearchWorks(q, {
      limit: parseInt(limit),
      offset,
      minSimilarity: parseFloat(min_similarity)
    });
    
    res.json({
      query: q,
      results: searchResult.results,
      total: searchResult.total,
      alternatives: searchResult.alternatives,
      min_similarity: searchResult.minSimilarity,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(searchResult.total / parseInt(limit)),
        has_next: offset + parseInt(limit) < searchResult.total
      }
    });
  } catch (error) {
    console.error('Ошибка умного поиска произведений:', error);
    res.status(500).json({ 
      error: 'Ошибка умного поиска',
      details: error.message 
    });
  }
});

// Автокомплит для поиска
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q, type = 'all', limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }
    
    const suggestions = await getSearchSuggestions(q, type, parseInt(limit));
    
    res.json({
      query: q,
      type,
      suggestions
    });
  } catch (error) {
    console.error('Ошибка получения предложений поиска:', error);
    res.status(500).json({ 
      error: 'Ошибка получения предложений',
      details: error.message 
    });
  }
});

// Получение миниатюры произведения
router.get('/:id/thumbnail', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Некорректный ID произведения' });
    }
    
    const thumbnailPath = await getThumbnail(parseInt(id));
    
    if (!thumbnailPath) {
      return res.status(404).json({ error: 'Миниатюра не найдена' });
    }
    
    res.json({
      work_id: parseInt(id),
      thumbnail_url: thumbnailPath
    });
  } catch (error) {
    console.error('Ошибка получения миниатюры:', error);
    res.status(500).json({ 
      error: 'Ошибка получения миниатюры',
      details: error.message 
    });
  }
});

export default router;