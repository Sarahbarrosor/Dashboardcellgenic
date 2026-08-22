import fs from 'fs';
import path from 'path';
import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, ImageRun, Packer,
  PageBreak, PageNumber, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';
import type { Block, CaseData, DocumentSpec, Seg } from '../types';
import { fieldValue } from '../fields';
import { LETTERHEAD_DIR } from '../store';

const FONT = 'Times New Roman';
const SIZE = 24;        // 12 pt = 24 half-points
const LINE = 276;       // interlineado 1.15
const MARGIN = 1440;    // 1 pulgada

function runs(segs: Seg[] | undefined, base: Partial<{ bold: boolean; size: number; allCaps: boolean }> = {}): TextRun[] {
  return (segs ?? []).map((s) => new TextRun({
    text: s.t,
    bold: s.b || base.bold,
    italics: s.i,
    underline: s.u ? {} : undefined,
    font: FONT,
    size: base.size ?? SIZE,
    // Todo campo sin dato sale en resaltado amarillo. Es la regla que hace visible la laguna.
    highlight: s.missing || s.t.includes('[FALTA DATO:') ? 'yellow' : undefined,
  }));
}

function para(segs: Seg[] | undefined, opts: any = {}): Paragraph {
  return new Paragraph({
    children: runs(segs, opts.base),
    spacing: { line: LINE, after: opts.after ?? 160 },
    alignment: opts.alignment,
    heading: opts.heading,
    bullet: opts.bullet,
    numbering: opts.numbering,
    indent: opts.indent,
  });
}

function logoFor(entityKey: string | null | undefined): Buffer | null {
  if (!entityKey) return null;
  for (const ext of ['png', 'jpg', 'jpeg']) {
    const p = path.join(LETTERHEAD_DIR, `${entityKey}.${ext}`);
    if (fs.existsSync(p)) return fs.readFileSync(p);
  }
  return null;
}

/** Membrete: logo + nombre legal + dirección + teléfono, cargado desde /assets/letterhead/. */
function buildHeader(c: CaseData, entityKey: string | null | undefined): Header | undefined {
  if (!entityKey || entityKey === 'none') return undefined;
  if (entityKey === 'bank') {
    return new Header({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: '[MEMBRETE DEL BANCO — este borrador lo emite el banco en su propio papel]', font: FONT, size: SIZE, highlight: 'yellow' })],
        }),
        new Paragraph({ text: '', border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } } }),
      ],
    });
  }
  const name = fieldValue(c, `entities.${entityKey}.legalName`) ?? '[FALTA DATO: nombre legal de la entidad]';
  const address = fieldValue(c, `entities.${entityKey}.address`);
  const phone = fieldValue(c, `entities.${entityKey}.phone`);
  const logo = logoFor(entityKey);

  const children: Paragraph[] = [];
  if (logo) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: logo, transformation: { width: 160, height: 60 } })],
    }));
  }
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: name, bold: true, font: FONT, size: 26, highlight: name.startsWith('[FALTA DATO') ? 'yellow' : undefined })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({
      text: address ?? '[FALTA DATO: domicilio de la entidad para el membrete]',
      font: FONT, size: 20,
      highlight: address ? undefined : 'yellow',
    })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({
      text: phone ? `Tel. ${phone}` : '[FALTA DATO: teléfono de la entidad para el membrete]',
      font: FONT, size: 20,
      highlight: phone ? undefined : 'yellow',
    })],
  }));
  children.push(new Paragraph({ text: '', border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } } }));
  return new Header({ children });
}

/** Pie con numeración "Página X de Y". */
function buildFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Página ', font: FONT, size: 20 }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 }),
          new TextRun({ text: ' de ', font: FONT, size: 20 }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 20 }),
        ],
      }),
    ],
  });
}

/**
 * Bloque de firma: nombre, cargo, entidad, línea en blanco y campo de fecha vacío.
 * Nunca se inserta una imagen de firma. Nunca sale firmado.
 */
