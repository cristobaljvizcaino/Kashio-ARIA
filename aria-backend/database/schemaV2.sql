-- public.artifact_definition definition

-- Drop table

-- DROP TABLE public.artifact_definition;

CREATE TABLE public.artifact_definition (
	id varchar(50) NOT NULL,
	gate varchar(10) NOT NULL,
	"name" varchar(500) NOT NULL,
	initiative_type varchar(20) DEFAULT 'Both'::character varying NULL,
	predecessor_ids jsonb DEFAULT '[]'::jsonb NULL,
	description text NULL,
	mandatory bool DEFAULT false NULL,
	area varchar(50) DEFAULT 'Producto'::character varying NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT artifact_definition_initiative_type_check CHECK (((initiative_type)::text = ANY ((ARRAY['Change'::character varying, 'Run'::character varying, 'Both'::character varying])::text[]))),
	CONSTRAINT artifact_definition_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_artdef_gate ON public.artifact_definition USING btree (gate);
CREATE INDEX idx_artdef_type ON public.artifact_definition USING btree (initiative_type);

-- Table Triggers

create trigger update_artdef_updated_at before
update
    on
    public.artifact_definition for each row execute function update_updated_at_column();


-- public.initiative definition

-- Drop table

-- DROP TABLE public.initiative;

CREATE TABLE public.initiative (
	id varchar(50) NOT NULL,
	"name" varchar(500) NOT NULL,
	product varchar(200) NULL,
	current_gate_id varchar(10) DEFAULT 'G0'::character varying NULL,
	"type" varchar(20) NULL,
	start_date varchar(20) NULL,
	end_date varchar(20) NULL,
	quarter varchar(20) NULL,
	status varchar(100) NULL,
	intake_request_id varchar(50) NULL,
	pipeline_activated bool DEFAULT false NULL,
	artifacts jsonb DEFAULT '[]'::jsonb NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT initiative_pkey PRIMARY KEY (id),
	CONSTRAINT initiative_type_check CHECK (((type)::text = ANY ((ARRAY['Change'::character varying, 'Run'::character varying])::text[])))
);
CREATE INDEX idx_initiative_gate ON public.initiative USING btree (current_gate_id);
CREATE INDEX idx_initiative_quarter ON public.initiative USING btree (quarter);
CREATE INDEX idx_initiative_status ON public.initiative USING btree (status);
CREATE INDEX idx_initiative_type ON public.initiative USING btree (type);

-- Table Triggers

create trigger update_initiative_updated_at before
update
    on
    public.initiative for each row execute function update_updated_at_column();


-- public.intake_request definition

-- Drop table

-- DROP TABLE public.intake_request;

CREATE TABLE public.intake_request (
	id varchar(50) NOT NULL,
	title varchar(500) NULL,
	requester varchar(200) NOT NULL,
	area varchar(100) NULL,
	"type" varchar(50) NULL,
	product varchar(200) NULL,
	"domain" varchar(200) NULL,
	region varchar(200) NULL,
	impact_type varchar(100) NULL,
	severity varchar(5) NULL,
	urgency varchar(20) NULL,
	problem text NOT NULL,
	outcome text NULL,
	"scope" jsonb DEFAULT '[]'::jsonb NULL,
	"constraints" text NULL,
	alternatives text NULL,
	kpi varchar(500) NULL,
	status varchar(50) DEFAULT 'G0_Intake'::character varying NULL,
	aria_analysis text NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT intake_request_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_intake_created ON public.intake_request USING btree (created_at DESC);
CREATE INDEX idx_intake_severity ON public.intake_request USING btree (severity);
CREATE INDEX idx_intake_status ON public.intake_request USING btree (status);

-- Table Triggers

create trigger update_intake_updated_at before
update
    on
    public.intake_request for each row execute function update_updated_at_column();


-- public.library_file definition

-- Drop table

-- DROP TABLE public.library_file;

CREATE TABLE public.library_file (
	id varchar(50) NOT NULL,
	file_name varchar(255) NOT NULL,
	file_type varchar(20) NULL,
	file_size int8 NULL,
	mime_type varchar(100) NULL,
	storage_url text NOT NULL,
	gate varchar(10) NULL,
	category varchar(100) NULL,
	description text NULL,
	uploaded_by varchar(100) NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	deleted_at timestamp NULL,
	CONSTRAINT library_file_file_type_check CHECK (((file_type)::text = ANY ((ARRAY['Template'::character varying, 'Prompt'::character varying, 'Contexto'::character varying, 'Output'::character varying])::text[]))),
	CONSTRAINT library_file_gate_check CHECK (((gate IS NULL) OR ((gate)::text = ANY ((ARRAY['G0'::character varying, 'G1'::character varying, 'G2'::character varying, 'G3'::character varying, 'G4'::character varying, 'G5'::character varying, 'ALL'::character varying])::text[])))),
	CONSTRAINT library_file_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_library_active ON public.library_file USING btree (is_active);
CREATE INDEX idx_library_category ON public.library_file USING btree (category);
CREATE INDEX idx_library_created ON public.library_file USING btree (created_at DESC);
CREATE INDEX idx_library_gate ON public.library_file USING btree (gate);
CREATE INDEX idx_library_type ON public.library_file USING btree (file_type);

-- Table Triggers

create trigger update_library_file_updated_at before
update
    on
    public.library_file for each row execute function update_updated_at_column();