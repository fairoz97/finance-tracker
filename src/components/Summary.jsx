import React, { useMemo } from "react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

function toJSDate(ts) {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}

export default function Summary({ items, month }) {
  const monthStart = startOfMonth(new Date(month + "-01"));
  const monthEnd = endOfMonth(monthStart);

  const monthItems = useMemo(() => {
    return items.filter((t) => {
      const d = toJSDate(t.date);
      if (!d) return false;
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
  }, [items, monthStart, monthEnd]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of monthItems) {
      const a = Number(t.amount || 0);
      if (t.type === "income") income += a;
      else expense += a;
    }
    return { income, expense, net: income - expense };
  }, [monthItems]);

  const byCategory = useMemo(() => {
    const m = new Map();
    for (const t of monthItems) {
      if (t.type !== "expense") continue;
      const key = t.category || "Uncategorized";
      m.set(key, (m.get(key) || 0) + Number(t.amount || 0));
    }
    return Array.from(m.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthItems]);

  const dailyNet = useMemo(() => {
    const m = new Map();
    for (const t of monthItems) {
      const d = toJSDate(t.date);
      if (!d) continue;
      const key = format(d, "yyyy-MM-dd");
      const amt = Number(t.amount || 0) * (t.type === "income" ? 1 : -1);
      m.set(key, (m.get(key) || 0) + amt);
    }
    return Array.from(m.entries())
      .map(([date, net]) => ({ date, net }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [monthItems]);

  return (
    <div className="grid" style={{ gap: 12 }}>
      <div className="grid grid-3">
        <div className="card">
          <div className="subtle">Income ({month})</div>
          <div className="h1 mono">{totals.income.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="subtle">Expense ({month})</div>
          <div className="h1 mono">{totals.expense.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="subtle">Net ({month})</div>
          <div className="h1 mono">{totals.net.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-3">
        <div className="card" style={{ minHeight: 280 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="subtle">Expenses by category</div>
              <div className="subtle" style={{ fontSize: 12 }}>
                {byCategory.length ? "Top categories" : "No expenses yet"}
              </div>
            </div>
          </div>

          <div className="spacer" />
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={85} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ gridColumn: "span 2", minHeight: 280 }}>
          <div className="subtle">Daily net (income − expense)</div>
          <div className="spacer" />
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyNet}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="net" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
