// frontend/src/Login.jsx
import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState(null);
<div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md font-cursive"></div>

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Login failed");
      onLogin(data.access_token, data.user);
    } catch (err) {
      setMsg("Error: " + err.message);
    }
  };

  return (
    <div>
      <h3>Login</h3>
      <form onSubmit={submit}>
        <div>
          <input required placeholder="username or email" value={form.username}
            onChange={(e)=>setForm({...form, username:e.target.value})} />
        </div>
        <div>
          <input required type="password" placeholder="password" value={form.password}
            onChange={(e)=>setForm({...form, password:e.target.value})} />
        </div>
        <button type="submit">Login</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}