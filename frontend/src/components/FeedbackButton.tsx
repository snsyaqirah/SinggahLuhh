import { useState } from "react";
import { MessageSquarePlus, Star, X, Loader2, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { feedbackApi, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function FeedbackButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      feedbackApi.submit({
        message,
        rating: rating || undefined,
        pageUrl: window.location.pathname,
        name: name.trim() || undefined,
      }),
    onSuccess: () => {
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setRating(0);
        setMessage("");
        setName("");
      }, 2500);
    },
    onError: (e) => {
      toast({
        title: "Gagal hantar",
        description: e instanceof ApiError ? e.message : "Cuba lagi.",
        variant: "destructive",
      });
    },
  });

  const stars = hovered || rating;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95"
        aria-label="Bagi Maklum Balas"
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span className="hidden sm:inline">Maklum Balas</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl border bg-background shadow-2xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
            <div>
              <p className="font-semibold text-sm">Bagi Maklum Balas 💬</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tolong beritahu apa yang anda rasa</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-8 px-5">
              <CheckCircle className="h-10 w-10 text-primary" />
              <p className="font-semibold">Terima kasih! 🙏</p>
              <p className="text-xs text-muted-foreground text-center">Maklum balas anda sangat bermakna untuk kami.</p>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {/* Star rating */}
              <div>
                <Label className="text-xs mb-2 block">Penilaian keseluruhan</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHovered(s)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(s)}
                      className="transition-transform active:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          s <= stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground self-center">
                      {["", "Sangat Buruk", "Kurang Baik", "OK", "Bagus", "Sangat Bagus"][rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <Label className="text-xs mb-1.5 block">Maklum balas anda <span className="text-destructive">*</span></Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Apa yang anda suka? Apa yang perlu diperbaiki? Bug yang dijumpai?"
                  className="rounded-xl resize-none text-sm min-h-[90px]"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/1000</p>
              </div>

              {/* Name (only for guests) */}
              {!user && (
                <div>
                  <Label className="text-xs mb-1.5 block">Nama <span className="text-muted-foreground">(pilihan)</span></Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama anda"
                    className="rounded-xl text-sm"
                    maxLength={100}
                  />
                </div>
              )}

              <Button
                className="w-full rounded-xl"
                onClick={() => mutation.mutate()}
                disabled={message.trim().length < 5 || mutation.isPending}
              >
                {mutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menghantar...</>
                ) : (
                  "Hantar Maklum Balas"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
