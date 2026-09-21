import { createContext, useContext, useEffect, useState } from "react";

import api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("psicoliga_token");

    if (!token) {
      setCarregando(false);
      return;
    }

    api
      .get("/auth/me")
      .then(({ data }) => setUsuario(data.usuario))
      .catch(() => {
        localStorage.removeItem("psicoliga_token");
      })
      .finally(() => setCarregando(false));
  }, []);

  function login(token, dadosUsuario) {
    localStorage.setItem("psicoliga_token", token);
    setUsuario(dadosUsuario);
  }

  function logout() {
    localStorage.removeItem("psicoliga_token");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
