-- BD: aria
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
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	area varchar(50) DEFAULT 'Producto'::character varying NULL,
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


-- public.chat_conversations definition

-- Drop table

-- DROP TABLE public.chat_conversations;

CREATE TABLE public.chat_conversations (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id varchar(500) NOT NULL,
	title varchar(500) DEFAULT 'Nueva conversación'::character varying NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT chat_conversations_pkey PRIMARY KEY (id)
);


-- public.confluence_publication definition

-- Drop table

-- DROP TABLE public.confluence_publication;

CREATE TABLE public.confluence_publication (
	id varchar(255) NOT NULL,
	initiative_id varchar(255) NOT NULL,
	initiative_name varchar(500) NULL,
	artifact_id varchar(255) NULL,
	artifact_name varchar(500) NOT NULL,
	gate varchar(10) DEFAULT 'G5'::character varying NOT NULL,
	page_id varchar(255) NULL,
	page_url text NULL,
	confluence_action varchar(50) NULL,
	published_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT confluence_publication_pkey PRIMARY KEY (id)
);


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


-- public.chat_messages definition

-- Drop table

-- DROP TABLE public.chat_messages;

CREATE TABLE public.chat_messages (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	conversation_id uuid NOT NULL,
	"role" varchar(10) NOT NULL,
	"content" text NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
	CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE
);

-- BD: aria_db

-- public.intake_request definition

-- Drop table

-- DROP TABLE public.intake_request;

CREATE TABLE public.intake_request (
	id varchar(20) NOT NULL,
	requester varchar(100) NOT NULL,
	area varchar(50) NULL,
	"type" varchar(50) NULL,
	product varchar(100) NULL,
	"domain" varchar(100) NULL,
	region varchar(100) NULL,
	impact_type varchar(50) NULL,
	severity varchar(5) NULL,
	urgency varchar(20) NULL,
	problem text NOT NULL,
	outcome text NOT NULL,
	"scope" _text NULL,
	"constraints" text NULL,
	alternatives text NULL,
	kpi varchar(255) NULL,
	status varchar(50) NULL,
	aria_analysis text NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT intake_request_pkey PRIMARY KEY (id),
	CONSTRAINT intake_request_severity_check CHECK (((severity)::text = ANY ((ARRAY['P0'::character varying, 'P1'::character varying, 'P2'::character varying, 'P3'::character varying])::text[]))),
	CONSTRAINT intake_request_type_check CHECK (((type)::text = ANY ((ARRAY['Bug'::character varying, 'Mejora'::character varying, 'Estratégica'::character varying, 'Regulatorio'::character varying, 'Deuda Técnica'::character varying])::text[]))),
	CONSTRAINT intake_request_urgency_check CHECK (((urgency)::text = ANY ((ARRAY['Now'::character varying, 'Next'::character varying, 'Later'::character varying])::text[])))
);
CREATE INDEX idx_intake_created ON public.intake_request USING btree (created_at DESC);
CREATE INDEX idx_intake_severity ON public.intake_request USING btree (severity);
CREATE INDEX idx_intake_status ON public.intake_request USING btree (status);

-- Table Triggers

create trigger update_intake_request_updated_at before
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
	gate varchar(5) NULL,
	category varchar(100) NULL,
	description text NULL,
	uploaded_by varchar(100) NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	deleted_at timestamp NULL,
	CONSTRAINT library_file_file_type_check CHECK (((file_type)::text = ANY ((ARRAY['Template'::character varying, 'Prompt'::character varying, 'Contexto'::character varying, 'Output'::character varying])::text[]))),
	CONSTRAINT library_file_gate_check CHECK (((gate)::text = ANY ((ARRAY['G0'::character varying, 'G1'::character varying, 'G2'::character varying, 'G3'::character varying, 'G4'::character varying, 'G5'::character varying, 'ALL'::character varying])::text[]))),
	CONSTRAINT library_file_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_library_active ON public.library_file USING btree (is_active);
CREATE INDEX idx_library_created ON public.library_file USING btree (created_at DESC);
CREATE INDEX idx_library_gate ON public.library_file USING btree (gate);
CREATE INDEX idx_library_type ON public.library_file USING btree (file_type);

-- Table Triggers

create trigger update_library_file_updated_at before
update
    on
    public.library_file for each row execute function update_updated_at_column();


-- public.oea definition

-- Drop table

-- DROP TABLE public.oea;

CREATE TABLE public.oea (
	id varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner" varchar(100) NULL,
	"period" varchar(10) NULL,
	progress int4 NULL,
	health varchar(20) NULL,
	impact int4 NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT oea_health_check CHECK (((health)::text = ANY ((ARRAY['Healthy'::character varying, 'At Risk'::character varying, 'Critical'::character varying])::text[]))),
	CONSTRAINT oea_impact_check CHECK (((impact >= 1) AND (impact <= 5))),
	CONSTRAINT oea_pkey PRIMARY KEY (id),
	CONSTRAINT oea_progress_check CHECK (((progress >= 0) AND (progress <= 100)))
);
CREATE INDEX idx_oea_health ON public.oea USING btree (health);
CREATE INDEX idx_oea_period ON public.oea USING btree (period);
COMMENT ON TABLE public.oea IS 'Objetivos Estratégicos Anuales de Kashio';

