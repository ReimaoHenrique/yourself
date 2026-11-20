import { useState } from "react";
import { useProfileController } from "../../controllers";
import "./MeetingsView.css";

export function MeetingsView() {
  const [slugQuery, setSlugQuery] = useState("default");
  const { profile, meetings, loading, error, scheduleMeeting } = useProfileController(slugQuery);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [meetMsg, setMeetMsg] = useState("");

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !guestName || !guestEmail || !title || !startTime || !endTime) return;
    const res = await scheduleMeeting({
      hostId: profile.id,
      guestName,
      guestEmail,
      title,
      startTime,
      endTime,
    });
    if (res) {
      setMeetMsg(`Reunião agendada com sucesso! Link do Meet: ${res.meetLink}`);
      setGuestName("");
      setGuestEmail("");
      setTitle("");
      setStartTime("");
      setEndTime("");
    } else {
      setMeetMsg("Erro ao agendar reunião (horário pode estar ocupado).");
    }
  };

  return (
    <div className="meetings-page">
      <h1>Reuniões & Google Meet</h1>
      <p className="subtitle">Agende horários e gere salas do Google Meet vinculadas ao seu perfil</p>

      <div className="search-box">
        <label>Perfil Anfitrião (Slug):</label>
        <div className="search-row">
          <input
            type="text"
            value={slugQuery}
            onChange={(e) => setSlugQuery(e.target.value)}
            placeholder="Ex: default"
          />
        </div>
      </div>

      {loading && <p>Carregando...</p>}
      {error && <p className="error">{error}</p>}

      <div className="meetings-grid">
        <section className="card">
          <h2>Agendar Nova Reunião</h2>
          {profile ? (
            <form onSubmit={handleSchedule} className="form">
              <div className="form-group">
                <label>Título da Reunião:</label>
                <input
                  type="text"
                  placeholder="Ex: Reunião de Alinhamento"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nome do Convidado:</label>
                <input
                  type="text"
                  placeholder="Ex: Maria Souza"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email do Convidado:</label>
                <input
                  type="email"
                  placeholder="Ex: maria@email.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                />
              </div>
              <div className="row-inputs">
                <div className="form-group">
                  <label>Data/Hora Início:</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Data/Hora Fim:</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn">Agendar e Gerar Meet</button>
              {meetMsg && <p className="meet-msg">{meetMsg}</p>}
            </form>
          ) : (
            <p>Nenhum perfil encontrado para "{slugQuery}". Cadastre seu perfil na aba "Perfil" primeiro.</p>
          )}
        </section>

        <section className="card">
          <h2>Reuniões Confirmadas ({meetings.length})</h2>
          <ul className="meetings-list">
            {meetings.length === 0 ? (
              <p>Nenhuma reunião agendada.</p>
            ) : (
              meetings.map((m) => (
                <li key={m.id}>
                  <strong>{m.title}</strong>
                  <p>Convidado: {m.guestName} ({m.guestEmail})</p>
                  <span>Início: {new Date(m.startTime).toLocaleString()}</span>
                  <div className="meet-link-box">
                    <a href={m.meetLink} target="_blank" rel="noreferrer">🔗 {m.meetLink}</a>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
