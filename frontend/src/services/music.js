import api from "./api";

// Thin wrappers around the Phase 3/4 backend endpoints — used by the
// Home/Search/Artist/Album/Library pages built in later phases, and by
// the player context for play tracking + likes.

export const getArtists = (params) => api.get("/artists/", { params });
export const getGenres = (params) => api.get("/genres/", { params });
export const getArtist = (slug) => api.get(`/artists/${slug}/`);
export const followArtist = (slug) => api.post(`/artists/${slug}/follow/`);
export const unfollowArtist = (slug) => api.post(`/artists/${slug}/unfollow/`);
export const getFeaturedArtists = () => api.get("/artists/featured/");

export const getAlbums = (params) => api.get("/albums/", { params });
export const getAlbum = (slug) => api.get(`/albums/${slug}/`);
export const getNewReleases = () => api.get("/albums/new_releases/");

export const getSongs = (params) => api.get("/songs/", { params });
export const getTrendingSongs = () => api.get("/songs/trending/");
export const getFeaturedSongs = () => api.get("/songs/featured/");
export const recordSongPlay = (songId) => api.post(`/songs/${songId}/play/`);

export const search = (q, type) => api.get("/search/", { params: { q, type } });

export const getPlaylists = (params) => api.get("/playlists/", { params });
export const getMyPlaylists = () => api.get("/playlists/mine/");
export const getPlaylist = (id) => api.get(`/playlists/${id}/`);
export const createPlaylist = (data) => api.post("/playlists/", data);
export const updatePlaylist = (id, data) => api.patch(`/playlists/${id}/`, data);
export const deletePlaylist = (id) => api.delete(`/playlists/${id}/`);
export const addSongToPlaylist = (playlistId, songId) =>
  api.post(`/playlists/${playlistId}/add_song/`, { song: songId });
export const removeSongFromPlaylist = (playlistId, songId) =>
  api.post(`/playlists/${playlistId}/remove_song/`, { song: songId });
export const reorderPlaylist = (playlistId, songIds) =>
  api.post(`/playlists/${playlistId}/reorder/`, { song_ids: songIds });
export const likePlaylist = (playlistId) => api.post(`/playlists/${playlistId}/like/`);
export const unlikePlaylist = (playlistId) => api.post(`/playlists/${playlistId}/unlike/`);

export const getLikedSongs = () => api.get("/liked-songs/");
export const likeSong = (songId) => api.post(`/songs/${songId}/like-toggle/`);
export const unlikeSong = (songId) => api.delete(`/songs/${songId}/like-toggle/`);

export const getRecentlyPlayed = () => api.get("/recently-played/");
export const recordRecentlyPlayed = (songId) => api.post("/recently-played/record/", { song: songId });
export const clearRecentlyPlayed = () => api.delete("/recently-played/clear/");

// --- Admin CRUD (staff / is_admin_user only — backend enforces this) ---
export const createGenre = (data) => api.post("/genres/", data);
export const deleteGenre = (id) => api.delete(`/genres/${id}/`);

export const createArtist = (formData) => api.post("/artists/", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateArtist = (slug, formData) => api.patch(`/artists/${slug}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteArtist = (slug) => api.delete(`/artists/${slug}/`);

export const createAlbum = (formData) => api.post("/albums/", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateAlbum = (slug, formData) => api.patch(`/albums/${slug}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteAlbum = (slug) => api.delete(`/albums/${slug}/`);

export const createSong = (formData) => api.post("/songs/", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateSong = (id, formData) => api.patch(`/songs/${id}/`, formData, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteSong = (id) => api.delete(`/songs/${id}/`);

// --- Admin dashboard: users & playlist moderation ---
export const getAdminUsers = (params) => api.get("/admin/users/", { params });
export const updateAdminUser = (id, data) => api.patch(`/admin/users/${id}/`, data);
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}/`);

export const getAdminPlaylists = (params) => api.get("/admin/playlists/", { params });
export const deleteAdminPlaylist = (id) => api.delete(`/admin/playlists/${id}/`);
