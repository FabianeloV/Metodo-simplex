import React from "react";
import { Badge } from "../../atoms/Badge";
import { MetricCard } from "../../molecules/MetricCard";
import { ErrorBanner } from "../../molecules/ErrorBanner";
import { Spinner } from "../../atoms/Spinner";
import { Plot3D } from "../../molecules/Plot3D";
import type { GraphicalMultivarResponse, CriticalPointNature } from "../../../types/graphicalMultivar";
import styles from "./GraphicalMultivarSolutionDisplay.module.css";

interface GraphicalMultivarSolutionDisplayProps {
  result: GraphicalMultivarResponse | null;
  loading: boolean;
  error: string | null;
}

const NATURE_LABEL: Record<CriticalPointNature, string> = {
  min: "Mínimo",
  max: "Máximo",
  saddle: "Silla",
  degenerate: "Degenerado",
};

const NATURE_BADGE_COLOR: Record<CriticalPointNature, "green" | "red" | "blue" | "gray"> = {
  min: "green",
  max: "red",
  saddle: "blue",
  degenerate: "gray",
};

function fmt(n: number, digits = 6): string {
  if (!Number.isFinite(n)) return "—";
  const r = Number(n.toPrecision(digits));
  return String(r);
}

export const GraphicalMultivarSolutionDisplay: React.FC<GraphicalMultivarSolutionDisplayProps> = ({
  result,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className={styles.loadingCard}>
        <Spinner size={22} />
        <span className={styles.loadingText}>Buscando puntos críticos y armando el gráfico…</span>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;
  if (!result) return null;

  const { optimal_point, optimal_value, status, variables, critical_points, surface, volume } = result;
  const found = status === "optimal";

  return (
    <section className={styles.card} aria-labelledby="graphical-multivar-result-heading">
      <div className={styles.resultHeader}>
        <div>
          <h2 id="graphical-multivar-result-heading" className={styles.cardTitle}>
            {found ? "Solución: Óptimo Encontrado" : "Sin Punto Óptimo Exacto"}
          </h2>
          <p className={styles.cardSub}>{result.message}</p>
        </div>
        {found ? (
          <Badge color="green">✓ Encontrado</Badge>
        ) : (
          <Badge color="red">Sin coincidencia</Badge>
        )}
      </div>

      <div className={styles.exprBlock}>
        <div className={styles.exprRow}>
          <span className={styles.exprLabel}>f({variables.join(", ")})</span>
          <code className={styles.expr}>{result.function_str}</code>
        </div>
      </div>

      {optimal_point !== null && optimal_value !== null && (
        <div className={styles.metrics}>
          {optimal_point.map((val, idx) => (
            <MetricCard key={variables[idx]} label={`${variables[idx]}*`} value={fmt(val)} highlight />
          ))}
          <MetricCard label="f(x*)" value={fmt(optimal_value)} highlight />
          <MetricCard label="Puntos críticos" value={String(critical_points.length)} />
        </div>
      )}

      {(surface || volume) && (
        <div className={styles.plotSection}>
          <Plot3D
            variables={variables}
            surface={surface}
            volume={volume}
            criticalPoints={critical_points}
          />
        </div>
      )}

      {critical_points.length > 0 && (
        <div className={styles.tableSection}>
          <p className={styles.sectionLabel}>Puntos críticos</p>
          <div className={styles.wrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  {variables.map((v) => <th key={v}>{v}</th>)}
                  <th>f</th>
                  <th>Naturaleza</th>
                </tr>
              </thead>
              <tbody>
                {critical_points.map((cp, i) => (
                  <tr key={i}>
                    <td className={styles.idxCell}>{i + 1}</td>
                    {cp.point.map((val, j) => (
                      <td key={j}>{fmt(val)}</td>
                    ))}
                    <td>{fmt(cp.value)}</td>
                    <td>
                      <Badge color={NATURE_BADGE_COLOR[cp.nature]}>{NATURE_LABEL[cp.nature]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
