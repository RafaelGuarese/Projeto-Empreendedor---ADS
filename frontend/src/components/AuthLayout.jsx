import Icone from "./Icone.jsx";
import Logo from "./Logo.jsx";

const DESTAQUES = [
  { icone: "busca", texto: "Encontre estagiários pela abordagem e pela sua necessidade" },
  { icone: "calendario", texto: "Agende e pague com PIX em poucos passos" },
  { icone: "video", texto: "Atendimento presencial ou por videochamada" },
  { icone: "escudo", texto: "Acompanhamento supervisionado por professores" },
];

export default function AuthLayout({ titulo, subtitulo, children, largo = false }) {
  return (
    <div className="auth">
      <aside className="auth-painel">
        <Logo claro tamanho={40} />
        <div className="auth-painel-conteudo">
          <h2>Cuidado psicológico acessível, perto de você.</h2>
          <p>Uma ponte entre pacientes e estagiários de Psicologia em estágio supervisionado.</p>
          <ul className="auth-destaques">
            {DESTAQUES.map((d) => (
              <li key={d.icone}>
                <span className="auth-destaque-icone">
                  <Icone nome={d.icone} tamanho={18} />
                </span>
                {d.texto}
              </li>
            ))}
          </ul>
        </div>
        <span className="auth-painel-rodape">Estágio supervisionado em Psicologia</span>
      </aside>

      <main className="auth-conteudo">
        <div className={`auth-cartao ${largo ? "auth-cartao-largo" : ""}`}>
          <div className="auth-logo-mobile">
            <Logo tamanho={36} />
          </div>
          <h1 className="auth-titulo">{titulo}</h1>
          {subtitulo && <p className="auth-subtitulo">{subtitulo}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
