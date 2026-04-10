import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Moon, ArrowLeft, LogIn, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "login") {
      const ok = await login(email, password);
      if (ok) {
        toast({ title: "Selamat datang! 🌙", description: "Anda berjaya log masuk." });
        navigate("/");
      } else {
        toast({ title: "Gagal log masuk", description: "Email atau kata laluan salah.", variant: "destructive" });
      }
    } else {
      if (!displayName.trim()) {
        toast({ title: "Nama diperlukan", description: "Sila masukkan nama paparan anda.", variant: "destructive" });
        setLoading(false);
        return;
      }
      const ok = await signup(email, password, displayName);
      if (ok) {
        toast({ title: "Akaun berjaya dicipta! 🎉", description: "Selamat datang ke JejakMasjid." });
        navigate("/");
      } else {
        toast({ title: "Email sudah didaftarkan", description: "Sila guna email lain atau log masuk.", variant: "destructive" });
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-md">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Moon className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            {mode === "login" ? "Log Masuk" : "Daftar Akaun"}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {mode === "login"
              ? "Masuk untuk mula menjejaki kunjungan masjid anda"
              : "Cipta akaun untuk mula berkongsi dan menjejaki"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="font-medium">Nama Paparan *</Label>
                <Input
                  id="displayName"
                  placeholder="cth: Syaqi"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="rounded-xl bg-background"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl bg-background"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium">Kata Laluan *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 aksara"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl bg-background"
                minLength={8}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6 text-base"
          >
            {mode === "login" ? (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Log Masuk
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-5 w-5" />
                Daftar Sekarang
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Belum ada akaun?{" "}
                <button type="button" onClick={() => setMode("signup")} className="text-primary font-semibold hover:underline">
                  Daftar di sini
                </button>
              </>
            ) : (
              <>
                Sudah ada akaun?{" "}
                <button type="button" onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">
                  Log masuk
                </button>
              </>
            )}
          </p>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;
