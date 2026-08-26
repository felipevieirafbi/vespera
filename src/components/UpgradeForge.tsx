import React, { useEffect } from 'react';
import { PlayerUpgrades } from '../types/game';
import { Heart, Sword, Zap, Sparkles, X, Shield, Check, Flame } from 'lucide-react';

interface UpgradeForgeProps {
  memoryDust: number;
  upgrades: PlayerUpgrades;
  onBuyUpgrade: (type: keyof PlayerUpgrades, cost: number) => void;
  onClose: () => void;
}

interface UpgradeDefinition {
  key: keyof PlayerUpgrades;
  name: string;
  subtitle: string;
  description: string;
  cost: number;
  icon: React.ElementType;
  iconColor: string;
  borderColor: string;
  bgGlow: string;
  getStatText: (level: number) => string;
  getNextStatText: (level: number) => string;
}

export const UpgradeForge: React.FC<UpgradeForgeProps> = ({
  memoryDust,
  upgrades,
  onBuyUpgrade,
  onClose,
}) => {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const upgradeDefinitions: UpgradeDefinition[] = [
    {
      key: 'vitalityLevel',
      name: 'Vitalidade Titânica',
      subtitle: '+20 Max HP Permanente',
      description: 'Fortalece a fibra vital de sua alma através das eras, expandindo seu limite de dano tolerável em todas as vidas.',
      cost: 50,
      icon: Heart,
      iconColor: 'text-rose-400',
      borderColor: 'border-rose-500/40 hover:border-rose-400',
      bgGlow: 'from-rose-950/40 to-slate-950/80',
      getStatText: (lvl) => `${100 + lvl * 20} HP Máx`,
      getNextStatText: (lvl) => `+20 (${100 + (lvl + 1) * 20} HP)`,
    },
    {
      key: 'damageLevel',
      name: 'Lâmina Real',
      subtitle: '+10 Dano de Ataque Permanente',
      description: 'Afia a lâmina radiante com fragmentos de tempo condensado, rasgando as aberrações com maior ferocidade.',
      cost: 75,
      icon: Sword,
      iconColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/40 hover:border-cyan-400',
      bgGlow: 'from-cyan-950/40 to-slate-950/80',
      getStatText: (lvl) => `${50 + lvl * 10} Dano`,
      getNextStatText: (lvl) => `+10 (${50 + (lvl + 1) * 10} Dano)`,
    },
    {
      key: 'dashLevel',
      name: 'Fantasma',
      subtitle: '-20% Cooldown do Dash Permanente',
      description: 'Dissolve sua presença física no éter, permitindo que execute esquivas com I-frames com maior frequência.',
      cost: 60,
      icon: Zap,
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/40 hover:border-amber-400',
      bgGlow: 'from-amber-950/40 to-slate-950/80',
      getStatText: (lvl) => `${Math.max(0.3, 1.0 * Math.pow(0.8, lvl)).toFixed(2)}s Cooldown`,
      getNextStatText: (lvl) => `-20% (${Math.max(0.3, 1.0 * Math.pow(0.8, lvl + 1)).toFixed(2)}s)`,
    },
  ];

  return (
    <div
      id="upgrade-forge-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        id="upgrade-forge-card"
        className="relative w-full max-w-2xl rounded-3xl border-2 border-rose-500/60 bg-gradient-to-b from-slate-950 via-[#0a0515] to-slate-950 p-6 shadow-[0_0_50px_rgba(244,63,94,0.25)] text-slate-100"
      >
        {/* Header with Forge Anvil theme */}
        <div className="flex items-center justify-between border-b border-rose-900/50 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-500 bg-rose-950/80 shadow-[0_0_20px_#f43f5e]">
              <Flame className="h-6 w-6 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-lg font-bold tracking-wider text-rose-300">
                  FORJA DA ALMA
                </h2>
                <span className="rounded-full border border-rose-500/60 bg-rose-950/60 px-2 py-0.5 text-[10px] font-mono text-rose-300">
                  KAEL, O FORJADOR
                </span>
              </div>
              <p className="font-mono text-xs text-slate-400">
                Gaste Pó de Memória para imbuir sua essência com bênçãos eternas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-rose-400 hover:bg-rose-950 hover:text-rose-200 transition"
            title="Fechar Forja (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Currency Display (Pó de Memória) */}
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-purple-500/50 bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-purple-950/80 p-3 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
            <div>
              <span className="text-xs font-mono text-purple-300">PÓ DE MEMÓRIA DISPONÍVEL</span>
              <p className="text-[10px] text-slate-400">Preservado através de todas as mortes</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xl font-bold text-purple-200">
            <span className="text-purple-400 text-sm">✦</span>
            <span>{memoryDust}</span>
            <span className="text-xs text-purple-400/80 font-normal">Dust</span>
          </div>
        </div>

        {/* Upgrades List */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {upgradeDefinitions.map((upg) => {
            const currentLevel = upgrades[upg.key];
            const canAfford = memoryDust >= upg.cost;
            const Icon = upg.icon;

            return (
              <div
                key={upg.key}
                className={`relative rounded-2xl border bg-gradient-to-r ${upg.bgGlow} p-4 transition-all duration-200 ${upg.borderColor}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90">
                      <Icon className={`h-5 w-5 ${upg.iconColor}`} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono text-sm font-bold text-white">
                          {upg.name}
                        </h3>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-300 border border-slate-700">
                          Nível {currentLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-tight">
                        {upg.description}
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
                        <span className="text-slate-300">
                          Atual: <strong className="text-white">{upg.getStatText(currentLevel)}</strong>
                        </span>
                        <span className="text-emerald-400">
                          Próximo: <strong>{upg.getNextStatText(currentLevel)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buy Button */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <button
                      onClick={() => onBuyUpgrade(upg.key, upg.cost)}
                      disabled={!canAfford}
                      className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-mono font-bold transition active:scale-95 cursor-pointer ${
                        canAfford
                          ? 'border border-rose-400 bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:brightness-110'
                          : 'border border-slate-800 bg-slate-900/70 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span>Aprimorar</span>
                      <span className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] ${
                        canAfford ? 'bg-black/30 text-rose-200' : 'bg-slate-950 text-slate-600'
                      }`}>
                        ✦ {upg.cost}
                      </span>
                    </button>
                    {!canAfford && (
                      <span className="text-[9.5px] font-mono text-rose-400/80">
                        Falta {upg.cost - memoryDust} Dust
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-900 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
            <Shield className="h-3.5 w-3.5" />
            <span>Upgrades persistem para todas as vidas futuras.</span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2 text-xs font-mono text-slate-300 hover:border-slate-500 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <span>Retornar ao Santuário</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
              ESC
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
