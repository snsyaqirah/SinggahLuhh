"""
Supabase client configuration for JejakMasjid.
This module provides authenticated Supabase clients for auth operations and database queries.
"""
from supabase import create_client, Client
from app.core.config import settings

# Supabase client with anon key (for client-side operations)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

# Supabase admin client with service_role key (bypasses RLS for admin operations)
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def get_supabase() -> Client:
    """Get Supabase client instance."""
    return supabase


def get_supabase_admin() -> Client:
    """Get Supabase admin client instance (bypasses RLS)."""
    return supabase_admin
