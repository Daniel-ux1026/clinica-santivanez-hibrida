CREATE TABLE IF NOT EXISTS bookings (
 id uuid PRIMARY KEY, token_hash text NOT NULL, doctor_id text NOT NULL,
 visit_date date NOT NULL, visit_time text NOT NULL,
 contact_name varchar(80) NOT NULL, email varchar(120) NOT NULL,
 reminder_consent boolean NOT NULL DEFAULT false, privacy_version text NOT NULL,
 status text NOT NULL DEFAULT 'Solicitada' CHECK(status IN ('Solicitada','Confirmada','Cancelada')),
 version integer NOT NULL DEFAULT 1, synced_version integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_booking_per_slot
 ON bookings(doctor_id,visit_date,visit_time) WHERE status IN ('Solicitada','Confirmada');
CREATE TABLE IF NOT EXISTS integration_commands (
 command_id uuid PRIMARY KEY, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
