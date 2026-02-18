import React, { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Transactions({ user }) {
  const [items, setItems] = useState([]);
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("General");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

useEffect(() => {
  const q = query(
    collection(db, "transactions"),
    where("uid", "==", user.uid),
    orderBy("date", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      console.error("onSnapshot failed:", err);
      alert("Listener error: " + (err?.message || String(err)));
    }
  );
}, [user.uid]);

  const totals = useMemo(() => {
    let income = 0,
      expense = 0;

    for (const t of items) {
      const a = Number(t.amount || 0);
      if (t.type === "income") income += a;
      else expense += a;
    }

    return { income, expense, net: income - expense };
  }, [items]);

 async function addTransaction(e) {
  e.preventDefault();

  
  const amt = Number(amount);
  if (!amt || amt <= 0) {
    alert("Amount is invalid. Enter something like 12.34");
    return;
  }

  try {
    await addDoc(collection(db, "transactions"), {
      uid: user.uid,
      type,
      amount: amt,
      category,
      note,
      date: Timestamp.fromDate(new Date(date)),
      createdAt: serverTimestamp(),
    });

    
    setAmount("");
    setNote("");
  } catch (err) {
    console.error("Add transaction failed:", err);
    alert("Firestore error: " + (err?.message || String(err)));
  }
}

  async function remove(id) {
    await deleteDoc(doc(db, "transactions", id));
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
        }}
      >
        <h1>Transactions</h1>
        <button onClick={() => signOut(auth)}>Sign out</button>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Stat label="Income" value={totals.income} />
        <Stat label="Expense" value={totals.expense} />
        <Stat label="Net" value={totals.net} />
      </div>

      <h2 style={{ marginTop: 24 }}>Add</h2>
      <form
        onSubmit={addTransaction}
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(6, 1fr)",
        }}
      >
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ gridColumn: "span 1" }}
        >
          <option value="expense">expense</option>
          <option value="income">income</option>
        </select>

        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          inputMode="decimal"
          style={{ gridColumn: "span 1" }}
        />

        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          style={{ gridColumn: "span 2" }}
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ gridColumn: "span 1" }}
        />

        <button type="submit" style={{ gridColumn: "span 1" }}>
          Add
        </button>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note"
          style={{ gridColumn: "span 6" }}
        />
      </form>

      <h2 style={{ marginTop: 24 }}>History</h2>
      <div style={{ display: "grid", gap: 8 }}>
        {items.map((t) => (
          <div
            key={t.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div>
                <b>{t.type}</b> • {t.category} • {formatDate(t.date)}
              </div>
              {t.note ? <div style={{ opacity: 0.8 }}>{t.note}</div> : null}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontVariantNumeric: "tabular-nums" }}>
                {Number(t.amount).toFixed(2)}
              </div>
              <button onClick={() => remove(t.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 12,
        minWidth: 180,
      }}
    >
      <div style={{ opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 20, fontVariantNumeric: "tabular-nums" }}>
        {value.toFixed(2)}
      </div>
    </div>
  );
}

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().slice(0, 10);
}
