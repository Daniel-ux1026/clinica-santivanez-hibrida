CREATE TABLE IF NOT EXISTS staff (
 id serial PRIMARY KEY, username text UNIQUE NOT NULL, role text NOT NULL,
 password_hash text NOT NULL, doctor_id text
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash text PRIMARY KEY, staff_id integer NOT NULL REFERENCES staff(id), expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS appointments (
 id uuid PRIMARY KEY, doctor_id text NOT NULL, visit_date date NOT NULL,
 visit_time text NOT NULL, contact_name text NOT NULL, email text NOT NULL,
 status text NOT NULL, source_version integer NOT NULL, received_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS outbox (
 command_id uuid PRIMARY KEY, booking_id uuid NOT NULL REFERENCES appointments(id),
 base_version integer NOT NULL, status text NOT NULL,
 delivered boolean NOT NULL DEFAULT false, result text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS clinical_records (
 id text PRIMARY KEY, patient_label text NOT NULL, doctor_id text NOT NULL,
 clinical_note text NOT NULL
);
INSERT INTO clinical_records VALUES
 ('HC-DEMO-001','Paciente sintético 001','med-001','Registro académico ficticio. Sin información de una persona real.'),
 ('HC-DEMO-002','Paciente sintético 002','med-002','Registro académico ficticio para comprobar restricciones por médico.')
 ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS audit (
 id bigserial PRIMARY KEY, actor text NOT NULL, action text NOT NULL,
 result text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
