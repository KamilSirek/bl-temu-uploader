"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login === "kamil" && password === "kamil") {
      localStorage.setItem("vsprint_logged_in", "1");
      router.push("/");
    } else {
      setError("Nieprawidłowy login lub hasło");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(120deg, #fd6615 0%, #fff 100%)" }}>
      <form onSubmit={handleSubmit} style={{ background: "#fff", padding: 36, borderRadius: 16, boxShadow: "0 4px 32px #0002", minWidth: 340, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <img src="/logo.png" alt="Logo" style={{ height: 48, marginBottom: 18 }} />
        <h2 style={{ color: "#fd6615", marginBottom: 24, fontWeight: 700 }}>Logowanie</h2>
        <input type="text" placeholder="Login" value={login} onChange={e => setLogin(e.target.value)} style={{ marginBottom: 16, padding: 10, borderRadius: 8, border: '1px solid #ccc', width: '100%', fontSize: 16 }} />
        <input type="password" placeholder="Hasło" value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: 20, padding: 10, borderRadius: 8, border: '1px solid #ccc', width: '100%', fontSize: 16 }} />
        <button type="submit" style={{ background: "#fd6615", color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", width: "100%", fontSize: 17, fontWeight: 600, cursor: "pointer", marginBottom: 10 }}>Zaloguj się</button>
        {error && <div style={{ color: "#d00", marginTop: 6 }}>{error}</div>}
      </form>
    </div>
  );
} 