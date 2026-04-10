import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn, LogOut, User, PlusCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileApi.get(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  const isAdmin = profile?.is_admin ?? false;

  // Main nav links — same for everyone
  const publicLinks = [
    { to: "/", label: "Utama" },
    { to: "/browse", label: "Cari Masjid" },
  ];

  const authLinks = [
    { to: "/tracking", label: "Jejak Saya" },
  ];

  const allLinks = user ? [...publicLinks, ...authLinks] : publicLinks;

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/pwa-icon.svg" alt="JejakMasjid" className="h-9 w-9 rounded-lg" />
          <span className="font-serif text-xl font-bold text-foreground">
            JejakMasjid
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {allLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-3 flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-secondary transition-colors focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {user.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
                    {user.fullName}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Profil Saya
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/add" className="flex items-center gap-2 cursor-pointer">
                    <PlusCircle className="h-4 w-4" />
                    Tambah Masjid
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer text-primary">
                        <ShieldCheck className="h-4 w-4" />
                        Panel Admin
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Log Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm" className="ml-3 rounded-lg">
              <Link to="/auth">
                <LogIn className="mr-1.5 h-4 w-4" />
                Log Masuk
              </Link>
            </Button>
          )}
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="border-t bg-card px-4 py-3 md:hidden animate-fade-in">
          {allLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <>
              <Link
                to="/add"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                Tambah Masjid
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                <User className="h-4 w-4" />
                Profil Saya
              </Link>
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-destructive hover:bg-secondary transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log Keluar
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              className="mt-2 block rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground text-center"
            >
              Log Masuk / Daftar
            </Link>
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;
