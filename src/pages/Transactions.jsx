import React, { useEffect, useMemo, useState } from "react";
import Summary from "../components/Summary";
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
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0,7)); //YYYY-MM

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

const historyItems = items.filter((t) => {
  const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
  const ym = d.toISOString().slice(0, 7);
  return ym === month;
});

return (
  <div className="container">
    <div className="header">
      <div>
        <h1 className="h1">Finance Tracker</h1>
        <div className="subtle">Signed in</div>
      </div>
      <button className="button ghost" onClick={() => signOut(auth)}>
        Sign out
      </button>
    </div>

    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="subtle">Month</div>
          <div className="subtle" style={{ fontSize: 12 }}>Choose a month to view summary</div>
        </div>
        <input
          className="input"
          style={{ maxWidth: 220 }}
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>
    </div>

    <div className="spacer" />
    <Summary items={items} month={month} />

    <div className="spacer" />
    <div className="card">
      <div className="subtle">Add transaction</div>
      <div className="spacer" />

      <form onSubmit={addTransaction} className="formgrid">
        <select className="select span-1" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="expense">expense</option>
          <option value="income">income</option>
        </select>

        <input
          className="input span-1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          inputMode="decimal"
        />

        <input
          className="input span-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
        />
	
	<div className="row span-6">
  {["Food", "Transport", "Groceries", "Bills", "Fun", "Health"].map((c) => (
    <button
      key={c}
      type="button"
      className="button"
      onClick={() => setCategory(c)}
    >
      {c}
    </button>
  ))}
</div>	

        <input
          className="input span-1"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <button className="button primary span-1" type="submit">
          Add
        </button>

        <input
          className="input span-6"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note"
        />
      </form>
    </div>

    <div className="spacer" />
    <div className="card">
      <div className="subtle">History</div>
      <div className="spacer" />

      <div className="list">
        {historyItems.map((t) => (
          <div key={t.id} className="card" style={{ padding: 12 }}>
            <div className="item">
              <div>
                <div>
                  <b>{t.type}</b> • {t.category} • {formatDate(t.date)}
                </div>
                {t.note ? <div className="subtle">{t.note}</div> : null}
              </div>

              <div className="row">
                <div className="mono">{fmt.format(Number(t.amount || 0))}</div>
                <button className="button" onClick={() => remove(t.id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
}

const fmt = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().slice(0, 10);
}
