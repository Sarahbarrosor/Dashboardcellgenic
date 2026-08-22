import type { EvidenceItem } from './types';

export const TABS = [
  { id: 'Tab A', name: 'Peticionaria estadounidense: constitución, EIN, impuestos, banco, arrendamiento, operación' },
  { id: 'Tab B', name: 'Empleadora extranjera: acta constitutiva, RFC, COFEPRIS, arrendamiento, banco, operación' },
  { id: 'Tab C', name: 'Relación calificada: cadena de propiedad, certificados, libro de accionistas, filings SEC' },
  { id: 'Tab D', name: 'Empleo de la beneficiaria en el extranjero: nómina CFDI, IMSS, permiso INM, contrato' },
  { id: 'Tab E', name: 'Puesto en el extranjero: carta de empleo, descripción con % de tiempo, organigrama, subordinados' },
  { id: 'Tab F', name: 'Plan de negocio de oficina nueva: proyecciones, plan de contratación a 12 meses, arrendamiento Plantation' },
  { id: 'Tab G', name: 'Puesto propuesto en EE.UU.: carta de oferta, descripción, organigrama proyectado' },
  { id: 'Tab H', name: 'Identidad y respaldo personal de la beneficiaria' },
] as const;

export interface ChecklistEntry {
  id: string;
  name: string;
  tab: string;
  proves: string;
  whereToLook: string;
  alternative: string;
}

/**
 * GRUPO D — recolección. La app no genera estos documentos; los rastrea.
 * Las cuatro columnas del registro de faltantes viven aquí:
 * qué necesitamos / por qué / dónde buscarlo / alternativa si no existe.
 */
