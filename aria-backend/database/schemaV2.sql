-- public.artifact_definition definition

-- Drop table

-- DROP TABLE public.artifact_definition;

CREATE TABLE public.artifact_definition (
	id bigserial NOT NULL,
	public_id uuid DEFAULT gen_random_uuid() NOT NULL,
	phase int2 NOT NULL,
	"name" varchar(500) NOT NULL,
	initiative_type varchar(20) DEFAULT 'Both'::character varying NULL,
	product_type jsonb DEFAULT '[]'::jsonb NULL,
	predecessor_public_ids jsonb DEFAULT '[]'::jsonb NULL,
	description text NULL,
	mandatory bool DEFAULT false NULL,
	area varchar(50) DEFAULT 'Producto'::character varying NULL,
	status int2 NOT NULL DEFAULT 1,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT artifact_definition_phase_check CHECK (((phase >= 1) AND (phase <= 8))),
	CONSTRAINT artifact_definition_initiative_type_check CHECK (((initiative_type)::text = ANY (ARRAY[('Both'::character varying)::text, ('Change'::character varying)::text, ('New_Product'::character varying)::text]))),
	CONSTRAINT artifact_definition_product_type_check CHECK ((product_type IS NULL OR jsonb_typeof(product_type) = 'array')),
	CONSTRAINT artifact_definition_predecessor_public_ids_check CHECK ((predecessor_public_ids IS NULL OR jsonb_typeof(predecessor_public_ids) = 'array')),
	CONSTRAINT artifact_definition_status_check CHECK (status IN (0, 1)),
	CONSTRAINT artifact_definition_pkey PRIMARY KEY (id),
	CONSTRAINT artifact_definition_public_id_key UNIQUE (public_id),
	CONSTRAINT artifact_definition_name_key UNIQUE ("name")
);
CREATE INDEX idx_artdef_phase ON public.artifact_definition USING btree (phase);
CREATE INDEX idx_artdef_type ON public.artifact_definition USING btree (initiative_type);
CREATE INDEX idx_artdef_area ON public.artifact_definition USING btree (area);
CREATE INDEX idx_artdef_status ON public.artifact_definition USING btree (status);
CREATE INDEX idx_artdef_product_type ON public.artifact_definition USING gin (product_type);
CREATE INDEX idx_artdef_predecessor_public_ids ON public.artifact_definition USING gin (predecessor_public_ids);

COMMENT ON COLUMN public.artifact_definition.status IS
	'Activo/inactivo del artefacto en el catalogo. 1 = Activo (default), 0 = Inactivo/soft-delete.';

-- Table Triggers

create trigger update_artdef_updated_at before
update
    on
    public.artifact_definition for each row execute function update_updated_at_column();


-- public.initiative definition

-- Drop table

-- DROP TABLE public.initiative;

CREATE TABLE public.initiative (
	id                    bigserial      NOT NULL,
	public_id             uuid           NOT NULL,
	code                  varchar(50)    NULL,
	title                 varchar(500)   NOT NULL,
	description           text           NULL,
	status                varchar(50)    NULL,
	current_phase         int2           NULL,
	initiative_type       varchar(20)    NULL,
	product_name          varchar(200)   NULL,
	quarter_name          varchar(50)    NULL,
	quarter_year          int2           NULL,
	estimated_start_date  date           NULL,
	estimated_end_date    date           NULL,
	intake_origin_code    varchar(50)    NULL,
	product_type          varchar(20)    NULL,
	phases                jsonb          DEFAULT '[]'::jsonb NULL,
	synced_at             timestamptz    DEFAULT now() NOT NULL,
	created_at            timestamptz    DEFAULT now() NOT NULL,
	updated_at            timestamptz    DEFAULT now() NOT NULL,
	CONSTRAINT initiative_pkey PRIMARY KEY (id),
	CONSTRAINT initiative_public_id_key UNIQUE (public_id),
	CONSTRAINT initiative_current_phase_check
		CHECK (current_phase IS NULL OR (current_phase BETWEEN 1 AND 8)),
	CONSTRAINT initiative_initiative_type_check
		CHECK (initiative_type IS NULL OR initiative_type IN ('CHANGE', 'NEW_PRODUCT')),
	CONSTRAINT initiative_product_type_check
		CHECK (product_type IS NULL OR product_type IN ('Offering', 'Sellable', 'Non_Sellable'))
);
CREATE INDEX idx_initiative_status        ON public.initiative USING btree (status);
CREATE INDEX idx_initiative_type          ON public.initiative USING btree (initiative_type);
CREATE INDEX idx_initiative_current_phase ON public.initiative USING btree (current_phase);
CREATE INDEX idx_initiative_quarter       ON public.initiative USING btree (quarter_year, quarter_name);
CREATE INDEX idx_initiative_code          ON public.initiative USING btree (code);
CREATE INDEX idx_initiative_product_type  ON public.initiative USING btree (product_type);

COMMENT ON COLUMN public.initiative.product_type IS
	'Tipo de producto de la iniciativa (Offering | Sellable | Non_Sellable). Lo envia el front en POST /initiatives/sync junto con publicId. Al renderizar el detalle (GET /initiatives/:publicId) ARIA filtra los artefactos de cada fase por contenido de artifact_definition.product_type. Si es NULL no se aplica filtro.';

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