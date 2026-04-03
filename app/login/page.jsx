"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signInWithGoogle, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  return (
    <main className="min-h-screen bg-[#091C3E] text-white selection:bg-fortnite-yellow/30 relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-x-0 bottom-0 h-full w-full pointer-events-none opacity-5 bg-[repeating-linear-gradient(-45deg,transparent,transparent_10px,#FFF_10px,#FFF_20px)] mix-blend-overlay z-0"></div>
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-fortnite-yellow/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-rarity-epic/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      <section className="pt-32 pb-20 relative z-10 w-full flex items-center justify-center min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-[#051024] border-4 border-[#1A3E7A] rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden mx-4"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-fortnite-yellow/0 via-fortnite-yellow to-fortnite-yellow/0 opacity-50"></div>

          <div className="text-center mb-8 relative z-10">
            <h1 className="text-5xl font-display font-normal text-white mb-2 text-3d tracking-wider">CONNEXION</h1>
            <p className="text-gray-400 font-sans font-bold text-sm uppercase tracking-widest">ACCÉDEZ À VOTRE COMPTE</p>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 mb-6 py-3 px-4 bg-white text-gray-800 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-[0_4px_0_rgba(0,0,0,0.3)] hover:shadow-[0_2px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 border border-gray-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">ou</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {error && (
            <div className="bg-rarity-marvel/20 border border-rarity-marvel/50 rounded-xl p-3 mb-4 text-sm text-red-300 font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-white font-sans font-bold text-sm mb-2 uppercase tracking-wider">ADRESSE E-MAIL</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/60 border-2 border-white/10 rounded-xl px-4 py-3 text-white/90 font-sans font-medium focus:border-fortnite-yellow focus:outline-none transition-colors shadow-inner"
                placeholder="joueur@epicgames.com"
              />
            </div>
            <div>
              <label className="block text-white font-sans font-bold text-sm mb-2 uppercase tracking-wider">MOT DE PASSE</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/60 border-2 border-white/10 rounded-xl px-4 py-3 text-white/90 font-sans font-medium focus:border-fortnite-yellow focus:outline-none transition-colors shadow-inner"
                placeholder="••••••••"
              />
              <div className="flex justify-end mt-2">
                <Link href="#" className="text-xs text-fortnite-yellow hover:text-white transition-colors font-bold uppercase tracking-wider">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>
            <button 
              type="submit" disabled={loading}
              className="btn-fortnite bg-fortnite-yellow hover:bg-fortnite-yellow-hover text-fortnite-blue w-full py-4 text-xl shadow-[0_6px_0_rgba(180,160,0,1)] hover:shadow-[0_4px_0_rgba(180,160,0,1)] transition-all mt-2 disabled:opacity-50"
            >
              <span className="btn-fortnite-inner flex items-center justify-center gap-2 mt-1 font-bold">
                {loading ? "CONNEXION..." : "SE CONNECTER"}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center relative z-10 border-t-2 border-white/5 pt-6">
            <p className="text-gray-400 font-sans font-bold text-sm tracking-wider">VOUS N'AVEZ PAS DE COMPTE ?</p>
            <Link href="/register" className="mt-3 btn-fortnite bg-white/10 hover:bg-white text-white hover:text-fortnite-blue w-full py-3 text-lg border-2 border-white/50 backdrop-blur-sm shadow-[0_6px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_0_rgba(200,200,200,1)] block">
              <span className="btn-fortnite-inner leading-none mt-1 font-bold">CRÉER UN COMPTE</span>
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
