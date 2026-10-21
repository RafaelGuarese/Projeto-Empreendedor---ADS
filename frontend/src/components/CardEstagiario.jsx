import { useNavigate } from "react-router-dom";

import Avatar from "./Avatar.jsx";
import Icone from "./Icone.jsx";

const LABEL_TIPO = { presencial: "Presencial", online: "Online", ambos: "Presencial e online" };

export default function CardEstagiario({ estagiario }) {
  const navegar = useNavigate();

  return (
    <article className="card-estagiario">
      <div className="card-estagiario-topo">
        <Avatar nome={estagiario.nome} tamanho={50} />
        <div>
          <div className="nome">{estagiario.nome}</div>
          <span className="avaliacao">
            <Icone nome="estrela" tamanho={14} preenchido />
            {estagiario.avaliacao ? estagiario.avaliacao.toFixed(1) : "Novo"}
          </span>
        </div>
      </div>

      <div className="consulta-tags">
        <span className="tag">{estagiario.abordagem}</span>
        <span className="tag tag-secundaria">
          <Icone nome={estagiario.tipoAtendimento === "presencial" ? "local" : "video"} tamanho={13} />
          {LABEL_TIPO[estagiario.tipoAtendimento] || estagiario.tipoAtendimento}
        </span>
      </div>

      {estagiario.especialidades.length > 0 && (
        <div className="chips">
          {estagiario.especialidades.map((esp) => (
            <span key={esp} className="chip">
              {esp}
            </span>
          ))}
        </div>
      )}

      {estagiario.horariosDisponiveis.length > 0 && (
        <span className="info-linha">
          <Icone nome="relogio" tamanho={15} />
          {estagiario.horariosDisponiveis.join(" · ")}
        </span>
      )}

      <div className="card-estagiario-rodape">
        <span className="preco">
          R$ {estagiario.valorConsulta?.toFixed(2)} <small>/ sessão</small>
        </span>
        <button className="botao botao-primario botao-pequeno" onClick={() => navegar(`/agendar/${estagiario.id}`)}>
          Agendar
        </button>
      </div>
    </article>
  );
}
