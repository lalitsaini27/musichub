import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import { recordSongPlay, recordRecentlyPlayed, likeSong, unlikeSong, getLikedSongs } from "../services/music";
import { useAuth } from "./AuthContext";

const PlayerContext = createContext(null);

// 5-band EQ — center frequencies match a standard consumer graphic EQ
// (sub bass / bass punch / mid vocals / presence / treble air).
export const EQ_BANDS = [
  { freq: 60, label: "Sub Bass", type: "lowshelf" },
  { freq: 230, label: "Bass Punch", type: "peaking" },
  { freq: 910, label: "Mid Vocals", type: "peaking" },
  { freq: 4000, label: "Presence", type: "peaking" },
  { freq: 14000, label: "Treble Air", type: "highshelf" },
];

export const EQ_PRESETS = {
  "Flat (Default)": [0, 0, 0, 0, 0],
  "Bass Boost": [8, 5, 1, 0, -1],
  "Vocal Clarity": [-2, 0, 4, 5, 1],
  "Club EDM": [6, 3, -2, 2, 4],
  "Acoustic Warmth": [3, 4, 2, -1, -2],
  "Treble Sparkle": [-1, -1, 1, 4, 7],
};

/**
 * Global playback state so the player keeps running while the user
 * navigates between pages (audio element lives above the router).
 */
