from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('api.urls')),

    # Media files (uploaded audio/images) are served through Django in every
    # environment, not just DEBUG, so django-cors-headers can attach the CORS
    # headers the Web Audio API needs (equalizer/visualizer silence any audio
    # it can't verify as CORS-approved).
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]