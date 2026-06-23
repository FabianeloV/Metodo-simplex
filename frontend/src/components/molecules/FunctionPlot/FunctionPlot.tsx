import React, { useMemo } from "react";
import type { GraphicalResult } from "../../../utils/graphical";
import styles from "./FunctionPlot.module.css";

interface FunctionPlotProps {
  result: GraphicalResult;
}

const WIDTH = 560;
const HEIGHT = 360;
const PADDING = { top: 18, right: 18, bottom: 36, left: 54 };
const TICKS = 5;

function fmtTick(value: number): string {
  const r = Math.round(value * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/\.?0+$/, "");
}

export const FunctionPlot: React.FC<FunctionPlotProps> = ({ result }) => {
  const { bounds, points, critical, optimalX, optimalValue } = result;

  const { sx, sy, xTicks, yTicks, plotW, plotH } = useMemo(() => {
    const xSpan = Math.max(1e-9, bounds.xMax - bounds.xMin);
    const ySpan = Math.max(1e-9, bounds.yMax - bounds.yMin);
    const w = WIDTH - PADDING.left - PADDING.right;
    const h = HEIGHT - PADDING.top - PADDING.bottom;

    const scaleX = (x: number) => PADDING.left + ((x - bounds.xMin) / xSpan) * w;
    const scaleY = (y: number) => PADDING.top + h - ((y - bounds.yMin) / ySpan) * h;

    const xs = Array.from({ length: TICKS + 1 }, (_, i) => bounds.xMin + (xSpan * i) / TICKS);
    const ys = Array.from({ length: TICKS + 1 }, (_, i) => bounds.yMin + (ySpan * i) / TICKS);

    return { sx: scaleX, sy: scaleY, xTicks: xs, yTicks: ys, plotW: w, plotH: h };
  }, [bounds]);

  const curvePath = useMemo(
    () =>
      points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`)
        .join(" "),
    [points, sx, sy],
  );

  const showXAxis = bounds.yMin <= 0 && bounds.yMax >= 0; // recta y = 0
  const showYAxis = bounds.xMin <= 0 && bounds.xMax >= 0; // recta x = 0

  const optX = sx(optimalX);
  const optY = sy(optimalValue);
  const labelLeft = optX > WIDTH - 90; // evita que la etiqueta se salga por la derecha

  return (
    <div className={styles.card}>
      <svg
        className={styles.plot}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Gráfica de f(x) y su óptimo"
      >
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={plotW}
          height={plotH}
          className={styles.plotBg}
        />

        {xTicks.map((x, i) => (
          <g key={`x-${i}`}>
            <line x1={sx(x)} y1={PADDING.top} x2={sx(x)} y2={PADDING.top + plotH} className={styles.gridLine} />
            <text x={sx(x)} y={PADDING.top + plotH + 18} className={styles.tickLabel}>
              {fmtTick(x)}
            </text>
          </g>
        ))}

        {yTicks.map((y, i) => (
          <g key={`y-${i}`}>
            <line x1={PADDING.left} y1={sy(y)} x2={PADDING.left + plotW} y2={sy(y)} className={styles.gridLine} />
            <text x={PADDING.left - 10} y={sy(y) + 4} className={styles.tickLabel}>
              {fmtTick(y)}
            </text>
          </g>
        ))}

        {showXAxis && (
          <line x1={PADDING.left} y1={sy(0)} x2={PADDING.left + plotW} y2={sy(0)} className={styles.axisLine} />
        )}
        {showYAxis && (
          <line x1={sx(0)} y1={PADDING.top} x2={sx(0)} y2={PADDING.top + plotH} className={styles.axisLine} />
        )}

        {/* Curva f(x) */}
        <path d={curvePath} className={styles.curve} />

        {/* Puntos críticos (excepto el óptimo, que se marca aparte) */}
        {critical.map((c, i) => (
          <circle key={`c-${i}`} cx={sx(c.x)} cy={sy(c.fx)} r={3.5} className={styles.criticalPoint} />
        ))}

        {/* Punto óptimo */}
        <line x1={optX} y1={PADDING.top} x2={optX} y2={PADDING.top + plotH} className={styles.optimalGuide} />
        <circle cx={optX} cy={optY} r={5.5} className={styles.optimalPoint} />
        <text
          x={labelLeft ? optX - 9 : optX + 9}
          y={optY - 9}
          className={styles.optimalLabel}
          textAnchor={labelLeft ? "end" : "start"}
        >
          ({fmtTick(optimalX)}, {fmtTick(optimalValue)})
        </text>

        <text x={PADDING.left + plotW - 4} y={PADDING.top + plotH + 28} className={styles.axisLabel}>
          x
        </text>
        <text x={PADDING.left - 30} y={PADDING.top + 6} className={styles.axisLabel}>
          f(x)
        </text>
      </svg>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchCurve].join(" ")} />
          f(x)
        </span>
        <span className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchCritical].join(" ")} />
          Puntos críticos
        </span>
        <span className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchOptimal].join(" ")} />
          Óptimo
        </span>
      </div>
    </div>
  );
};
