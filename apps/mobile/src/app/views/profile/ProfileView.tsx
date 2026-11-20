import { useState } from "react";
import { useProfileController } from "../../controllers";
import "./ProfileView.css";

export function ProfileView() {
  const [slugQuery, setSlugQuery] = useState("default");
  const { profile, meetings, loading, error, saveProfile, scheduleMeeting } = useProfileController(slugQuery);

  const [formSlug, setFormSlug] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [msg, setMsg] = useState("");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [meetMsg, setMeetMsg] = useState("");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSlug || !formName || !formEmail) return;
    const res = await saveProfile({
      slug: formSlug,
      name: formName,
      email: formEmail,
    });
    if (res) {
      setMsg("Perfil salvo com sucesso no Docker SQLite!");
      setSlugQuery(formSlug);
    } else {
      setMsg("Erro ao salvar perfil.");
    }
  };

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
      setMeetMsg(`Reunião agendada! Link do Meet: ${res.meetLink}`);
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
    <div className="profile-view">
      <h1>Gerenciamento de Perfil & Reuniões (Docker + SQLite)</h1>
      <p className="subtitle">Conectado ao backend Hono na porta 8787</p>

      <div className="search-box">
        <label>Buscar perfil por slug:</label>
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

      <div className="grid-sections">
        <section className="card">
          <h2>Perfil Atual</h2>
          {profile ? (
            <div className="profile-info">
              <p><strong>Nome:</strong> {profile.name}</p>
              <p><strong>Slug:</strong> {profile.slug}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Horário:</strong> {profile.startHour} às {profile.endHour}</p>
              <p><strong>Duração slot:</strong> {profile.slotDurationMinutes} min</p>
            </div>
          ) : (
            <p>Nenhum perfil encontrado para "{slugQuery}". Crie abaixo.</p>
          )}

          <h3>Criar / Atualizar Perfil</h3>
          <form onSubmit={handleSaveProfile} className="form">
            <input
              type="text"
              placeholder="Slug (ex: joao)"
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Nome"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn">Salvar Perfil</button>
            {msg && <span className="msg">{msg}</span>}
          </form>
        </section>

        <section className="card">
          <h2>Agendar Reunião</h2>
          {profile ? (
            <form onSubmit={handleSchedule} className="form">
              <input
                type="text"
                placeholder="Título da Reunião"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Nome do Convidado"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email do Convidado"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
              />
              <div className="row-inputs">
                <div>
                  <label>Início:</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>Fim:</label>
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
            <p>Selecione ou crie um perfil válido acima para agendar reuniões.</p>
          )}

          <h3>Reuniões Confirmadas ({meetings.length})</h3>
          <ul className="meetings-list">
            {meetings.map((m) => (
              <li key={m.id}>
                <strong>{m.title}</strong> — {m.guestName} ({new Date(m.startTime).toLocaleString()})
                <br />
                <a href={m.meetLink} target="_blank" rel="noreferrer">🔗 {m.meetLink}</a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
