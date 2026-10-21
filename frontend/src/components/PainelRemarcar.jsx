import { useEffect, useState } from "react";

import api from "../api/client.js";
import SeletorHorario from "./SeletorHorario.jsx";
import { Alerta, Carregando } from "./Ui.jsx";

export default function PainelRemarcar({ consulta, onRemarcada, onCancelar }) {
  const [slots, setSlots] = useState([]);
  const [slotSelecionado, setSlotSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get(`/consultas/estagiario/${consulta.estagiario.id}/disponibilidade`)
      .then(({ data }) => setSlots(data.horariosDisponiveis))
      .catch((err) => setErro(err.response?.data?.mensagem || "Não foi possível carregar os horários."))
      .finally(() => setCarregando(false));
  }, [consulta.estagiario.id]);

  async function confirmar() {
    if (!slotSelecionado) {
      setErro("Selecione um novo horário.");
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      await api.put(`/consultas/${consulta.id}/remarcar`, { novaDataHora: slotSelecionado });
      onRemarcada();
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível remarcar a consulta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="painel-remarcar">
      <h4>Escolha a nova data</h4>
      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      {carregando ? (
        <Carregando texto="Carregando horários..." />
      ) : slots.length === 0 ? (
        <p className="campo-ajuda">Nenhum outro horário disponível para remarcar.</p>
      ) : (
        <SeletorHorario slots={slots} selecionado={slotSelecionado} onSelecionar={setSlotSelecionado} />
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button className="botao botao-primario" onClick={confirmar} disabled={enviando || !slotSelecionado}>
          {enviando ? "Salvando..." : "Confirmar nova data"}
        </button>
        <button type="button" className="botao botao-secundario" onClick={onCancelar}>
          Voltar
        </button>
      </div>
    </div>
  );
}
