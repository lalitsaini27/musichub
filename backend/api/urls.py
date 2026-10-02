from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from django.http import JsonResponse

from .views import SearchView
from accounts.views import UserAdminViewSet
from playlists.views import AdminPlaylistViewSet


def api_root(request):
    return JsonResponse({
        "message": "MusicHub API — v1",
        "status": "ok",
    })


admin_router = DefaultRouter()
admin_router.register('admin/users', UserAdminViewSet, basename='admin-user')
admin_router.register('admin/playlists', AdminPlaylistViewSet, basename='admin-playlist')

urlpatterns = [
    path('', api_root, name='api-root'),
    path('auth/', include('accounts.urls')),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('search/', SearchView.as_view(), name='search'),
    path('', include('music.urls')),
    path('', include('playlists.urls')),
    path('', include(admin_router.urls)),
]
