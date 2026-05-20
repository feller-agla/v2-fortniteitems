"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CreatorCodeContext = createContext();

export function CreatorCodeProvider({ children }) {
  const { user, profile, isAuthReady } = useAuth();

  // Code promo actif en session (permet à l'utilisateur de taper un code dans le modal avant la commande)
  const [sessionPromoCode, setSessionPromoCode] = useState("");
  const [sessionIsDiscounted, setSessionIsDiscounted] = useState(false);

  // Source de vérité : lire directement depuis profile.used_promo_code en BDD
  // Pas de localStorage, pas de scan de commandes — tout vient du profil.
  useEffect(() => {
    if (isAuthReady && user && profile?.used_promo_code) {
      // L'utilisateur est connecté et a déjà utilisé un code → l'appliquer immédiatement
      setSessionPromoCode(profile.used_promo_code);
      setSessionIsDiscounted(true);
    } else if (isAuthReady && user && !profile?.used_promo_code) {
      // L'utilisateur est connecté mais n'a jamais utilisé de code
      setSessionPromoCode("");
      setSessionIsDiscounted(false);
    } else if (isAuthReady && !user) {
      // Nettoyage complet à la déconnexion
      setSessionPromoCode("");
      setSessionIsDiscounted(false);
    }
  }, [user, profile, isAuthReady]);

  /**
   * Sauvegarder un code créateur en session.
   * Appelé depuis le CheckoutModal quand l'utilisateur tape et valide un code.
   * La sauvegarde persistante en BDD (profiles.used_promo_code) se fait côté serveur
   * lors de la création de la commande dans /api/orders.
   */
  const saveCreatorCode = (code, isValid) => {
    setSessionPromoCode(code);
    setSessionIsDiscounted(isValid);
  };

  // Réinitialiser le code de session uniquement (pas la BDD)
  const clearCreatorCode = () => {
    setSessionPromoCode("");
    setSessionIsDiscounted(false);
  };

  return (
    <CreatorCodeContext.Provider
      value={{
        promoCode: sessionPromoCode,
        isDiscounted: !!user && sessionIsDiscounted,
        isLoaded: isAuthReady,
        saveCreatorCode,
        clearCreatorCode,
      }}
    >
      {children}
    </CreatorCodeContext.Provider>
  );
}

export function useCreatorCode() {
  const context = useContext(CreatorCodeContext);
  if (context === undefined) {
    throw new Error("useCreatorCode must be used within a CreatorCodeProvider");
  }
  return context;
}
