import React, { useMemo, useEffect } from 'react';
import { BoonId, BoonInfo } from '../types/game';
import { Sword, Zap, Droplets, Flame, Sparkles, X } from 'lucide-react';

export const ALL_BOONS: Record<BoonId, BoonInfo> = {
  colossal_blade: {
    id: 'colossal_blade',
    name: 'Lâmina Colossal',
    subtitle: 'Extensão Dimensional do Golpe',
    description: 'O alcance da hitbox física e a varredura visual do corte com a espada aumentam em 50%.',
    iconName: 'Sword',
    color: '#06b6d4',
    borderColor: '#22d3ee',
    badge: 'OFENSIVO',
  },
  shattering_dash: {
    id: 'shattering_dash',
    name: 'Passos Estilhaçantes',
    subtitle: 'Ruptura Cinética Ofensiva',
    description: 'O Dash se torna uma arma de impacto: inimigos atingidos sofrem 40 de dano e o rastro torna-se Dourado.',
    iconName: 'Zap',
    color: '#f59e0b',
    borderColor: '#fbbf24',
    badge: 'CINÉTICO',
  },
  blood_siphon: {
    id: 'blood_siphon',
    name: 'Sifão de Sangue',
    subtitle: 'Drenagem de Essência Temporal',
    description: 'Matar qualquer aberração ou inimigo recupera instantaneamente +2 de HP (até o HP Máximo).',
    iconName: 'Droplets',
    color: '#10b981',
    borderColor: '#34d399',
    badge: 'VITALIDADE',
  },
  frenzy: {
    id: 'frenzy',
    name: 'Frenesi Implacável',
    subtitle: 'Aceleração Temporal do Golpe',
    description: 'O tempo de recarga do corte de espada é reduzido em 50%, permitindo cortes velozes em sequência.',
    iconName: 'Flame',
    color: '#d946ef',
    borderColor: '#f472b6',
    badge: 'VELOCIDADE',
  },
};

interface BoonSelectionProps {
  activeBoons: BoonId[];
  onSelectBoon: (boonId: BoonId) => void;
  onClose: () => void;
}

export const BoonSelection: React.FC<BoonSelectionProps> = ({
  activeBoons,
  onSelectBoon,
  onClose,
}) => {
  // Select 3 random boons to present to player
  const choices = useMemo(() => {
    const allKeys = Object.keys(ALL_BOONS) as BoonId[];
    // Shuffle
    const shuffled = [...allKeys].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3).map((key) => ALL_BOONS[key]);
  }, []);

  // Keyboard shortcut listeners (1, 2, 3, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && choices[0]) {
        onSelectBoon(choices[0].id);
      } else if (e.key === '2' && choices[1]) {
        onSelectBoon(choices[1].id);
      } else if (e.key === '3' && choices[2]) {
        onSelectBoon(choices[2].id);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [choices, onSelectBoon, onClose]);

  const renderIcon = (iconName: string, color: string) => {
    const props = { className: 'w-7 h-7', style: { color } };
    switch (iconName) {
      case 'Sword':
        return <Sword {...props} />;
      case 'Zap':
        return <Zap {...props} />;
      case 'Droplets':
        return <Droplets {...props} />;
      case 'Flame':
        return <Flame {...props} />;
      default:
        return <Sparkles {...props} />;
    }
  };

  return (
    <div
      id="boon-selection-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-4xl rounded-2xl border border-cyan-500/40 bg-[#050510]/95 p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title="Fechar [ESC]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/50 bg-cyan-950/60 text-cyan-300 text-xs font-mono font-bold mb-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>ALTAR DE ECO • ESCOLHA UMA BÊNÇÃO</span>
          </div>
          <h2 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-300 to-indigo-200 font-mono">
            ABSORVA O PODER DO TEMPO
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Poderes temporários concedidos pela ressonância dos ecos da realidade nesta jornada.
          </p>
        </div>

        {/* 3 Boon Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {choices.map((boon, index) => {
            const isAlreadyActive = activeBoons.includes(boon.id);

            return (
              <button
                key={boon.id}
                onClick={() => onSelectBoon(boon.id)}
                className={`group relative flex flex-col justify-between rounded-xl border p-5 text-left transition-all duration-200 hover:-translate-y-1 ${
                  isAlreadyActive
                    ? 'border-cyan-400/60 bg-cyan-950/30 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                    : 'border-slate-800 bg-slate-900/60 hover:border-cyan-400/70 hover:bg-slate-900/90 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]'
                }`}
              >
                {/* Number Key Indicator */}
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  {isAlreadyActive && (
                    <span className="text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50 px-1.5 py-0.5 rounded">
                      ATIVO
                    </span>
                  )}
                  <span className="w-5 h-5 rounded border border-slate-700 bg-slate-950/80 font-mono text-[10px] text-slate-300 flex items-center justify-center font-bold group-hover:border-cyan-400 group-hover:text-cyan-300">
                    {index + 1}
                  </span>
                </div>

                <div>
                  {/* Icon & Category Badge */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg border bg-slate-950/90 shadow-inner group-hover:scale-105 transition-transform"
                      style={{ borderColor: boon.borderColor }}
                    >
                      {renderIcon(boon.iconName, boon.color)}
                    </div>
                    <div>
                      <span
                        className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                        style={{
                          color: boon.color,
                          borderColor: `${boon.color}40`,
                          backgroundColor: `${boon.color}15`,
                        }}
                      >
                        {boon.badge}
                      </span>
                      <h3 className="font-mono font-bold text-sm text-slate-100 mt-1 group-hover:text-cyan-300 transition-colors">
                        {boon.name}
                      </h3>
                    </div>
                  </div>

                  {/* Subtitle */}
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide mb-2">
                    {boon.subtitle}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {boon.description}
                  </p>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Pressione [{index + 1}] ou Clique</span>
                  <span
                    className="font-bold font-mono group-hover:translate-x-1 transition-transform"
                    style={{ color: boon.color }}
                  >
                    Absorver →
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Hint */}
        <div className="mt-6 text-center text-[10.5px] font-mono text-slate-500">
          Dica: Bênçãos ativas duram até o final da Run atual (limpas ao retornar ao Santuário).
        </div>
      </div>
    </div>
  );
};
