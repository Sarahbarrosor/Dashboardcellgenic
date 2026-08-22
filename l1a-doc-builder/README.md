# L1A Doc Builder

Ensamblador de expedientes L-1A (transferido intracompañía, modalidad de **oficina nueva**,
8 C.F.R. § 214.2(l)(3)(v)). Guarda una sola base de hechos del caso, genera los documentos
del paquete en `.docx` real con membrete y Times New Roman 12, y corre un validador de
consistencia antes de dejar exportar.

**La app no redacta: ensambla.** No inventa hechos, no infiere fechas, no estima salarios,
no supone nombres de subordinados y no redacta logros que nadie declaró. Si un dato no está
en `case-data.json`, imprime `[FALTA DATO: …]` en resaltado amarillo.

## Correr

```bash
npm install
npm run dev      # http://localhost:3100
```

Sin base de datos. El estado vive en tres archivos en `data/`:

| Archivo | Qué guarda |
|---|---|
| `case-data.json` | La única base de hechos del caso. Cada valor lleva `value`, `status` (`confirmed`/`declared`/`missing`), `source` e historial de versiones. |
| `overrides.json` | Los bloques editados a mano. Nunca toca `case-data.json`. |
| `questions.json` | La cola de preguntas abiertas. Se crea sola en el primer arranque. |

Los `.docx` salen en `output/{Grupo X}/{documento}.docx`, más un `output/L1A-Package.zip`.
Los logos de membrete van en `assets/letterhead/` (ver el LEEME de esa carpeta).

## Las seis pestañas

1. **Preguntas** — la pantalla de inicio. Una pregunta a la vez, con las cuatro partes:
   lo que teníamos / lo que aparece ahora / por qué importa / qué documento lo aclararía.
   Priorizadas por cuántos documentos desbloquea cada respuesta. Sarah contesta en texto
   libre; la app extrae el hecho y lo devuelve reformulado — *"Entendí esto: ___. ¿Correcto?"* —
   antes de guardarlo. Si no logra extraerlo, lo dice; no adivina.
2. **Hechos** — el formulario de `case-data.json`, con semáforo por campo e historial por hecho.
3. **Personas** — alta de subordinados con funciones, % de tiempo, educación, salario y
   checkboxes de CV/título en archivo. Cada persona genera su propia descripción de puesto.
4. **Documentos** — la rejilla del catálogo con el botón **GENERAR TODO**.
5. **Editor** — documento con membrete a la derecha, edición por bloque, llenado inline de
   faltantes y **EXPORTAR TODO**.
6. **Evidencia** — el checklist de recolección más el registro de faltantes, con las cuatro
   columnas: qué necesitamos / por qué / dónde buscarlo / alternativa si no existe.

Barra superior permanente con preguntas abiertas, documentos listos, datos faltantes,
inconsistencias y bloques editados.

## Catálogo de documentos

**Grupo A — entidad extranjera:** A1 carta de verificación de empleo · A2 descripción del
puesto de la beneficiaria con % de tiempo · A3 descripción de puesto de **cada** subordinado
directo (un `.docx` por persona) · A4 organigrama real · A5 borrador de carta de referencia bancaria.

**Grupo B — peticionaria (GSCG):** B1 carta de oferta · B2 descripción del puesto propuesto ·
B3 descripciones de los puestos de EE.UU. · B4 organigrama proyectado año 1 · B5 borrador bancario.

**Grupo C — petición:** C1 Petition Support Letter (nueve secciones, tabla de asignación de
tiempo, índice de exhibits) · C2 Beneficiary Declaration · C3 Business Plan de oficina nueva ·
C4 memorándum de relación calificada · C5 índice maestro de exhibits y carátulas Tab A–H ·
C6 registro de evidencia faltante.

**Grupo D** no se genera: se rastrea en la pestaña Evidencia con estado `Tengo`/`Solicitado`/`Falta`.

> El catálogo tiene 16 documentos base y **crece con las personas**: A3 y B3 se expanden a un
> `.docx` por subordinado. Con cinco reportes directos capturados el paquete llega a 21. La barra
> superior muestra el total real del momento, no un número fijo.

Los documentos del paquete se redactan en inglés, que es el idioma en que los lee el oficial
que decide. La interfaz, las preguntas y las notas internas están en español.

## El campo que decide el caso: `sarahDuties`

Cada función exige cuatro campos, y la app **rechaza guardar** si faltan los dos últimos:

