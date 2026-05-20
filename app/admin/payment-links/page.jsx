"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";

export default function PaymentLinksAdmin() {
  const { user, profile } = useAuth();
  const [links, setLinks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newVbucks, setNewVbucks] = useState('');
  const [newLink, setNewLink] = useState('');

  // Load payment links
  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchLinks();
    }
  }, [user, profile]);

  const fetchLinks = async () => {
    if (!user || profile?.role !== 'admin') return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/payment-links');
      const data = await res.json();
      if (data.status === 'success') {
        setLinks(data.data);
      }
    } catch (err) {
      console.error('Error fetching links:', err);
      setMessage('Erreur lors du chargement des liens');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLink = (vbucks, newUrl) => {
    setLinks(prev => ({
      ...prev,
      [vbucks]: newUrl
    }));
  };

  const handleDeleteLink = (vbucks) => {
    setLinks(prev => {
      const updated = { ...prev };
      delete updated[vbucks];
      return updated;
    });
  };

  const handleAddLink = () => {
    if (!newVbucks || !newLink) {
      setMessage('Veuillez remplir tous les champs');
      return;
    }

    const vbucksNum = parseInt(newVbucks);
    if (isNaN(vbucksNum) || vbucksNum <= 0) {
      setMessage('V-Bucks doit être un nombre positif');
      return;
    }

    setLinks(prev => ({
      ...prev,
      [vbucksNum]: newLink
    }));
    setNewVbucks('');
    setNewLink('');
    setMessage('Lien ajouté (n\'oubliez pas de sauvegarder)');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setMessage('✓ Liens de paiement sauvegardés avec succès!');
      } else {
        setMessage('Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Error saving links:', err);
      setMessage('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  const sortedVbucks = Object.keys(links).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="min-h-screen bg-[#091C3E] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-display mb-8">Gestion des Liens de Paiement</h1>

        {message && (
          <div className={`mb-6 p-4 rounded border-l-4 ${
            message.includes('✓') ? 'bg-green-500/20 border-green-500' : 'bg-yellow-500/20 border-yellow-500'
          }`}>
            {message}
          </div>
        )}

        {/* Add New Link */}
        <div className="bg-[#0c1a3b]/60 backdrop-blur-md p-6 rounded-xl border border-white/10 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Ajouter un nouveau lien</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="V-Bucks"
              value={newVbucks}
              onChange={(e) => setNewVbucks(e.target.value)}
              className="bg-[#091C3E] border border-white/20 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#31BBE6]"
            />
            <input
              type="url"
              placeholder="Lien de paiement (https://...)"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              className="bg-[#091C3E] border border-white/20 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#31BBE6] md:col-span-2"
            />
          </div>
          <button
            onClick={handleAddLink}
            className="mt-4 px-6 py-2 bg-[#FFF12B] text-[#091C3E] font-bold rounded hover:bg-white transition-colors"
          >
            Ajouter
          </button>
        </div>

        {/* Links Table */}
        <div className="bg-[#0c1a3b]/60 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#1A3E7A] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-[#FFF12B] font-semibold">V-Bucks</th>
                <th className="px-6 py-4 text-left text-[#FFF12B] font-semibold">Lien de paiement</th>
                <th className="px-6 py-4 text-center text-[#FFF12B] font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedVbucks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-400">
                    Aucun lien configuré
                  </td>
                </tr>
              ) : (
                sortedVbucks.map(vbucks => (
                  <tr key={vbucks} className="border-b border-white/5 hover:bg-[#1A3E7A]/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#FFF12B]">{vbucks}</td>
                    <td className="px-6 py-4">
                      <input
                        type="url"
                        value={links[vbucks]}
                        onChange={(e) => handleUpdateLink(vbucks, e.target.value)}
                        className="w-full bg-[#091C3E] border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#31BBE6]"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteLink(vbucks)}
                        className="px-3 py-1 bg-red-600/70 hover:bg-red-600 text-white rounded text-sm transition-colors"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-[#FFF12B] text-[#091C3E] font-bold rounded-lg hover:bg-white disabled:opacity-50 transition-colors text-lg"
          >
            {saving ? 'Sauvegarde en cours...' : 'Sauvegarder les modifications'}
          </button>
          <button
            onClick={fetchLinks}
            className="px-8 py-3 bg-white/10 text-white font-bold rounded-lg border border-white/20 hover:border-white/40 transition-colors text-lg"
          >
            Annuler les modifications
          </button>
        </div>
      </div>
    </div>
  );
}