export const EVIDENCE_CHECKLIST: ChecklistEntry[] = [
  { id: 'd1', name: 'Operating Agreement / certificado accionario de GSCG (100% RMTG)', tab: 'Tab C', proves: 'Relación calificada: control de la matriz sobre la peticionaria', whereToLook: 'Libro corporativo de GSCG; abogado corporativo; filings SEC de RMTG', alternative: 'Filings SEC de RMTG que describan la subsidiaria + declaración jurada del secretario corporativo' },
  { id: 'd2', name: 'Operating Agreement / certificado de membresía de Cellgenic, LLC — REEMITIDO con fecha 25/07/2024 o posterior', tab: 'Tab A', proves: 'Corrige un documento que se contradice en su propia página', whereToLook: 'Abogado que redactó el Operating Agreement original', alternative: 'Acta de los miembros ratificando el acuerdo con la fecha real de constitución' },
  { id: 'd3', name: 'Operating Agreement / certificado de Cellular Hope Institute', tab: 'Tab C', proves: 'Relación calificada: participación de GSCG en la empleadora extranjera', whereToLook: 'Notario que protocolizó el acta; contador de CHI', alternative: 'Libro de accionistas certificado por el secretario del consejo' },
  { id: 'd4', name: 'Articles of Incorporation + Operating Agreement + certificado de ISSCA (US)', tab: 'Tab A', proves: 'Estructura del grupo estadounidense', whereToLook: 'sunbiz.org y libro corporativo', alternative: 'Registro público estatal impreso' },
  { id: 'd5', name: 'Articles of Incorporation de RMTG', tab: 'Tab C', proves: 'Existencia legal de la matriz', whereToLook: 'Secretaría de Estado de Nevada; filings SEC', alternative: 'Certificado de buena situación (good standing) vigente' },
  { id: 'd6', name: 'Acta constitutiva, RFC y libro de accionistas de la empleadora mexicana', tab: 'Tab B', proves: 'Existencia legal y propiedad de la empleadora extranjera', whereToLook: 'Notario, contador, portal del SAT', alternative: 'Constancia de situación fiscal + boleta del Registro Público de Comercio' },
  { id: 'd7', name: 'Recibos de nómina de Sarah, últimos 2 años (CFDI timbrados)', tab: 'Tab D', proves: 'Año continuo de empleo en el extranjero y entidad pagadora', whereToLook: 'Portal del SAT con la e.firma de CHI; recursos humanos de CHI', alternative: 'Estados de cuenta bancarios con los depósitos de nómina + carta del patrón' },
  { id: 'd8', name: 'Reporte de semanas cotizadas del IMSS de Sarah (mejor evidencia individual del expediente)', tab: 'Tab D', proves: 'Año continuo de empleo con CHI como patrón, con sello de una autoridad', whereToLook: 'Portal del IMSS con CURP y NSS', alternative: 'Constancia de alta patronal + recibos CFDI, aunque prueban menos' },
  { id: 'd9', name: 'Permiso de trabajo INM de Sarah patrocinado por CHI', tab: 'Tab D', proves: 'Que el empleo en el extranjero es lícito y está patrocinado por la empleadora declarada', whereToLook: 'Tarjeta de residente y resolución del INM', alternative: 'Constancia de trámite del INM' },
  { id: 'd10', name: 'Contrato de arrendamiento de la oficina mexicana', tab: 'Tab B', proves: 'Operación física de la empleadora extranjera', whereToLook: 'Administración de CHI', alternative: 'Recibos de renta + fotografías fechadas del local con licencia visible' },
  { id: 'd11', name: 'Estados de cuenta bancarios de la entidad mexicana', tab: 'Tab B', proves: 'Operación regular, sistemática y continua', whereToLook: 'Banca en línea de CHI', alternative: 'Carta de referencia bancaria (documento A5)' },
  { id: 'd12', name: 'Evidencia de operación sistemática mexicana: facturas y contratos, últimos 2 años', tab: 'Tab B', proves: 'Que la empleadora extranjera hace negocio, no solo existe en papel', whereToLook: 'Facturación del SAT; carpeta de contratos de CHI', alternative: 'Reporte de facturación emitido por el contador' },
  { id: 'd13', name: 'Declaraciones de impuestos corporativas de GSCG, últimos 3 años', tab: 'Tab A', proves: 'Operación y capacidad financiera de la peticionaria', whereToLook: 'Contador de GSCG', alternative: 'Transcripts del IRS (Form 4506-T)' },
  { id: 'd14', name: 'Contrato de arrendamiento de Plantation, FL, a nombre de GSCG', tab: 'Tab F', proves: 'Elemento de oficina nueva: local físico asegurado a nombre de la peticionaria', whereToLook: 'Arrendador o corredor del inmueble', alternative: 'Carta de intención firmada + comprobante de depósito, aunque prueba menos' },
  { id: 'd15', name: 'Cartas de EIN/FEIN de GSCG y subsidiarias', tab: 'Tab A', proves: 'Identidad fiscal de la peticionaria; debe coincidir con nómina y I-129', whereToLook: 'Carta CP 575 del IRS; si se perdió, pedir 147C por teléfono al IRS', alternative: 'Carta 147C del IRS' },
  { id: 'd16', name: 'Evidencia de operación sistemática de GSCG: contratos y facturas 2024–hoy', tab: 'Tab A', proves: 'Que la peticionaria hace negocio de forma regular y continua', whereToLook: 'Sistema de facturación de GSCG', alternative: 'Reporte de ventas certificado por el contador' },
  { id: 'd17', name: 'Estados de cuenta bancarios de GSCG, últimos 6–12 meses', tab: 'Tab A', proves: 'Capacidad de sostener la nueva oficina y el salario ofrecido', whereToLook: 'Banca en línea de GSCG', alternative: 'Carta de referencia bancaria (documento B5)' },
  { id: 'd18', name: 'CVs y títulos de CADA subordinado directo de Sarah', tab: 'Tab E', proves: 'Que el personal bajo la beneficiaria es profesional — sostiene la teoría gerencial', whereToLook: 'Expedientes de recursos humanos de CHI', alternative: 'Cédula profesional o carta de la universidad, si el título no está a la mano' },
  { id: 'd19', name: 'Pasaporte mexicano de Sarah (pregunta abierta de la abogada)', tab: 'Tab H', proves: 'Planeación del trámite consular', whereToLook: 'Acuse de solicitud ante la SRE, si existe', alternative: 'Pasaporte venezolano vigente + tarjeta de residente mexicana' },
];

export function defaultInventory(): EvidenceItem[] {
  return EVIDENCE_CHECKLIST.map((e) => ({
    id: e.id,
    name: e.name,
    tab: e.tab,
    status: 'Falta' as const,
    owner: null,
    proves: e.proves,
    notes: null,
  }));
}
