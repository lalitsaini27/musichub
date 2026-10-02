import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon, X } from "lucide-react";

import SongCard from "../components/SongCard";
import ArtistCard from "../components/ArtistCard";
import AlbumCard from "../components/AlbumCard";
import PlaylistCard from "../components/PlaylistCard";
import SkeletonRow from "../components/SkeletonLoader";
import Section from "../components/Section";

import { search, getTrendingSongs, getFeaturedArtists } from "../services/music";

const TABS = [
  { key: "all", label: "All" },
  { key: "songs", label: "Songs" },
  { key: "artists", label: "Artists" },
  { key: "albums", label: "Albums" },
  { key: "playlists", label: "Playlists" },
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState("all");
  const [results, setResults] = useState(null); // null = not searched yet
  const [loading, setLoading] = useState(false);

  const [trending, setTrending] = useState(null);
  const [artists, setArtists] = useState(null);

  const debounceRef = useRef(null);

  // Suggestions shown before the user has typed anything.
  useEffect(() => {
    if (query.trim()) return;
    getTrendingSongs().then((r) => setTrending(r.data)).catch(() => setTrending([]));
    getFeaturedArtists().then((r) => setArtists(r.data)).catch(() => setArtists([]));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setParams({}, { replace: true });
      return;
    }
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(query.trim(), tab === "all" ? undefined : tab)
        .then((r) => setResults(r.data))
        .catch(() => setResults({ songs: [], artists: [], albums: [], playlists: [] }))
        .finally(() => setLoading(false));
      setParams({ q: query.trim() }, { replace: true });
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, tab]);

  const hasAnyResults =
    results && (results.songs?.length || results.artists?.length || results.albums?.length || results.playlists?.length);

  return (
    <div className="pt-2">
      <div className="px-3 px-lg-4 mb-3">
        <div
          className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
          style={{ background: "var(--mh-surface-raised)", maxWidth: 520 }}
        >
          <SearchIcon size={18} className="text-secondary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, albums, playlists..."
            className="flex-grow-1 border-0 bg-transparent"
            style={{ outline: "none", color: "var(--mh-text-primary)" }}
          />
          {query && (
            <button className="btn btn-sm p-0 text-secondary" style={{ background: "none", border: "none" }} onClick={() => setQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {query.trim() && (
        <div className="px-3 px-lg-4 mb-3 d-flex gap-2" style={{ overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="btn btn-sm px-3 py-1 flex-shrink-0"
              style={{
                borderRadius: 999, border: "none",
                background: tab === t.key ? "var(--mh-accent-gradient)" : "var(--mh-surface-raised)",
                color: tab === t.key ? "#0b0d10" : "var(--mh-text-primary)",
                fontWeight: tab === t.key ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* No query yet — suggestions */}
      {!query.trim() && (
        <>
          <Section title="Trending Songs">
            {trending === null ? <SkeletonRow /> : trending.length === 0 ? (
              <p className="text-secondary small">No trending songs yet.</p>
            ) : (
              <div className="mh-scroll-row">{trending.map((s) => <SongCard key={s.id} song={s} queue={trending} />)}</div>
            )}
          </Section>
          <Section title="Popular Artists">
            {artists === null ? <SkeletonRow round /> : artists.length === 0 ? (
              <p className="text-secondary small">No featured artists yet.</p>
            ) : (
              <div className="mh-scroll-row">{artists.map((a) => <ArtistCard key={a.id} artist={a} />)}</div>
            )}
          </Section>
        </>
      )}

      {/* Loading */}
      {query.trim() && loading && (
        <div className="px-3 px-lg-4">
          <SkeletonRow />
        </div>
      )}

      {/* Empty state */}
      {query.trim() && !loading && results && !hasAnyResults && (
        <div className="px-3 px-lg-4 py-5 text-center">
          <p className="fw-semibold mb-1">No results for "{query}"</p>
          <p className="text-secondary small">Try a different search term or check the spelling.</p>
        </div>
      )}

      {/* Results */}
      {query.trim() && !loading && results && hasAnyResults && (
        <>
          {(tab === "all" || tab === "songs") && results.songs?.length > 0 && (
            <Section title="Songs">
              <div className="mh-scroll-row">{results.songs.map((s) => <SongCard key={s.id} song={s} queue={results.songs} />)}</div>
            </Section>
          )}
          {(tab === "all" || tab === "artists") && results.artists?.length > 0 && (
            <Section title="Artists">
              <div className="mh-scroll-row">{results.artists.map((a) => <ArtistCard key={a.id} artist={a} />)}</div>
            </Section>
          )}
          {(tab === "all" || tab === "albums") && results.albums?.length > 0 && (
            <Section title="Albums">
              <div className="mh-scroll-row">{results.albums.map((a) => <AlbumCard key={a.id} album={a} />)}</div>
            </Section>
          )}
          {(tab === "all" || tab === "playlists") && results.playlists?.length > 0 && (
            <Section title="Playlists">
              <div className="mh-scroll-row">{results.playlists.map((p) => <PlaylistCard key={p.id} playlist={p} />)}</div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
