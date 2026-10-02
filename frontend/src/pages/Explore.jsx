import { useEffect, useState } from "react";
import SongCard from "../components/SongCard";
import AlbumCard from "../components/AlbumCard";
import SkeletonRow from "../components/SkeletonLoader";
import { getGenres, getSongs, getAlbums } from "../services/music";

export default function Explore() {
  const [genres, setGenres] = useState(null);
  const [activeGenre, setActiveGenre] = useState(null);
  const [songs, setSongs] = useState(null);
  const [albums, setAlbums] = useState(null);

  useEffect(() => {
    getGenres().then((r) => setGenres(r.data.results || r.data)).catch(() => setGenres([]));
  }, []);

  useEffect(() => {
    setSongs(null);
    setAlbums(null);
    const params = activeGenre ? { genres: activeGenre } : {};
    getSongs(params).then((r) => setSongs(r.data.results || r.data)).catch(() => setSongs([]));
    getAlbums(params).then((r) => setAlbums(r.data.results || r.data)).catch(() => setAlbums([]));
  }, [activeGenre]);

  return (
    <div className="pt-2">
      <div className="px-3 px-lg-4 mb-4">
        <h1 className="fw-bold mb-3">Explore</h1>
        <div className="d-flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveGenre(null)}
            className="btn btn-sm px-3 py-1"
            style={{
              borderRadius: 999, border: "none",
              background: activeGenre === null ? "var(--mh-accent-gradient)" : "var(--mh-surface-raised)",
              color: activeGenre === null ? "#0b0d10" : "var(--mh-text-primary)",
              fontWeight: activeGenre === null ? 600 : 400,
            }}
          >
            All Genres
          </button>
          {genres === null && <span className="text-secondary small">Loading genres...</span>}
          {genres?.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGenre(g.id)}
              className="btn btn-sm px-3 py-1"
              style={{
                borderRadius: 999, border: "none",
                background: activeGenre === g.id ? "var(--mh-accent-gradient)" : "var(--mh-surface-raised)",
                color: activeGenre === g.id ? "#0b0d10" : "var(--mh-text-primary)",
                fontWeight: activeGenre === g.id ? 600 : 400,
              }}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      <section className="mb-4 px-3 px-lg-4">
        <h2 className="mh-section-title mb-3">Songs</h2>
        {songs === null ? <SkeletonRow /> : songs.length === 0 ? (
          <p className="text-secondary small">No songs in this genre yet.</p>
        ) : (
          <div className="mh-scroll-row">{songs.map((s) => <SongCard key={s.id} song={s} queue={songs} />)}</div>
        )}
      </section>

      <section className="mb-4 px-3 px-lg-4">
        <h2 className="mh-section-title mb-3">Albums</h2>
        {albums === null ? <SkeletonRow /> : albums.length === 0 ? (
          <p className="text-secondary small">No albums in this genre yet.</p>
        ) : (
          <div className="mh-scroll-row">{albums.map((a) => <AlbumCard key={a.id} album={a} />)}</div>
        )}
      </section>
    </div>
  );
}
