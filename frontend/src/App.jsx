import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import { PlayerProvider } from "./context/PlayerContext";

import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Search from "./pages/Search";
import ArtistDetails from "./pages/ArtistDetails";
import AlbumDetails from "./pages/AlbumDetails";
import PlaylistDetails from "./pages/PlaylistDetails";
import Playlists from "./pages/Playlists";
import LikedSongs from "./pages/LikedSongs";
import Library from "./pages/Library";
import RecentlyPlayed from "./pages/RecentlyPlayed";
import NowPlaying from "./pages/NowPlaying";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Routes>
          {/* Standalone auth pages (no sidebar/player chrome) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/now-playing" element={<NowPlaying />} />

          {/* Main app shell */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/search" element={<Search />} />
            <Route path="/artist/:id" element={<ArtistDetails />} />
            <Route path="/album/:id" element={<AlbumDetails />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/playlist/:id" element={<PlaylistDetails />} />
            <Route path="/liked" element={<LikedSongs />} />
            <Route path="/library" element={<Library />} />
            <Route path="/recently-played" element={<RecentlyPlayed />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <ToastContainer theme="dark" position="bottom-right" />
      </PlayerProvider>
    </AuthProvider>
  );
}
