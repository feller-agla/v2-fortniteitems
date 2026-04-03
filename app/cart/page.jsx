"use client";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Link from "next/link";
import { TrashIcon, PlusIcon, MinusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

const DEVICES = ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"];

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, isLoaded } = useCart();
  const { user, displayName } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "loading" | "error"
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    epicUsername: "",
    device: "",
  });

  const handleCheckout = () => {
    setFormError("");
    setForm({
      firstName: "",
      lastName: "",
      epicUsername: "",
      device: "",
    });
    setStep("form");
    setShowModal(true);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    const { firstName, lastName, epicUsername, device } = form;
    if (!firstName || !lastName || !epicUsername || !device) {
      setFormError("Veuillez remplir tous les champs.");
      return;
    }
    setStep("loading");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: cartTotal,
          items: cartItems,
          customer: {
            id: user?.id || null,
            firstName,
            lastName,
            epicUsername,
            device,
            email: user?.email || "",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.payment_link) {
        throw new Error(data.error || "Erreur lors de la création du paiement.");
      }
      // Redirect to Lygos payment
      window.location.href = data.payment_link;
    } catch (err) {
      setStep("error");
      setFormError(err.message);
    }
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-[#091C3E]">
        <Navbar />
        <div className="pt-32 container mx-auto px-4 text-center">
          <p className="text-white font-display text-2xl animate-pulse">Chargement...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#091C3E] text-white selection:bg-fortnite-yellow/30 relative overflow-hidden">
        <Navbar />
        <div className="absolute inset-x-0 bottom-0 h-full w-full pointer-events-none opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#FFF_10px,#FFF_20px)] mix-blend-overlay z-0"></div>

        <section className="pt-32 pb-20 relative z-10 w-full">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="bg-[#051024] border-4 border-[#1A3E7A] rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
              <h1 className="text-4xl font-display font-normal text-white mb-4 tracking-wider text-3d">CONNECTEZ-VOUS</h1>
              <p className="text-gray-300 font-sans text-base leading-relaxed">
                Pour accéder à votre panier et le retrouver après votre déconnexion, connectez-vous à votre compte.
              </p>
              <div className="mt-8 flex gap-4 flex-col sm:flex-row">
                <Link href="/login" className="btn-fortnite bg-fortnite-yellow hover:bg-fortnite-yellow-hover text-fortnite-blue w-full sm:w-auto px-10 py-4 text-center">
                  <span className="btn-fortnite-inner font-semibold">SE CONNECTER</span>
                </Link>
                <Link href="/#products" className="btn-fortnite bg-white/5 hover:bg-white/10 text-white w-full sm:w-auto px-10 py-4 text-center border-2 border-white/10">
                  <span className="btn-fortnite-inner font-semibold">CONTINUER</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#091C3E] text-white selection:bg-fortnite-yellow/30 relative overflow-hidden">
      <Navbar />

      {/* Background */}
      <div className="absolute inset-x-0 bottom-0 h-full w-full pointer-events-none opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#FFF_10px,#FFF_20px)] mix-blend-overlay z-0"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-fortnite-blue-light/40 blur-[150px] pointer-events-none mix-blend-screen" />

      <section className="pt-32 pb-32 relative z-10 w-full">
        <div className="container mx-auto px-4 z-10 relative max-w-6xl">

          <div className="mb-16 text-center md:text-left">
            <h1 className="text-6xl md:text-[80px] font-display font-normal text-white mb-6 tracking-wider text-3d inline-block">
              VOTRE{" "}
              <span className="text-fortnite-yellow text-3d-yellow inline-block transform -rotate-2 scale-110 ml-4">
                PANIER
              </span>
            </h1>
            <p className="text-white/88 font-sans text-xl font-semibold tracking-wide uppercase bg-black/35 p-4 rounded-xl border-2 border-white/10 mt-4 md:max-w-2xl">
              VÉRIFIEZ VOS ARTICLES AVANT DE PROCÉDER AU{" "}
              <span className="text-fortnite-yellow">PAIEMENT SÉCURISÉ</span>.
            </p>
          </div>

          {cartItems.length === 0 ? (
            <div className="bg-[#051024] border-4 border-[#1A3E7A] rounded-2xl p-16 text-center shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-w-3xl mx-auto">
              <div className="w-32 h-32 bg-black/60 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white/10">
                <TrashIcon className="w-16 h-16 text-gray-500" />
              </div>
              <h2 className="text-4xl font-display tracking-wide mb-6 text-gray-400/85">PANIER VIDE</h2>
              <p className="text-white/90 font-sans text-xl font-medium mb-10 max-w-lg mx-auto">
                VOUS N'AVEZ PAS ENCORE SÉLECTIONNÉ D'ARTICLES.
              </p>
              <Link href="/#products" className="btn-fortnite bg-fortnite-yellow hover:bg-fortnite-yellow-hover text-fortnite-blue px-12 py-5 text-2xl inline-block">
                <span className="btn-fortnite-inner font-semibold leading-none mt-1">VOIR LES OFFRES</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Article List */}
              <div className="lg:col-span-2 space-y-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-center gap-6 bg-[#051024] border-4 border-[#1A3E7A] rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)] relative group hover:scale-[1.02] hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute inset-0 rounded-xl opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#FFF_5px,#FFF_10px)] pointer-events-none mix-blend-overlay"></div>
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-[#0c1a3b]/80 rounded-xl flex items-center justify-center shrink-0 p-2 border-2 border-white/10 relative overflow-visible shadow-inner z-10">
                      <div className={`absolute inset-0 rounded-xl blur-2xl opacity-60 mix-blend-screen ${item.type === 'shop_item' ? 'bg-rarity-epic' : 'bg-rarity-rare'}`} />
                      <img src={item.image || "/assets/1000vbucks.png"} alt={item.name} className="w-[125%] h-[125%] object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.9)] relative z-20 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="flex-1 text-center sm:text-left z-10 w-full mt-4 sm:mt-0">
                      <div className="text-sm text-fortnite-yellow font-display tracking-widest mb-1">{item.vbucks ? `💰 ${item.vbucks} V-BUCKS` : "💎 OBJET FORTNITE"}</div>
                      <h3 className="text-3xl font-display tracking-wide text-white mb-3 text-3d leading-none">{item.name.toUpperCase()}</h3>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                        <div className="text-2xl font-semibold font-sans text-fortnite-yellow bg-black/50 px-4 py-2 rounded-lg border border-white/5 inline-block">
                          {item.price.toLocaleString("fr-FR")} FCFA
                        </div>
                        <div className="flex items-center gap-1 bg-black/80 rounded-xl p-1 border-2 border-[#1A3E7A]">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="p-2 bg-fortnite-blue hover:bg-fortnite-blue-light rounded-lg transition-colors border-b-4 border-fortnite-blue-light disabled:opacity-30 active:border-b-0 active:translate-y-[4px] text-white">
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="font-semibold font-display text-2xl w-10 text-center text-white/95 pt-1">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 bg-fortnite-blue hover:bg-fortnite-blue-light rounded-lg transition-colors border-b-4 border-fortnite-blue-light active:border-b-0 active:translate-y-[4px] text-white">
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="absolute top-4 right-4 z-20">
                      <div className="p-2 bg-rarity-marvel/80 hover:bg-red-500 text-white rounded-lg transition-all border-b-2 border-red-900 shadow-md active:border-b-0 active:translate-y-[2px]">
                        <TrashIcon className="w-5 h-5" />
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-[#051024] border-4 border-[#1A3E7A] rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] sticky top-32 overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-fortnite-yellow/10 blur-[50px] rounded-full pointer-events-none mix-blend-screen z-0"></div>
                  <h3 className="text-2xl font-display tracking-wider mb-8 border-b-4 border-[#1A3E7A] pb-4 text-white text-3d relative z-10 text-center">RÉSUMÉ</h3>
                  <div className="space-y-4 mb-8 font-sans text-lg font-semibold relative z-10">
                    <div className="flex justify-between text-gray-300/90 bg-black/35 p-3 rounded-lg border border-white/5">
                      <span>Articles ({cartItems.length})</span>
                      <span className="text-white">{cartTotal.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                    <div className="flex justify-between text-gray-300/90 bg-black/35 p-3 rounded-lg border border-white/5">
                      <span>Frais</span>
                      <span className="text-fortnite-yellow uppercase tracking-widest bg-[#1A3E7A]/50 px-2 rounded">Gratuit</span>
                    </div>
                  </div>
                  <div className="border-t-4 border-[#1A3E7A] pt-8 mb-8 relative z-10">
                    <div className="flex justify-between items-center bg-black/60 p-4 rounded-xl border-2 border-white/5">
                      <span className="text-lg font-display tracking-widest text-[#B0B8C8]">TOTAL</span>
                      <span className="text-3xl lg:text-4xl font-display text-fortnite-yellow text-3d-yellow leading-none text-right">
                        {cartTotal.toLocaleString("fr-FR")} <span className="text-base font-sans opacity-80 italic">FCFA</span>
                      </span>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <button
                      onClick={handleCheckout}
                      className="btn-fortnite w-full bg-fortnite-yellow hover:bg-fortnite-yellow-hover text-fortnite-blue py-3.5 text-lg shadow-[0_4px_0_rgba(180,160,0,1)] hover:shadow-[0_2px_0_rgba(180,160,0,1)] transition-all"
                    >
                      <span className="btn-fortnite-inner font-bold text-xl tracking-wide mt-1">COMMANDER →</span>
                    </button>
                  </div>
                  <div className="mt-6 flex flex-col items-center gap-2 relative z-10 opacity-70">
                    <p className="text-center text-xs text-white/85 font-medium font-sans uppercase tracking-wide">PAIEMENT SÉCURISÉ PAR</p>
                    <div className="flex gap-2 items-center justify-center font-display text-sm">
                      <span className="bg-[#00B0FF] px-2 rounded text-white">WAVE</span>
                      <span className="bg-[#FF6600] px-2 rounded text-white">ORANGE</span>
                      <span className="bg-[#FFCC00] px-2 rounded text-black">MTN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ====== CHECKOUT MODAL ====== */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-lg bg-[#051024] border-4 border-[#1A3E7A] rounded-2xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.9)] relative overflow-hidden"
            >
              {/* Accent top border */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-fortnite-yellow/0 via-fortnite-yellow to-fortnite-yellow/0"></div>
              {/* Glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-fortnite-yellow/10 blur-[80px] rounded-full pointer-events-none"></div>

              {/* Close button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors z-10"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              {step === "form" && (
                <>
                  <div className="mb-8 relative z-10">
                    <h2 className="text-4xl font-display text-white text-3d tracking-widest">INFOS COMMANDE</h2>
                    <p className="text-gray-400/88 font-semibold text-sm uppercase tracking-wide mt-1">
                      ON A BESOIN DE CES INFOS POUR LIVRER TES ARTICLES
                    </p>
                  </div>

                  {formError && (
                    <div className="bg-rarity-marvel/20 border border-rarity-marvel/50 rounded-xl p-3 mb-4 text-red-300/95 font-medium text-sm relative z-10">
                      ⚠️ {formError}
                    </div>
                  )}

                  <form onSubmit={handleSubmitOrder} className="space-y-4 relative z-10">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/95 font-semibold text-xs mb-1.5 uppercase tracking-wide">PRÉNOM</label>
                        <input
                          type="text" required value={form.firstName}
                          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                          className="w-full bg-black/60 border-2 border-white/10 rounded-xl px-4 py-3 text-white/90 font-sans font-medium focus:border-fortnite-yellow focus:outline-none transition-colors"
                          placeholder="Jean"
                        />
                      </div>
                      <div>
                        <label className="block text-white/95 font-semibold text-xs mb-1.5 uppercase tracking-wide">NOM</label>
                        <input
                          type="text" required value={form.lastName}
                          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                          className="w-full bg-black/60 border-2 border-white/10 rounded-xl px-4 py-3 text-white/90 font-sans font-medium focus:border-fortnite-yellow focus:outline-none transition-colors"
                          placeholder="Dupont"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/95 font-semibold text-xs mb-1.5 uppercase tracking-wide">
                        🎮 NOM D'UTILISATEUR EPIC GAMES
                      </label>
                      <input
                        type="text" required value={form.epicUsername}
                        onChange={(e) => setForm({ ...form, epicUsername: e.target.value })}
                        className="w-full bg-black/60 border-2 border-white/10 rounded-xl px-4 py-3 text-white/90 font-sans font-medium focus:border-fortnite-yellow focus:outline-none transition-colors"
                        placeholder="Ton pseudo Fortnite"
                      />
                      <p className="text-gray-500/85 text-xs mt-1 font-medium">
                        ⚠️ Vérifie bien l'orthographe — c'est là qu'on envoie les V-Bucks !
                      </p>
                    </div>

                    <div>
                      <label className="block text-white/95 font-semibold text-xs mb-1.5 uppercase tracking-wide">
                        📱 TON APPAREIL
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {DEVICES.map((d) => (
                          <button
                            key={d} type="button"
                            onClick={() => setForm({ ...form, device: d })}
                            className={`py-2 px-1 rounded-xl font-medium text-sm border-2 transition-all ${
                              form.device === d
                                ? "bg-fortnite-yellow text-fortnite-blue border-fortnite-yellow shadow-[0_4px_0_rgba(180,160,0,1)]"
                                : "bg-black/40 text-gray-300 border-white/10 hover:border-fortnite-yellow/50"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-black/60 rounded-xl p-4 border border-white/5 mt-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-gray-400">{cartItems.length} article(s)</span>
                        <span className="text-fortnite-yellow text-lg">{cartTotal.toLocaleString("fr-FR")} FCFA</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-fortnite bg-fortnite-yellow hover:bg-fortnite-yellow-hover text-fortnite-blue w-full py-4 text-xl shadow-[0_6px_0_rgba(180,160,0,1)] hover:shadow-[0_4px_0_rgba(180,160,0,1)] transition-all mt-2"
                    >
                      <span className="btn-fortnite-inner font-semibold text-xl tracking-wide mt-1">
                        PROCÉDER AU PAIEMENT →
                      </span>
                    </button>
                  </form>
                </>
              )}

              {step === "loading" && (
                <div className="py-16 text-center relative z-10">
                  <div className="text-5xl font-display text-fortnite-yellow animate-pulse tracking-widest mb-4">
                    CHARGEMENT...
                  </div>
                  <p className="text-gray-400/88 font-semibold text-sm uppercase tracking-wide">
                    Création de ta commande en cours...
                  </p>
                </div>
              )}

              {step === "error" && (
                <div className="py-12 text-center relative z-10">
                  <div className="text-5xl mb-4">❌</div>
                  <h3 className="text-3xl font-display text-white text-3d mb-3">ERREUR</h3>
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
        )}
      </AnimatePresence>
    </main>
  );
}
