import { useEffect, useState } from "react";
import { Play, Shuffle } from "lucide-react";
import { toast } from "react-toastify";

import Section from "../components/Section";
import SongCard from "../components/SongCard";
import ArtistCard from "../components/ArtistCard";
import AlbumCard from "../components/AlbumCard";
import PlaylistCard from "../components/PlaylistCard";
import SkeletonRow from "../components/SkeletonLoader";

import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import {
  getFeaturedSongs, getTrendingSongs, getFeaturedArtists,
  getNewReleases, getRecentlyPlayed, getPlaylists,
} from "../services/music";

const FALLBACK =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%231c2028'/%3E%3C/svg%3E";

function toPlayable(song) {
  return {
    id: song.id, title: song.title, artist: song.artist_name,
    coverUrl: song.cover_image || FALLBACK, audioUrl: song.audio_url, lyrics: song.lyrics,
  };
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { playQueue } = usePlayer();

  const [featured, setFeatured] = useState(null);
  const [trending, setTrending] = useState(null);
  const [artists, setArtists] = useState(null);
  const [newReleases, setNewReleases] = useState(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState(null);
  const [playlists, setPlaylists] = useState(null);

  useEffect(() => {
    getFeaturedSongs().then((r) => setFeatured(r.data)).catch(() => setFeatured([]));
    getTrendingSongs().then((r) => setTrending(r.data)).catch(() => setTrending([]));
    getFeaturedArtists().then((r) => setArtists(r.data)).catch(() => setArtists([]));
    getNewReleases().then((r) => setNewReleases(r.data)).catch(() => setNewReleases([]));
    getPlaylists().then((r) => setPlaylists(r.data.results || r.data)).catch(() => setPlaylists([]));
    if (isAuthenticated) {
      getRecentlyPlayed()
        .then((r) => setRecentlyPlayed((r.data.results || r.data).map((x) => x.song)))
        .catch(() => setRecentlyPlayed([]));
    } else {
      setRecentlyPlayed([]);
    }
  }, [isAuthenticated]);

  const heroSong = featured && featured.length ? featured[0] : null;

  const handlePlayHero = () => {
    if (!heroSong) return;
    playQueue([heroSong, ...(featured || []).slice(1)].map(toPlayable), 0);
  };

  const handleShuffleAll = () => {
    const pool = [...(trending || []), ...(featured || [])];
    if (!pool.length) {
      toast.info("Nothing to shuffle yet — check back once more music is added.");
      return;
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    playQueue(shuffled.map(toPlayable), 0);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="pt-2">
      {/* Hero */}
      <div className="px-3 px-lg-4 mb-4">
        <div
          className="position-relative p-4 p-lg-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4"
          style={{
            borderRadius: "var(--mh-radius-lg)",
            background: "linear-gradient(135deg, rgba(124,58,237,0.35), rgba(34,211,238,0.15)), var(--mh-surface)",
            border: "1px solid var(--mh-border)",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <div className="text-secondary small mb-2">{greeting()}{user ? `, ${user.username}` : ""}</div>
            <h1 className="fw-bold mb-2" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>
              Music that moves with you
            </h1>
            <p className="text-secondary mb-4">
              {heroSong
                ? `Featured right now: "${heroSong.title}" by ${heroSong.artist_name}.`
                : "Discover trending tracks, new releases, and artists picked just for you."}
            </p>
            <div className="d-flex gap-2">
              <button
                className="mh-btn-primary d-flex align-items-center gap-2 px-4"
                style={{ width: "auto" }}
                onClick={handlePlayHero}
                disabled={!heroSong}
              >
                <Play size={16} fill="#0b0d10" /> Play Now
              </button>
              <button
                className="btn d-flex align-items-center gap-2 px-3"
                style={{ background: "var(--mh-surface-raised)", border: "none", color: "var(--mh-text-primary)", borderRadius: "var(--mh-radius-sm)" }}
                onClick={handleShuffleAll}
              >
                <Shuffle size={16} /> Shuffle All
              </button>
            </div>
          </div>

          {heroSong && (
            <img
              src={heroSong.cover_image || FALLBACK}
              alt={heroSong.title}
              style={{
                width: 200, height: 200, objectFit: "cover",
                borderRadius: "var(--mh-radius-lg)", flexShrink: 0,
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              }}
            />
          )}
        </div>
      </div>

      {isAuthenticated && recentlyPlayed && recentlyPlayed.length > 0 && (
        <Section title="Recently Played">
          <div className="mh-scroll-row">
            {recentlyPlayed.map((s) => <SongCard key={s.id} song={s} queue={recentlyPlayed} />)}
          </div>
        </Section>
      )}

      <Section title="Trending Songs">
        {trending === null ? <SkeletonRow /> : trending.length === 0 ? (
          <p className="text-secondary small">No trending songs yet.</p>
        ) : (
          <div className="mh-scroll-row">
            {trending.map((s) => <SongCard key={s.id} song={s} queue={trending} />)}
          </div>
        )}
      </Section>

      <Section title="Popular Artists">
        {artists === null ? <SkeletonRow round /> : artists.length === 0 ? (
          <p className="text-secondary small">No featured artists yet.</p>
        ) : (
          <div className="mh-scroll-row">
            {artists.map((a) => <ArtistCard key={a.id} artist={a} />)}
          </div>
        )}
      </Section>

      <Section title="New Releases">
        {newReleases === null ? <SkeletonRow /> : newReleases.length === 0 ? (
          <p className="text-secondary small">No new releases yet.</p>
        ) : (
          <div className="mh-scroll-row">
            {newReleases.map((a) => <AlbumCard key={a.id} album={a} />)}
          </div>
        )}
      </Section>

      <Section title="Recommended For You">
        {featured === null ? <SkeletonRow /> : featured.length === 0 ? (
          <p className="text-secondary small">Nothing recommended yet — like a few songs to get started.</p>
        ) : (
          <div className="mh-scroll-row">
            {featured.map((s) => <SongCard key={s.id} song={s} queue={featured} />)}
          </div>
        )}
      </Section>

      <Section title="Popular Playlists">
        {playlists === null ? <SkeletonRow /> : playlists.length === 0 ? (
          <p className="text-secondary small">No public playlists yet.</p>
        ) : (
          <div className="mh-scroll-row">
            {playlists.slice(0, 10).map((p) => <PlaylistCard key={p.id} playlist={p} />)}
          </div>
        )}
      </Section>
    </div>
  );
}
