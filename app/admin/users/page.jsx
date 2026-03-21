"use client";
import { useState, useEffect } from "react";
import { formatLocaleDate } from "@/app/lib/datetime";
import { 
  UsersIcon, 
  TrashIcon, 
  UserPlusIcon, 
  ArrowPathIcon,
  ShieldCheckIcon,
  UserIcon
} from "@heroicons/react/24/outline";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Erreur lors de la récupération des utilisateurs");
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (!confirm(`Voulez-vous changer le rôle de cet utilisateur en ${newRole} ?`)) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });
      if (!res.ok) throw new Error("Erreur mise à jour");
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("🚨 ATTENTION: Supprimer cet utilisateur supprimera également toutes ses commandes. Continuer ?")) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Erreur suppression");
      setUsers(users.filter(u => u.id !== userId));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-normal text-white text-3d tracking-widest mb-2">
            GESTION DES <span className="text-fortnite-yellow text-3d-yellow">UTILISATEURS</span>
          </h1>
          <p className="text-[#B0B8C8] font-bold text-sm tracking-wider uppercase">
            {users.length} UTILISATEURS ENREGISTRÉS
          </p>
        </div>
        <button 
          onClick={fetchUsers} 
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-xl transition-colors"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="bg-rarity-marvel/20 border border-rarity-marvel/50 rounded-xl p-4 text-red-300 font-bold text-sm text-center">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-[#051024] rounded-2xl border-2 border-[#1A3E7A] shadow-[0_15px_30px_rgba(0,0,0,0.6)] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="text-2xl font-display text-fortnite-yellow animate-pulse tracking-widest">CHARGEMENT...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead className="bg-[#091C3E] text-[#B0B8C8] font-bold uppercase tracking-widest border-b border-white/5">
                <tr>
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4">Inscription</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-bold">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <UserIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <span className="text-white group-hover:text-fortnite-yellow transition-colors">{u.name || "Joueur"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] tracking-widest uppercase border ${
                        u.role === 'admin' 
                          ? 'bg-fortnite-yellow/20 text-fortnite-yellow border-fortnite-yellow/50' 
                          : 'bg-white/5 text-gray-400 border-white/10'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="p-4 text-[#B0B8C8] text-xs">
                      {formatLocaleDate(u.created_at)}
                    </td>
                    <td className="p-4 flex gap-2 justify-end">
                      {u.role === 'admin' ? (
                        <button 
                          onClick={() => handleRoleChange(u.id, 'user')}
                          className="p-2 bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 rounded transition-colors border border-orange-500/30" 
                          title="Rétrograder"
                        >
                          <UserIcon className="w-5 h-5" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleRoleChange(u.id, 'admin')}
                          className="p-2 bg-fortnite-yellow/20 hover:bg-fortnite-yellow text-fortnite-yellow hover:text-black rounded transition-colors border border-fortnite-yellow/30" 
                          title="Promouvoir Admin"
                        >
                          <ShieldCheckIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded transition-colors border border-red-500/30" 
                        title="Supprimer"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
