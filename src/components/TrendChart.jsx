import React, { memo, useMemo } from 'react';

const TrendChart = memo(({ data, color = '#22d3ee', unit = '', decimals = 1 }) => {
  const chartMath = useMemo(() => {
    if (!Array.isArray(data) || data.length < 2) return null;

    const padding = 20;
    const width = 300;
    const height = 120;

    const values = data.map(d => Number(d.val));
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const valRange = (maxVal - minVal) || 1;

    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((Number(d.val) - minVal) / valRange) * (height - padding * 2);
      return { x, y, val: d.val, label: d.label };
    });

    const pathD = points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    const firstVal = values[0];
    const lastVal = values[values.length - 1];
    const diff = lastVal - firstVal;

    return { padding, width, height, points, pathD, areaD, diff };
  }, [data]);

  if (!chartMath) {
    return (
      <div className="h-32 flex items-center justify-center bg-zinc-950/50 rounded-2xl border border-zinc-800 text-[10px] text-zinc-600 font-mono">
        Trend çizmek için en az 2 kayıt gerekli
      </div>
    );
  }

  const { padding, width, height, points, pathD, areaD, diff } = chartMath;
  const isPositive = diff > 0;

  return (
    <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2">
      <div className="flex justify-between items-center text-[9px] font-mono">
        <span className="text-zinc-500 uppercase tracking-wider font-bold">Zaman İçinde Değişim</span>
        <span className={`font-bold px-1.5 py-0.5 rounded ${diff === 0 ? 'text-zinc-400 bg-zinc-900' : isPositive ? 'text-emerald-400 bg-emerald-950/40' : 'text-red-400 bg-red-950/40'}`}>
          {diff > 0 ? '+' : ''}{diff.toFixed(decimals)} {unit}
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#27272a" strokeWidth="1" />

        <path d={areaD} fill={`url(#gradient-${color.replace('#', '')})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#09090b" stroke={color} strokeWidth="2" />
            {(i === 0 || i === points.length - 1) && (
              <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#a1a1aa" fontSize="8" className="font-mono">
                {Number(p.val).toFixed(decimals)}
              </text>
            )}
          </g>
        ))}
      </svg>

      <div className="flex justify-between text-[8px] text-zinc-600 font-mono px-1 uppercase">
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
});

TrendChart.displayName = 'TrendChart';

export default TrendChart;
