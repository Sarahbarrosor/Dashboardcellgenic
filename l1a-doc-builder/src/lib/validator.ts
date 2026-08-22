import type { CaseData, DocumentSpec, OverridesFile, ValidationIssue, ValidationResult } from './types';
import { fieldValue, getByPath } from './fields';
import { segsToText } from './docx/blocks';

const MISSING_RE = /\[FALTA DATO:\s*([^\]]*)\]/g;

function issue(
  rule: string, severity: 'block' | 'warn',
  previousFact: string, newFact: string, whyItMatters: string, clarifyingDocument: string,
  where?: string,
): ValidationIssue {
  return { id: `${rule}-${Math.random().toString(36).slice(2, 8)}`, rule, severity, previousFact, newFact, whyItMatters, clarifyingDocument, where };
}

/**
 * Texto plano del documento. Las celdas se separan con " | " y las filas con salto de
 * línea: unirlas con espacios crearía vecindades que no existen en el documento real
 * y haría que el validador viera nombres partidos donde no los hay.
 */
function docText(d: DocumentSpec): string {
  return d.blocks
    .filter((b) => !b.disabled)
    .map((b) => {
      const rows = (b.rows ?? []).map((row) => row.map(segsToText).join(' | '));
      return [segsToText(b.segs), ...rows].filter(Boolean).join('\n');
    })
    .join('\n');
}

/** Índices donde alguna razón social del catálogo aparece escrita completa y exacta. */
function exactSpans(text: string, catalog: string[]): { start: number; end: number }[] {
  const spans: { start: number; end: number }[] = [];
  for (const name of catalog) {
    let i = text.indexOf(name);
    while (i !== -1) {
      spans.push({ start: i, end: i + name.length });
      i = text.indexOf(name, i + name.length);
    }
  }
  return spans;
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
}

