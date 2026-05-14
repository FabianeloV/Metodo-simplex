import React from "react";
import { Badge } from "../../atoms/Badge";
import { MetricCard } from "../../molecules/MetricCard";
import { TableauTable } from "../../molecules/TableauTable";
import { GraphicalPlot } from "../../molecules/GraphicalPlot";
import { ErrorBanner } from "../../molecules/ErrorBanner";
import { Spinner } from "../../atoms/Spinner";
import type { SimplexResponse, VariableCount } from "../../../types/simplex";
import styles from "./SolutionDisplay.module.css";

interface SolutionDisplayProps {
  nVars: VariableCount;
  result: SimplexResponse | null;
  loading: boolean;
  error: string | null;
}

function fmtNum(n: number): string {
  if (Math.abs(n) < 1e-8) return "0";
  const r = Math.round(n * 10000) / 10000;
  return Number.isInteger(r) ? String(r) : r.toFixed(4).replace(/\.?0+$/, "");
}

const VAR_LABELS = ["x₁", "x₂", "x₃", "x₄"];

const statusBadge = (status: string) => {
  if (status === "optimal")    return <Badge color="green">✓ Óptimo</Badge>;
  if (status === "unbounded")  return <Badge color="red">No acotado</Badge>;
  if (status === "infeasible") return <Badge color="red">No factible</Badge>;
  return null;
};

export const SolutionDisplay: React.FC<SolutionDisplayProps> = ({
  nVars,
  result,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className={styles.loadingCard}>
        <Spinner size={22} />
        <span className={styles.loadingText}>Resolviendo…</span>
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;
  if (!result) return null;

  const isOptimal = result.status === "optimal";
  const showGraph = nVars === 2 && !!result.graphical;

  return (
    <section className={styles.card} aria-labelledby="result-heading">
      <div className={styles.resultHeader}>
        <div>
          <h2 id="result-heading" className={styles.cardTitle}>
            {isOptimal ? "Solución: Resultado Óptimo Encontrado" : `Solución: ${result.status}`}
          </h2>
          <p className={styles.cardSub}>{result.message}</p>
        </div>
        {statusBadge(result.status)}
      </div>

      {isOptimal && result.variables && result.objective_value !== undefined && (
        <>
          <div className={styles.metrics}>
            <MetricCard
              label="Objetivo (Z)"
              value={fmtNum(result.objective_value)}
              highlight
            />
            {Array.from({ length: nVars }, (_, i) => {
              const key = `x${i + 1}`;
              return (
                <MetricCard
                  key={key}
                  label={VAR_LABELS[i]}
                  value={fmtNum(result.variables![key] ?? 0)}
                />
              );
            })}
          </div>

          {showGraph && result.graphical && (
            <div className={styles.graphSection}>
              <div className={styles.graphHeader}>
                <h3 className={styles.graphTitle}>Método Gráfico (2 variables)</h3>
                <p className={styles.graphSub}>
                  Región factible, líneas de restricción y línea objetivo en el óptimo.
                </p>
              </div>
              <GraphicalPlot data={result.graphical} />
            </div>
          )}

          {result.tableau_headers && result.tableau_rows && (
            <>
              <p className={styles.tableauLabel}>Tabla Simplex Final</p>
              <TableauTable
                headers={result.tableau_headers}
                rows={result.tableau_rows}
              />
            </>
          )}
        </>
      )}

      {!isOptimal && result.message && (
        <ErrorBanner message={result.message} />
      )}
    </section>
  );
};
