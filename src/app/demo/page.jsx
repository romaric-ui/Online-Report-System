"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ArrowRight,
  Lock,
  BarChart3,
  Users,
  Wrench,
  ShieldCheck,
  FileText,
  MessageSquare,
  Loader2,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const DEMO_CHANTIER_ID = process.env.NEXT_PUBLIC_DEMO_CHANTIER_ID || "7";

export default function DemoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    fetchDemo();
  }, [status]);

  const fetchDemo = async () => {
    try {
      const res = await fetch(`/api/demo/chantier`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Bandeau démo */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <p className="font-semibold">
              Mode démo — Chantier "Construction Villa R+2 — Cotonou"
            </p>
            <span className="text-emerald-200 text-sm hidden sm:block">
              Toutes les données sont fictives
            </span>
          </div>
          <button
            onClick={() => router.push("/inscription")}
            className="shrink-0 flex items-center gap-2 bg-white text-emerald-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition"
          >
            Créer mon compte <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Header chantier */}
        <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                  En cours
                </span>
                <span className="text-slate-400 text-sm">Réf. DEMO-2024</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                Construction Villa R+2 — Cotonou
              </h1>
              <p className="text-slate-500 mt-1">
                Quartier Fidjrossè, Cotonou, Bénin · Client : Famille ADANDE
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-emerald-600">67%</p>
              <p className="text-slate-500 text-sm">Avancement</p>
            </div>
          </div>

          {/* Barre progression */}
          <div className="w-full bg-slate-100 rounded-full h-3 mb-6">
            <div
              className="bg-emerald-500 h-3 rounded-full"
              style={{ width: "67%" }}
            />
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Budget prévu",
                value: "45 000 000 F",
                icon: TrendingUp,
                color: "text-blue-600",
              },
              {
                label: "Date fin prévue",
                value: "30 Oct 2024",
                icon: Calendar,
                color: "text-purple-600",
              },
              {
                label: "Équipe",
                value: "8 ouvriers",
                icon: Users,
                color: "text-orange-600",
              },
              {
                label: "Tâches",
                value: "15 tâches",
                icon: CheckCircle,
                color: "text-emerald-600",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center"
              >
                <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
                <p className="font-bold text-slate-900 text-sm">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sections disponibles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              label: "Tâches & Planning",
              icon: BarChart3,
              color: "bg-blue-100 text-blue-600",
              desc: "15 tâches · 3 en cours · Gantt CPM",
              href: null,
              locked: false,
            },
            {
              label: "Équipe & Pointage",
              icon: Users,
              color: "bg-violet-100 text-violet-600",
              desc: "8 ouvriers · 85% présence · 30 jours",
              href: null,
              locked: false,
            },
            {
              label: "Budget & Dépenses",
              icon: TrendingUp,
              color: "bg-emerald-100 text-emerald-600",
              desc: "45M F prévu · 22M F dépensé · 49%",
              href: null,
              locked: false,
            },
            {
              label: "Sécurité HSE",
              icon: ShieldCheck,
              color: "bg-red-100 text-red-600",
              desc: "5 incidents · Score moyen 88%",
              href: null,
              locked: false,
            },
            {
              label: "Matériel",
              icon: Wrench,
              color: "bg-orange-100 text-orange-600",
              desc: "6 équipements affectés",
              href: null,
              locked: false,
            },
            {
              label: "Documents",
              icon: FileText,
              color: "bg-pink-100 text-pink-600",
              desc: "Plans, contrats, permis...",
              href: null,
              locked: true,
            },
            {
              label: "Chat interne",
              icon: MessageSquare,
              color: "bg-teal-100 text-teal-600",
              desc: "Messagerie par chantier",
              href: null,
              locked: true,
            },
            {
              label: "Rapports auto PDF",
              icon: FileText,
              color: "bg-indigo-100 text-indigo-600",
              desc: "Génération automatique",
              href: null,
              locked: true,
            },
            {
              label: "Gantt avancé",
              icon: BarChart3,
              color: "bg-cyan-100 text-cyan-600",
              desc: "Chemin critique · Dépendances",
              href: null,
              locked: false,
            },
          ].map(({ label, icon: Icon, color, desc, href, locked }) => (
            <button
              key={label}
              onClick={() =>
                locked ? router.push("/inscription") : href && router.push(href)
              }
              className={`group p-6 rounded-2xl bg-white border-2 text-left transition-all ${locked ? "border-slate-100 opacity-70" : "border-slate-200 hover:border-emerald-300 hover:shadow-lg"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`rounded-xl p-2.5 w-fit ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {locked && <Lock className="w-4 h-4 text-slate-400" />}
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{label}</h3>
              <p className="text-xs text-slate-500">{desc}</p>
              {locked && (
                <p className="text-xs text-emerald-600 font-semibold mt-2">
                  Créer un compte →
                </p>
              )}
            </button>
          ))}
        </div>

        {/* CTA inscription */}
        <div className="rounded-[2rem] bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">
            Prêt à gérer vos vrais chantiers ?
          </h2>
          <p className="text-emerald-100 mb-6">
            Créez votre compte entreprise et commencez votre essai gratuit de 7
            jours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/inscription")}
              className="px-8 py-3 bg-white text-emerald-700 rounded-xl font-semibold hover:bg-emerald-50 transition shadow-lg"
            >
              Créer mon compte — Essai gratuit 7 jours
            </button>
            <button
              onClick={() => router.push("/bienvenue")}
              className="px-8 py-3 bg-emerald-700 text-white rounded-xl font-semibold hover:bg-emerald-800 transition"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
