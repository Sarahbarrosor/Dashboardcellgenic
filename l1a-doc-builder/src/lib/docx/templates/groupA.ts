import type { Block, CaseData, DocumentSpec, Seg } from '../../types';
import { blockFactory, Ctx, S } from '../blocks';
import { formatDateEN, todayISO } from '../../fields';

const FE = 'foreignEmployer';

/** Fila de tabla: helper corto. */
const R = (...cells: Seg[][]): Seg[][] => cells;

export function buildGroupA(c: CaseData): DocumentSpec[] {
  const ctx = new Ctx(c);
  const docs: DocumentSpec[] = [];
  const today = formatDateEN(todayISO()) as string;

  // ------------------------------------------------------------------ A1 ---
  {
    const b = blockFactory('A1');
    const blocks: Block[] = [
      b.letterhead(FE),
      b.date(S(today)),
      b.p(S('U.S. Citizenship and Immigration Services', { b: true })),
      b.p(S('Re: Employment Verification — ', { b: true }), ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria', { b: true })),
      b.p(S('To Whom It May Concern:')),
      b.pb(
        'entities.foreignEmployer.legalName',
        S('I write on behalf of '),
        ctx.entityName(FE),
        S(', a company organized under the laws of Mexico with its place of business at '),
        ctx.F('entities.foreignEmployer.address', 'domicilio de la empleadora extranjera'),
        S(', '),
        ctx.F('entities.foreignEmployer.city', 'ciudad de la empleadora extranjera'),
        S('. '),
        ctx.entityName(FE),
        S(' is the foreign employer of the beneficiary named above.'),
      ),
      b.pb(
        'beneficiary.employmentStartDate',
        ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria'),
        S(' has been continuously employed by this company on a full-time basis since '),
        ctx.FDate('beneficiary.employmentStartDate', 'fecha exacta de inicio de empleo en la empleadora extranjera'),
        S(', in the position of '),
        ctx.F('beneficiary.currentTitle', 'puesto actual de la beneficiaria en la empleadora extranjera'),
        S('. She performs her duties at our facility located in '),
        ctx.F('beneficiary.workLocation', 'ubicación física de trabajo'),
        S('.'),
      ),
      b.pb(
        'beneficiary.currentSalary',
        S('Her current gross annual compensation is '),
        ctx.FMoney('beneficiary.currentSalary', 'salario actual de la beneficiaria y su moneda'),
        S('. She reports directly to '),
        ctx.F('people.signerForeign.name', 'nombre de la persona a quien reporta la beneficiaria'),
        S(', '),
        ctx.F('people.signerForeign.title', 'cargo de la persona a quien reporta la beneficiaria'),
        S('.'),
      ),
      b.p(
        S('In her position she directs the operations described in the attached position description, which sets out each function she performs, the percentage of her time devoted to it, the manner in which she exercises that function, and the personnel who perform the underlying work. Her direct reports are listed in the attached organizational chart.'),
      ),
      b.p(
        S('This letter is issued at the request of the beneficiary in support of a petition filed with U.S. Citizenship and Immigration Services. Should you require any additional information or documentation, please contact the undersigned.'),
      ),
      b.p(S('Sincerely,')),
      b.signature(FE, c.people?.signerForeign?.name?.value ?? null, c.people?.signerForeign?.title?.value ?? null),
    ];
    docs.push({
      docId: 'A1', group: 'A', code: 'A1',
      title: 'Carta de verificación de empleo (empleadora extranjera)',
      deliverTo: 'Abogada de récord → USCIS (Tab D/E)',
      signedBy: c.people?.signerForeign?.name?.value ?? 'Firmante autorizado',
      tab: 'Tab D — Empleo de la beneficiaria en el extranjero',
      entityKey: FE,
      proves: 'Elemento 3: un año continuo de empleo en el extranjero dentro de los tres años previos.',
      blocks,
    });
  }

  // ------------------------------------------------------------------ A2 ---
  {
    const b = blockFactory('A2');
    const duties = c.sarahDuties ?? [];
    const rows: Seg[][][] = [
      R([S('Function', { b: true })], [S('% of time', { b: true })], [S('How she exercises it', { b: true })], [S('Who performs the underlying work', { b: true })]),
    ];
    if (duties.length === 0) {
      rows.push(R(
        [{ t: '[FALTA DATO: funciones de la beneficiaria con % de tiempo — capturar en la pestaña Hechos]', missing: { path: 'sarahDuties', label: 'funciones de la beneficiaria con % de tiempo' } }],
        [{ t: '[FALTA DATO: % de tiempo]', missing: { path: 'sarahDuties', label: '% de tiempo' } }],
        [{ t: '[FALTA DATO: cómo ejerce la función]', missing: { path: 'sarahDuties', label: 'cómo ejerce la función' } }],
        [{ t: '[FALTA DATO: quién ejecuta el trabajo subyacente]', missing: { path: 'sarahDuties', label: 'quién ejecuta el trabajo subyacente' } }],
      ));
    } else {
      duties.forEach((d, i) => {
        rows.push(R(
          [d.task ? S(d.task) : { t: '[FALTA DATO: función]', missing: { path: `sarahDuties.${i}.task`, label: 'función' } }],
          [d.percentTime != null ? S(`${d.percentTime}%`) : { t: '[FALTA DATO: % de tiempo]', missing: { path: `sarahDuties.${i}.percentTime`, label: '% de tiempo' } }],
          [d.howSheDoesIt ? S(d.howSheDoesIt) : { t: '[FALTA DATO: cómo ejerce la función — qué aprueba, qué firma, qué presupuesto controla, con qué frecuencia]', missing: { path: `sarahDuties.${i}.howSheDoesIt`, label: 'cómo ejerce la función' } }],
          [d.whoExecutes ? S(d.whoExecutes) : { t: '[FALTA DATO: quién ejecuta el trabajo subyacente]', missing: { path: `sarahDuties.${i}.whoExecutes`, label: 'quién ejecuta el trabajo subyacente' } }],
        ));
      });
      const total = duties.reduce((s, d) => s + (d.percentTime ?? 0), 0);
      rows.push(R([S('TOTAL', { b: true })], [S(`${total}%`, { b: true })], [S('')], [S('')]));
    }

    const blocks: Block[] = [
      b.letterhead(FE),
      b.date(S(today)),
      b.title(S('POSITION DESCRIPTION')),
      b.subtitle(ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria'), S(' — '), ctx.F('beneficiary.currentTitle', 'puesto actual de la beneficiaria')),
      b.subtitle(ctx.entityName(FE)),
      b.heading(S('1. Position and reporting line')),
      b.p(
        S('The beneficiary holds the position of '),
        ctx.F('beneficiary.currentTitle', 'puesto actual de la beneficiaria'),
        S(' at '), ctx.entityName(FE), S(', based in '), ctx.F('beneficiary.workLocation', 'ubicación física de trabajo'),
        S('. She reports to '), ctx.F('people.signerForeign.name', 'nombre de la persona a quien reporta'),
        S(', '), ctx.F('people.signerForeign.title', 'cargo de la persona a quien reporta'), S('.'),
      ),
      b.heading(S('2. Day-to-day duties and allocation of time')),
      b.p(S('The following table states each function performed by the beneficiary, the percentage of working time devoted to it, the specific manner in which she exercises it, and the personnel who perform the underlying operational work.')),
      b.table(rows),
      b.heading(S('3. Required education')),
      b.pb('beneficiary.education', ctx.F('beneficiary.education', 'educación requerida para el puesto / educación de la beneficiaria')),
      b.heading(S('4. Required skills')),
      b.pb('beneficiary.requiredSkills', ctx.F('beneficiary.requiredSkills', 'habilidades requeridas para el puesto')),
      b.heading(S('5. Current salary')),
      b.pb('beneficiary.currentSalary', S('Gross annual compensation: '), ctx.FMoney('beneficiary.currentSalary', 'salario actual de la beneficiaria y su moneda')),
      b.signature(FE, c.people?.signerForeign?.name?.value ?? null, c.people?.signerForeign?.title?.value ?? null),
    ];
    docs.push({
      docId: 'A2', group: 'A', code: 'A2',
      title: 'Descripción detallada del puesto de Sarah (extranjero)',
      deliverTo: 'Abogada de récord → USCIS (Tab E)',
      signedBy: c.people?.signerForeign?.name?.value ?? 'Firmante autorizado',
      tab: 'Tab E — Puesto en el extranjero',
      entityKey: FE,
      proves: 'Elemento 3: capacidad ejecutiva o gerencial en el extranjero. Separa dirigir de ejecutar.',
      blocks,
    });
  }

  // --------------------------------------------- A3 (uno por subordinado) ---
  const foreignSubs = c.subordinatesForeign ?? [];
  if (foreignSubs.length === 0) {
    const b = blockFactory('A3');
    docs.push({
      docId: 'A3', group: 'A', code: 'A3',
      title: 'Descripciones de puesto de subordinados directos (extranjero)',
      deliverTo: 'Abogada de récord → USCIS (Tab E)',
      signedBy: c.people?.signerForeign?.name?.value ?? 'Firmante autorizado',
      tab: 'Tab E — Puesto en el extranjero',
      entityKey: FE,
      proves: 'Elemento 4/3: que la beneficiaria dirige personal profesional. Punto más frágil del expediente.',
      blocks: [
        b.letterhead(FE),
        b.date(S(today)),
        b.title(S('POSITION DESCRIPTIONS — DIRECT REPORTS')),
        b.p({ t: '[FALTA DATO: no hay ningún subordinado directo capturado en la empleadora extranjera. Se necesita nombre, puesto, línea de reporte, educación, salario y funciones con % de tiempo de cada persona que reporta a la beneficiaria]', missing: { path: 'subordinatesForeign', label: 'subordinados directos de la beneficiaria en la empleadora extranjera' } }),
        b.note(S('Este documento se convierte en un .docx por persona en cuanto se capturen los subordinados en la pestaña Personas.')),
      ],
    });
  } else {
    foreignSubs.forEach((sub, i) => {
      const docId = `A3-${sub.id}`;
      const b = blockFactory(docId);
      const rows: Seg[][][] = [R([S('Function', { b: true })], [S('% of time', { b: true })])];
      if ((sub.duties ?? []).length === 0) {
        rows.push(R(
          [{ t: '[FALTA DATO: funciones del subordinado]', missing: { path: `subordinatesForeign.${i}.duties`, label: 'funciones del subordinado' } }],
          [{ t: '[FALTA DATO: % de tiempo]', missing: { path: `subordinatesForeign.${i}.duties`, label: '% de tiempo' } }],
        ));
      } else {
        sub.duties.forEach((d, j) => {
          rows.push(R(
            [d.task ? S(d.task) : { t: '[FALTA DATO: función]', missing: { path: `subordinatesForeign.${i}.duties.${j}.task`, label: 'función' } }],
            [d.percentTime != null ? S(`${d.percentTime}%`) : { t: '[FALTA DATO: % de tiempo]', missing: { path: `subordinatesForeign.${i}.duties.${j}.percentTime`, label: '% de tiempo' } }],
          ));
        });
        const total = sub.duties.reduce((s, d) => s + (d.percentTime ?? 0), 0);
        rows.push(R([S('TOTAL', { b: true })], [S(`${total}%`, { b: true })]));
      }
      const nameSeg: Seg = sub.name ? S(sub.name) : { t: '[FALTA DATO: nombre del subordinado]', missing: { path: `subordinatesForeign.${i}.name`, label: 'nombre del subordinado' } };
      const titleSeg: Seg = sub.title ? S(sub.title) : { t: '[FALTA DATO: puesto del subordinado]', missing: { path: `subordinatesForeign.${i}.title`, label: 'puesto del subordinado' } };
      const eduSeg: Seg = sub.education ? S(sub.education) : { t: '[FALTA DATO: educación del subordinado]', missing: { path: `subordinatesForeign.${i}.education`, label: 'educación del subordinado' } };
      const salSeg: Seg = sub.salary != null
        ? S(`${sub.salary.toLocaleString('en-US')}${sub.currency ? ` ${sub.currency}` : ' [FALTA DATO: moneda]'}`)
        : { t: '[FALTA DATO: salario del subordinado]', missing: { path: `subordinatesForeign.${i}.salary`, label: 'salario del subordinado' } };

      docs.push({
        docId, group: 'A', code: `A3.${i + 1}`,
        title: `Descripción de puesto — ${sub.name ?? 'subordinado sin nombre'} (extranjero)`,
        deliverTo: 'Abogada de récord → USCIS (Tab E)',
        signedBy: c.people?.signerForeign?.name?.value ?? 'Firmante autorizado',
        tab: 'Tab E — Puesto en el extranjero',
        entityKey: FE,
        proves: 'Elemento 4/3: personal profesional bajo la beneficiaria.',
        blocks: [
          b.letterhead(FE),
          b.date(S(today)),
          b.title(S('POSITION DESCRIPTION')),
          b.subtitle(nameSeg, S(' — '), titleSeg),
          b.subtitle(ctx.entityName(FE)),
          b.heading(S('1. Reporting line')),
          b.p(nameSeg, S(' reports directly to '), sub.reportsTo ? S(sub.reportsTo) : { t: '[FALTA DATO: línea de reporte]', missing: { path: `subordinatesForeign.${i}.reportsTo`, label: 'línea de reporte' } }, S('.')),
          b.heading(S('2. Duties and allocation of time')),
          b.table(rows),
          b.heading(S('3. Required education')),
          b.p(eduSeg),
          b.heading(S('4. Required skills')),
          b.p({ t: '[FALTA DATO: habilidades requeridas del subordinado]', missing: { path: `subordinatesForeign.${i}.skills`, label: 'habilidades requeridas del subordinado' } }),
          b.heading(S('5. Salary')),
          b.p(salSeg),
          b.heading(S('6. Supporting records on file')),
          b.bullet(S(`Curriculum vitae on file: ${sub.cvOnFile ? 'Yes' : 'No'}`)),
          b.bullet(S(`Degree / diploma on file: ${sub.degreeOnFile ? 'Yes' : 'No'}`)),
          b.signature(FE, c.people?.signerForeign?.name?.value ?? null, c.people?.signerForeign?.title?.value ?? null),
        ],
      });
    });
  }

  // ------------------------------------------------------------------ A4 ---
  {
    const b = blockFactory('A4');
    const rows: Seg[][][] = [R([S('Name', { b: true })], [S('Position', { b: true })], [S('Reports to', { b: true })], [S('Level', { b: true })])];
    rows.push(R(
      [ctx.F('people.signerForeign.name', 'nombre del directivo al que reporta la beneficiaria')],
      [ctx.F('people.signerForeign.title', 'cargo del directivo al que reporta la beneficiaria')],
      [S('—')],
      [S('1')],
    ));
    rows.push(R(
      [ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria')],
      [ctx.F('beneficiary.currentTitle', 'puesto actual de la beneficiaria')],
      [ctx.F('people.signerForeign.name', 'nombre del directivo al que reporta la beneficiaria')],
      [S('2')],
    ));
    if (foreignSubs.length === 0) {
      rows.push(R(
        [{ t: '[FALTA DATO: nombres de los subordinados directos]', missing: { path: 'subordinatesForeign', label: 'nombres de los subordinados directos' } }],
        [{ t: '[FALTA DATO: puestos de los subordinados directos]', missing: { path: 'subordinatesForeign', label: 'puestos de los subordinados directos' } }],
        [ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria')],
        [S('3')],
      ));
    } else {
      foreignSubs.forEach((sub, i) => {
        rows.push(R(
          [sub.name ? S(sub.name) : { t: '[FALTA DATO: nombre del subordinado]', missing: { path: `subordinatesForeign.${i}.name`, label: 'nombre del subordinado' } }],
          [sub.title ? S(sub.title) : { t: '[FALTA DATO: puesto del subordinado]', missing: { path: `subordinatesForeign.${i}.title`, label: 'puesto del subordinado' } }],
          [sub.reportsTo ? S(sub.reportsTo) : { t: '[FALTA DATO: línea de reporte]', missing: { path: `subordinatesForeign.${i}.reportsTo`, label: 'línea de reporte' } }],
          [S('3')],
        ));
      });
    }
    docs.push({
      docId: 'A4', group: 'A', code: 'A4',
      title: 'Organigrama real de la empleadora extranjera',
      deliverTo: 'Abogada de récord → USCIS (Tab E)',
      signedBy: '— (no requiere firma)',
      tab: 'Tab E — Puesto en el extranjero',
      entityKey: FE,
      proves: 'Elemento 4/3: posición de la beneficiaria y personal a su cargo.',
      blocks: [
        b.letterhead(FE),
        b.date(S(today)),
        b.title(S('ORGANIZATIONAL CHART')),
        b.subtitle(ctx.entityName(FE)),
        b.p(S('The following chart reflects the reporting lines in effect as of the date of this document. Each individual named below is an employee of '), ctx.entityName(FE), S('.')),
        b.table(rows),
        b.heading(S('Total headcount')),
        b.p(ctx.F('entities.foreignEmployer.employeeCount', 'número total de empleados de la empleadora extranjera')),
      ],
    });
  }

  // ------------------------------------------------------------------ A5 ---
  {
    const b = blockFactory('A5');
    docs.push({
      docId: 'A5', group: 'A', code: 'A5',
      title: 'Carta de referencia bancaria — borrador para el banco (extranjero)',
      deliverTo: 'Banco de la empleadora extranjera (para que la emita en su membrete)',
      signedBy: 'Funcionario del banco',
      tab: 'Tab B — Empleadora extranjera',
      entityKey: 'bank',
      proves: 'Elemento 2: operación regular, sistemática y continua de la empleadora extranjera.',
      blocks: [
        b.letterhead('bank'),
        b.note(S('BORRADOR para que el banco lo emita en su propio membrete y lo firme un funcionario autorizado. La app no imita el membrete de un banco.')),
        b.date(S(today)),
        b.p(S('To Whom It May Concern:')),
        b.p(
          S('This is to confirm that '), ctx.entityName(FE),
          S(', RFC '), ctx.F('entities.foreignEmployer.rfc', 'RFC de la empleadora extranjera'),
          S(', maintains account number '), { t: '[FALTA DATO: número de cuenta bancaria de la empleadora extranjera]', missing: { path: 'entities.foreignEmployer.bankAccount', label: 'número de cuenta bancaria de la empleadora extranjera' } },
          S(' with this institution, opened on '), { t: '[FALTA DATO: fecha de apertura de la cuenta]', missing: { path: 'entities.foreignEmployer.bankAccountOpened', label: 'fecha de apertura de la cuenta' } },
          S('.'),
        ),
        b.p(S('The account is active and in good standing. Relations with this institution have been satisfactory.')),
        b.p(S('This letter is issued at the request of the account holder and without liability on the part of this institution.')),
        b.signature('bank', null, null),
      ],
    });
  }

  return docs;
}
