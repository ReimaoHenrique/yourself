import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { DatabaseSync } from 'node:sqlite';
import { serve } from '@hono/node-server';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = process.env.DATA_DIR || './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new DatabaseSync(dbPath);

// Inicializar banco de dados SQLite com suporte a google_token
db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      timezone TEXT DEFAULT 'America/Bahia',
      slot_duration_minutes INTEGER DEFAULT 30,
      work_days TEXT DEFAULT '1,2,3,4,5',
      start_hour TEXT DEFAULT '09:00:00',
      end_hour TEXT DEFAULT '18:00:00',
      google_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      host_id TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      title TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      meet_link TEXT NOT NULL,
      status TEXT DEFAULT 'confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (host_id) REFERENCES profiles(id) ON DELETE CASCADE,
      CONSTRAINT unique_host_slot UNIQUE (host_id, start_time)
  );
`);

try {
  db.exec(`ALTER TABLE profiles ADD COLUMN google_token TEXT;`);
} catch {}

const app = new Hono();

app.use('/*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

// Buscar perfil público e regras de disponibilidade pelo slug
app.get('/profiles/:slug', (c) => {
  const slug = c.req.param('slug');
  const stmt = db.prepare(`
    SELECT id, slug, name, timezone, slot_duration_minutes, work_days, start_hour, end_hour, google_token, email
    FROM profiles WHERE slug = ? LIMIT 1
  `);
  const profile = stmt.get(slug);

  if (!profile) {
    return c.json({ error: 'Perfil não encontrado' }, 404);
  }
  return c.json(profile);
});

// Criar ou atualizar perfil e horários com conta Google
app.post('/profiles', async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const slug = body.slug;
    const name = body.name;
    const email = body.email;
    const slot_duration_minutes = body.slot_duration_minutes || 30;
    const start_hour = body.start_hour || '09:00';
    const end_hour = body.end_hour || '18:00';
    const timezone = body.timezone || 'America/Bahia';
    const work_days = Array.isArray(body.work_days) ? body.work_days.join(',') : (body.work_days || '1,2,3,4,5');
    const google_token = body.google_token || body.googleToken || null;

    const upsertStmt = db.prepare(`
      INSERT INTO profiles (id, slug, name, email, timezone, slot_duration_minutes, work_days, start_hour, end_hour, google_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        slug = excluded.slug,
        name = excluded.name,
        slot_duration_minutes = excluded.slot_duration_minutes,
        work_days = excluded.work_days,
        start_hour = excluded.start_hour,
        end_hour = excluded.end_hour,
        timezone = excluded.timezone,
        google_token = COALESCE(excluded.google_token, profiles.google_token)
      RETURNING *
    `);
    const profile = upsertStmt.get(id, slug, name, email, timezone, slot_duration_minutes, work_days, start_hour, end_hour, google_token);
    return c.json(profile, 201);
  } catch (err: any) {
    return c.json({ error: err.message || 'Erro ao salvar perfil' }, 500);
  }
});

// Buscar eventos do Google Calendar para um perfil vinculado
app.get('/profiles/:id/calendar-events', async (c) => {
  const profileId = c.req.param('id');
  const stmt = db.prepare(`SELECT google_token FROM profiles WHERE id = ? LIMIT 1`);
  const profile: any = stmt.get(profileId);

  if (!profile || !profile.google_token) {
    return c.json({ error: 'Conta Google não vinculada a este perfil.' }, 400);
  }

  try {
    const now = new Date().toISOString();
    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${profile.google_token}`,
        },
      }
    );

    if (!calRes.ok) {
      return c.json({ error: 'Falha ao autenticar com o Google Calendar. Verifique o token.' }, 401);
    }

    const data: any = await calRes.json();
    return c.json(data.items || []);
  } catch (err: any) {
    return c.json({ error: err.message || 'Erro ao buscar eventos do Google Calendar' }, 500);
  }
});

// Gerador de código de sala estilo Google Meet (xxx-yyyy-zzz)
function generateMeetCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${part(3)}-${part(4)}-${part(3)}`;
}

// Listar reuniões agendadas de um anfitrião
app.get('/meetings/:hostId', (c) => {
  const hostId = c.req.param('hostId');
  const stmt = db.prepare(`
    SELECT id, guest_name, title, start_time, end_time, meet_link, status
    FROM meetings
    WHERE host_id = ? AND status = 'confirmed'
    ORDER BY start_time ASC
  `);
  const meetings = stmt.all(hostId);
  return c.json(meetings);
});

// Agendar nova reunião com integração Google Calendar & Google Meet (e fallback simulado)
app.post('/meetings', async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    let meetLink = '';
    
    let googleToken = body.googleToken;
    if (!googleToken && body.host_id) {
      const pStmt = db.prepare(`SELECT google_token FROM profiles WHERE id = ? LIMIT 1`);
      const p: any = pStmt.get(body.host_id);
      if (p && p.google_token) {
        googleToken = p.google_token;
      }
    }
    if (!googleToken) {
      googleToken = process.env.GOOGLE_ACCESS_TOKEN;
    }

    if (googleToken) {
      try {
        const calRes = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${googleToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              summary: body.title,
              description: `Reunião agendada por ${body.guestName} (${body.guestEmail}) via Yourself`,
              start: { dateTime: body.startTime },
              end: { dateTime: body.endTime },
              attendees: [{ email: body.guestEmail }],
              conferenceData: {
                createRequest: {
                  requestId: crypto.randomUUID(),
                  conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
              },
            }),
          }
        );

        if (calRes.ok) {
          const calData: any = await calRes.json();
          meetLink = calData.hangoutLink || calData.htmlLink || '';
        }
      } catch (err) {
        console.warn('Aviso: Falha na API do Google Calendar, usando link simulado.', err);
      }
    }

    if (!meetLink) {
      meetLink = generateMeetCode();
    }

    const stmt = db.prepare(`
      INSERT INTO meetings (id, host_id, guest_name, guest_email, title, start_time, end_time, meet_link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      body.host_id,
      body.guest_name,
      body.guest_email,
      body.title,
      body.start_time,
      body.end_time,
      meetLink
    );

    const getStmt = db.prepare(`SELECT * FROM meetings WHERE id = ?`);
    const meeting = getStmt.get(id);
    return c.json(meeting, 201);
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'Este horário acabou de ser reservado por outra pessoa.' }, 409);
    }
    return c.json({ error: err.message || 'Erro ao agendar reunião.' }, 500);
  }
});

const port = Number(process.env.PORT || 8787);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`🚀 Backend service running on http://localhost:${info.port}`);
  }
);
