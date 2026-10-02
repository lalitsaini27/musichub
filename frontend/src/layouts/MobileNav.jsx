import { NavLink } from "react-router-dom";
import { Home, Search, Library, Heart, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
  { to: "/liked", label: "Liked", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
];

export default function MobileNav() {
  return (
    <nav
      className="d-flex d-lg-none justify-content-around align-items-center position-fixed bottom-0 start-0 end-0"
      style={{
        height: "var(--mh-mobile-nav-height)",
        background: "var(--mh-surface)",
        borderTop: "1px solid var(--mh-border)",
        zIndex: 40,
      }}
    >
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `d-flex flex-column align-items-center gap-1 text-decoration-none ${
              isActive ? "text-white" : "text-secondary"
            }`
          }
        >
          <Icon size={20} />
          <span style={{ fontSize: 11 }}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
