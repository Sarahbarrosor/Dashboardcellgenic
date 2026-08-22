// ---------------------------------------------------------------------------
// L1A Doc Builder — modelo de datos
// Regla absoluta: la app NUNCA inventa hechos. Si un dato no está en
// case-data.json, se imprime [FALTA DATO: ...] en resaltado amarillo.
// ---------------------------------------------------------------------------

export type FieldStatus = 'confirmed' | 'declared' | 'missing';

export interface FieldVersion {
  at: string;            // ISO timestamp
  value: unknown;
  status: FieldStatus;
  source: string | null;
  rawAnswer?: string;    // texto original de Sarah, sin normalizar
  note?: string;
}

/** Todo hecho del caso vive dentro de un Field. Nunca un string suelto. */
export interface Field<T = string> {
  value: T | null;
  status: FieldStatus;
  source: string | null;
  currency?: string | null;
  history?: FieldVersion[];
}

export interface Duty {
  id: string;
  task: string | null;
  percentTime: number | null;
  /** CÓMO la ejerce en concreto: qué aprueba, qué firma, qué presupuesto, con qué frecuencia. */
  howSheDoesIt: string | null;
  /** QUIÉN ejecuta el trabajo subyacente. Esta es la distinción que decide un L-1A. */
  whoExecutes: string | null;
  evidence: string | null;
}

export interface SubordinateDuty {
  task: string | null;
  percentTime: number | null;
}

export interface Subordinate {
  id: string;
  name: string | null;
  title: string | null;
  reportsTo: string | null;
  entityKey: 'foreignEmployer' | 'petitioner';
  salary: number | null;
  currency: string | null;
  education: string | null;
  duties: SubordinateDuty[];
  cvOnFile: boolean;
  degreeOnFile: boolean;
  professional: boolean | null; // ¿título profesional? decide gerencial vs functional manager
}

export interface OwnershipLink {
  id: string;
  owner: string;
  owned: string;
  percent: number | null;
  proof: string | null;
  status: FieldStatus;
}

export interface EntityRecord {
  key: string;
  legalName: Field;
  shortName: string;
  role: string;
  locked?: boolean;
  state?: Field;
  city?: Field;
  incDate?: Field;
  ein?: Field;
  rfc?: Field;
  actaConstitutiva?: Field;
  notario?: Field;
  cofepris?: Field;
  address?: Field;
  phone?: Field;
  ticker?: string;
  employeeCount?: Field<number>;
  annualRevenue?: Field<number>;
  operatingAgreementEffectiveDate?: Field;
  [k: string]: unknown;
}

export interface EvidenceItem {
  id: string;
  name: string;
  tab: string;                 // Tab A..H
  status: 'Tengo' | 'Solicitado' | 'Falta';
  owner: string | null;        // responsable
  proves: string | null;       // qué elemento del caso prueba
  notes: string | null;
}

export interface MissingEvidenceItem {
  id: string;
  need: string;        // qué necesitamos
  why: string;         // por qué importa
  whereToLook: string; // dónde buscarlo
  alternative: string; // alternativa si no existe
  createdAt: string;
}

export interface DecisionLogEntry {
  id: string;
  at: string;
  path: string;
  rawAnswer: string | null;
  extracted: unknown;
  status: FieldStatus;
  source: string | null;
  previous: unknown;
}

export interface HiringPlanRow {
  id: string;
  month: number | null;
  title: string | null;
  count: number | null;
  salary: number | null;
  currency: string | null;
}

export interface RevenueRow {
  id: string;
  period: string | null;
  revenue: number | null;
  expenses: number | null;
  currency: string | null;
}

export interface Theory {
  id: string;
  name: string;
  state: string;
  supportingFacts: string[];
  supportingDocs: string[];
  weakeningFacts: string[];
  missingEvidence: string[];
}

