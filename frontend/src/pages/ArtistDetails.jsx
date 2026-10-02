import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, BadgeCheck, UserPlus, UserCheck } from "lucide-react";
import { toast } from "react-toastify";

import SongRow from "../components/SongRow";
import AlbumCard from "../components/AlbumCard";
import ArtistCard from "../components/ArtistCard";
import AddToPlaylistModal from "../components/AddToPlaylistModal";

import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { getArtist, followArtist, unfollowArtist } from "../services/music";

const FALLBACK =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%231c2028'/%3E%3C/svg%3E";

function toPlayable(song) {
  return {
    id: song.id, title: song.title, artist: song.artist_name,
    coverUrl: song.cover_image || FALLBACK, audioUrl: song.audio_url, lyrics: song.lyrics,
  };
}

function formatListeners(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M monthly listeners`;
  if (n >= 1_000) return `${Math.round(n / 1000)}K monthly listeners`;
  return `${n} monthly listeners`;
}

export default function ArtistDetails() {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { playQueue } = usePlayer();

  const [artist, setArtist] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState(null);

  useEffect(() => {
    setArtist(null);
    setNotFound(false);
    getArtist(slug)
      .then((r) => { setArtist(r.data); setFollowing(r.data.is_following); })
      .catch(() => setNotFound(true));
  }, [slug]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.info("Log in to follow artists.");
      navigate("/login", { state: { from: `/artist/${slug}` } });
      return;
    }
    try {
      if (following) {
        await unfollowArtist(slug);
        setFollowing(false);
      } else {
        await followArtist(slug);
        setFollowing(true);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handlePlayPopular = () => {
    if (!artist?.popular_songs?.length) return;
    playQueue(artist.popular_songs.map(toPlayable), 0);
  };

  if (notFound) {
    return (
      <div className="px-3 px-lg-4 py-5 text-center">
        <p className="fw-semibold mb-1">Artist not found</p>
        <p className="text-secondary small">This artist may have been removed.</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="px-3 px-lg-4 py-5">
        <div className="mh-skeleton" style={{ height: 220, borderRadius: "var(--mh-radius-lg)" }} />
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div
        className="position-relative d-flex align-items-end p-4 p-lg-5"
        style={{
          minHeight: 260,
          background: artist.cover_image
            ? `linear-gradient(180deg, rgba(11,13,16,0.2), var(--mh-bg)), url(${artist.cover_image}) center/cover`
            : "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(34,211,238,0.2))",
        }}
      >
        <div className="d-flex align-items-center gap-4">
          <img
            src={artist.image || FALLBACK}
            alt={artist.name}
            style={{ width: 140, height: 140, borderRadius: "50%", objectFit: "cover", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}
          />
          <div>
            <div className="d-flex align-items-center gap-2">
              <h1 className="fw-bold mb-0" style={{ fontSize: "clamp(1.5rem, 4vw, 2.6rem)" }}>{artist.name}</h1>
              {artist.verified && <BadgeCheck size={24} style={{ color: "var(--mh-accent-2)" }} />}
            </div>
            <p className="text-secondary mb-0">{formatListeners(artist.monthly_listeners)}</p>
          </div>
        </div>
      </div>

      <div className="px-3 px-lg-4 py-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <button
            className="mh-btn-primary d-flex align-items-center gap-2 px-4"
            style={{ width: "auto" }}
            onClick={handlePlayPopular}
            disabled={!artist.popular_songs?.length}
          >
            <Play size={16} fill="#0b0d10" /> Play
          </button>
          <button
            className="btn d-flex align-items-center gap-2 px-3"
            style={{
              background: following ? "var(--mh-surface-raised)" : "transparent",
              border: "1px solid var(--mh-border)", color: "var(--mh-text-primary)",
              borderRadius: "var(--mh-radius-sm)",
            }}
            onClick={handleFollow}
          >
            {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
            {following ? "Following" : "Follow"}
          </button>
        </div>

        {artist.bio && <p className="text-secondary mb-4" style={{ maxWidth: 640 }}>{artist.bio}</p>}

        {artist.popular_songs?.length > 0 && (
          <div className="mb-5">
            <h2 className="mh-section-title mb-3">Popular Songs</h2>
            <div className="d-flex flex-column gap-1">
              {artist.popular_songs.map((song, i) => (
                <SongRow
                  key={song.id} song={song} index={i + 1} queue={artist.popular_songs}
                  onAddToPlaylist={isAuthenticated ? () => setAddToPlaylistSong(song) : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {artist.albums?.length > 0 && (
          <div className="mb-5">
            <h2 className="mh-section-title mb-3">Albums</h2>
            <div className="mh-scroll-row">{artist.albums.map((a) => <AlbumCard key={a.id} album={a} />)}</div>
          </div>
        )}

        {artist.singles?.length > 0 && (
          <div className="mb-5">
            <h2 className="mh-section-title mb-3">Singles &amp; EPs</h2>
            <div className="mh-scroll-row">{artist.singles.map((a) => <AlbumCard key={a.id} album={a} />)}</div>
          </div>
        )}

        {artist.related_artists?.length > 0 && (
          <div className="mb-5">
            <h2 className="mh-section-title mb-3">Fans Also Like</h2>
            <div className="mh-scroll-row">{artist.related_artists.map((a) => <ArtistCard key={a.id} artist={a} />)}</div>
          </div>
        )}
      </div>

      {addToPlaylistSong && <AddToPlaylistModal song={addToPlaylistSong} onClose={() => setAddToPlaylistSong(null)} />}
    </div>
  );
}
