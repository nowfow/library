"""
Клиент для взаимодействия с Backend API
"""

import aiohttp
import asyncio
import json
from typing import Optional, Dict, Any, List
from loguru import logger
from config.settings import settings


class APIClient:
    """Клиент для работы с Backend API"""
    
    def __init__(self):
        self.base_url = settings.BACKEND_API_URL.rstrip("/")
        self.api_key = settings.BACKEND_API_KEY
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Получение HTTP сессии"""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(timeout=timeout)
        return self.session
    
    def _get_headers(self, jwt_token: Optional[str] = None) -> Dict[str, str]:
        """Формирование заголовков запроса"""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": f"{settings.BOT_NAME}/1.0"
        }
        
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        
        if jwt_token:
            headers["Authorization"] = f"Bearer {jwt_token}"
        
        return headers
    
    async def _make_request(self, method: str, endpoint: str, 
                          jwt_token: Optional[str] = None, 
                          data: Optional[Dict] = None,
                          params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """Выполнение HTTP запроса"""
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers(jwt_token)
        
        try:
            session = await self._get_session()
            
            async with session.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                params=params
            ) as response:
                
                response_text = await response.text()
                
                if response.status == 200:
                    try:
                        return json.loads(response_text)
                    except json.JSONDecodeError:
                        logger.error(f"Ошибка парсинга JSON: {response_text}")
                        return None
                
                elif response.status == 401:
                    logger.warning("Ошибка авторизации API")
                    return {"error": "unauthorized", "message": "Требуется авторизация"}
                
                elif response.status == 404:
                    return {"error": "not_found", "message": "Ресурс не найден"}
                
                else:
                    logger.error(f"API ошибка {response.status}: {response_text}")
                    return {"error": "api_error", "message": f"Ошибка API: {response.status}"}
        
        except asyncio.TimeoutError:
            logger.error(f"Таймаут запроса: {url}")
            return {"error": "timeout", "message": "Превышен таймаут запроса"}
        
        except Exception as e:
            logger.error(f"Ошибка HTTP запроса: {e}")
            return {"error": "connection_error", "message": "Ошибка соединения с сервером"}
    
    # Методы аутентификации
    async def register_user(self, email: str, password: str, name: str) -> Optional[Dict[str, Any]]:
        """Регистрация пользователя"""
        data = {
            "email": email,
            "password": password,
            "name": name
        }
        return await self._make_request("POST", "/auth/register", data=data)
    
    async def login_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Авторизация пользователя"""
        data = {
            "email": email,
            "password": password
        }
        return await self._make_request("POST", "/auth/login", data=data)
    
    async def get_user_info(self, jwt_token: str) -> Optional[Dict[str, Any]]:
        """Получение информации о пользователе"""
        return await self._make_request("GET", "/auth/me", jwt_token=jwt_token)
    
    async def verify_token(self, jwt_token: str) -> Optional[Dict[str, Any]]:
        """Проверка действительности токена"""
        return await self._make_request("POST", "/auth/verify-token", jwt_token=jwt_token)
    
    # Методы поиска произведений
    async def search_works(self, query: str, page: int = 1, limit: int = 10, 
                          jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Поиск произведений"""
        params = {
            "search": query,
            "limit": limit,
            "offset": (page - 1) * limit
        }
        return await self._make_request("GET", "/works", jwt_token=jwt_token, params=params)
    
    async def smart_search_works(self, query: str, page: int = 1, limit: int = 10,
                                jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Умный поиск произведений с исправлением опечаток"""
        params = {
            "q": query,
            "page": page,
            "limit": limit
        }
        return await self._make_request("GET", "/works/search/smart", jwt_token=jwt_token, params=params)
    
    async def get_search_suggestions(self, query: str, search_type: str = "all",
                                   jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Получение предложений для автокомплита"""
        params = {
            "q": query,
            "type": search_type,
            "limit": 5
        }
        return await self._make_request("GET", "/works/search/suggestions", jwt_token=jwt_token, params=params)
    
    async def get_work_by_id(self, work_id: int, jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Получение произведения по ID"""
        return await self._make_request("GET", f"/works/{work_id}", jwt_token=jwt_token)
    
    async def get_work_thumbnail(self, work_id: int, jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Получение миниатюры произведения"""
        return await self._make_request("GET", f"/works/{work_id}/thumbnail", jwt_token=jwt_token)
    
    # Методы для работы с категориями и композиторами
    async def get_categories(self, jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Получение списка категорий"""
        return await self._make_request("GET", "/works/categories", jwt_token=jwt_token)
    
    async def get_composers(self, category: Optional[str] = None, 
                          jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Получение списка композиторов"""
        params = {"category": category} if category else None
        return await self._make_request("GET", "/works/composers", jwt_token=jwt_token, params=params)
    
    async def get_composer_works(self, composer: str, category: Optional[str] = None,
                               jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Получение произведений композитора"""
        params = {"category": category} if category else None
        endpoint = f"/works/composer/{composer}"
        return await self._make_request("GET", endpoint, jwt_token=jwt_token, params=params)
    
    # Методы для работы с терминами
    async def search_terms(self, query: str, page: int = 1, limit: int = 10,
                          jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Поиск терминов"""
        params = {
            "search": query,
            "page": page,
            "limit": limit
        }
        return await self._make_request("GET", "/terms", jwt_token=jwt_token, params=params)
    
    async def smart_search_terms(self, query: str, page: int = 1, limit: int = 10,
                                jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Умный поиск терминов"""
        params = {
            "q": query,
            "page": page,
            "limit": limit
        }
        return await self._make_request("GET", "/terms/search/smart", jwt_token=jwt_token, params=params)
    
    async def get_term_by_id(self, term_id: int, jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Получение термина по ID"""
        return await self._make_request("GET", f"/terms/{term_id}", jwt_token=jwt_token)
    
    # Методы для работы с коллекциями
    async def get_user_collections(self, jwt_token: str, public_only: bool = False) -> Optional[Dict[str, Any]]:
        """Получение коллекций пользователя"""
        params = {"public": "true"} if public_only else None
        return await self._make_request("GET", "/collections", jwt_token=jwt_token, params=params)
    
    async def create_collection(self, name: str, description: str, is_public: bool,
                              jwt_token: str) -> Optional[Dict[str, Any]]:
        """Создание новой коллекции"""
        data = {
            "name": name,
            "description": description,
            "is_public": is_public
        }
        return await self._make_request("POST", "/collections", jwt_token=jwt_token, data=data)
    
    async def get_collection_by_id(self, collection_id: int, jwt_token: str) -> Optional[Dict[str, Any]]:
        """Получение коллекции по ID"""
        return await self._make_request("GET", f"/collections/{collection_id}", jwt_token=jwt_token)
    
    async def update_collection(self, collection_id: int, name: Optional[str] = None,
                              description: Optional[str] = None, is_public: Optional[bool] = None,
                              jwt_token: str) -> Optional[Dict[str, Any]]:
        """Обновление коллекции"""
        data = {}
        if name is not None:
            data["name"] = name
        if description is not None:
            data["description"] = description
        if is_public is not None:
            data["is_public"] = is_public
        
        return await self._make_request("PUT", f"/collections/{collection_id}", jwt_token=jwt_token, data=data)
    
    async def delete_collection(self, collection_id: int, jwt_token: str) -> Optional[Dict[str, Any]]:
        """Удаление коллекции"""
        return await self._make_request("DELETE", f"/collections/{collection_id}", jwt_token=jwt_token)
    
    async def add_work_to_collection(self, collection_id: int, work_id: int,
                                   jwt_token: str) -> Optional[Dict[str, Any]]:
        """Добавление произведения в коллекцию"""
        data = {"work_id": work_id}
        return await self._make_request("POST", f"/collections/{collection_id}/works", 
                                      jwt_token=jwt_token, data=data)
    
    async def remove_work_from_collection(self, collection_id: int, work_id: int,
                                        jwt_token: str) -> Optional[Dict[str, Any]]:
        """Удаление произведения из коллекции"""
        return await self._make_request("DELETE", f"/collections/{collection_id}/works/{work_id}",
                                      jwt_token=jwt_token)
    
    async def get_collection_works(self, collection_id: int, page: int = 1, limit: int = 10,
                                 jwt_token: str) -> Optional[Dict[str, Any]]:
        """Получение произведений из коллекции"""
        params = {
            "page": page,
            "limit": limit
        }
        return await self._make_request("GET", f"/collections/{collection_id}/works",
                                      jwt_token=jwt_token, params=params)
    
    # Методы для работы с файлами
    async def get_file_info(self, file_path: str, jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Получение информации о файле"""
        params = {"path": file_path}
        return await self._make_request("GET", "/files/info", jwt_token=jwt_token, params=params)
    
    async def download_file_url(self, file_path: str, jwt_token: Optional[str] = None) -> str:
        """Получение URL для скачивания файла"""
        # Возвращаем прямую ссылку на файл
        encoded_path = file_path.replace(" ", "%20")
        return f"{self.base_url}/files/download/{encoded_path}"
    
    async def get_file_stats(self, jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Получение статистики файлов"""
        return await self._make_request("GET", "/files/stats", jwt_token=jwt_token)
    
    # Методы статистики
    async def get_works_stats(self, jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Получение статистики произведений"""
        return await self._make_request("GET", "/works/stats/summary", jwt_token=jwt_token)
    
    async def get_terms_stats(self, jwt_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Получение статистики терминов"""
        return await self._make_request("GET", "/terms/stats/summary", jwt_token=jwt_token)
    
    # Health check
    async def health_check(self) -> Optional[Dict[str, Any]]:
        """Проверка состояния API"""
        try:
            session = await self._get_session()
            url = f"{self.base_url.replace('/api', '')}/health"
            
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {"status": "unhealthy", "error": f"HTTP {response.status}"}
        except Exception as e:
            logger.error(f"Ошибка health check: {e}")
            return {"status": "unhealthy", "error": str(e)}
    
    async def close(self) -> None:
        """Закрытие HTTP сессии"""
        if self.session and not self.session.closed:
            await self.session.close()
            logger.debug("HTTP сессия закрыта")


# Глобальный экземпляр API клиента
api_client = APIClient()