function addYears(iso: string, years: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(y + years).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function sumPercent(list: { percentTime: number | null }[]): number {
  return list.reduce((s, d) => s + (d.percentTime ?? 0), 0);
}

// ---------------------------------------------------------------------------
// Validación sobre los DATOS del caso (§5, reglas 1 a 8)
// ---------------------------------------------------------------------------
export function validateData(c: CaseData): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const employerName = fieldValue(c, 'entities.foreignEmployer.legalName') ?? '';

  // Regla 1 — "Cellgenic" donde debe decir el nombre de la empleadora extranjera.
  if (/cellgenic/i.test(employerName)) {
    out.push(issue(
      'R1-empleadora-cellgenic', 'block',
      'La empleadora extranjera es Cellular Hope Institute, S.A. de C.V., confirmado por la beneficiaria y bloqueado en un solo campo.',
      `El campo de empleadora extranjera dice "${employerName}".`,
      '"Cellgenic" es una unidad de negocio o marca, no la entidad que emplea y paga. Si el I-129 nombra a la entidad equivocada como empleadora extranjera, el error es material.',
      'Recibo CFDI timbrado, alta del IMSS y contrato laboral, todos a nombre de la entidad que realmente emplea.',
    ));
  }

  // Regla 2 — los % de tiempo deben sumar 100 exacto.
  const sarahTotal = sumPercent(c.sarahDuties ?? []);
  if ((c.sarahDuties ?? []).length > 0 && sarahTotal !== 100) {
    out.push(issue(
      'R2-porcentaje-sarah', 'block',
      'La asignación de tiempo de la beneficiaria debe sumar exactamente 100%.',
      `Las funciones capturadas suman ${sarahTotal}%.`,
      'Una tabla de tiempo que no suma 100 le dice al oficial que la descripción del puesto no está completa, y es de lo primero que se revisa en un L-1A.',
      'Descripción de puesto de la empleadora extranjera con el desglose de funciones (documento A2).',
    ));
  }
  const usTotal = sumPercent(c.proposedUSDuties ?? []);
  if ((c.proposedUSDuties ?? []).length > 0 && usTotal !== 100) {
    out.push(issue(
      'R2-porcentaje-us', 'block',
      'La asignación de tiempo del puesto propuesto en EE.UU. debe sumar exactamente 100%.',
      `Las funciones capturadas suman ${usTotal}%.`,
      'La tabla de asignación de tiempo de la Petition Support Letter tiene que sumar 100%.',
      'Descripción del puesto propuesto en EE.UU. (documento B2).',
    ));
  }
  for (const [listName, list] of [['subordinatesForeign', c.subordinatesForeign ?? []], ['subordinatesUS', c.subordinatesUS ?? []]] as const) {
    list.forEach((s, i) => {
      const t = sumPercent(s.duties ?? []);
      if ((s.duties ?? []).length > 0 && t !== 100) {
        out.push(issue(
          'R2-porcentaje-subordinado', 'block',
          `Las funciones de ${s.name ?? s.title ?? `${listName}[${i}]`} deben sumar exactamente 100%.`,
          `Suman ${t}%.`,
          'Cada descripción de puesto de subordinado se presenta como documento independiente y se lee igual de duro que la de la beneficiaria.',
          'Descripción de puesto del subordinado (documento A3 / B3).',
        ));
      }
    });
  }

  // Regla 3 — vigencia anterior a la constitución de la entidad que emite.
  for (const [key, e] of Object.entries(c.entities ?? {})) {
    const eff = fieldValue(c, `entities.${key}.operatingAgreementEffectiveDate`);
    const inc = fieldValue(c, `entities.${key}.incDate`);
    if (eff && inc && eff < inc) {
      out.push(issue(
        'R3-vigencia-anterior', 'block',
        `${fieldValue(c, `entities.${key}.legalName`)} se constituyó el ${inc}.`,
        `Su Operating Agreement dice tener vigencia desde el ${eff}, antes de que la entidad existiera.`,
        'Un documento que se contradice en su propia página invita a que se revise todo lo demás con la misma lupa.',
        'Operating Agreement reemitido con la fecha real de constitución, o acta de los miembros ratificándolo.',
      ));
    }
  }

  // Regla 5 — un año continuo dentro de los tres años previos a la presentación.
  const start = fieldValue(c, 'beneficiary.employmentStartDate');
  const filing = fieldValue(c, 'meta.filingDate') ?? new Date().toISOString().slice(0, 10);
  if (!start) {
    out.push(issue(
      'R5-anio-continuo', 'warn',
      'Hay que probar un año continuo de empleo en el extranjero dentro de los tres años previos a la presentación.',
      'No hay fecha de inicio de empleo capturada, así que el año continuo no se puede verificar.',
      'Es el tercero de los cinco elementos y sin fecha no se sostiene ninguna afirmación sobre el año.',
      'Contrato laboral, primer recibo CFDI timbrado o alta del IMSS.',
    ));
  } else {
    const oneYearBefore = addYears(filing, -1);
    if (start > oneYearBefore) {
      out.push(issue(
        'R5-anio-continuo', 'block',
        `Fecha de presentación considerada: ${filing}.`,
        `El empleo en el extranjero inició el ${start}, menos de un año antes de esa fecha.`,
        'Sin un año continuo de empleo en el extranjero dentro de los tres años previos, la clasificación L-1 no procede.',
        'Reporte de semanas cotizadas del IMSS y recibos CFDI que muestren la continuidad real del empleo.',
      ));
    }
  }

  // Regla 6 — titular del arrendamiento ≠ peticionaria del I-129.
  const leaseHolder = fieldValue(c, 'usOffice.leaseHolder');
  const petitioner = fieldValue(c, 'entities.petitioner.legalName');
  if (leaseHolder && petitioner && normalizeName(leaseHolder) !== normalizeName(petitioner)) {
    out.push(issue(
      'R6-arrendamiento', 'block',
      `La peticionaria del I-129 es ${petitioner}.`,
      `El arrendamiento de la oficina de EE.UU. está a nombre de ${leaseHolder}.`,
      'La modalidad de oficina nueva exige local físico asegurado por la misma entidad que presenta la petición.',
      'Contrato de arrendamiento de Plantation, FL, a nombre de la peticionaria.',
    ));
  }

  // Regla 8 — entidad pagadora en los recibos ≠ empleadora declarada.
  const payroll = fieldValue(c, 'entities.foreignEmployer.payrollIssuer');
  if (payroll && employerName && normalizeName(payroll) !== normalizeName(employerName)) {
    out.push(issue(
      'R8-entidad-pagadora', 'block',
      `La empleadora extranjera declarada es ${employerName}.`,
      `Los recibos de nómina los emite ${payroll}.`,
      'Si el papel que prueba el empleo dice otra entidad, la relación laboral queda en duda justo donde más se mira.',
      'Recibo CFDI timbrado: leer el nombre y el RFC del emisor en la cara del recibo.',
    ));
  }

  // Cadena de propiedad incompleta — no bloquea, pero no se maquilla.
  (c.ownershipChain ?? []).forEach((o, i) => {
    if (o.percent === null) {
      out.push(issue(
        'R1b-cadena-propiedad', 'warn',
        `Se afirma que ${o.owner} controla a ${o.owned}.`,
        'El porcentaje exacto de participación está vacío.',
        'La relación calificada es el primero de los cinco elementos y exige mostrar propiedad y control, no solo afirmarlos.',
        'Libro de accionistas de la entidad participada. No declarar 100% sin verlo.',
        `ownershipChain.${i}`,
      ));
    }
  });

  return out;
}