-- Table Triggers

create trigger update_oea_updated_at before
update
    on
    public.oea for each row execute function update_updated_at_column();


-- public.okr definition

-- Drop table

-- DROP TABLE public.okr;

CREATE TABLE public.okr (
	id varchar(20) NOT NULL,
	oea_id varchar(20) NULL,
	"name" varchar(255) NOT NULL,
	"owner" varchar(100) NULL,
	health varchar(20) NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT okr_health_check CHECK (((health)::text = ANY ((ARRAY['Healthy'::character varying, 'At Risk'::character varying, 'Critical'::character varying])::text[]))),
	CONSTRAINT okr_pkey PRIMARY KEY (id),
	CONSTRAINT okr_oea_id_fkey FOREIGN KEY (oea_id) REFERENCES public.oea(id) ON DELETE CASCADE
);
CREATE INDEX idx_okr_health ON public.okr USING btree (health);
CREATE INDEX idx_okr_oea ON public.okr USING btree (oea_id);

-- Table Triggers

create trigger update_okr_updated_at before
update
    on
    public.okr for each row execute function update_updated_at_column();


-- public.portfolio_initiative definition

-- Drop table

-- DROP TABLE public.portfolio_initiative;

CREATE TABLE public.portfolio_initiative (
	id varchar(20) NOT NULL,
	okr_id varchar(20) NULL,
	kpc_code varchar(50) NULL,
	kpc_version varchar(20) NULL,
	portfolio varchar(100) NULL,
	"name" varchar(255) NOT NULL,
	start_date varchar(20) NULL,
	end_date varchar(20) NULL,
	"owner" varchar(100) NULL,
	"lead" varchar(100) NULL,
	tech_lead varchar(100) NULL,
	squads varchar(100) NULL,
	status varchar(50) NULL,
	brm_link text NULL,
	domain_l1 varchar(100) NULL,
	domain_l2 varchar(100) NULL,
	domain_l3 varchar(100) NULL,
	it_services varchar(255) NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT portfolio_initiative_pkey PRIMARY KEY (id),
	CONSTRAINT portfolio_initiative_okr_id_fkey FOREIGN KEY (okr_id) REFERENCES public.okr(id) ON DELETE SET NULL
);
CREATE INDEX idx_init_kpc ON public.portfolio_initiative USING btree (kpc_code);
CREATE INDEX idx_init_okr ON public.portfolio_initiative USING btree (okr_id);
CREATE INDEX idx_init_portfolio ON public.portfolio_initiative USING btree (portfolio);
CREATE INDEX idx_init_status ON public.portfolio_initiative USING btree (status);

-- Table Triggers

create trigger update_portfolio_initiative_updated_at before
update
    on
    public.portfolio_initiative for each row execute function update_updated_at_column();


-- public.product definition

-- Drop table

-- DROP TABLE public.product;

CREATE TABLE public.product (
	id varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	code varchar(50) NOT NULL,
	"domain" varchar(100) NOT NULL,
	region varchar(100) NOT NULL,
	status varchar(50) DEFAULT 'Active'::character varying NOT NULL,
	pdlc_initiative_id varchar(255) NULL,
	pdlc_gate varchar(20) NULL,
	description text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT product_code_key UNIQUE (code),
	CONSTRAINT product_pkey PRIMARY KEY (id),
	CONSTRAINT product_pdlc_initiative_id_fkey FOREIGN KEY (pdlc_initiative_id) REFERENCES public.portfolio_initiative(id) ON DELETE SET NULL
);

-- Table Triggers

create trigger update_product_updated_at before
update
    on
    public.product for each row execute function update_updated_at_column();


-- public.artifact definition

-- Drop table

-- DROP TABLE public.artifact;

CREATE TABLE public.artifact (
	id varchar(20) NOT NULL,
	initiative_id varchar(20) NULL,
	gate varchar(5) NOT NULL,
	"name" varchar(255) NOT NULL,
	category varchar(100) NULL,
	"version" varchar(20) NULL,
	status varchar(30) NULL,
	artifact_type varchar(10) NULL,
	"content" text NULL,
	generated_by varchar(20) NULL,
	link text NULL,
	storage_url text NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	approved_by varchar(100) NULL,
	approved_at timestamp NULL,
	CONSTRAINT artifact_artifact_type_check CHECK (((artifact_type)::text = ANY ((ARRAY['Input'::character varying, 'Output'::character varying])::text[]))),
	CONSTRAINT artifact_gate_check CHECK (((gate)::text = ANY ((ARRAY['G0'::character varying, 'G1'::character varying, 'G2'::character varying, 'G3'::character varying, 'G4'::character varying, 'G5'::character varying])::text[]))),
	CONSTRAINT artifact_generated_by_check CHECK (((generated_by)::text = ANY ((ARRAY['ARIA'::character varying, 'Manual'::character varying])::text[]))),
	CONSTRAINT artifact_pkey PRIMARY KEY (id),
	CONSTRAINT artifact_status_check CHECK (((status)::text = ANY ((ARRAY['NOT_STARTED'::character varying, 'DRAFT'::character varying, 'ACTIVE'::character varying, 'OBSOLETE'::character varying, 'PENDING_HITL'::character varying, 'GENERATING'::character varying])::text[]))),
	CONSTRAINT artifact_initiative_id_fkey FOREIGN KEY (initiative_id) REFERENCES public.portfolio_initiative(id) ON DELETE CASCADE
);
CREATE INDEX idx_artifact_gate ON public.artifact USING btree (gate);
CREATE INDEX idx_artifact_init ON public.artifact USING btree (initiative_id);
CREATE INDEX idx_artifact_status ON public.artifact USING btree (status);
CREATE INDEX idx_artifact_type ON public.artifact USING btree (artifact_type);

