import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Pause, Heart, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "react-toastify";

import SongRow from "../components/SongRow";
import Modal from "../components/Modal";

import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import {
  getPlaylist, updatePlaylist, deletePlaylist, removeSongFromPlaylist,
  reorderPlaylist, likePlaylist, unlikePlaylist,
} from "../services/music";

const FALLBACK =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%231c2028'/%3E%3C/svg%3E";

function toPlayable(song) {
  return {
    id: song.id, title: song.title, artist: song.artist_name,
    coverUrl: song.cover_image || FALLBACK, audioUrl: song.audio_url, lyrics: song.lyrics,
  };
}

export default function PlaylistDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { currentSong, isPlaying, playQueue, togglePlay } = usePlayer();

  const [playlist, setPlaylist] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwner = isAuthenticated && playlist && user?.id === playlist.owner;

  const load = () => {
    getPlaylist(id).then((r) => { setPlaylist(r.data); setEditTitle(r.data.title); }).catch(() => setNotFound(true));
  };

  useEffect(() => {
    setPlaylist(null);
    setNotFound(false);
    load();
  }, [id]);

  const isThisPlaying = playlist?.songs?.some((s) => s.id === currentSong?.id) && isPlaying;

  const handlePlayAll = () => {
    if (!playlist?.songs?.length) return;
    if (playlist.songs.some((s) => s.id === currentSong?.id)) { togglePlay(); return; }
    playQueue(playlist.songs.map(toPlayable), 0);
  };

  const handleToggleLike = async () => {
    if (!isAuthenticated) { toast.info("Log in to like playlists."); return; }
    try {
      if (playlist.is_liked) await unlikePlaylist(playlist.id);
      else await likePlaylist(playlist.id);
      setPlaylist((p) => ({ ...p, is_liked: !p.is_liked }));
    } catch {
      toast.error("Something went wrong.");
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    try {
      await updatePlaylist(playlist.id, { title: editTitle.trim() });
      setPlaylist((p) => ({ ...p, title: editTitle.trim() }));
      setEditing(false);
      toast.success("Playlist renamed.");
    } catch {
      toast.error("Couldn't rename the playlist.");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePlaylist(playlist.id);
      toast.success("Playlist deleted.");
      navigate("/library");
    } catch {
      toast.error("Couldn't delete the playlist.");
    }
  };

  const handleRemoveSong = async (songId) => {
    try {
      const { data } = await removeSongFromPlaylist(playlist.id, songId);
      setPlaylist(data);
    } catch {
      toast.error("Couldn't remove that song.");
    }
  };

  const handleMove = async (index, direction) => {
    const songs = [...playlist.songs];
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= songs.length) return;
    [songs[index], songs[swapWith]] = [songs[swapWith], songs[index]];
    setPlaylist((p) => ({ ...p, songs })); // optimistic
    try {
      await reorderPlaylist(playlist.id, songs.map((s) => s.id));
    } catch {
      toast.error("Couldn't reorder — refreshing.");
      load();
    }
  };

  if (notFound) {
    return (
      <div className="px-3 px-lg-4 py-5 text-center">
        <p className="fw-semibold mb-1">Playlist not found</p>
        <p className="text-secondary small">It may be private or have been deleted.</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="px-3 px-lg-4 py-5">
        <div className="mh-skeleton" style={{ height: 220, borderRadius: "var(--mh-radius-lg)" }} />
      </div>
    );
  }

  return (
    <div>
      <div
        className="d-flex flex-column flex-md-row align-items-md-end gap-4 p-4 p-lg-5"
        style={{ background: "linear-gradient(180deg, rgba(34,211,238,0.2), var(--mh-bg))" }}
      >
        {playlist.cover_image ? (
          <img src={playlist.cover_image} alt={playlist.title} style={{ width: 200, height: 200, objectFit: "cover", borderRadius: "var(--mh-radius-md)" }} />
        ) : (
          <div
            className="d-flex align-items-center justify-content-center fw-bold"
            style={{ width: 200, height: 200, borderRadius: "var(--mh-radius-md)", background: "var(--mh-accent-gradient)", color: "#0b0d10", fontSize: 48 }}
          >
            {playlist.title.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-grow-1">
          <div className="text-secondary small text-uppercase">Playlist</div>
          {editing ? (
            <form onSubmit={handleRename} className="d-flex gap-2 align-items-center mb-2">
              <input autoFocus className="form-control mh-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ maxWidth: 320 }} />
              <button type="submit" className="btn btn-sm p-2" style={{ background: "var(--mh-accent-gradient)", border: "none", borderRadius: "var(--mh-radius-sm)" }}>
                <Check size={16} color="#0b0d10" />
              </button>
              <button type="button" className="btn btn-sm p-2 text-secondary" style={{ background: "none", border: "none" }} onClick={() => { setEditing(false); setEditTitle(playlist.title); }}>
                <X size={16} />
              </button>
            </form>
          ) : (
            <h1 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ fontSize: "clamp(1.5rem, 4vw, 2.6rem)" }}>
              {playlist.title}
              {isOwner && (
                <button className="btn btn-sm p-1 text-secondary" style={{ background: "none", border: "none" }} onClick={() => setEditing(true)}>
                  <Pencil size={18} />
                </button>
              )}
            </h1>
          )}
          {playlist.description && <p className="text-secondary mb-2">{playlist.description}</p>}
          <div className="text-secondary small">
            By <span className="fw-semibold text-white">{playlist.owner_username}</span> · {playlist.songs.length} songs
          </div>
        </div>
      </div>

      <div className="px-3 px-lg-4 py-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <button
            className="mh-btn-primary d-flex align-items-center gap-2 px-4"
            style={{ width: "auto" }}
            onClick={handlePlayAll}
            disabled={!playlist.songs.length}
          >
            {isThisPlaying ? <Pause size={16} color="#0b0d10" /> : <Play size={16} fill="#0b0d10" />}
            {isThisPlaying ? "Pause" : "Play"}
          </button>
          <button
            className="btn btn-sm p-2"
            style={{ background: "none", border: "none", color: playlist.is_liked ? "var(--mh-accent-2)" : "var(--mh-text-secondary)" }}
            onClick={handleToggleLike}
          >
            <Heart size={22} fill={playlist.is_liked ? "currentColor" : "none"} />
          </button>
          {isOwner && (
            <button className="btn btn-sm p-2 text-secondary" style={{ background: "none", border: "none" }} onClick={() => setConfirmDelete(true)}>
              <Trash2 size={20} />
            </button>
          )}
        </div>

        <div className="d-flex flex-column gap-1">
          {playlist.songs.map((song, i) => (
            <SongRow
              key={song.id} song={song} index={i + 1} queue={playlist.songs} showAlbum
              onRemove={isOwner ? () => handleRemoveSong(song.id) : undefined}
              onMoveUp={isOwner && i > 0 ? () => handleMove(i, -1) : undefined}
              onMoveDown={isOwner && i < playlist.songs.length - 1 ? () => handleMove(i, 1) : undefined}
            />
          ))}
          {playlist.songs.length === 0 && (
            <p className="text-secondary small">
              No songs yet — add some from any album, artist, or search page via "Add to Playlist".
            </p>
          )}
        </div>
      </div>

      {confirmDelete && (
        <Modal title="Delete this playlist?" onClose={() => setConfirmDelete(false)} maxWidth={380}>
          <p className="text-secondary small mb-3">
            This will permanently delete "{playlist.title}". This can't be undone.
          </p>
          <div className="d-flex gap-2 justify-content-end">
            <button
              className="btn btn-sm px-3"
              style={{ background: "var(--mh-surface-raised)", border: "none", color: "var(--mh-text-primary)", borderRadius: "var(--mh-radius-sm)" }}
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-sm px-3"
              style={{ background: "#e5484d", border: "none", color: "#fff", borderRadius: "var(--mh-radius-sm)" }}
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
