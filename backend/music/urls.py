from rest_framework.routers import DefaultRouter
from .views import GenreViewSet, ArtistViewSet, AlbumViewSet, SongViewSet

router = DefaultRouter()
router.register("genres", GenreViewSet, basename="genre")
router.register("artists", ArtistViewSet, basename="artist")
router.register("albums", AlbumViewSet, basename="album")
router.register("songs", SongViewSet, basename="song")

urlpatterns = router.urls