-- Table Triggers

create trigger update_artifact_updated_at before
update
    on
    public.artifact for each row execute function update_updated_at_column();


-- public.artifact_destination definition

-- Drop table

-- DROP TABLE public.artifact_destination;

CREATE TABLE public.artifact_destination (
	artifact_id varchar(20) NOT NULL,
	destination varchar(50) NOT NULL,
	published_at timestamp NULL,
	published_url text NULL,
	CONSTRAINT artifact_destination_destination_check CHECK (((destination)::text = ANY ((ARRAY['Confluence'::character varying, 'Jira'::character varying, 'SharePoint'::character varying, 'ReadMe'::character varying])::text[]))),
	CONSTRAINT artifact_destination_pkey PRIMARY KEY (artifact_id, destination),
	CONSTRAINT artifact_destination_artifact_id_fkey FOREIGN KEY (artifact_id) REFERENCES public.artifact(id) ON DELETE CASCADE
);


-- public.gate_status definition

-- Drop table

-- DROP TABLE public.gate_status;

CREATE TABLE public.gate_status (
	id varchar(50) NOT NULL,
	initiative_id varchar(50) NOT NULL,
	gate_id varchar(10) NOT NULL,
	status varchar(20) DEFAULT 'EN_CURSO'::character varying NOT NULL,
	completed_at timestamp NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT gate_status_initiative_id_gate_id_key UNIQUE (initiative_id, gate_id),
	CONSTRAINT gate_status_pkey PRIMARY KEY (id),
	CONSTRAINT fk_initiative FOREIGN KEY (initiative_id) REFERENCES public.portfolio_initiative(id) ON DELETE CASCADE
);
CREATE INDEX idx_gate_status_gate ON public.gate_status USING btree (gate_id);
CREATE INDEX idx_gate_status_initiative ON public.gate_status USING btree (initiative_id);
CREATE INDEX idx_gate_status_status ON public.gate_status USING btree (status);


-- public.key_result definition

-- Drop table

-- DROP TABLE public.key_result;

CREATE TABLE public.key_result (
	id varchar(20) NOT NULL,
	okr_id varchar(20) NULL,
	description text NULL,
	target numeric NULL,
	"current" numeric NULL,
	unit varchar(20) NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT key_result_pkey PRIMARY KEY (id),
	CONSTRAINT key_result_okr_id_fkey FOREIGN KEY (okr_id) REFERENCES public.okr(id) ON DELETE CASCADE
);
CREATE INDEX idx_kr_okr ON public.key_result USING btree (okr_id);

-- Table Triggers

create trigger update_key_result_updated_at before
update
    on
    public.key_result for each row execute function update_updated_at_column();


-- public.kpc_product definition

-- Drop table

-- DROP TABLE public.kpc_product;

CREATE TABLE public.kpc_product (
	id varchar(20) NOT NULL,
	code varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	status varchar(20) NULL,
	"version" varchar(20) NULL,
	pdlc_initiative_id varchar(20) NULL,
	pdlc_gate varchar(5) NULL,
	"owner" varchar(100) NULL,
	"domain" varchar(100) NULL,
	target_segment varchar(100) NULL,
	region varchar(100) NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT kpc_product_code_key UNIQUE (code),
	CONSTRAINT kpc_product_pkey PRIMARY KEY (id),
	CONSTRAINT kpc_product_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Archived'::character varying, 'Deprecated'::character varying, 'Draft'::character varying])::text[]))),
	CONSTRAINT kpc_product_pdlc_initiative_id_fkey FOREIGN KEY (pdlc_initiative_id) REFERENCES public.portfolio_initiative(id)
);
CREATE INDEX idx_kpc_code ON public.kpc_product USING btree (code);
CREATE INDEX idx_kpc_initiative ON public.kpc_product USING btree (pdlc_initiative_id);
CREATE INDEX idx_kpc_status ON public.kpc_product USING btree (status);

-- Table Triggers

create trigger update_kpc_product_updated_at before
update
    on
    public.kpc_product for each row execute function update_updated_at_column();