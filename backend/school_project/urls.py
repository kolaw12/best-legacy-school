"""
URL configuration for school_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.urls import re_path

from core.secure_media import secure_media_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('api/academics/', include('academics.urls')),
    path('api/auth/', include('accounts.urls')),
    path('api/finance/', include('finance.urls')),
    path('api/wellbeing/', include('wellbeing.urls')),
    path('api/operations/', include('operations.urls')),
    path('api/', include('assignments.urls')),
    # Signed, time-limited access for sensitive uploads — see core/secure_media.py.
    path('secure-media/', secure_media_view, name='secure-media'),
]

# Only genuinely public marketing photos (school-life gallery, event banners)
# are served directly. Everything else uploaded — student/staff photos,
# pickup-authorisation photos, admission passport photos — is safeguarding-
# relevant data and must go through secure_media_view's signed links instead,
# never this catch-all.
urlpatterns += [
    re_path(r'^media/(?P<path>(?:events|gallery)/.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
