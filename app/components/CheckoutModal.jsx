"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

const DEVICES = ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"];

/**
 * Modal de checkout rapide pour un achat direct (packs V-Bucks + items boutique).
 * Collecte les infos client + code parrainage, crée la commande, puis redirige vers Monniz.
 */
export default function CheckoutModal({ product, onClose }) {
  const { user } = useAuth();
  const [step, setStep] = useState("form"); // "form" | "loading" | "error"
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    epicUsername: "",
    device: "",
  });

  // Code de parrainage
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState("idle"); // "idle" | "checking" | "valid" | "invalid"
  const [promoData, setPromoData] = useState(null); // { code, discount }

  if (!product) return null;

  // Calcul du prix avec réduction
  const basePrice = product.price || 0;
  const discount = promoData?.discount || 0;
  const discountedPrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;

  const handleCheckPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setPromoStatus("checking");
    try {
      const res = await fetch(`/api/promo/validate?code=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (data.valid) {
        setPromoStatus("valid");
        setPromoData({ code: data.code, discount: data.discount });
      } else {
        setPromoStatus("invalid");
        setPromoData(null);
      }
    } catch {
      setPromoStatus("invalid");
      setPromoData(null);
    }
  };

  const handleClearPromo = () => {
    setPromoCode("");
    setPromoStatus("idle");
    setPromoData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName, epicUsername, device } = form;
    if (!firstName || !lastName || !epicUsername || !device) {
      setFormError("Veuillez remplir tous les champs.");
      return;
    }

    setStep("loading");
    setFormError("");

    try {
      // Créer la commande dans Supabase
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: discountedPrice,
          items: [{
            id: product.id,
            name: product.name,
            price: product.price,
            vbucks: product.vbucks,
            image: product.image,
            type: product.type || "vbucks_pack",
            quantity: 1,
          }],
          customer: {
            id: user?.id || null,
            firstName,
            lastName,
            epicUsername,
            device,
            email: user?.email || "",
            promoCode: promoData?.code || null,
            promoDiscount: promoData?.discount || 0,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création de la commande.");
      }

      // Rediriger vers le lien de paiement Monniz
      if (data.payment_link) {
        window.location.href = data.payment_link;
      } else if (product.href) {
        window.location.href = product.href;
      } else {
        throw new Error("Aucun lien de paiement disponible pour cet article.");
      }
    } catch (err) {
      setStep("error");
      setFormError(err.message);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-lg bg-[#051024] border-4 border-[#1A3E7A] rounded-2xl p-6 sm:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.9)] relative overflow-y-auto max-h-[90vh]"
        >
          {/* Accent top border */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-fortnite-yellow/0 via-fortnite-yellow to-fortnite-yellow/0"></div>
          {/* Glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-fortnite-yellow/10 blur-[80px] rounded-full pointer-events-none"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors z-10"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {step === "form" && (
            <>
              <div className="mb-5 relative z-10">
                <h2 className="text-2xl sm:text-3xl font-display text-white text-3d tracking-widest">COMMANDER</h2>
                <div className="mt-3 bg-fortnite-yellow/10 border border-fortnite-yellow/30 rounded-xl p-3 flex items-center gap-4">
                  <img src={product.image} alt="" className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-lg" />
                  <div>
                    <p className="text-fortnite-yellow font-display tracking-wider text-xs sm:text-sm">{product.name}</p>
                    <div className="flex items-center gap-2">
                      {discount > 0 && (
                        <span className="text-gray-400 line-through text-xs">{basePrice.toLocaleString("fr-FR")} FCFA</span>
                      )}
                      <p className="text-white font-bold text-base sm:text-lg">{discountedPrice.toLocaleString("fr-FR")} FCFA</p>
                    </div>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="bg-rarity-marvel/20 border border-rarity-marvel/50 rounded-xl p-3 mb-4 text-red-300/95 font-medium text-sm relative z-10">
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/95 font-semibold text-xs mb-1 uppercase tracking-wide">PRÉNOM</label>
                    <input
                      type="text" required value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full bg-black/60 border-2 border-white/10 rounded-xl px-3 py-2.5 text-white/90 font-sans font-medium focus:border-fortnite-yellow focus:outline-none transition-colors text-sm"
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label className="block text-white/95 font-semibold text-xs mb-1 uppercase tracking-wide">NOM</label>
                    <input
                      type="text" required value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full bg-black/60 border-2 border-white/10 rounded-xl px-3 py-2.5 text-white/90 font-sans font-medium focus:border-fortnite-yellow focus:outline-none transition-colors text-sm"
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/95 font-semibold text-xs mb-1 uppercase tracking-wide">
                    🎮 PSEUDO EPIC GAMES
                  </label>
                  <input
                    type="text" required value={form.epicUsername}
                    onChange={(e) => setForm({ ...form, epicUsername: e.target.value })}
                    className="w-full bg-black/60 border-2 border-white/10 rounded-xl px-3 py-2.5 text-white/90 font-sans font-medium focus:border-fortnite-yellow focus:outline-none transition-colors text-sm"
                    placeholder="Ton pseudo Fortnite"
                  />
                  <p className="text-gray-500/85 text-[10px] mt-1 font-medium">
                    ⚠️ V&eacute;rifie bien &mdash; c&apos;est l&agrave; qu&apos;on envoie les V-Bucks !
                  </p>
                </div>

                <div>
                  <label className="block text-white/95 font-semibold text-xs mb-1 uppercase tracking-wide">
                    📱 TON APPAREIL
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {DEVICES.map((d) => (
                      <button
                        key={d} type="button"
                        onClick={() => setForm({ ...form, device: d })}
                        className={`py-2 px-1 rounded-xl font-sans font-medium text-[10px] sm:text-xs border-2 transition-all ${
                          form.device === d
                            ? "bg-fortnite-yellow text-fortnite-blue border-fortnite-yellow shadow-[0_3px_0_rgba(180,160,0,1)]"
                            : "bg-black/40 text-gray-300 border-white/10 hover:border-fortnite-yellow/50"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code de parrainage */}
                <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                  <label className="block text-white/95 font-semibold text-xs mb-1.5 uppercase tracking-wide">
                    🎁 CODE DE PARRAINAGE <span className="text-gray-500 normal-case">(optionnel)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        if (promoStatus !== "idle") {
                          setPromoStatus("idle");
                          setPromoData(null);
                        }
                      }}
                      className="flex-1 bg-black/60 border-2 border-white/10 rounded-lg px-3 py-2 text-white/90 font-mono font-bold text-sm tracking-widest focus:border-fortnite-yellow focus:outline-none transition-colors uppercase"
                      placeholder="EX: LAMA2026"
                      disabled={promoStatus === "valid"}
                    />
                    {promoStatus === "valid" ? (
                      <button
                        type="button"
                        onClick={handleClearPromo}
                        className="px-3 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-xs font-bold border border-red-500/30 transition-colors"
                      >
                        ✕
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCheckPromo}
                        disabled={!promoCode.trim() || promoStatus === "checking"}
                        className="px-4 py-2 bg-fortnite-yellow/20 hover:bg-fortnite-yellow/40 text-fortnite-yellow rounded-lg text-xs font-bold border border-fortnite-yellow/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {promoStatus === "checking" ? "..." : "APPLIQUER"}
                      </button>
                    )}
                  </div>

                  {/* Promo feedback */}
                  {promoStatus === "valid" && promoData && (
                    <div className="mt-2 flex items-center gap-2 text-green-400 text-xs font-bold">
                      <CheckCircleIcon className="w-4 h-4" />
                      Code &laquo;{promoData.code}&raquo; appliqu&eacute; &mdash; {promoData.discount}% de r&eacute;duction !
                    </div>
                  )}
                  {promoStatus === "invalid" && (
                    <p className="mt-2 text-red-400 text-xs font-bold">
                      ❌ Code invalide ou expir&eacute;
                    </p>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-black/60 rounded-xl p-4 border border-white/5 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#B0B8C8] uppercase tracking-widest">A PAYER</span>
                    <div className="text-right">
                      {discount > 0 && (
                        <span className="text-gray-500 line-through text-xs block">{basePrice.toLocaleString("fr-FR")} FCFA</span>
                      )}
                      <span className={`text-xl font-display ${discount > 0 ? 'text-green-400' : 'text-fortnite-yellow'} text-3d-yellow`}>
                        {discountedPrice.toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-fortnite bg-fortnite-yellow hover:bg-fortnite-yellow-hover text-fortnite-blue w-full py-3.5 text-lg sm:text-xl shadow-[0_6px_0_rgba(180,160,0,1)] hover:shadow-[0_4px_0_rgba(180,160,0,1)] transition-all mt-1"
                >
                  <span className="btn-fortnite-inner font-semibold text-lg sm:text-xl tracking-wide mt-1">
                    PROCÉDER AU PAIEMENT →
                  </span>
                </button>
              </form>
            </>
          )}

          {step === "loading" && (
            <div className="py-16 text-center relative z-10">
              <div className="w-16 h-16 border-8 border-[#0c1a3b] border-t-fortnite-yellow rounded-full animate-spin mx-auto mb-6 shadow-[0_0_20px_rgba(255,241,43,0.3)]"></div>
              <div className="text-2xl sm:text-3xl font-display text-fortnite-yellow animate-pulse tracking-widest mb-4">
                CRÉATION...
              </div>
              <p className="text-gray-400/88 font-semibold text-sm uppercase tracking-wide">
                Enregistrement de ta commande en cours...
              </p>
            </div>
          )}

          {step === "error" && (
            <div className="py-12 text-center relative z-10">
              <div className="text-5xl mb-4">❌</div>
              <h3 className="text-2xl sm:text-3xl font-display text-white text-3d mb-3">ERREUR</h3>
              <p className="text-red-300/95 font-medium mb-8">{formError}</p>
              <button
                onClick={() => setStep("form")}
                className="btn-fortnite bg-fortnite-yellow text-fortnite-blue px-8 py-3"
              >
                <span className="btn-fortnite-inner font-semibold">RÉESSAYER</span>
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
