import { useNavigate } from "react-router-dom";

export default function CardEstagiario({ estagiario }) {
  const navegar = useNavigate();

  return (
    <article className="card-estagiario">
      <span className="abordagem-tag">{estagiario.abordagem}</span>
      <span className="nome-estagiario">{estagiario.nome}</span>
      <span className="tipo-atendimento-tag">{estagiario.tipoAtendimento}</span>
      {estagiario.especialidades.length > 0 && (
        <span className="especialidades">{estagiario.especialidades.join(", ")}</span>
      )}
      {estagiario.horariosDisponiveis.length > 0 && (
        <span className="horarios">Disponível: {estagiario.horariosDisponiveis.join(" · ")}</span>
      )}
      <span className="avaliacao">★ {estagiario.avaliacao?.toFixed(1) ?? "-"}</span>
      <div className="rodape-card">
        <span className="valor">R$ {estagiario.valorConsulta?.toFixed(2)}</span>
        <button className="botao-agendar" onClick={() => navegar(`/agendar/${estagiario.id}`)}>
          Agendar
        </button>
      </div>
    </article>
  );
}
