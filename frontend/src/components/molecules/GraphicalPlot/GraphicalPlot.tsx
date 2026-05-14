import React, { useMemo } from "react";
import type { GraphicalData, GraphPoint } from "../../../types/simplex";
import styles from "./GraphicalPlot.module.css";

interface GraphicalPlotProps {
  data: GraphicalData;
}

const WIDTH = 560;
const HEIGHT = 360;
const PADDING = { top: 18, right: 16, bottom: 36, left: 48 };
const TICKS = 5;

export const GraphicalPlot: React.FC<GraphicalPlotProps> = ({ data }) => {
  const { bounds } = data;

  const { scaleX, scaleY, xTicks, yTicks, plotWidth, plotHeight } = useMemo(() => {
    const xSpan = Math.max(1e-6, bounds.x_max - bounds.x_min);
    const ySpan = Math.max(1e-6, bounds.y_max - bounds.y_min);
    const plotW = WIDTH - PADDING.left - PADDING.right;
    const plotH = HEIGHT - PADDING.top - PADDING.bottom;

    const sx = (x: number) =>
      PADDING.left + ((x - bounds.x_min) / xSpan) * plotW;
    const sy = (y: number) =>
      PADDING.top + plotH - ((y - bounds.y_min) / ySpan) * plotH;

    const xs = Array.from({ length: TICKS + 1 }, (_, i) =>
      bounds.x_min + (xSpan * i) / TICKS,
    );
    const ys = Array.from({ length: TICKS + 1 }, (_, i) =>
      bounds.y_min + (ySpan * i) / TICKS,
    );

    return { scaleX: sx, scaleY: sy, xTicks: xs, yTicks: ys, plotWidth: plotW, plotHeight: plotH };
  }, [bounds]);

  const polygonPath = useMemo(() => {
    if (!data.feasible_polygon || data.feasible_polygon.length < 3) return null;
    const d = data.feasible_polygon
      .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.x)} ${scaleY(p.y)}`)
      .join(" ");
    return `${d} Z`;
  }, [data.feasible_polygon, scaleX, scaleY]);

  const toPath = (points: GraphPoint[]) => {
    if (points.length < 2) return "";
    const [p1, p2] = points;
    return `M ${scaleX(p1.x)} ${scaleY(p1.y)} L ${scaleX(p2.x)} ${scaleY(p2.y)}`;
  };

  return (
    <div className={styles.card}>
      <svg
        className={styles.plot}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Gráfico del método gráfico"
      >
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={plotWidth}
          height={plotHeight}
          className={styles.plotBg}
        />

        {xTicks.map((x, i) => (
          <g key={`x-${i}`}>
            <line
              x1={scaleX(x)}
              y1={PADDING.top}
              x2={scaleX(x)}
              y2={PADDING.top + plotHeight}
              className={styles.gridLine}
            />
            <text x={scaleX(x)} y={PADDING.top + plotHeight + 18} className={styles.tickLabel}>
              {fmtTick(x)}
            </text>
          </g>
        ))}

        {yTicks.map((y, i) => (
          <g key={`y-${i}`}>
            <line
              x1={PADDING.left}
              y1={scaleY(y)}
              x2={PADDING.left + plotWidth}
              y2={scaleY(y)}
              className={styles.gridLine}
            />
            <text x={PADDING.left - 10} y={scaleY(y) + 4} className={styles.tickLabel}>
              {fmtTick(y)}
            </text>
          </g>
        ))}

        <line
          x1={scaleX(0)}
          y1={PADDING.top}
          x2={scaleX(0)}
          y2={PADDING.top + plotHeight}
          className={styles.axisLine}
        />
        <line
          x1={PADDING.left}
          y1={scaleY(0)}
          x2={PADDING.left + plotWidth}
          y2={scaleY(0)}
          className={styles.axisLine}
        />

        {polygonPath && <path d={polygonPath} className={styles.feasibleArea} />}

        {data.constraints.map((line) => (
          <path key={line.label ?? `${line.a}-${line.b}-${line.c}`} d={toPath(line.points)} className={styles.constraintLine} />
        ))}

        {data.objective_line && (
          <path d={toPath(data.objective_line.points)} className={styles.objectiveLine} />
        )}

        {data.vertices.map((p, i) => (
          <circle key={`v-${i}`} cx={scaleX(p.x)} cy={scaleY(p.y)} r={3} className={styles.vertexPoint} />
        ))}

        {data.optimal_point && (
          <circle
            cx={scaleX(data.optimal_point.x)}
            cy={scaleY(data.optimal_point.y)}
            r={5}
            className={styles.optimalPoint}
          />
        )}

        <text x={PADDING.left + plotWidth - 8} y={PADDING.top + plotHeight + 28} className={styles.axisLabel}>
          x1
        </text>
        <text x={PADDING.left - 24} y={PADDING.top + 4} className={styles.axisLabel}>
          x2
        </text>
      </svg>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchConstraint].join(" ")} />
          Restricciones
        </span>
        <span className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchRegion].join(" ")} />
          Región factible
        </span>
        <span className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchObjective].join(" ")} />
          Línea objetivo
        </span>
        <span className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchOptimal].join(" ")} />
          Punto óptimo
        </span>
      </div>

      {data.status !== "optimal" && (
        <p className={styles.statusNote}>
          Estado: {data.status}. El gráfico aún muestra las restricciones e intersecciones disponibles.
        </p>
      )}
    </div>
  );
};

function fmtTick(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.0+$/, "");
}