export interface CaseData {
  meta: { caseName: string; classification: string; filingDate: Field; schemaVersion: number };
  beneficiary: Record<string, Field<any>>;
  entities: Record<string, EntityRecord>;
  people: Record<string, { name: Field; title: Field; entityKey: string }>;
  ownershipChain: OwnershipLink[];
  subordinatesForeign: Subordinate[];
  subordinatesUS: Subordinate[];
  sarahDuties: Duty[];
  proposedUSDuties: Duty[];
  usOffice: Record<string, Field<any>>;
  businessPlan: {
    hiringPlan12Months: HiringPlanRow[];
    revenueProjections: RevenueRow[];
    startupCapital: Field<number>;
  };
  theories: Theory[];
  evidenceInventory: EvidenceItem[];
  missingEvidence: MissingEvidenceItem[];
  decisionLog: DecisionLogEntry[];
}

// --------------------------- Bloques de documento ---------------------------

/** Un segmento de texto dentro de un bloque. `missing` marca un [FALTA DATO]. */
export interface Seg {
  t: string;
  b?: boolean;   // bold
  i?: boolean;   // italic
  u?: boolean;   // underline
  missing?: { path: string; label: string };
}

export type BlockType =
  | 'letterhead'
  | 'title'
  | 'subtitle'
  | 'date'
  | 'heading'
  | 'paragraph'
  | 'bullet'
  | 'numbered'
  | 'table'
  | 'signature'
  | 'pagebreak'
  | 'note';

export interface Block {
  blockId: string;
  type: BlockType;
  segs?: Seg[];
  /** tabla: filas -> celdas -> segmentos */
  rows?: Seg[][][];
  header?: boolean;          // la primera fila de la tabla es encabezado
  boundField?: string | null; // ruta al dato de case-data.json que alimenta el bloque
  optional?: boolean;
  disabled?: boolean;
  entityKey?: string;         // para letterhead / signature
  signerName?: string | null;
  signerTitle?: string | null;
  indentLevel?: number;
}

export interface DocumentSpec {
  docId: string;
  group: 'A' | 'B' | 'C' | 'D';
  code: string;              // A1, A2, A3-<id>, ...
  title: string;
  deliverTo: string;         // a quién se entrega
  signedBy: string;          // quién firma
  tab: string;               // pestaña del fólder
  entityKey: string | null;  // membrete
  proves: string;            // qué elemento de los cinco prueba
  blocks: Block[];
}

export interface OverrideBlock {
  segs: Seg[];
  editedAt: string;
  deliberateDivergence?: boolean;
  originalSegs?: Seg[];
}

export interface OverridesFile {
  [docId: string]: {
    blocks: Record<string, OverrideBlock>;
    disabledBlocks?: string[];
    blockOrder?: string[];
    history?: { at: string; blocks: Record<string, OverrideBlock> }[];
  };
}

// ------------------------------ Validador -----------------------------------

export interface ValidationIssue {
  id: string;
  severity: 'block' | 'warn';
  rule: string;
  previousFact: string;   // hecho previo
  newFact: string;        // hecho nuevo
  whyItMatters: string;   // por qué importa
  clarifyingDocument: string; // qué documento lo aclara
  where?: string;         // documento / bloque
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  checkedAt: string;
}

// ------------------------------ Preguntas -----------------------------------

export type AnswerKind = 'text' | 'date' | 'money' | 'number' | 'boolean' | 'percent' | 'people';

export interface Question {
  id: string;
  order: number;
  prompt: string;
  /** las cuatro partes obligatorias del §5-BIS */
  weHad: string;
  whatAppearsNow: string;
  whyItMatters: string;
  clarifyingDocument: string;
  /** convertida en búsqueda de documento cuando se puede */
  searchHint?: string;
  targetPath: string | null;  // dónde se guarda la respuesta
  /** Ruta usada solo para medir impacto cuando la respuesta no cabe en un solo campo. */
  impactPath?: string;
  kind: AnswerKind;
  blocksLabel: string;        // "6 documentos" | "Prueba central del año continuo"
  /**
   * Cuántos documentos se sabe que bloquea, según el levantamiento del caso. Se usa junto
   * con el impacto calculado: al arrancar, un dato que aún no aparece en ningún documento
   * (los subordinados, por ejemplo) tendría impacto calculado bajo y quedaría hasta abajo,
   * justo el dato del que depende la teoría ejecutiva.
   */
  declaredBlocks?: number;
  status: 'open' | 'answered' | 'dismissed';
  answeredAt?: string;
  rawAnswer?: string;
  generatedBy?: 'seed' | 'validator';
}

export interface QuestionsFile {
  questions: Question[];
}
