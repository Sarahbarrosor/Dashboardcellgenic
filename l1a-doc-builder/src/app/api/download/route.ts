import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { OUTPUT_DIR } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rel = req.nextUrl.searchParams.get('file');
  if (!rel) return new Response('Falta el archivo.', { status: 400 });
  const file = path.resolve(OUTPUT_DIR, rel);
  if (!file.startsWith(path.resolve(OUTPUT_DIR))) return new Response('Ruta no permitida.', { status: 403 });
  if (!fs.existsSync(file)) return new Response('El archivo no existe. Exporta primero.', { status: 404 });
  const buf = fs.readFileSync(file);
  const isZip = file.endsWith('.zip');
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': isZip ? 'application/zip' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(path.basename(file))}"`,
    },
  });
}
