import { executeQuery } from '../db.js';
import logger from './logger.js';

// Функция для вычисления расстояния Левенштейна
function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,     // deletion
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Функция для вычисления коэффициента схожести
function similarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// Функция для нормализации строки поиска
function normalizeSearchString(str) {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .replace(/[ёе]/g, 'е')
    .replace(/[ий]/g, 'и')
    .replace(/[ъь]/g, '')
    .replace(/[^а-яa-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Создание альтернативных написаний для русских имен
function generateAlternatives(text) {
  const alternatives = [text];
  
  // Транслитерация основных букв
  const translitMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'sch', 'ы': 'y', 'э': 'e', 'ю': 'yu',
    'я': 'ya'
  };
  
  // Создаем транслитерированную версию
  let transliterated = text.toLowerCase();
  for (const [cyrillic, latin] of Object.entries(translitMap)) {
    transliterated = transliterated.replace(new RegExp(cyrillic, 'g'), latin);
  }
  
  alternatives.push(transliterated);
  
  // Общие альтернативы для композиторов
  const commonAlternatives = {
    'чайковский': ['tchaikovsky', 'tschaikovsky', 'chaikovsky'],
    'рахманинов': ['rachmaninoff', 'rachmaninov'],
    'стравинский': ['stravinsky', 'strawinsky'],
    'прокофьев': ['prokofiev', 'prokofieff'],
    'шостакович': ['shostakovich', 'schostakowitsch'],
    'мусоргский': ['mussorgsky', 'moussorgsky'],
    'моцарт': ['mozart'],
    'бах': ['bach'],
    'бетховен': ['beethoven'],
    'шопен': ['chopin'],
    'дебюсси': ['debussy'],
    'равель': ['ravel']
  };
  
  const normalized = normalizeSearchString(text);
  for (const [russian, variants] of Object.entries(commonAlternatives)) {
    if (normalized.includes(russian)) {
      alternatives.push(...variants);
    }
  }
  
  return [...new Set(alternatives)];
}

// Интеллектуальный поиск произведений
export async function smartSearchWorks(query, options = {}) {
  try {
    const {
      limit = 20,
      offset = 0,
      minSimilarity = 0.6,
      exactMatchBoost = 2.0,
      fuzzyMatchBoost = 1.0
    } = options;
    
    if (!query || query.trim().length < 2) {
      return { results: [], total: 0 };
    }
    
    const normalizedQuery = normalizeSearchString(query);
    const queryAlternatives = generateAlternatives(normalizedQuery);
    
    // Создаем условия поиска для всех альтернатив
    const searchConditions = [];
    const searchParams = [];
    
    queryAlternatives.forEach(alternative => {
      // Точное совпадение (высший приоритет)
      searchConditions.push(`
        (LOWER(composer) LIKE ? OR 
         LOWER(work_title) LIKE ? OR 
         LOWER(category) LIKE ? OR 
         LOWER(subcategory) LIKE ?)
      `);
      const exactMatch = `%${alternative}%`;
      searchParams.push(exactMatch, exactMatch, exactMatch, exactMatch);
    });
    
    // Полнотекстовый поиск
    if (queryAlternatives.length > 0) {
      const fullTextQuery = queryAlternatives
        .filter(alt => alt.length >= 3)
        .map(alt => `"${alt}"`)
        .join(' ');
      
      if (fullTextQuery) {
        searchConditions.push('MATCH(composer, work_title, category, subcategory) AGAINST (? IN BOOLEAN MODE)');
        searchParams.push(fullTextQuery);
      }
    }
    
    const whereClause = searchConditions.length > 0 
      ? `WHERE (${searchConditions.join(' OR ')})` 
      : '';
    
    // Основной запрос
    const searchQuery = `
      SELECT 
        *,
        CASE 
          WHEN LOWER(composer) = ? THEN ${exactMatchBoost * 10}
          WHEN LOWER(work_title) = ? THEN ${exactMatchBoost * 8}
          WHEN LOWER(composer) LIKE ? THEN ${exactMatchBoost * 6}
          WHEN LOWER(work_title) LIKE ? THEN ${exactMatchBoost * 4}
          ELSE ${fuzzyMatchBoost}
        END as relevance_score
      FROM works
      ${whereClause}
      ORDER BY relevance_score DESC, composer ASC, work_title ASC
      LIMIT ? OFFSET ?
    `;
    
    const queryParams = [
      normalizedQuery, normalizedQuery,
      `%${normalizedQuery}%`, `%${normalizedQuery}%`,
      ...searchParams,
      limit, offset
    ];
    
    // Выполняем поиск
    const results = await executeQuery(searchQuery, queryParams);
    
    // Постобработка результатов с вычислением схожести
    const processedResults = results.map(work => {
      const composerSimilarity = similarity(normalizedQuery, normalizeSearchString(work.composer));
      const titleSimilarity = similarity(normalizedQuery, normalizeSearchString(work.work_title));
      const categorySimilarity = similarity(normalizedQuery, normalizeSearchString(work.category || ''));
      
      const maxSimilarity = Math.max(composerSimilarity, titleSimilarity, categorySimilarity);
      
      return {
        ...work,
        similarity_score: maxSimilarity,
        match_type: composerSimilarity > titleSimilarity ? 'composer' : 'title'
      };
    }).filter(work => work.similarity_score >= minSimilarity);
    
    // Подсчет общего количества
    const countQuery = `
      SELECT COUNT(*) as total
      FROM works
      ${whereClause}
    `;
    
    const countResult = await executeQuery(countQuery, searchParams);
    const total = countResult[0]?.total || 0;
    
    logger.info('Умный поиск выполнен', {
      query: normalizedQuery,
      alternatives: queryAlternatives.length,
      resultsFound: processedResults.length,
      totalMatches: total
    });
    
    return {
      results: processedResults,
      total,
      query: normalizedQuery,
      alternatives: queryAlternatives,
      minSimilarity
    };
    
  } catch (error) {
    logger.error('Ошибка умного поиска произведений', {
      query,
      error: error.message
    });
    throw error;
  }
}

// Интеллектуальный поиск терминов
export async function smartSearchTerms(query, options = {}) {
  try {
    const {
      limit = 20,
      offset = 0,
      minSimilarity = 0.5
    } = options;
    
    if (!query || query.trim().length < 2) {
      return { results: [], total: 0 };
    }
    
    const normalizedQuery = normalizeSearchString(query);
    const queryAlternatives = generateAlternatives(normalizedQuery);
    
    // Поиск терминов
    const searchConditions = [];
    const searchParams = [];
    
    queryAlternatives.forEach(alternative => {
      searchConditions.push(`
        (LOWER(term) LIKE ? OR LOWER(definition) LIKE ?)
      `);
      const pattern = `%${alternative}%`;
      searchParams.push(pattern, pattern);
    });
    
    // Полнотекстовый поиск
    if (queryAlternatives.length > 0) {
      const fullTextQuery = queryAlternatives
        .filter(alt => alt.length >= 3)
        .map(alt => `"${alt}"`)
        .join(' ');
      
      if (fullTextQuery) {
        searchConditions.push('MATCH(term, definition) AGAINST (? IN BOOLEAN MODE)');
        searchParams.push(fullTextQuery);
      }
    }
    
    const whereClause = searchConditions.length > 0 
      ? `WHERE (${searchConditions.join(' OR ')})` 
      : '';
    
    const searchQuery = `
      SELECT 
        *,
        CASE 
          WHEN LOWER(term) = ? THEN 10
          WHEN LOWER(term) LIKE ? THEN 8
          WHEN LOWER(definition) LIKE ? THEN 6
          ELSE 1
        END as relevance_score
      FROM terms
      ${whereClause}
      ORDER BY relevance_score DESC, term ASC
      LIMIT ? OFFSET ?
    `;
    
    const queryParams = [
      normalizedQuery,
      `%${normalizedQuery}%`,
      `%${normalizedQuery}%`,
      ...searchParams,
      limit, offset
    ];
    
    const results = await executeQuery(searchQuery, queryParams);
    
    // Постобработка с вычислением схожести
    const processedResults = results.map(term => {
      const termSimilarity = similarity(normalizedQuery, normalizeSearchString(term.term));
      const definitionSimilarity = similarity(normalizedQuery, normalizeSearchString(term.definition));
      
      const maxSimilarity = Math.max(termSimilarity, definitionSimilarity);
      
      return {
        ...term,
        similarity_score: maxSimilarity,
        match_type: termSimilarity > definitionSimilarity ? 'term' : 'definition'
      };
    }).filter(term => term.similarity_score >= minSimilarity);
    
    // Подсчет общего количества
    const countQuery = `
      SELECT COUNT(*) as total
      FROM terms
      ${whereClause}
    `;
    
    const countResult = await executeQuery(countQuery, searchParams);
    const total = countResult[0]?.total || 0;
    
    return {
      results: processedResults,
      total,
      query: normalizedQuery,
      alternatives: queryAlternatives
    };
    
  } catch (error) {
    logger.error('Ошибка умного поиска терминов', {
      query,
      error: error.message
    });
    throw error;
  }
}

// Поиск предложений (автокомплит)
export async function getSearchSuggestions(query, type = 'all', limit = 10) {
  try {
    if (!query || query.length < 2) {
      return [];
    }
    
    const normalizedQuery = normalizeSearchString(query);
    const suggestions = [];
    
    if (type === 'all' || type === 'composers') {
      // Предложения композиторов
      const composers = await executeQuery(`
        SELECT DISTINCT composer as value, 'composer' as type, COUNT(*) as count
        FROM works 
        WHERE LOWER(composer) LIKE ?
        GROUP BY composer
        ORDER BY count DESC, composer ASC
        LIMIT ?
      `, [`%${normalizedQuery}%`, Math.ceil(limit / 2)]);
      
      suggestions.push(...composers);
    }
    
    if (type === 'all' || type === 'works') {
      // Предложения произведений
      const works = await executeQuery(`
        SELECT DISTINCT work_title as value, 'work' as type, COUNT(*) as count
        FROM works 
        WHERE LOWER(work_title) LIKE ?
        GROUP BY work_title
        ORDER BY count DESC, work_title ASC
        LIMIT ?
      `, [`%${normalizedQuery}%`, Math.ceil(limit / 2)]);
      
      suggestions.push(...works);
    }
    
    if (type === 'all' || type === 'categories') {
      // Предложения категорий
      const categories = await executeQuery(`
        SELECT DISTINCT category as value, 'category' as type, COUNT(*) as count
        FROM works 
        WHERE LOWER(category) LIKE ?
        GROUP BY category
        ORDER BY count DESC, category ASC
        LIMIT ?
      `, [`%${normalizedQuery}%`, Math.ceil(limit / 3)]);
      
      suggestions.push(...categories);
    }
    
    // Сортируем по релевантности и ограничиваем
    return suggestions
      .sort((a, b) => {
        // Точное совпадение в начале имеет приоритет
        const aStartsWithQuery = normalizeSearchString(a.value).startsWith(normalizedQuery);
        const bStartsWithQuery = normalizeSearchString(b.value).startsWith(normalizedQuery);
        
        if (aStartsWithQuery && !bStartsWithQuery) return -1;
        if (!aStartsWithQuery && bStartsWithQuery) return 1;
        
        // Затем по количеству упоминаний
        return b.count - a.count;
      })
      .slice(0, limit);
    
  } catch (error) {
    logger.error('Ошибка получения предложений поиска', {
      query,
      type,
      error: error.message
    });
    return [];
  }
}