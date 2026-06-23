import React from "react";
import { Badge } from "../../atoms/Badge";
import { MetricCard } from "../../molecules/MetricCard";
import { ErrorBanner } from "../../molecules/ErrorBanner";
import { FunctionPlot } from "../../molecules/FunctionPlot";
import type { GraphicalResult } from "../../../utils/graphical";
import styles from "./GraphicalSolutionDisplay.module.css";

interface GraphicalSolutionDisplayProps {
  result: GraphicalResult | null;
  error: string | null;
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const r = Number(n.toPrecision(6));
  return String(r);
}

export const GraphicalSolutionDisplay: React.FC<GraphicalSolutionDisplayProps> = ({
  result,
  error,
}) => {
  if (error) return <ErrorBanner message={error} />;
  if (!result) return null;

  const goalWord = result.goal === "max" ? "máximo" : "mínimo";

  return (
    <section className={styles.card} aria-labelledby="graph-result-heading">
      <div className={styles.resultHeader}>
        <div>
          <h2 id="graph-result-heading" className={styles.cardTitle}>
            Solución Gráfica
          </h2>
          <p className={styles.cardSub}>
            f(x) trazada sobre el intervalo; el óptimo se ubica comparando los
            puntos críticos (f′(x) = 0) con los extremos del intervalo.
          </p>
        </div>
        {result.optimalAtEndpoint
          ? <Badge color="blue">Óptimo en el borde</Badge>
          : <Badge color="green">✓ {goalWord}</Badge>}
      </div>

      <div className={styles.exprBlock}>
        <div className={styles.exprRow}>
          <span className={styles.exprLabel}>f(x)</span>
          <code className={styles.expr}>{result.functionStr}</code>
        </div>
        <div className={styles.exprRow}>
          <span className={styles.exprLabel}>f′(x)</span>
          <code className={styles.expr}>{result.derivativeStr}</code>
        </div>
      </div>

      <div className={styles.metrics}>
        <MetricCard label={`x* (${goalWord})`} value={fmt(result.optimalX)} highlight />
        <MetricCard label="f(x*)" value={fmt(result.optimalValue)} highlight />
        <MetricCard label="Naturaleza" value={result.nature} />
        <MetricCard label="Puntos críticos" value={String(result.critical.length)} />
      </div>

      <FunctionPlot result={result} />

      {result.critical.length > 0 && (
        <div className={styles.tableSection}>
          <p className={styles.sectionLabel}>Puntos críticos en el intervalo</p>
          <div className={styles.wrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>x</th>
                  <th>f(x)</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {result.critical.map((c, i) => {
                  const isOpt = Math.abs(c.x - result.optimalX) < 1e-7;
                  return (
                    <tr key={i} className={isOpt ? styles.optRow : undefined}>
                      <td>{fmt(c.x)}</td>
                      <td>{fmt(c.fx)}</td>
                      <td>{c.type}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
