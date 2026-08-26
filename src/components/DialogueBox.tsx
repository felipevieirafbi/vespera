import React, { useEffect, useState } from 'react';
import { NPC } from '../types/game';
import { Sparkles, MessageSquare, Droplets, X, CheckCircle2, User } from 'lucide-react';

interface DialogueBoxProps {
  npc: NPC;
  isAwakened: boolean;
  currentCycle: number;
  memoryTears: number;
  onGiveTear: (npcId: string) => void;
  onClose: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  npc,
  isAwakened,
  currentCycle,
  memoryTears,
  onGiveTear,
  onClose,
}) => {
  const [justAwakened, setJustAwakened] = useState(false);

  // Close on Escape or Space or E key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDeliverTear = () => {
    if (memoryTears > 0 && !isAwakened) {
      onGiveTear(npc.id);
      setJustAwakened(true);
    }
  };

  // Determine dialogue text based on NPC identity, cycle, and memory state
  let dialogueContent = '';
  if (npc.id === 'npc_orion') {
    if (currentCycle <= 1) {
      dialogueContent =
        'Desperte, Anomalia. O Caleidoscópio estilhaçou. Entre no portal e traga o Pó de Memória.';
    } else if (currentCycle >= 2 && currentCycle <= 4) {
      dialogueContent =
        'A morte é apenas uma porta para nós. Você está ficando mais forte.';
    } else {
      dialogueContent =
        'O Senhor do Fragmento sente o seu poder crescendo lá fora...';
    }
  } else if (npc.id === 'npc_kael') {
    dialogueContent =
      'Traga-me o Pó de Memória arrancado das Aberrações. Forjarei sua própria alma para resistir aos próximos ciclos na Forja da Alma.';
  } else if (npc.id === 'npc_lyra') {
    if (justAwakened) {
      dialogueContent =
        'Um lampejo... eu consigo ver! Você me tirou daquele pesadelo! Nos encontraremos no Refúgio quando este ciclo se findar.';
    } else if (isAwakened) {
      dialogueContent =
        'Você me tirou daquele pesadelo! O fluxo do tempo lá fora é enlouquecedor. Que o eco da minha magia fortaleça sua jornada.';
    } else {
      dialogueContent =
        'Quem é você? O Caleidoscópio gira e minha mente dói... Não te conheço, forasteiro.';
    }
  } else {
    if (justAwakened) {
      dialogueContent =
        'Um lampejo... eu consigo ver! Minha mente está protegida. Eu me lembrarei de você, Anomalia!';
    } else if (!isAwakened) {
      dialogueContent =
        'Quem é você? O Caleidoscópio gira e minha mente dói... Não te conheço, forasteiro.';
    } else {
      dialogueContent =
        'Minha mente está protegida através do Caleidoscópio. Eu me lembrarei de você quando a Ruptura vier!';
    }
  }

  const effectiveAwakened = isAwakened || justAwakened;

  return (
    <div
      id="dialogue-overlay-container"
      className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none p-4 pb-6 sm:pb-8 animate-in fade-in duration-200"
    >
      {/* Cinematic Modal Window */}
      <div
        id="dialogue-box-card"
        className="pointer-events-auto w-full max-w-3xl rounded-2xl border-2 border-amber-400/80 bg-slate-950/95 p-5 shadow-[0_0_40px_rgba(255,215,0,0.25)] backdrop-blur-xl transition-all"
      >
        {/* Header: NPC Badge & Close */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-3">
          <div className="flex items-center gap-3">
            {/* NPC Radiant Emblem */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400 bg-amber-950/60 shadow-[0_0_15px_#FFD700]">
              <User className="h-5 w-5 text-amber-300" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-slate-950">
                ✦
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-base font-bold tracking-wide text-amber-300">
                  {npc.name}
                </h3>
                {effectiveAwakened ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/60 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-3 h-3" />
                    ALMA DESPERTA
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                    AMNÉSIA TEMPORAL
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-amber-200/70">{npc.title}</p>
            </div>
          </div>

          <button
            id="btn-close-dialogue"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-amber-400 hover:bg-amber-950 hover:text-amber-300 transition"
            title="Fechar Diálogo (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dialogue Body with JRPG Typography */}
        <div className="min-h-[70px] flex items-center py-2 px-1">
          <p className="font-mono text-sm leading-relaxed text-slate-100 sm:text-base selection:bg-amber-400 selection:text-black">
            <span className="text-amber-400 font-bold text-lg mr-1">“</span>
            {dialogueContent}
            <span className="text-amber-400 font-bold text-lg ml-1">”</span>
          </p>
        </div>

        {/* Action Controls & Memory Tear Offering */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
          <div className="flex items-center gap-2">
            {!effectiveAwakened && memoryTears > 0 && (
              <button
                id="btn-deliver-memory-tear"
                onClick={handleDeliverTear}
                className="group flex items-center gap-2 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 px-4 py-2 text-xs font-mono font-bold text-slate-950 shadow-[0_0_20px_rgba(255,215,0,0.5)] transition hover:brightness-110 active:scale-95"
              >
                <Droplets className="h-4 w-4 text-cyan-900 fill-cyan-900 group-hover:scale-110 transition" />
                <span>ENTREGAR LÁGRIMA DA LEMBRANÇA</span>
                <span className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] text-white">
                  1 Disp.
                </span>
              </button>
            )}

            {!effectiveAwakened && memoryTears === 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-mono text-slate-500">
                <Droplets className="h-3.5 w-3.5 text-slate-600" />
                <span>Sem Lágrimas da Lembrança no inventário</span>
              </div>
            )}

            {effectiveAwakened && (
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-xs font-mono text-emerald-300">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>A mente deste ser atravessará todas as Rupturas futuras.</span>
              </div>
            )}
          </div>

          <button
            id="btn-confirm-continue"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2 text-xs font-mono text-slate-300 hover:border-slate-500 hover:text-white transition active:scale-95"
          >
            <span>Continuar</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
              ESC
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
