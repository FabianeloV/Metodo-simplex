import React from "react";
import type { TableauRow } from "../../../types/simplex";
import styles from "./TableauTable.module.css";

interface TableauTableProps {
  headers: string[];
  rows: TableauRow[];
}

function fmt(n: number): string {
  if (Math.abs(n) < 1e-8) return "0";
  const r = Math.round(n * 10000) / 10000;
  return Number.isInteger(r) ? String(r) : r.toFixed(4).replace(/\.?0+$/, "");
}

export const TableauTable: React.FC<TableauTableProps> = ({ headers, rows }) => (
  <div className={styles.wrapper}>
    <table className={styles.table}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const isZ = row.basic_variable === "Z";
          return (
            <tr key={i} className={isZ ? styles.zRow : ""}>
              <td className={isZ ? styles.zCell : styles.basicCell}>
                {row.basic_variable}
              </td>
              {row.values.map((v, j) => (
                <td key={j} className={j === row.values.length - 1 ? styles.rhs : ""}>
                  {fmt(v)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
