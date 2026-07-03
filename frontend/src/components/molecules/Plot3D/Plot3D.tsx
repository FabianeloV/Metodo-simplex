import React, { useMemo } from "react";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-dist-min";
import type { CriticalPoint, SurfaceData, VolumeData } from "../../../types/graphicalMultivar";
import styles from "./Plot3D.module.css";

const Plot = createPlotlyComponent(Plotly);

const NATURE_COLOR: Record<CriticalPoint["nature"], string> = {
  min: "#059669",
  max: "#DC2626",
  saddle: "#D97706",
  degenerate: "#6B7280",
};

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[idx];
}

const LAYOUT_BASE = {
  autosize: true,
  margin: { l: 0, r: 0, t: 10, b: 0 },
  paper_bgcolor: "transparent",
  font: { family: "'DM Mono', monospace", size: 11, color: "#374151" },
};

const CONFIG = { displaylogo: false, responsive: true };

interface Plot3DProps {
  variables: string[];
  surface: SurfaceData | null;
  volume: VolumeData | null;
  criticalPoints: CriticalPoint[];
}

export const Plot3D: React.FC<Plot3DProps> = ({ variables, surface, volume, criticalPoints }) => {
  const critMarker = useMemo(
    () => ({
      size: 5,
      symbol: "diamond",
      color: criticalPoints.map((cp) => NATURE_COLOR[cp.nature]),
    }),
    [criticalPoints],
  );

  if (surface) {
    const surfaceTrace = {
      type: "surface",
      x: surface.x,
      y: surface.y,
      z: surface.z,
      colorscale: "Viridis",
      opacity: 0.92,
      showscale: false,
      contours: { z: { show: true, usecolormap: true, project: { z: true } } },
    };

    const critScatter3d = {
      type: "scatter3d",
      mode: "markers",
      name: "Puntos críticos",
      x: criticalPoints.map((cp) => cp.point[0]),
      y: criticalPoints.map((cp) => cp.point[1]),
      z: criticalPoints.map((cp) => cp.value),
      marker: critMarker,
    };

    const contourTrace = {
      type: "contour",
      x: surface.x,
      y: surface.y,
      z: surface.z,
      colorscale: "Viridis",
      contours: { coloring: "heatmap" },
      showscale: false,
    };

    const critScatter2d = {
      type: "scatter",
      mode: "markers",
      name: "Puntos críticos",
      x: criticalPoints.map((cp) => cp.point[0]),
      y: criticalPoints.map((cp) => cp.point[1]),
      marker: { ...critMarker, size: 9, line: { color: "#fff", width: 1 } },
    };

    return (
      <div className={styles.grid}>
        <div className={styles.plotBox}>
          <p className={styles.plotTitle}>Superficie 3D — z = f({variables.join(", ")})</p>
          <Plot
            data={[surfaceTrace, critScatter3d]}
            layout={{
              ...LAYOUT_BASE,
              scene: {
                xaxis: { title: variables[0] },
                yaxis: { title: variables[1] },
                zaxis: { title: `f(${variables.join(", ")})` },
              },
            }}
            config={CONFIG}
            style={{ width: "100%", height: "420px" }}
            useResizeHandler
          />
        </div>
        <div className={styles.plotBox}>
          <p className={styles.plotTitle}>Curvas de nivel</p>
          <Plot
            data={[contourTrace, critScatter2d]}
            layout={{
              ...LAYOUT_BASE,
              xaxis: { title: variables[0] },
              yaxis: { title: variables[1] },
            }}
            config={CONFIG}
            style={{ width: "100%", height: "420px" }}
            useResizeHandler
          />
        </div>
      </div>
    );
  }

  if (volume) {
    const finite = volume.value.filter((v): v is number => v !== null).sort((a, b) => a - b);
    const isomin = finite.length ? percentile(finite, 0.25) : 0;
    const isomax = finite.length ? percentile(finite, 0.75) : 1;

    const isoTrace = {
      type: "isosurface",
      x: volume.x,
      y: volume.y,
      z: volume.z,
      value: volume.value.map((v) => (v === null ? NaN : v)),
      isomin,
      isomax,
      surface: { count: 3 },
      colorscale: "Viridis",
      showscale: false,
      caps: { x: { show: false }, y: { show: false }, z: { show: false } },
    };

    const critScatter3d = {
      type: "scatter3d",
      mode: "markers",
      name: "Puntos críticos",
      x: criticalPoints.map((cp) => cp.point[0]),
      y: criticalPoints.map((cp) => cp.point[1]),
      z: criticalPoints.map((cp) => cp.point[2]),
      marker: critMarker,
    };

    return (
      <div className={styles.plotBox}>
        <p className={styles.plotTitle}>
          Isosuperficie de f({variables.join(", ")}) (nivel ≈ percentil 25–75) y puntos críticos
        </p>
        <Plot
          data={[isoTrace, critScatter3d]}
          layout={{
            ...LAYOUT_BASE,
            scene: {
              xaxis: { title: variables[0] },
              yaxis: { title: variables[1] },
              zaxis: { title: variables[2] },
            },
          }}
          config={CONFIG}
          style={{ width: "100%", height: "480px" }}
          useResizeHandler
        />
      </div>
    );
  }

  return null;
};
