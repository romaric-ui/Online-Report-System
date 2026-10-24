"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus, Search, Filter, X, CheckSquare, Clock, AlertTriangle,
  ChevronDown, Trash2, Edit3, Upload,
  LayoutDashboard, BookOpen, Camera, Users, Wrench,
  Wallet, BarChart3, ShieldCheck, FolderOpen, MessageCircle, FileText,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";

const STATUTS = [
  { value: "",          label: "Tous" },
  { value: "a_faire",   label: "À faire",    color: "bg-slate-100 text-slate-700" },
  { value: "en_cours",  label: "En cours",   color: "bg-blue-100 text-blue-700" },
  { value: "en_attente", label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  { value: "termine",   label: "Terminé",    color: "bg-emerald-100 text-emerald-700" },
];

const PRIORITES = [
  { value: "",         label: "Toutes" },
  { value: "urgente",  label: "Urgente",  dot: "bg-red-500" },
  { value: "haute",    label: "Haute",    dot: "bg-orange-500" },
  { value: "normale",  label: "Normale",  dot: "bg-blue-500" },
  { value: "basse",    label: "Basse",    dot: "bg-slate-400" },
];

const STATUS_BADGE = {
  a_faire:    "bg-slate-100 text-slate-700 border-slate-200",
  en_cours:   "bg-blue-100 text-blue-700 border-blue-200",
  en_attente: "bg-yellow-100 text-yellow-700 border-yellow-200",
  termine:    "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const PRIORITY_DOT = {
  urgente: "bg-red-500", haute: "bg-orange-500", normale: "bg-blue-500", basse: "bg-slate-400",
};

function progressColor(v) {
  if (v >= 75) return "bg-emerald-500";
  if (v >= 40) return "bg-blue-500";
  if (v >= 15) return "bg-yellow-500";
  return "bg-red-500";
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—";

const EMPTY_FORM = {
  nom: "", description: "", lot: "", date_debut: "", date_fin_prevue: "",
  duree_jours: 1, priorite: "normale", statut: "a_faire", pourcentage: 0,
};

export default function TachesPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const { status } = useSession();

  const [tasks, setTasks] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterPriorite, setFilterPriorite] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status === "authenticated") loadTasks();
  }, [status, id]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chantiers/${id}/taches`);
      const json = await res.json();
      const data = json.data || json || [];
      setTasks(Array.isArray(data) ? data : []);

      // Extraire les lots uniques
      const lotSet = new Set(data.filter((t) => t.lot_nom).map((t) => t.lot_nom));
      setLots([...lotSet].sort());
    } catch { setTasks([]); }
    finally { setLoading(false); }
  }, [id]);

  // Filtrage
  const filtered = tasks.filter((t) => {
    if (filterStatut && t.statut !== filterStatut) return false;
    if (filterPriorite && t.priorite !== filterPriorite) return false;
    if (search && !t.nom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stats rapides
  const stats = {
    total: tasks.length,
    en_cours: tasks.filter((t) => t.statut === "en_cours").length,
    termine: tasks.filter((t) => t.statut === "termine").length,
    urgentes: tasks.filter((t) => t.priorite === "urgente" || t.priorite === "haute").length,
  };

  // Modal
  function openCreate() {
    setEditTask(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(task) {
    setEditTask(task);
    setForm({
      nom: task.nom || "",
      description: task.description || "",
      lot: task.lot_nom || "",
      date_debut: task.date_debut ? task.date_debut.split("T")[0] : "",
      date_fin_prevue: task.date_fin_prevue ? task.date_fin_prevue.split("T")[0] : "",
      duree_jours: task.duree_jours || 1,
      priorite: task.priorite || "normale",
      statut: task.statut || "a_faire",
      pourcentage: task.pourcentage || 0,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.nom.trim()) return setError("Le nom est obligatoire");
    setSaving(true);
    setError("");

    try {
      const body = { ...form, duree_jours: parseInt(form.duree_jours), pourcentage: parseFloat(form.pourcentage) };

      if (editTask) {
        const res = await fetch(`/api/chantiers/${id}/taches`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_tache: editTask.id_tache, ...body }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error?.message || d.message || "Erreur"); }
      } else {
        const res = await fetch(`/api/chantiers/${id}/taches`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error?.message || d.message || "Erreur"); }
      }

      setShowModal(false);
      loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(taskId) {
    if (!confirm("Supprimer cette tâche ?")) return;
    try {
      const res = await fetch(`/api/chantiers/${id}/taches`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_tache: taskId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error?.message || d.message || "Suppression impossible");
      }
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  }

  if (status === "loading") return null;

  return (
    <AppLayout>
      {/* Tabs */}
      <TabNav id={id} active="taches" />

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Tâches</h1>
            <p className="text-sm text-slate-500">{stats.total} tâche{stats.total > 1 ? "s" : ""} au total</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push("/import-taches")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
              <Upload className="w-4 h-4" /> Importer
            </button>
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow">
              <Plus className="w-4 h-4" /> Nouvelle tâche
            </button>
          </div>
        </div>

        {/* Stats mini */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <MiniStat icon={CheckSquare} label="Total" value={stats.total} color="text-slate-700" />
          <MiniStat icon={Clock} label="En cours" value={stats.en_cours} color="text-blue-600" />
          <MiniStat icon={CheckSquare} label="Terminées" value={stats.termine} color="text-emerald-600" />
          <MiniStat icon={AlertTriangle} label="Urgentes" value={stats.urgentes} color="text-red-600" />
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" placeholder="Rechercher une tâche..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={filterPriorite} onChange={(e) => setFilterPriorite(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {PRIORITES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-500">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
            <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              {tasks.length === 0 ? "Aucune tâche pour ce chantier." : "Aucune tâche ne correspond aux filtres."}
            </p>
            {tasks.length === 0 && (
              <button onClick={openCreate} className="mt-4 text-indigo-600 text-sm font-semibold hover:underline">
                Créer une première tâche
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => (
              <div key={task.id_tache}
                className="group rounded-xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all p-4">
                <div className="flex items-start gap-3">
                  {/* Priority dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${PRIORITY_DOT[task.priorite] || "bg-slate-400"}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{task.nom}</p>
                      {task.lot_nom && (
                        <span className="shrink-0 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 text-xs font-medium">
                          {task.lot_nom}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                      <span>{fmtDate(task.date_debut)} → {fmtDate(task.date_fin_prevue)}</span>
                      <span>{task.duree_jours || 1}j</span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[task.statut] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                        {STATUTS.find((s) => s.value === task.statut)?.label || task.statut}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${progressColor(task.pourcentage || 0)}`}
                          style={{ width: `${task.pourcentage || 0}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-500 w-10 text-right">
                        {parseFloat(task.pourcentage || 0).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(task)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(task.id_tache)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal création / édition */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>

            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editTask ? "Modifier la tâche" : "Nouvelle tâche"}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body modal */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: Fondations bâtiment A"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lot</label>
                  <input type="text" value={form.lot} onChange={(e) => setForm({ ...form, lot: e.target.value })}
                    placeholder="Ex: Gros œuvre" list="lots-list"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <datalist id="lots-list">
                    {lots.map((l) => <option key={l} value={l} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Durée (jours)</label>
                  <input type="number" min="1" value={form.duree_jours}
                    onChange={(e) => setForm({ ...form, duree_jours: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date début</label>
                  <input type="date" value={form.date_debut}
                    onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fin prévue</label>
                  <input type="date" value={form.date_fin_prevue}
                    onChange={(e) => setForm({ ...form, date_fin_prevue: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priorité</label>
                  <select value={form.priorite} onChange={(e) => setForm({ ...form, priorite: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="basse">Basse</option>
                    <option value="normale">Normale</option>
                    <option value="haute">Haute</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                  <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="a_faire">À faire</option>
                    <option value="en_cours">En cours</option>
                    <option value="en_attente">En attente</option>
                    <option value="termine">Terminé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Progression ({parseFloat(form.pourcentage || 0).toFixed(0)}%)
                </label>
                <input type="range" min="0" max="100" value={form.pourcentage}
                  onChange={(e) => setForm({ ...form, pourcentage: e.target.value })}
                  className="w-full accent-indigo-600" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea rows={3} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description optionnelle..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>

            {/* Footer modal */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setShowModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition">
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50">
                {saving ? "Enregistrement..." : editTask ? "Modifier" : "Créer la tâche"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Mini stat card ───────────────────────────────────────────────
function MiniStat({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ── Tab navigation (réutilisable) ────────────────────────────────
function TabNav({ id, active }) {
  const groups = [
    {
      label: "Chantier", icon: LayoutDashboard,
      items: [
        { key: "overview", label: "Vue d'ensemble", icon: LayoutDashboard, href: `/chantiers/${id}` },
        { key: "journal", label: "Journal", icon: BookOpen, href: `/chantiers/${id}/journal` },
        { key: "photos", label: "Photos", icon: Camera, href: `/chantiers/${id}/photos` },
      ],
    },
    {
      label: "Équipe", icon: Users,
      items: [
        { key: "equipe", label: "Équipe", icon: Users, href: `/chantiers/${id}/equipe` },
        { key: "pointage", label: "Pointage", icon: Clock, href: `/chantiers/${id}/pointage` },
      ],
    },
    {
      label: "Ressources", icon: Wrench,
      items: [
        { key: "materiel", label: "Matériel", icon: Wrench, href: `/chantiers/${id}/materiel` },
        { key: "budget", label: "Budget", icon: Wallet, href: `/chantiers/${id}/budget` },
      ],
    },
    {
      label: "Planification", icon: BarChart3,
      items: [
        { key: "taches", label: "Tâches", icon: CheckSquare, href: `/chantiers/${id}/taches` },
        { key: "planning", label: "Planning", icon: BarChart3, href: `/chantiers/${id}/planning` },
      ],
    },
    {
      label: "Sécurité & Docs", icon: ShieldCheck,
      items: [
        { key: "securite", label: "Sécurité", icon: ShieldCheck, href: `/chantiers/${id}/securite` },
        { key: "documents", label: "Documents", icon: FolderOpen, href: `/chantiers/${id}/documents` },
        { key: "chat", label: "Discussion", icon: MessageCircle, href: `/chantiers/${id}/chat` },
      ],
    },
  ];

  const isGroupActive = (group) => group.items.some((item) => item.key === active);

  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-20" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-1">
          {groups.map((group) => (
            <div key={group.label} className="relative group">
              <button className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                isGroupActive(group)
                  ? "text-indigo-600 border-indigo-600"
                  : "text-slate-600 hover:text-indigo-600 border-transparent hover:border-indigo-600"
              }`}>
                <group.icon className="w-4 h-4" />
                {group.label}
                <svg className="w-3 h-3 ml-0.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 w-48 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {group.items.map((item) => (
                  <a key={item.href} href={item.href}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm first:rounded-t-xl last:rounded-b-xl transition-colors ${
                      item.key === active
                        ? "bg-indigo-50 text-indigo-600 font-medium"
                        : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                    }`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <a href={`/chantiers/${id}/rapport-auto`}
            className="flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors border-b-2 border-transparent hover:border-indigo-600">
            <FileText className="w-4 h-4" />
            Rapport auto
          </a>
        </div>
      </div>
    </div>
  );
}