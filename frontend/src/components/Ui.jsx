import Icone from "./Icone.jsx";

const ICONE_ALERTA = { erro: "alerta", sucesso: "check", aviso: "relogio", info: "info" };

export function Alerta({ tipo = "info", children, className = "" }) {
  return (
    <div className={`alerta alerta-${tipo} ${className}`} role={tipo === "erro" ? "alert" : "status"}>
      <Icone nome={ICONE_ALERTA[tipo]} tamanho={18} />
      <div>{children}</div>
    </div>
  );
}

export function CabecalhoPagina({ titulo, subtitulo, sobretitulo, acoes }) {
  return (
    <header className="cabecalho-pagina">
      <div>
        {sobretitulo && <span className="sobretitulo">{sobretitulo}</span>}
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      {acoes && <div className="cabecalho-acoes">{acoes}</div>}
    </header>
  );
}

export function EstadoVazio({ icone = "info", titulo, children }) {
  return (
    <div className="estado-vazio">
      <span className="estado-vazio-icone">
        <Icone nome={icone} tamanho={26} />
      </span>
      {titulo && <strong>{titulo}</strong>}
      {children && <p>{children}</p>}
    </div>
  );
}

export function Carregando({ texto = "Carregando..." }) {
  return (
    <div className="carregando">
      <span className="spinner" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}
