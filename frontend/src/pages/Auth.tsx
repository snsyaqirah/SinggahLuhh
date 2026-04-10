import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Moon, ArrowLeft, LogIn, UserPlus, KeyRound, Eye, EyeOff, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, ApiError, setTokens } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Step = "login" | "signup" | "otp" | "forgot" | "forgot-sent";

const pwdRules = [
  { key: "len",     label: "Sekurang-kurangnya 8 aksara",  test: (p: string) => p.length >= 8 },
  { key: "upper",  label: "Huruf besar (A-Z)",             test: (p: string) => /[A-Z]/.test(p) },
  { key: "lower",  label: "Huruf kecil (a-z)",             test: (p: string) => /[a-z]/.test(p) },
  { key: "num",    label: "Nombor (0-9)",                  test: (p: string) => /[0-9]/.test(p) },
  { key: "sym",    label: "Simbol (!@#$...)",              test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const passed = pwdRules.filter((r) => r.test(password)).length;
  const colors = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-lime-400", "bg-green-500"];
  const labels = ["Sangat lemah", "Lemah", "Sederhana", "Kuat", "Sangat kuat"];
  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= passed ? colors[passed - 1] : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${
          passed <= 1 ? "text-red-500" :
          passed === 2 ? "text-orange-400" :
          passed === 3 ? "text-yellow-500" :
          passed === 4 ? "text-lime-500" : "text-green-500"
        }`}>{labels[passed - 1] ?? ""}</span>
      </div>
      {/* Checklist */}
      <ul className="space-y-1">
        {pwdRules.map((r) => {
          const ok = r.test(password);
          return (
            <li key={r.key} className={`flex items-center gap-1.5 text-xs transition-colors ${
              ok ? "text-green-600" : "text-muted-foreground"
            }`}>
              {ok
                ? <Check className="h-3 w-3 shrink-0 text-green-600" />
                : <X className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const Auth = () => {
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<"Lelaki" | "Perempuan" | "">("")
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);;
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { authenticate } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Clean up interval on unmount
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setStep("forgot-sent");
    } catch {
      // Always show success to avoid email enumeration
      setStep("forgot-sent");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      authenticate(data.user as { id: string; email: string; user_metadata: Record<string, unknown> });
      toast({ title: "Selamat datang! 🎉", description: "Anda berjaya log masuk." });
      navigate("/");
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 403
        ? "Sila sahkan email anda dahulu."
        : "Email atau kata laluan salah.";
      toast({ title: "Gagal log masuk", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ title: "Nama diperlukan", description: "Sila masukkan nama penuh anda.", variant: "destructive" });
      return;
    }
    if (!gender) {
      toast({ title: "Jantina diperlukan", description: "Sila pilih jantina anda.", variant: "destructive" });
      return;
    }
    const allPassed = pwdRules.every((r) => r.test(password));
    if (!allPassed) {
      toast({ title: "Kata laluan tidak memenuhi syarat", description: "Sila semak semua keperluan kata laluan.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.signup({ email, password, fullName, gender: gender as "Lelaki" | "Perempuan" });
      if (data.accessToken && data.refreshToken && data.user) {
        // Email confirm is OFF — user is auto-confirmed, log in immediately
        setTokens(data.accessToken, data.refreshToken);
        authenticate(data.user as { id: string; email: string; user_metadata: Record<string, unknown> });
        toast({ title: "Akaun berjaya didaftarkan! 🎉", description: "Selamat datang ke JejakMasjid." });
        navigate("/");
      } else {
        toast({
          title: "Kod pengesahan dihantar!",
          description: `Semak inbox ${email} untuk kod anda.`,
        });
        startCooldown(60);
        setStep("otp");
      }
    } catch (err) {
      toast({
        title: "Pendaftaran gagal",
        description: err instanceof ApiError ? err.message : "Sila cuba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      toast({ title: "Kod tidak sah", description: "Masukkan kod pengesahan dari email anda.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.verifyOtp({ email, token: otpCode });
      authenticate(data.user as { id: string; email: string; user_metadata: Record<string, unknown> });
        toast({ title: "Akaun berjaya disahkan! 🎉", description: "Selamat datang ke JejakMasjid." });
      navigate("/");
    } catch (err) {
      toast({
        title: "Kod tidak sah atau tamat tempoh",
        description: "Sila semak kod sekali lagi atau minta kod baharu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await authApi.resendOtp(email);
      toast({ title: "Kod dihantar semula", description: `Semak inbox ${email}.` });
      startCooldown(60);
    } catch {
      toast({ title: "Gagal hantar semula", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </div>

          <div className="rounded-2xl border bg-card p-8 shadow-sm">
            {/* Logo */}
            <div className="mb-6 flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Moon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="font-serif text-2xl font-bold text-foreground">JejakMasjid</h1>
            </div>

            {/* ── OTP Step ── */}
            {step === "otp" && (
              <>
                <div className="mb-6 text-center">
                  <div className="mb-2 flex justify-center">
                    <KeyRound className="h-8 w-8 text-accent" />
                  </div>
                  <h2 className="text-lg font-semibold">Sahkan Email</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Kami hantar kod ke <strong>{email}</strong>
                  </p>
                </div>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <Label htmlFor="otp">Kod Pengesahan</Label>
                    <Input
                      id="otp"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="12345678"
                      maxLength={8}
                      className="mt-1.5 text-center text-2xl tracking-widest font-mono"
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || otpCode.length < 4}>
                    {loading ? "Mengesahkan..." : "Sahkan"}
                  </Button>
                </form>
                <div className="mt-4 text-center">
                  {resendCooldown > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Hantar semula dalam <span className="font-medium tabular-nums">{resendCooldown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      Hantar semula kod
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── Login Step ── */}
            {step === "login" && (
              <>
                <div className="mb-6 flex gap-2">
                  <Button variant="default" className="flex-1" size="sm">
                    <LogIn className="mr-1.5 h-4 w-4" /> Log Masuk
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm" onClick={() => setStep("signup")}>
                    <UserPlus className="mr-1.5 h-4 w-4" /> Daftar
                  </Button>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" className="mt-1.5" required />
                  </div>
                  <div>
                    <Label htmlFor="password">Kata Laluan</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="password"
                        type={showLoginPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={showLoginPassword ? "Sembunyikan kata laluan" : "Tunjuk kata laluan"}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Memuatkan..." : "Log Masuk"}
                  </Button>
                </form>
                <div className="mt-4 space-y-2 text-center">
                  <button type="button" onClick={() => setStep("forgot")} className="text-sm text-muted-foreground hover:text-foreground underline block w-full">
                    Lupa kata laluan?
                  </button>
                  <p className="text-sm text-muted-foreground">
                    Belum ada akaun?{" "}
                    <button type="button" onClick={() => setStep("signup")} className="text-primary underline">Daftar sekarang</button>
                  </p>
                </div>
              </>
            )}

            {/* ── Forgot Password Step ── */}
            {step === "forgot" && (
              <>
                <button type="button" onClick={() => setStep("login")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </button>
                <div className="mb-6 text-center">
                  <KeyRound className="mx-auto h-10 w-10 text-primary mb-3" />
                  <h2 className="font-serif text-xl font-semibold">Lupa Kata Laluan?</h2>
                  <p className="text-sm text-muted-foreground mt-1">Masukkan email anda dan kami akan hantar pautan untuk tetapkan semula kata laluan.</p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="forgotEmail">Email</Label>
                    <Input id="forgotEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" className="mt-1.5" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Menghantar..." : "Hantar Pautan Tetapan Semula"}
                  </Button>
                </form>
              </>
            )}

            {/* ── Forgot Sent Step ── */}
            {step === "forgot-sent" && (
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h2 className="font-serif text-xl font-semibold">Semak Email Anda</h2>
                <p className="text-sm text-muted-foreground">
                  Kami telah hantar pautan tetapan semula ke <strong>{email || "email anda"}</strong>.
                  Pautan sah selama 1 jam.
                </p>
                <p className="text-xs text-muted-foreground">Tak jumpa? Semak folder Spam/Junk.</p>
                <Button variant="outline" className="w-full mt-2" onClick={() => setStep("login")}>
                  Kembali ke Log Masuk
                </Button>
              </div>
            )}

<<<<<<< HEAD
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
=======
            {/* ── Signup Step ── */}
            {step === "signup" && (
              <>
                <div className="mb-6 flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm" onClick={() => setStep("login")}>
                    <LogIn className="mr-1.5 h-4 w-4" /> Log Masuk
                  </Button>
                  <Button variant="default" className="flex-1" size="sm">
                    <UserPlus className="mr-1.5 h-4 w-4" /> Daftar
                  </Button>
                </div>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Nama Penuh</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ahmad bin Abdullah" className="mt-1.5" required />
                  </div>
                  <div>
                    <Label>Jantina *</Label>
                    <RadioGroup value={gender} onValueChange={(v) => setGender(v as "Lelaki" | "Perempuan")} className="mt-2 flex gap-4">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="Lelaki" id="gender-l" />
                        <Label htmlFor="gender-l" className="font-normal cursor-pointer">Lelaki</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="Perempuan" id="gender-p" />
                        <Label htmlFor="gender-p" className="font-normal cursor-pointer">Perempuan</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground mt-1">Digunakan untuk tunjuk info kemudahan yang relevan</p>
                  </div>
                  <div>
                    <Label htmlFor="emailSignup">Email</Label>
                    <Input id="emailSignup" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" className="mt-1.5" required />
                  </div>
                  <div>
                    <Label htmlFor="passwordSignup">Kata Laluan</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="passwordSignup"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 aksara"
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? "Sembunyikan kata laluan" : "Tunjuk kata laluan"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Mendaftar..." : "Daftar & Hantar Kod"}
                  </Button>
                </form>
              </>
            )}
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