function signatureBlock(c: CaseData, b: Block): Paragraph[] {
  const entityName = b.entityKey && b.entityKey !== 'none' && b.entityKey !== 'bank'
    ? fieldValue(c, `entities.${b.entityKey}.legalName`)
    : null;
  const out: Paragraph[] = [
    new Paragraph({ text: '', spacing: { before: 400, after: 0 } }),
    new Paragraph({ children: [new TextRun({ text: '_______________________________________', font: FONT, size: SIZE })], spacing: { after: 60 } }),
  ];
  out.push(new Paragraph({
    children: [new TextRun({
      text: b.signerName ?? '[FALTA DATO: nombre de quien firma]',
      font: FONT, size: SIZE, bold: true,
      highlight: b.signerName ? undefined : 'yellow',
    })],
    spacing: { after: 20 },
  }));
  if (b.signerTitle !== undefined) {
    out.push(new Paragraph({
      children: [new TextRun({
        text: b.signerTitle ?? '[FALTA DATO: cargo de quien firma]',
        font: FONT, size: SIZE,
        highlight: b.signerTitle ? undefined : 'yellow',
      })],
      spacing: { after: 20 },
    }));
  }
  if (entityName) {
    out.push(new Paragraph({ children: [new TextRun({ text: entityName, font: FONT, size: SIZE })], spacing: { after: 200 } }));
  }
  out.push(new Paragraph({
    children: [new TextRun({ text: 'Date: _______________________', font: FONT, size: SIZE })],
    spacing: { after: 160 },
  }));
  return out;
}

function tableFor(b: Block): Table {
  const rows = (b.rows ?? []).map((row, ri) => new TableRow({
    tableHeader: ri === 0 && b.header !== false,
    children: row.map((cell) => new TableCell({
      children: [new Paragraph({ children: runs(cell), spacing: { line: LINE, after: 40 } })],
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
    })),
  }));
  return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } });
}

function renderBlock(c: CaseData, b: Block): (Paragraph | Table)[] {
  if (b.disabled) return [];
  switch (b.type) {
    case 'letterhead':
      return []; // el membrete vive en el encabezado de la sección
    case 'title':
      return [para(b.segs, { alignment: AlignmentType.CENTER, base: { bold: true, size: 28 }, after: 120 })];
    case 'subtitle':
      return [para(b.segs, { alignment: AlignmentType.CENTER, base: { bold: true }, after: 200 })];
    case 'date':
      return [para(b.segs, { after: 240 })];
    case 'heading':
      return [para(b.segs, { base: { bold: true }, after: 120, heading: HeadingLevel.HEADING_2 })];
    case 'paragraph':
      return [para(b.segs)];
    case 'bullet':
      return [para(b.segs, { bullet: { level: b.indentLevel ?? 0 }, after: 80 })];
    case 'numbered':
      return [para(b.segs, { numbering: { reference: 'l1a-numbered', level: 0 }, after: 80 })];
    case 'note':
      return [para((b.segs ?? []).map((s) => ({ ...s, i: true })), { after: 160 })];
    case 'table':
      return [tableFor(b), new Paragraph({ text: '', spacing: { after: 160 } })];
    case 'signature':
      return signatureBlock(c, b);
    case 'pagebreak':
      return [new Paragraph({ children: [new PageBreak()] })];
    default:
      return [para(b.segs)];
  }
}

export async function renderDocx(c: CaseData, spec: DocumentSpec): Promise<Buffer> {
  const letterhead = spec.blocks.find((b) => b.type === 'letterhead');
  const entityKey = letterhead?.entityKey ?? spec.entityKey;
  const children = spec.blocks.flatMap((b) => renderBlock(c, b));

  const doc = new Document({
    creator: 'L1A Doc Builder',
    title: spec.title,
    description: `${spec.code} — ${spec.title}. Borrador para revisión de la abogada de récord.`,
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SIZE },
          paragraph: { spacing: { line: LINE } },
        },
        heading2: { run: { font: FONT, size: SIZE, bold: true, color: '000000' }, paragraph: { spacing: { before: 240, after: 120, line: LINE } } },
      },
    },
    numbering: {
      config: [{
        reference: 'l1a-numbered',
        levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
      }],
    },
    sections: [{
      properties: { page: { margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      headers: buildHeader(c, entityKey) ? { default: buildHeader(c, entityKey)! } : undefined,
      footers: { default: buildFooter() },
      children,
    }],
  });
  return Packer.toBuffer(doc);
}