// ---------------------------------------------------------------------------
// Validación sobre el TEXTO FINAL de los documentos (§6-BIS paso 3)
// ---------------------------------------------------------------------------
export function validateFinalText(
  c: CaseData,
  generated: DocumentSpec[],
  final: DocumentSpec[],
  ov: OverridesFile,
): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const employerName = fieldValue(c, 'entities.foreignEmployer.legalName') ?? '';
  const today = new Date().toISOString().slice(0, 10);

  // Catálogo de entidades: ningún documento puede nombrar una entidad que no esté dado de alta.
  const catalog = Object.values(c.entities ?? {})
    .map((e) => (e.legalName as any)?.value as string | null)
    .filter((x): x is string => !!x);

  for (const d of final) {
    const text = docText(d);
    const gen = generated.find((g) => g.docId === d.docId);

    // Regla 1 sobre texto — "Cellgenic" en documentos que deben decir la empleadora extranjera.
    if (['A1', 'A2', 'A4'].includes(d.docId) || d.docId.startsWith('A3-')) {
      if (/cellgenic/i.test(text)) {
        out.push(issue(
          'R1-texto-cellgenic', 'block',
          `La empleadora extranjera es ${employerName}.`,
          `El documento ${d.code} menciona "Cellgenic".`,
          'Cellgenic es una unidad de negocio o marca, no la entidad empleadora. Si aparece como empleadora en un documento del paquete, el expediente se contradice solo.',
          'Recibo CFDI, alta del IMSS y contrato laboral a nombre de la empleadora real.',
          d.docId,
        ));
      }
    }

    // Regla 4 — una entidad escrita de dos formas distintas.
    const spans = exactSpans(text, catalog);
    for (const name of catalog) {
      const core = name.split(/\s+/).slice(0, 2).join(' ');
      if (core.length < 5) continue;
      let idx = text.indexOf(core);
      while (idx !== -1) {
        const cur = idx;
        idx = text.indexOf(core, cur + core.length);
        if (text.startsWith(name, cur)) continue;
        // El núcleo de una razón social puede caer dentro de otra escrita completa
        // ("Stem Cell" dentro de "Global Stem Cells Group, Inc."). Eso no es una variante.
        if (spans.some((sp) => cur >= sp.start && cur < sp.end)) continue;
        const snippet = text.slice(cur, cur + Math.max(name.length, 40)).split(/[\n.;:|]/)[0].trim();
        const isAbbrev = normalizeName(name).startsWith(normalizeName(snippet));
        out.push(issue(
          'R4-nombre-inconsistente', isAbbrev ? 'warn' : 'block',
          `En el catálogo de entidades la razón social es "${name}".`,
          `El documento ${d.code} la escribe como "${snippet}".`,
          'Un nombre escrito de dos formas distintas dentro del mismo paquete le da al oficial una razón gratuita para dudar de la identidad de la entidad.',
          'Acta constitutiva o certificado de existencia con la razón social exacta.',
          d.docId,
        ));
      }
    }

    // Regla de la capa de edición — ninguna fecha de documento anterior a hoy.
    for (const b of d.blocks) {
      if (b.type !== 'date') continue;
      const t = segsToText(b.segs);
      const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(t);
      const en = /([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})/.exec(t);
      let parsed: string | null = null;
      if (iso) parsed = `${iso[1]}-${iso[2]}-${iso[3]}`;
      else if (en) {
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const mi = months.indexOf(en[1]);
        if (mi >= 0) parsed = `${en[3]}-${String(mi + 1).padStart(2, '0')}-${String(Number(en[2])).padStart(2, '0')}`;
      }
      if (parsed && parsed < today) {
        out.push(issue(
          'R-edicion-fecha-antedatada', 'block',
          `Hoy es ${today}.`,
          `El documento ${d.code} está fechado ${parsed}, antes de hoy.`,
          'Un documento creado hoy no puede presentarse como si hubiera existido antes. Es una de las restricciones no negociables de la app.',
          'Ninguno: se corrige poniendo la fecha real de emisión.',
          `${d.docId}/${b.blockId}`,
        ));
      }
    }

    // Regla de la capa de edición — no se puede borrar un [FALTA DATO] sin llenarlo.
    if (gen) {
      for (const gb of gen.blocks) {
        const fb = d.blocks.find((x) => x.blockId === gb.blockId);
        if (!fb) continue;
        const genMissing = [...segsToText(gb.segs).matchAll(MISSING_RE)].map((m) => m[1].trim());
        const finMissing = [...segsToText(fb.segs).matchAll(MISSING_RE)].map((m) => m[1].trim());
        for (const label of genMissing) {
          if (!finMissing.includes(label)) {
            out.push(issue(
              'R-edicion-falta-dato-borrado', 'block',
              `El bloque ${gb.blockId} tenía un hueco marcado: "${label}".`,
              'En la versión editada ese [FALTA DATO] ya no aparece, y el dato tampoco se capturó.',
              'Un [FALTA DATO] borrado sin llenar convierte una laguna visible en una afirmación silenciosa. Es exactamente el error que la app existe para prevenir.',
              'El documento que aporte el dato faltante, o restaurar el bloque desde los datos.',
              `${d.docId}/${gb.blockId}`,
            ));
          }
        }
      }
    }

    // Regla de la capa de edición — nada que parezca una imagen de firma.
    if (/<img|data:image\/|!\[.*\]\(/i.test(text)) {
      out.push(issue(
        'R-edicion-imagen-firma', 'block',
        'Todo documento sale sin firmar, con línea de firma en blanco.',
        `El documento ${d.code} contiene lo que parece una imagen incrustada.`,
        'La app no inserta imágenes de firma en documentos destinados a una presentación federal.',
        'Ninguno: se elimina la imagen y se deja la línea de firma en blanco.',
        d.docId,
      ));
    }

    // Regla 2 sobre texto — totales de tabla distintos de 100%.
    for (const m of text.matchAll(/TOTAL\s+(\d+)%/g)) {
      if (Number(m[1]) !== 100) {
        out.push(issue(
          'R2-total-texto', 'block',
          'Toda tabla de asignación de tiempo debe sumar exactamente 100%.',
          `El documento ${d.code} muestra un total de ${m[1]}%.`,
          'Una tabla de tiempo que no cierra en 100 se lee como una descripción de puesto incompleta.',
          'Descripción de puesto con el desglose completo de funciones.',
          d.docId,
        ));
      }
    }
  }

  // Regla 7 — subordinado en una descripción de puesto pero no en el organigrama, o al revés.
  const orgDoc = final.find((d) => d.docId === 'A4');
  if (orgDoc) {
    const orgText = docText(orgDoc);
    for (const sub of c.subordinatesForeign ?? []) {
      if (!sub.name) continue;
      const hasDoc = final.some((d) => d.docId === `A3-${sub.id}`);
      const inOrg = orgText.includes(sub.name);
      if (hasDoc && !inOrg) {
        out.push(issue(
          'R7-organigrama', 'block',
          `${sub.name} tiene descripción de puesto en el paquete.`,
          'No aparece en el organigrama de la empleadora extranjera.',
          'Un subordinado que existe en un documento y no en el otro hace que el oficial dude de los dos.',
          'Organigrama actualizado de la empleadora extranjera con todos los reportes directos.',
          `A4 / A3-${sub.id}`,
        ));
      }
      if (!hasDoc && inOrg) {
        out.push(issue(
          'R7-organigrama', 'warn',
          `${sub.name} aparece en el organigrama.`,
          'No tiene descripción de puesto en el paquete.',
          'La teoría ejecutiva se sostiene en documentar a cada reporte directo, no solo en listarlo.',
          'Descripción de puesto del subordinado con funciones, % de tiempo, educación y salario.',
          `A4 / ${sub.name}`,
        ));
      }
    }
  }

  return dedupe(out);
}

/** Un mismo problema repetido en el mismo documento se reporta una vez. */
function dedupe(issues: ValidationIssue[]): ValidationIssue[] {
  const seen = new Set<string>();
  const out: ValidationIssue[] = [];
  for (const i of issues) {
    const key = `${i.rule}|${i.where ?? ''}|${i.newFact}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(i);
  }
  return out;
}

export function runValidation(
  c: CaseData,
  generated: DocumentSpec[],
  final: DocumentSpec[],
  ov: OverridesFile,
  includeText: boolean,
): ValidationResult {
  const issues = [...validateData(c), ...(includeText ? validateFinalText(c, generated, final, ov) : [])];
  return { ok: !issues.some((i) => i.severity === 'block'), issues, checkedAt: new Date().toISOString() };
}
