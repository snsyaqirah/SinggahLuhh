from typing import Any, Generic, TypeVar

from pydantic import Field

from app.schemas.base import CamelModel

T = TypeVar("T")


class PaginatedResponse(CamelModel, Generic[T]):
    """Standard paginated list wrapper used across all list endpoints."""
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class MessageResponse(CamelModel):
    message: str
    success: bool = True


class ErrorResponse(CamelModel):
    error: str
    detail: str | None = None
