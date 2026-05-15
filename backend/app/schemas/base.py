"""
Pydantic base config.

All schemas inherit `CamelModel` which automatically aliases
snake_case Python fields to camelCase in JSON (API responses and request bodies).

Python  →  JSON / TypeScript
─────────────────────────────
user_id → userId
full_name → fullName
is_verified → isVerified
masjid_id → masjidId
created_at → createdAt
"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,   # still accept snake_case on input
        from_attributes=True,    # allow ORM models → schema
    )