export function PlayerProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const audioRef = useRef(new Audio());
  const shuffleHistoryRef = useRef([]); // stack of indices visited while shuffling, for "previous"

  // Web Audio API graph — built lazily on first user-initiated playback
  // (browsers require a user gesture before an AudioContext can run).
  // source -> filters[0..4] (EQ) -> analyser (visualizer taps here) -> destination
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const filtersRef = useRef([]);
  const analyserRef = useRef(null);

  const sleepTimeoutRef = useRef(null);
  const sleepIntervalRef = useRef(null);

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("off"); // off | all | one
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [eqGains, setEqGains] = useState(EQ_PRESETS["Flat (Default)"]);
  const [eqPresetName, setEqPresetName] = useState("Flat (Default)");
  const [sleepRemaining, setSleepRemaining] = useState(0); // seconds; 0 = no timer active

  const currentSong = currentIndex >= 0 ? queue[currentIndex] : null;

  // Build the Web Audio graph exactly once, the first time it's needed.
  const ensureAudioGraph = useCallback(() => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state === "suspended") audioContextRef.current.resume();
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const audio = audioRef.current;
      audio.crossOrigin = "anonymous";

      const source = ctx.createMediaElementSource(audio);
      const filters = EQ_BANDS.map((band, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = band.type;
        filter.frequency.value = band.freq;
        if (band.type === "peaking") filter.Q.value = 1;
        filter.gain.value = eqGains[i];
        return filter;
      });
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      // Chain them together: source -> filter0 -> filter1 -> ... -> analyser -> speakers
      let node = source;
      filters.forEach((f) => { node.connect(f); node = f; });
      node.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      sourceNodeRef.current = source;
      filtersRef.current = filters;
      analyserRef.current = analyser;
    } catch {
      // Web Audio API unavailable or blocked — playback still works via the
      // plain <audio> element, just without EQ/visualizer.
    }
  }, [eqGains]);

  const setEqGain = useCallback((index, value) => {
    setEqGains((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setEqPresetName("Custom");
    if (filtersRef.current[index]) filtersRef.current[index].gain.value = value;
  }, []);

  const applyEqPreset = useCallback((name) => {
    const gains = EQ_PRESETS[name];
    if (!gains) return;
    setEqGains(gains);
    setEqPresetName(name);
    filtersRef.current.forEach((filter, i) => { if (filter) filter.gain.value = gains[i]; });
  }, []);

  const startSleepTimer = useCallback((minutes) => {
    clearTimeout(sleepTimeoutRef.current);
    clearInterval(sleepIntervalRef.current);
    const endsAt = Date.now() + minutes * 60_000;
    setSleepRemaining(minutes * 60);
    sleepIntervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setSleepRemaining(remaining);
      if (remaining <= 0) clearInterval(sleepIntervalRef.current);
    }, 1000);
    sleepTimeoutRef.current = setTimeout(() => {
      setIsPlaying(false);
      setSleepRemaining(0);
    }, minutes * 60_000);
  }, []);

  const cancelSleepTimer = useCallback(() => {
    clearTimeout(sleepTimeoutRef.current);
    clearInterval(sleepIntervalRef.current);
    setSleepRemaining(0);
  }, []);

  useEffect(() => () => {
    clearTimeout(sleepTimeoutRef.current);
    clearInterval(sleepIntervalRef.current);
  }, []);

  // Load the user's actual liked-song ids on login, so heart icons are
  // correct everywhere from the start — not just for songs toggled this
  // session. Cleared again on logout.
  useEffect(() => {
    if (!isAuthenticated) {
      setLikedIds(new Set());
      return;
    }
    getLikedSongs()
      .then((r) => setLikedIds(new Set((r.data.results || r.data).map((entry) => entry.song.id))))
      .catch(() => {});
  }, [isAuthenticated]);

  const playQueue = useCallback((songs, startIndex = 0) => {
    ensureAudioGraph();
    shuffleHistoryRef.current = [];
    setQueue(songs);
    setCurrentIndex(startIndex);
    setIsPlaying(true);
  }, [ensureAudioGraph]);

  const jumpTo = useCallback((index) => {
    ensureAudioGraph();
    setCurrentIndex((prevIndex) => {
      if (prevIndex >= 0) shuffleHistoryRef.current.push(prevIndex);
      return index;
    });
    setIsPlaying(true);
  }, [ensureAudioGraph]);

  const togglePlay = useCallback(() => {
    if (!currentSong) return;
    ensureAudioGraph();
    setIsPlaying((prev) => !prev);
  }, [currentSong, ensureAudioGraph]);

  const next = useCallback(() => {
    if (!queue.length) return;
    if (shuffle && queue.length > 1) {
      setCurrentIndex((prevIndex) => {
        shuffleHistoryRef.current.push(prevIndex);
        let randomIndex = prevIndex;
        while (randomIndex === prevIndex) randomIndex = Math.floor(Math.random() * queue.length);
        return randomIndex;
      });
    } else {
      setCurrentIndex((prev) => (prev + 1) % queue.length);
    }
  }, [queue.length, shuffle]);

  const previous = useCallback(() => {
    if (!queue.length) return;
    if (shuffle && shuffleHistoryRef.current.length) {
      const prevIndex = shuffleHistoryRef.current.pop();
      setCurrentIndex(prevIndex);
    } else {
      setCurrentIndex((prev) => (prev - 1 + queue.length) % queue.length);
    }
  }, [queue.length, shuffle]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!currentSong) return;
    audio.src = currentSong.audioUrl;
    audio.play().catch(() => {});

    // Fire-and-forget play tracking — never blocks playback on network/API issues.
    if (currentSong.id) {
      recordSongPlay(currentSong.id).catch(() => {});
      if (isAuthenticated) recordRecentlyPlayed(currentSong.id).catch(() => {});
    }
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (repeat === "one") {
        audio.currentTime = 0;
        audio.play();
      } else if (repeat === "all" || shuffle || currentIndex < queue.length - 1) {
        next();
      } else {
        setIsPlaying(false);
      }
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [repeat, shuffle, currentIndex, queue.length, next]);

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const toggleLike = useCallback(async (songId) => {
    if (!isAuthenticated || !songId) return;
    const isLiked = likedIds.has(songId);
    setLikedIds((prev) => {
      const nextSet = new Set(prev);
      isLiked ? nextSet.delete(songId) : nextSet.add(songId);
      return nextSet;
    });
    try {
      if (isLiked) await unlikeSong(songId);
      else await likeSong(songId);
    } catch {
      // revert optimistic update on failure
      setLikedIds((prev) => {
        const nextSet = new Set(prev);
        isLiked ? nextSet.add(songId) : nextSet.delete(songId);
        return nextSet;
      });
    }
  }, [isAuthenticated, likedIds]);

  return (
    <PlayerContext.Provider
      value={{
        queue, currentSong, currentIndex, isPlaying, currentTime, duration,
        volume, shuffle, repeat, likedIds, toggleLike,
        playQueue, jumpTo, togglePlay, next, previous, seek,
        setVolume, setShuffle, setRepeat,
        // Equalizer
        eqGains, eqPresetName, setEqGain, applyEqPreset,
        // Sleep timer
        sleepRemaining, startSleepTimer, cancelSleepTimer,
        // Visualizer taps this directly in an animation loop (not reactive state)
        analyserRef,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
