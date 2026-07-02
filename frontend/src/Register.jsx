// frontend/src/Register.jsx
import React, { useState } from "react";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Error");
      setMsg("Registered! You can now log in.");
      setForm({ username: "", email: "", password: "" });
    } catch (err) {
      setMsg("Error: " + err.message);
    }
  };

  return (
    <div>
      <h3>Register</h3>
      <form onSubmit={submit}>
        <div>
          <input required placeholder="username" value={form.username}
            onChange={(e)=>setForm({...form, username:e.target.value})} />
        </div>
        <div>
          <input required placeholder="email" value={form.email}
            onChange={(e)=>setForm({...form, email:e.target.value})} />
        </div>
        <div>
          <input required type="password" placeholder="password" value={form.password}
            onChange={(e)=>setForm({...form, password:e.target.value})} />
        </div>
        <button type="submit">Register</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}