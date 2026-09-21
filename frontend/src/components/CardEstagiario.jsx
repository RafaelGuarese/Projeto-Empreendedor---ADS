const RESPOSTA_AGENDAR =
  'O agendamento (RF3) ainda não foi implementado nesta versão. Este botão demonstra o fluxo "Agendar" descrito no protótipo de Busca de Atendimento.';

export default function CardEstagiario({ estagiario }) {
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
        <button className="botao-agendar" onClick={() => alert(RESPOSTA_AGENDAR)}>
          Agendar
        </button>
      </div>
    </article>
  );
}