- `task` — qué función
- `percentTime` — % de tiempo (la suma debe dar 100 exacto)
- `howSheDoesIt` — **cómo** la ejerce: qué aprueba, qué firma, qué presupuesto controla, con
  qué frecuencia, sobre qué monto, en qué junta
- `whoExecutes` — **quién ejecuta el trabajo subyacente**

Quien ejecuta el trabajo técnico no es ejecutivo; quien decide, aprueba, presupuesta, contrata
y responde por el resultado, sí. Una viñeta vaga como *"dirige la estrategia comercial
internacional"* provoca un RFE, así que no se puede guardar.

## Validador

Corre antes de cada generación y otra vez sobre el **texto final editado** antes de exportar.
Cada error muestra hecho previo / hecho nuevo / por qué importa / qué documento lo aclara.
Bloquea cuando:

1. Aparece "Cellgenic" donde debe decir la empleadora extranjera.
2. Los `percentTime` de la beneficiaria o de un subordinado no suman 100.
3. La vigencia de un documento es anterior a la constitución de la entidad que lo emite.
4. Una entidad aparece escrita de dos formas distintas en el paquete.
5. La fecha de inicio de empleo no acredita un año continuo dentro de los tres años previos.
6. El titular del arrendamiento de Plantation ≠ peticionaria del I-129.
7. Un subordinado está en una descripción de puesto pero no en el organigrama, o al revés.
8. La entidad pagadora de los recibos ≠ empleadora declarada.

Al arrancar bloquea con la regla 3: el Operating Agreement de Cellgenic, LLC dice tener
vigencia desde el 2024-01-01 y la entidad se constituyó el 2024-07-25. Es un defecto real del
expediente y se resuelve reemitiendo el documento, no cambiando el número en la app.

## Restricciones de integridad (no negociables)

La app rechaza, por diseño:

- Insertar imágenes de firma. Todo documento sale sin firmar, con línea en blanco y campo de
  fecha vacío.
- Fechar cualquier documento con fecha anterior a hoy. Una declaración redactada hoy puede
  describir hechos pasados, pero se presenta como declaración actual, fechada hoy.
- Rellenar un campo vacío con una suposición plausible.
- Borrar un `[FALTA DATO]` sin llenarlo, ni editando ni con buscar y reemplazar. Un hueco
  borrado sin llenar convierte una laguna visible en una afirmación silenciosa.
- Teclear a mano el nombre de la empleadora extranjera: está bloqueado en
  `entities.foreignEmployer.legalName` y se propaga desde ahí a todos los documentos.
- Nombrar en un documento una entidad que no esté dada de alta en el catálogo de entidades.

## Capa de edición

`GENERAR TODO` compone los documentos en memoria; no descarga nada. En el Editor cada bloque
es editable en línea:

- Un bloque editado se marca **"editado a mano"** y se guarda en `overrides.json`. Regenerar no
  lo pisa. Hay **"restaurar desde los datos"** por bloque y por documento, e historial con deshacer.
- Si el bloque estaba vinculado a un dato, la app pregunta *"¿Corregir también el dato del caso?"*.
  Si sí, actualiza `case-data.json` y el cambio se propaga a los demás documentos. Si no, queda
  como divergencia deliberada, solo en ese documento.
- Los `[FALTA DATO]` amarillos son clickeables: el dato se escribe ahí y se guarda en el caso,
  no en el documento. Capturado una vez, desaparece de todos los documentos a la vez —también
  de los que ya se editaron a mano.
- Buscar y reemplazar en todos los documentos, comparar versión generada vs editada.

`EXPORTAR TODO` vuelve a correr el validador sobre el texto final. Si no pasa, no exporta y
dice qué documento y qué bloque tienen el problema.

## Formato de salida

Times New Roman 12 pt · interlineado 1.15 · márgenes 1" · membrete con logo, nombre legal,
domicilio y teléfono · pie con `Página X de Y` · bloque de firma con nombre, cargo, entidad,
línea en blanco y campo de fecha vacío · faltantes en resaltado amarillo.

## Aviso

Todo lo que sale de aquí es un **borrador para revisión de la abogada de récord** antes de
firmarse o presentarse. La app organiza y da formato a hechos reales; no acredita hechos ni
sustituye asesoría legal.

Pendiente fuera de la app: la abogada de récord cree que la empleadora es "Cellgenic Mexico".
Hay que corregirlo por escrito y por adelantado. Si el I-129 se redacta nombrando a la entidad
equivocada como empleadora extranjera, el error es material.
