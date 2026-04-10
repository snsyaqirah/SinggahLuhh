import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { KeyRound, Eye, EyeOff, Check, X, Moon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authApi, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const pwdRules = [
  { key: "len",   label: "Sekurang-kurangnya 8 aksara", test: (p: string) => p.length >= 8 },
  { key: "upper", label: "Huruf besar (A-Z)",            test: (p: string) => /[A-Z]/.test(p) },
  { key: "lower", label: "Huruf kecil (a-z)",            test: (p: string) => /[a-z]/.test(p) },
  { key: "num",   label: "Nombor (0-9)",                 test: (p: string) => /[0-9]/.test(p) },
  { key: "sym",   label: "Simbol (!@#$...)",             test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Supabase places the recovery token in the URL hash fragment
  useEffect(() => {
    const hash = window.location.hash.substring(1); // strip leading #
    const params = new URLSearchParams(hash);
    const type = params.get("type");
    const token = params.get("access_token");
    if (type === "recovery" && token) {
      setAccessToken(token);
    } else {
      setTokenError(true);
    }
  }, []);

  const allPassed = pwdRules.every((r) => r.test(password));
  const passed = pwdRules.filter((r) => r.test(password)).length;
  const colors = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-lime-400", "bg-green-500"];
  const labels = ["Sangat lemah", "Lemah", "Sederhana", "Kuat", "Sangat kuat"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allPassed) {
      toast({ title: "Kata laluan tidak memenuhi syarat", variant: "destructive" });
      return;
    }
    if (!accessToken) return;
    setLoading(true);
    try {
      await authApi.updatePassword(password, accessToken);
      setDone(true);
      setTimeout(() => navigate("/auth"), 3000);
    } catch (err) {
      toast({
        title: "Gagal kemaskini kata laluan",
        description: err instanceof ApiError ? err.message : "Pautan mungkin sudah luput. Cuba minta semula.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-md">
              <Moon className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-2xl font-bold">JejakMasjid</h1>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            {tokenError ? (
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                  <X className="h-7 w-7 text-destructive" />
                </div>
                <h2 className="font-serif text-xl font-semibold">Pautan Tidak Sah</h2>
                <p className="text-sm text-muted-foreground">
                  Pautan ini sudah luput atau tidak sah. Sila minta semula dari halaman log masuk.
                </p>
                <Button asChild className="w-full">
                  <Link to="/auth">Kembali ke Log Masuk</Link>
                </Button>
              </div>
            ) : done ? (
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Check className="h-7 w-7 text-green-600" />
                </div>
                <h2 className="font-serif text-xl font-semibold">Kata Laluan Berjaya Dikemaskini!</h2>
                <p className="text-sm text-muted-foreground">Anda akan diarahkan ke halaman log masuk dalam sebentar...</p>
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <KeyRound className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="font-serif text-xl font-semibold">Tetapkan Semula Kata Laluan</h2>
                  <p className="text-sm text-muted-foreground mt-1">Masukkan kata laluan baru anda di bawah.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="new-password">Kata Laluan Baru</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 aksara"
                        className="pr-10"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                        aria-label={showPassword ? "Sembunyikan" : "Tunjuk"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {password && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-1 gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= passed ? colors[passed - 1] : "bg-muted"}`} />
                            ))}
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">{labels[passed - 1] ?? ""}</span>
                        </div>
                        <ul className="space-y-1">
                          {pwdRules.map((r) => {
                            const ok = r.test(password);
                            return (
                              <li key={r.key} className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-600" : "text-muted-foreground"}`}>
                                {ok ? <Check className="h-3 w-3 shrink-0 text-green-600" /> : <X className="h-3 w-3 shrink-0 opacity-50" />}
                                {r.label}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || !allPassed}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan Kata Laluan Baru"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
