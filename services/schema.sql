-- Tabela do Serviço 1: Perfil e Regras de Agenda
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/Bahia',
    slot_duration_minutes INT DEFAULT 30,
    work_days INT[] DEFAULT '{1,2,3,4,5}', -- 1=Seg a 5=Sex
    start_hour TIME DEFAULT '09:00:00',
    end_hour TIME DEFAULT '18:00:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela do Serviço 2: Reuniões Agendadas
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    guest_name VARCHAR(150) NOT NULL,
    guest_email VARCHAR(150) NOT NULL,
    title VARCHAR(200) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    meet_link TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Trava para evitar duas reuniões no mesmo horário para o mesmo anfitrião
    CONSTRAINT unique_host_slot UNIQUE (host_id, start_time)
);
