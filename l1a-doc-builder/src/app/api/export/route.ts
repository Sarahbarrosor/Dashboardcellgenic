import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { NextRequest, NextResponse } from 'next/server';
import { snapshot } from '@/lib/service';
import { runValidation } from '@/lib/validator';
import { renderDocx } from '@/lib/docx/render';
import { OUTPUT_DIR } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function safe(name: string): string {
  return name.replace(/[^\w\dÁÉÍÓÚÜÑáéíóúüñ .-]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 90);
}

/**
 * EXPORTAR TODO. El validador corre otra vez, ahora sobre el texto final editado,
 * no solo sobre los datos. Si no pasa, no exporta y dice qué documento y qué bloque.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { docId?: string };
  const s = snapshot();
  const validation = runValidation(s.caseData, s.generated, s.final, s.overrides, true);
  if (!validation.ok) {
    return NextResponse.json({ error: 'La exportación está bloqueada por inconsistencias.', validation }, { status: 409 });
  }

  const targets = body.docId ? s.final.filter((d) => d.docId === body.docId) : s.final;
  if (!targets.length) return NextResponse.json({ error: 'No hay documentos que exportar.' }, { status: 404 });

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const written: { docId: string; file: string }[] = [];
  const zip = new JSZip();

  for (const d of targets) {
    const buf = await renderDocx(s.caseData, d);
    const dir = path.join(OUTPUT_DIR, `Grupo ${d.group}`);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${safe(`${d.code} - ${d.title}`)}.docx`);
    fs.writeFileSync(file, buf);
    zip.file(`Grupo ${d.group}/${path.basename(file)}`, buf);
    written.push({ docId: d.docId, file: path.relative(OUTPUT_DIR, file) });
  }

  let zipFile: string | null = null;
  if (!body.docId) {
    zip.file('LEEME.txt', [
      'Paquete generado por L1A Doc Builder.',
      '',
      'Todo lo que sale de aquí es un BORRADOR para revisión de la abogada de récord antes de',
      'firmarse o presentarse. La app organiza y da formato a hechos reales; no acredita hechos',
      'ni sustituye asesoría legal.',
      '',
      'Los campos resaltados en amarillo con [FALTA DATO: ...] son huecos reales del expediente.',
      'No se rellenan con suposiciones: se llenan con el documento que los pruebe.',
      '',
      `Generado: ${new Date().toISOString()}`,
    ].join('\n'));
    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });
    zipFile = path.join(OUTPUT_DIR, 'L1A-Package.zip');
    fs.writeFileSync(zipFile, zipBuf);
  }

  return NextResponse.json({
    ok: true,
    written,
    zip: zipFile ? path.relative(OUTPUT_DIR, zipFile) : null,
    outputDir: OUTPUT_DIR,
    validation,
  });
}
