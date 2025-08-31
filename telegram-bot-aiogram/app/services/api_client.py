import aiohttp
import logging
from typing import List, Dict, Any, Optional, Union
from app.config.settings import settings

logger = logging.getLogger(__name__)

class APIClient:
    """Client for interacting with Music Library backend API"""
    
    def __init__(self, jwt_token: Optional[str] = None):
        self.base_url = settings.API_BASE_URL.rstrip('/')
        self.jwt_token = jwt_token
        self.timeout = aiohttp.ClientTimeout(total=settings.API_TIMEOUT)
    
    @property
    def headers(self) -> Dict[str, str]:
        """Get headers for API requests"""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "MusicLibraryBot/1.0"
        }
        if self.jwt_token:
            headers["Authorization"] = f"Bearer {self.jwt_token}"
        return headers
    
    async def _request(
        self, 
        method: str, 
        endpoint: str, 
        params: Optional[Dict] = None,
        json_data: Optional[Dict] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Make HTTP request to API"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with aiohttp.ClientSession(
                timeout=self.timeout, 
                headers=self.headers
            ) as session:
                async with session.request(
                    method, 
                    url, 
                    params=params,
                    json=json_data,
                    **kwargs
                ) as response:
                    
                    # Log request for debugging
                    logger.debug(f"{method} {url} - Status: {response.status}")
                    
                    if response.status == 404:
                        return {"error": "Not found", "status": 404}
                    
                    response.raise_for_status()
                    
                    # Handle different content types
                    content_type = response.headers.get('content-type', '')
                    if 'application/json' in content_type:
                        return await response.json()
                    else:
                        return {"data": await response.text(), "content_type": content_type}
                        
        except aiohttp.ClientTimeout:
            logger.error(f"Timeout error for {method} {url}")
            raise APIException("Request timeout")
        except aiohttp.ClientError as e:
            logger.error(f"Client error for {method} {url}: {e}")
            raise APIException(f"Connection error: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error for {method} {url}: {e}")
            raise APIException(f"API error: {str(e)}")
    
    # Authentication methods
    async def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Login user and get JWT token"""
        return await self._request(
            "POST", 
            "/api/auth/login",
            json_data={"email": email, "password": password}
        )
    
    async def register_user(self, email: str, password: str, name: str) -> Dict[str, Any]:
        """Register new user"""
        return await self._request(
            "POST", 
            "/api/auth/register",
            json_data={"email": email, "password": password, "name": name}
        )
    
    # Search methods
    async def search_works(
        self, 
        composer: Optional[str] = None, 
        work: Optional[str] = None,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Search for musical works"""
        params = {}
        if composer:
            params["composer"] = composer
        if work:
            params["work"] = work
        if limit:
            params["limit"] = limit
        
        result = await self._request("GET", "/api/works", params=params)
        return result.get("works", result) if isinstance(result, dict) else result
    
    async def search_composers(self, query: str) -> List[Dict[str, Any]]:
        """Search for composers"""
        result = await self._request("GET", "/api/composers/search", params={"q": query})
        return result.get("composers", result) if isinstance(result, dict) else result
    
    async def search_terms(self, query: str) -> List[Dict[str, Any]]:
        """Search for musical terms"""
        result = await self._request("GET", "/api/terms/search", params={"q": query})
        return result.get("terms", result) if isinstance(result, dict) else result
    
    # File operations
    async def list_cloud_files(self, path: str = "/") -> Dict[str, Any]:
        """List files in cloud storage"""
        return await self._request("GET", "/api/files/cloud/list", params={"path": path})
    
    async def download_file(self, file_path: str) -> Dict[str, Any]:
        """Get download link for file"""
        return await self._request("GET", "/api/files/pdf", params={"pdf_path": file_path})
    
    async def get_file_info(self, file_path: str) -> Dict[str, Any]:
        """Get file information"""
        return await self._request("GET", "/api/files/info", params={"path": file_path})
    
    # Collections
    async def get_collections(self) -> List[Dict[str, Any]]:
        """Get user collections"""
        result = await self._request("GET", "/api/collections")
        return result.get("collections", result) if isinstance(result, dict) else result
    
    async def create_collection(self, name: str, description: str = "") -> Dict[str, Any]:
        """Create new collection"""
        return await self._request(
            "POST", 
            "/api/collections", 
            json_data={"name": name, "description": description}
        )
    
    async def add_to_collection(self, collection_id: int, work_id: int) -> Dict[str, Any]:
        """Add work to collection"""
        return await self._request(
            "POST", 
            f"/api/collections/{collection_id}/works", 
            json_data={"work_id": work_id}
        )
    
    # Work details
    async def get_work_details(self, work_id: int) -> Dict[str, Any]:
        """Get detailed information about a work"""
        return await self._request("GET", f"/api/works/{work_id}")
    
    async def get_work_files(self, work_id: int) -> List[Dict[str, Any]]:
        """Get files associated with a work"""
        result = await self._request("GET", f"/api/works/{work_id}/files")
        return result.get("files", result) if isinstance(result, dict) else result

class APIException(Exception):
    """Custom exception for API errors"""
    pass