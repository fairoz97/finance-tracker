import React from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export default function Login() {
  async function handleLogin() {
    await signInWithPopup(auth, googleProvider);
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h1>Finance Tracker</h1>
      <p>Sign in to continue.</p>
      <button onClick={handleLogin}>Sign in with Google</button>
    </div>
  );
}
