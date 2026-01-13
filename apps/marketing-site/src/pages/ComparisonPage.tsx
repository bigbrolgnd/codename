// Icons are currently not used in this version but kept for potential future use
// import { Check, Info, Shield, Zap, Layout, Star } from 'lucide-react';

export const ComparisonPage = () => {
  const comparisons = [
    {
      feature: 'Speed to Live',
      znapsite: '2 minutes (AI builds it)',
      wix: '4-8 hours (Manual DIY)',
      squarespace: '4-6 hours (Manual DIY)',
      advantage: '120x Faster'
    },
    {
      feature: 'Maintenance',
      znapsite: 'Zero. Automatically updates with social posts.',
      wix: 'Manual. You edit every time.',
      squarespace: 'Manual. You edit every time.',
      advantage: 'Fully Automated'
    },
    {
      feature: 'SEO',
      znapsite: 'Built-in. Automatic metadata & schema.',
      wix: 'DIY. Manual configuration.',
      squarespace: 'DIY. Manual configuration.',
      advantage: 'Hands-free SEO'
    },
    {
      feature: 'AI Strategy',
      znapsite: 'Core to product. AI is the builder.',
      wix: 'Add-on. Experimental tools.',
      squarespace: 'Add-on. Template-first.',
      advantage: 'Native AI'
    },
    {
      feature: 'Free Tier',
      znapsite: 'Permanent value. No time limit.',
      wix: '14-day trial / Ad-supported.',
      squarespace: '14-day trial.',
      advantage: 'Permanent Value'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black mb-6">Stop building. Start <span className="text-[var(--color-accent)]">growing.</span></h1>
          <p className="text-xl text-[var(--text-muted)]">Why spend your weekend in a drag-and-drop editor?</p>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-6 font-bold uppercase tracking-widest text-xs text-white/40">Feature</th>
                  <th className="p-6 font-bold text-[var(--color-accent)] text-lg">Znapsite</th>
                  <th className="p-6 font-medium text-white/60">Wix / SS</th>
                  <th className="p-6 font-bold text-green-400">Advantage</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="p-6 font-semibold text-white/80">{row.feature}</td>
                    <td className="p-6 font-bold">{row.znapsite}</td>
                    <td className="p-6 text-white/40">{row.wix}</td>
                    <td className="p-6 font-bold text-green-400 text-sm">{row.advantage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-12 items-center bg-[var(--color-accent)]/10 p-12 rounded-3xl border border-[var(--color-accent)]/20">
          <div>
            <h2 className="text-3xl font-bold mb-4">Lean into the simplicity.</h2>
            <p className="text-[var(--text-muted)] text-lg leading-relaxed">
              We have fewer templates than Wix. <span className="text-white font-bold">On purpose.</span>
              <br /><br />
              Wix gives you 500 ways to fail. Znapsite gives you 1 way to win: 
              A high-conversion site that works while you sleep.
            </p>
          </div>
          <div className="text-center">
            <button className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all hover:scale-105 hover:shadow-[0_0_40px_var(--color-accent-glow)] cursor-pointer">
              Try free for 2 minutes →
            </button>
            <p className="mt-4 text-sm text-[var(--text-muted)] italic">Then decide if you ever want to go back.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
