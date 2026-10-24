"use client";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  X,
  LogOut,
  LogIn,
  FileText,
  ChevronDown,
  MapPin,
  Users,
  Wrench,
  LayoutDashboard,
} from "lucide-react";
import NotificationCenter from "./NotificationCenter";

const pillLink =
  "lk-focus inline-flex items-center gap-2 h-9 px-4 rounded-full text-[15px] font-medium text-craie-2 hover:text-craie hover:bg-white/10 transition-colors";
const pillLinkActive =
  "lk-focus inline-flex items-center gap-2 h-9 px-4 rounded-full text-[15px] font-medium text-orange-vif bg-white/10 transition-colors";
const mobileLink =
  "lk-focus flex items-center gap-3 w-full h-12 px-4 rounded-xl text-base font-medium text-craie-2 hover:text-craie hover:bg-white/[0.06] transition-colors";

const navLinks = [
  { label: "Comment ça marche", anchor: "how-it-works" },
  { label: "Fonctionnalités", anchor: "features" },
  { label: "Tarifs", anchor: "pricing" },
  { label: "FAQ", anchor: "faq" },
];

export default function Header({ user, onLogout, onShowAuth }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);

  const isLoggedIn = !!(user || session?.user);
  const displayName =
    user?.prenom ||
    session?.user?.prenom ||
    session?.user?.name?.split(" ")[0] ||
    "";
  const displayLastName =
    user?.nom ||
    session?.user?.nom ||
    session?.user?.name?.split(" ").pop() ||
    "";
  const displayEmail = user?.email || session?.user?.email || "";
  const initials =
    `${displayName.charAt(0)}${displayLastName.charAt(0)}`.toUpperCase() || "U";

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Section de la landing au milieu de l'écran : lien actif du menu
  const [activeAnchor, setActiveAnchor] = useState(null);
  useEffect(() => {
    if (isLoggedIn) return;
    const sections = navLinks
      .map((l) => document.getElementById(l.anchor))
      .filter(Boolean);
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveAnchor(e.target.id);
          else setActiveAnchor((cur) => (cur === e.target.id ? null : cur));
        });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [isLoggedIn]);

  const scrollTo = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const dashboardHref =
    session?.user?.role === "admin" ? "/dashboard-projet" : "/dashboard";
  const dashboardLabel =
    session?.user?.role === "admin" ? "Mon projet" : "Mes rapports";

  const appLinks = [
    { label: dashboardLabel, href: dashboardHref, icon: LayoutDashboard },
    { label: "Chantiers", href: "/chantiers", icon: MapPin },
    { label: "Équipes", href: "/equipes", icon: Users },
    { label: "Matériel", href: "/materiel", icon: Wrench },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
        scrolled || open
          ? "bg-nuit/[0.96] backdrop-blur-xl border-b border-white/[0.08]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="relative flex items-center justify-between h-[76px] gap-4">
          {/* Logo */}
          <a
            href={
              isLoggedIn
                ? session?.user?.roleEntreprise === 1 ||
                  session?.user?.role === "admin"
                  ? "/dashboard-projet"
                  : "/dashboard"
                : "/"
            }
            className="lk-focus shrink-0 rounded-xl bg-white p-1 hover:opacity-90 transition-opacity"
          >
            {/* Le PNG a un fond blanc : on l'assume dans une pastille claire */}
            <img
              src="/logo_projectra.png"
              alt="PROJECTRA"
              className="h-10 w-auto rounded-lg"
            />
          </a>

          {/* Navigation desktop : pilule centrale */}
          <nav
            aria-label="Navigation principale"
            className="hidden md:flex lg:absolute lg:left-1/2 lg:-translate-x-1/2 items-center gap-0.5 p-1 rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-md"
          >
            {isLoggedIn
              ? appLinks.map(({ label, href, icon: Icon }) => (
                  <a key={href} href={href} className={pillLink}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </a>
                ))
              : navLinks.map((link) => (
                  <button
                    key={link.anchor}
                    type="button"
                    onClick={() => scrollTo(link.anchor)}
                    aria-current={activeAnchor === link.anchor ? "location" : undefined}
                    className={activeAnchor === link.anchor ? pillLinkActive : pillLink}
                  >
                    {link.label}
                  </button>
                ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isLoggedIn && <NotificationCenter />}

            {isLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-expanded={showUserMenu}
                  className="lk-focus flex items-center gap-2 h-11 pl-1.5 pr-3 rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/10 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-vif text-nuit text-sm font-semibold">
                    {initials}
                  </span>
                  <span className="hidden md:block text-[15px] font-medium text-craie">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`hidden md:block w-4 h-4 text-craie-2 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/10 bg-nuit-2 z-50 overflow-hidden">
                    <div className="px-4 py-4 border-b border-white/[0.08] flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-vif text-nuit text-sm font-semibold shrink-0">
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-craie truncate">
                          {displayName} {displayLastName}
                        </p>
                        <p className="text-sm text-craie-2 truncate">{displayEmail}</p>
                      </div>
                    </div>

                    <div className="p-1.5">
                      <a href={dashboardHref} className={mobileLink}>
                        <LayoutDashboard className="w-4 h-4" />
                        {dashboardLabel}
                      </a>
                      {session?.user?.role === "admin" && (
                        <a href="/dashboard" className={mobileLink}>
                          <FileText className="w-4 h-4" />
                          Mes rapports
                        </a>
                      )}
                    </div>

                    <div className="border-t border-white/[0.08] p-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          if (session?.user) {
                            signOut({ callbackUrl: "/" });
                          } else {
                            onLogout();
                          }
                        }}
                        className="lk-focus flex items-center gap-3 w-full h-12 px-4 rounded-xl text-base font-medium text-[#FF8A80] hover:bg-[#FF8A80]/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onShowAuth}
                className="lk-focus hidden sm:inline-flex items-center gap-2 h-11 px-6 rounded-full bg-orange-vif text-nuit text-[15px] font-semibold hover:bg-[#FF8A47] transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Se connecter
              </button>
            )}

            {/* Bouton mobile */}
            <button
              type="button"
              className="lk-focus md:hidden inline-flex items-center justify-center h-11 w-11 rounded-full border border-white/10 bg-white/[0.06] text-craie"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden border-t border-white/[0.08]">
          <nav aria-label="Navigation mobile" className="px-5 py-4 space-y-1">
            {isLoggedIn ? (
              appLinks.map(({ label, href, icon: Icon }) => (
                <a key={href} href={href} className={mobileLink}>
                  <Icon className="w-5 h-5" />
                  {label}
                </a>
              ))
            ) : (
              <>
                {navLinks.map((link) => (
                  <button
                    key={link.anchor}
                    type="button"
                    onClick={() => scrollTo(link.anchor)}
                    className={mobileLink}
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onShowAuth();
                  }}
                  className="lk-focus flex items-center justify-center gap-2 w-full h-12 mt-3 rounded-full bg-orange-vif text-nuit text-base font-semibold"
                >
                  <LogIn className="w-4 h-4" />
                  Se connecter
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
