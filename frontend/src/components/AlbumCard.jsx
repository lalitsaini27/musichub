import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { getAlbum } from "../services/music";

const FALLBACK =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%231c2028'/%3E%3C/svg%3E";

export default function AlbumCard({ album }) {
  const navigate = useNavigate();
  const { playQueue } = usePlayer();

  const handlePlay = async (e) => {
    e.stopPropagation();
    const { data } = await getAlbum(album.slug);
    const playable = data.songs.map((s) => ({
      id: s.id, title: s.title, artist: s.artist_name, coverUrl: s.cover_image || FALLBACK, audioUrl: s.audio_url, lyrics: s.lyrics,
    }));
    if (playable.length) playQueue(playable, 0);
  };

  return (
    <div
      className="mh-card-hover position-relative p-2"
      style={{ borderRadius: "var(--mh-radius-md)", cursor: "pointer", width: 168, flexShrink: 0 }}
      onClick={() => navigate(`/album/${album.slug}`)}
    >
      <div className="position-relative">
        <img
          src={album.cover_image || FALLBACK}
          alt={album.title}
          style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: "var(--mh-radius-sm)" }}
        />
        <button
          className="position-absolute d-flex align-items-center justify-content-center mh-play-overlay"
          style={{
            bottom: 8, right: 8, width: 36, height: 36, borderRadius: "50%",
            background: "var(--mh-accent-gradient)", border: "none", opacity: 0,
            transition: "opacity 0.15s ease, transform 0.15s ease",
          }}
          onClick={handlePlay}
        >
          <Play size={16} color="#0b0d10" />
        </button>
      </div>
      <div className="mt-2" style={{ minWidth: 0 }}>
        <div className="text-truncate small fw-semibold">{album.title}</div>
        <div className="text-truncate text-secondary" style={{ fontSize: 12 }}>
          {album.artist_name} · {album.release_year}
        </div>
      </div>
    </div>
  );
}
