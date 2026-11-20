import { useState } from "react";
import { useProfileController } from "../../controllers";
import "./ProfileView.css";

export function ProfileView() {
  const [slugQuery, setSlugQuery] = useState("default");
  const { profile, calendarEvents, loading, error, saveProfile } = useProfileController(slugQuery);

  const [formSlug, setFormSlug] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formGoogleToken, setFormGoogleToken] = useState("");
  const [msg, setMsg] = useState("");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSlug || !formName || !formEmail) return;
    const res = await saveProfile({
      slug: formSlug,
      name: formName,
      email: formEmail,
      googleToken: formGoogleToken.trim() || undefined,
    });
    if (res) {
      setMsg("Perfil e informações Google salvos com sucesso no Docker SQLite!");
      setSlugQuery(formSlug);
      setFormGoogleToken("");
    } else {
      setMsg("Erro ao salvar perfil.");
    }
  };

  return (
    <div className="profile-page">
      <h1>Meu Perfil & Conta Google</h1>
      <p className="subtitle">Gerencie seu perfil, email e informações de integração com o Google Calendar</p>

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

      <div className="profile-grid">
        <section className="card">
          <h2>Informações do Perfil</h2>
          {profile ? (
            <div className="profile-details">
              <div className="info-item">
                <span className="label">Nome:</span>
                <span className="value">{profile.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Slug:</span>
                <span className="value">{profile.slug}</span>
              </div>
              <div className="info-item">
                <span className="label">Email:</span>
                <span className="value">{profile.email}</span>
              </div>
              <div className="info-item">
                <span className="label">Horário de Trabalho:</span>
                <span className="value">{profile.startHour} às {profile.endHour}</span>
              </div>
              <div className="info-item">
                <span className="label">Status Google:</span>
                <span className={`value ${profile.googleToken ? "connected" : "disconnected"}`}>
                  {profile.googleToken ? "🔗 Conta Google Vinculada" : "⚠️ Não vinculado"}
                </span>
              </div>
            </div>
          ) : (
            <p>Nenhum perfil encontrado para "{slugQuery}". Preencha o formulário ao lado para criar.</p>
          )}

          {profile && profile.googleToken && (
            <div className="calendar-sync-section">
              <h3>📅 Eventos Sincronizados do Google Calendar ({calendarEvents.length})</h3>
              <ul className="events-list">
                {calendarEvents.length === 0 ? (
                  <p>Nenhum evento futuro encontrado.</p>
                ) : (
                  calendarEvents.map((ev) => (
                    <li key={ev.id}>
                      <strong>{ev.summary || "Sem título"}</strong>
                      <span>{new Date(ev.start.dateTime || ev.start.date || "").toLocaleString()}</span>
                      {ev.hangoutLink && (
                        <a href={ev.hangoutLink} target="_blank" rel="noreferrer">🔗 Google Meet</a>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </section>

        <section className="card">
          <h2>Criar / Atualizar Perfil & Google Account</h2>
          <form onSubmit={handleSaveProfile} className="form">
            <div className="form-group">
              <label>Slug (Identificador URL):</label>
              <input
                type="text"
                placeholder="Ex: joao"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Nome Completo:</label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                placeholder="Ex: joao@email.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Google OAuth Access Token:</label>
              <input
                type="password"
                placeholder="Cole seu token de acesso Google"
                value={formGoogleToken}
                onChange={(e) => setFormGoogleToken(e.target.value)}
              />
              <small className="help-text">Permite buscar informações do seu Google Calendar e criar links oficiais do Meet.</small>
            </div>
            <button type="submit" className="btn">Salvar Perfil</button>
            {msg && <span className="msg">{msg}</span>}
          </form>
        </section>
      </div>
    </div>
  );
}
