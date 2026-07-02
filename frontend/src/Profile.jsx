// frontend/src/Profile.jsx
import React, { useEffect, useState } from "react";

export default function Profile({ token, setUser, user }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch("http://localhost:5000/api/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.msg || "Failed to fetch");
        setUser(data.user);
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [token, setUser]);

  if (loading) return <p>Loading profile...</p>;
  if (err) return <p>Error: {err}</p>;
  if (!user) return <p>No user data</p>;

  return (
    <div>
      <h3>Profile</h3>
      <p>Username: {user.username}</p>
      <p>Email: {user.email}</p>
    </div>
  );
}