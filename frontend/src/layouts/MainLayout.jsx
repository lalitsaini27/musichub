import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import Header from "./Header";
import MusicPlayer from "../components/MusicPlayer";

export default function MainLayout() {
  const location = useLocation();
  return (
    <div>
      <Sidebar />
      <div
        className="d-flex flex-column"
        style={{ marginLeft: "0" }}
      >
        <div className="mh-main-content">
          <Header />
          <main
            key={location.pathname}
            className="mh-page-transition"
            style={{ paddingBottom: "calc(var(--mh-player-height) + var(--mh-mobile-nav-height) + 16px)" }}
          >
            <Outlet />
          </main>
        </div>
      </div>
      <MusicPlayer />
      <MobileNav />
    </div>
  );
}
