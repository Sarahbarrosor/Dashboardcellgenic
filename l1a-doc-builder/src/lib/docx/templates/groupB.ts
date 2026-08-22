import type { Block, CaseData, DocumentSpec, Seg } from '../../types';
import { blockFactory, Ctx, S } from '../blocks';
import { formatDateEN, todayISO } from '../../fields';

const PT = 'petitioner';
const R = (...cells: Seg[][]): Seg[][] => cells;

export function buildGroupB(c: CaseData): DocumentSpec[] {
  const ctx = new Ctx(c);
  const docs: DocumentSpec[] = [];
  const today = formatDateEN(todayISO()) as string;

  // ------------------------------------------------------------------ B1 ---
  {
    const b = blockFactory('B1');
    const blocks: Block[] = [
      b.letterhead(PT),
      b.date(S(today)),
      b.p(ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria', { b: true })),
      b.p(ctx.F('beneficiary.workLocation', 'domicilio actual de la beneficiaria')),
      b.p(S('Re: Offer of Employment — ', { b: true }), ctx.F('beneficiary.proposedTitle', 'puesto propuesto en EE.UU.', { b: true })),
      b.p(S('Dear '), ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria'), S(':')),
      b.pb(
        'entities.petitioner.legalName',
        S('On behalf of '), ctx.entityName(PT),
        S(', a corporation organized under the laws of '), ctx.F('entities.petitioner.state', 'estado de constitución de la peticionaria'),
        S(' with its principal place of business at '), ctx.F('entities.petitioner.address', 'domicilio de la peticionaria'),
        S(', I am pleased to offer you the position of '), ctx.F('beneficiary.proposedTitle', 'puesto propuesto en EE.UU.'),
        S('.'),
      ),
      b.pb(
        'beneficiary.proposedSalary',
        S('Your gross annual compensation in this position will be '),
        ctx.FMoney('beneficiary.proposedSalary', 'salario propuesto en EE.UU. y su moneda'),
        S('. You will report directly to '), ctx.F('people.signerUS.name', 'nombre de la persona a quien reportará en EE.UU.'),
        S(', '), ctx.F('people.signerUS.title', 'cargo de la persona a quien reportará en EE.UU.'), S('.'),
      ),
      b.pb(
        'usOffice.address',
        S('You will be based at the company\'s U.S. office located at '), ctx.F('usOffice.address', 'domicilio de la oficina de EE.UU.'),
        S('. Your duties, your decision-making authority and the personnel who will perform the underlying operational work are set out in the position description accompanying this letter.'),
      ),
      b.pb(
        'beneficiary.proposedStartDate',
        S('This offer is contingent upon approval by U.S. Citizenship and Immigration Services of the petition filed on your behalf, and your employment will commence on '),
        ctx.F('beneficiary.proposedStartDate', 'fecha de inicio propuesta del empleo en EE.UU.'),
        S(' or upon such approval, whichever is later.'),
      ),
      b.p(S('We look forward to your leadership of our U.S. operations.')),
      b.p(S('Sincerely,')),
      b.signature(PT, c.people?.signerUS?.name?.value ?? null, c.people?.signerUS?.title?.value ?? null),
      b.p(S('Accepted and agreed:')),
      b.signature(PT, c.beneficiary?.fullName?.value ?? null, null),
    ];
    docs.push({
      docId: 'B1', group: 'B', code: 'B1',
      title: 'Carta de oferta de empleo (GSCG)',
      deliverTo: 'Abogada de récord → USCIS (Tab G)',
      signedBy: c.people?.signerUS?.name?.value ?? 'Firmante autorizado',
      tab: 'Tab G — Puesto propuesto en EE.UU.',
      entityKey: PT,
      proves: 'Elemento 4: el puesto en EE.UU. será ejecutivo o gerencial.',
      blocks,
    });
  }

  // ------------------------------------------------------------------ B2 ---
  {
    const b = blockFactory('B2');
    const duties = c.proposedUSDuties ?? [];
    const rows: Seg[][][] = [
      R([S('Function', { b: true })], [S('% of time', { b: true })], [S('How the function is exercised', { b: true })], [S('Who performs the underlying work', { b: true })]),
    ];
    if (duties.length === 0) {
      rows.push(R(
        [{ t: '[FALTA DATO: funciones del puesto propuesto en EE.UU. con % de tiempo]', missing: { path: 'proposedUSDuties', label: 'funciones del puesto propuesto en EE.UU. con % de tiempo' } }],
        [{ t: '[FALTA DATO: % de tiempo]', missing: { path: 'proposedUSDuties', label: '% de tiempo' } }],
        [{ t: '[FALTA DATO: cómo se ejerce la función]', missing: { path: 'proposedUSDuties', label: 'cómo se ejerce la función' } }],
        [{ t: '[FALTA DATO: quién ejecuta el trabajo subyacente]', missing: { path: 'proposedUSDuties', label: 'quién ejecuta el trabajo subyacente' } }],
      ));
    } else {
      duties.forEach((d, i) => {
        rows.push(R(
          [d.task ? S(d.task) : { t: '[FALTA DATO: función]', missing: { path: `proposedUSDuties.${i}.task`, label: 'función' } }],
          [d.percentTime != null ? S(`${d.percentTime}%`) : { t: '[FALTA DATO: % de tiempo]', missing: { path: `proposedUSDuties.${i}.percentTime`, label: '% de tiempo' } }],
          [d.howSheDoesIt ? S(d.howSheDoesIt) : { t: '[FALTA DATO: cómo se ejerce la función — qué aprueba, qué firma, qué presupuesto controla]', missing: { path: `proposedUSDuties.${i}.howSheDoesIt`, label: 'cómo se ejerce la función' } }],
          [d.whoExecutes ? S(d.whoExecutes) : { t: '[FALTA DATO: quién ejecuta el trabajo subyacente]', missing: { path: `proposedUSDuties.${i}.whoExecutes`, label: 'quién ejecuta el trabajo subyacente' } }],
        ));
      });
      const total = duties.reduce((s, d) => s + (d.percentTime ?? 0), 0);
      rows.push(R([S('TOTAL', { b: true })], [S(`${total}%`, { b: true })], [S('')], [S('')]));
    }
    docs.push({
      docId: 'B2', group: 'B', code: 'B2',
      title: 'Descripción del puesto propuesto en EE.UU.',
      deliverTo: 'Abogada de récord → USCIS (Tab G)',
      signedBy: c.people?.signerUS?.name?.value ?? 'Firmante autorizado',
      tab: 'Tab G — Puesto propuesto en EE.UU.',
      entityKey: PT,
      proves: 'Elemento 4: capacidad ejecutiva o gerencial del puesto en EE.UU.',
      blocks: [
        b.letterhead(PT),
        b.date(S(today)),
        b.title(S('PROPOSED U.S. POSITION DESCRIPTION')),
        b.subtitle(ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria'), S(' — '), ctx.F('beneficiary.proposedTitle', 'puesto propuesto en EE.UU.')),
        b.subtitle(ctx.entityName(PT)),
        b.heading(S('1. Position, location and reporting line')),
        b.p(
          S('The beneficiary will serve as '), ctx.F('beneficiary.proposedTitle', 'puesto propuesto en EE.UU.'),
          S(' at '), ctx.entityName(PT), S(', based at '), ctx.F('usOffice.address', 'domicilio de la oficina de EE.UU.'),
          S('. She will report to '), ctx.F('people.signerUS.name', 'nombre de la persona a quien reportará'),
          S(', '), ctx.F('people.signerUS.title', 'cargo de la persona a quien reportará'), S('.'),
        ),
        b.heading(S('2. Daily duties, authority and allocation of time')),
        b.p(S('The table below states each function, the percentage of working time devoted to it, the concrete manner in which the beneficiary exercises the function — what she approves, what she signs, what budget she controls and at what frequency — and the personnel who perform the underlying operational work.')),
        b.table(rows),
        b.heading(S('3. Autonomy and decision-making authority')),
        b.p({ t: '[FALTA DATO: límites de autoridad de la beneficiaria en EE.UU. — monto máximo de compra que aprueba sin autorización, autoridad de contratación y despido, control presupuestal, firma bancaria]', missing: { path: 'beneficiary.usAuthority', label: 'límites de autoridad de la beneficiaria en EE.UU.' } }),
        b.heading(S('4. Personnel to be supervised')),
        b.p(S('The U.S. personnel who will report to the beneficiary are set out in the projected organizational chart (Exhibit B4) and in the twelve-month hiring plan contained in the business plan (Exhibit C3).')),
        b.heading(S('5. Compensation')),
        b.pb('beneficiary.proposedSalary', S('Gross annual compensation: '), ctx.FMoney('beneficiary.proposedSalary', 'salario propuesto en EE.UU. y su moneda')),
        b.signature(PT, c.people?.signerUS?.name?.value ?? null, c.people?.signerUS?.title?.value ?? null),
      ],
    });
  }

  // --------------------------------------------- B3 (uno por subordinado) ---
  const usSubs = c.subordinatesUS ?? [];
  if (usSubs.length === 0) {
    const b = blockFactory('B3');
    docs.push({
      docId: 'B3', group: 'B', code: 'B3',
      title: 'Descripciones de puesto de subordinados en EE.UU.',
      deliverTo: 'Abogada de récord → USCIS (Tab G)',
      signedBy: c.people?.signerUS?.name?.value ?? 'Firmante autorizado',
      tab: 'Tab G — Puesto propuesto en EE.UU.',
      entityKey: PT,
      proves: 'Elemento 5: que la operación sostendrá un puesto ejecutivo dentro de un año.',
      blocks: [
        b.letterhead(PT),
        b.date(S(today)),
        b.title(S('U.S. POSITION DESCRIPTIONS — DIRECT REPORTS')),
        b.p({ t: '[FALTA DATO: no hay puestos de EE.UU. capturados. Se necesita puesto, funciones con % de tiempo, educación requerida, habilidades y salario de cada persona que reportará a la beneficiaria en el primer año]', missing: { path: 'subordinatesUS', label: 'puestos subordinados proyectados en EE.UU.' } }),
        b.note(S('Este documento se convierte en un .docx por puesto en cuanto se capturen en la pestaña Personas.')),
      ],
    });
  } else {
    usSubs.forEach((sub, i) => {
      const docId = `B3-${sub.id}`;
      const b = blockFactory(docId);
      const rows: Seg[][][] = [R([S('Function', { b: true })], [S('% of time', { b: true })])];
      if ((sub.duties ?? []).length === 0) {
        rows.push(R(
          [{ t: '[FALTA DATO: funciones del puesto]', missing: { path: `subordinatesUS.${i}.duties`, label: 'funciones del puesto' } }],
          [{ t: '[FALTA DATO: % de tiempo]', missing: { path: `subordinatesUS.${i}.duties`, label: '% de tiempo' } }],
        ));
      } else {
        sub.duties.forEach((d, j) => {
          rows.push(R(
            [d.task ? S(d.task) : { t: '[FALTA DATO: función]', missing: { path: `subordinatesUS.${i}.duties.${j}.task`, label: 'función' } }],
            [d.percentTime != null ? S(`${d.percentTime}%`) : { t: '[FALTA DATO: % de tiempo]', missing: { path: `subordinatesUS.${i}.duties.${j}.percentTime`, label: '% de tiempo' } }],
          ));
        });
        const total = sub.duties.reduce((s, d) => s + (d.percentTime ?? 0), 0);
        rows.push(R([S('TOTAL', { b: true })], [S(`${total}%`, { b: true })]));
      }
      const titleSeg: Seg = sub.title ? S(sub.title) : { t: '[FALTA DATO: puesto]', missing: { path: `subordinatesUS.${i}.title`, label: 'puesto' } };
      docs.push({
        docId, group: 'B', code: `B3.${i + 1}`,
        title: `Descripción de puesto EE.UU. — ${sub.title ?? 'puesto sin nombre'}`,
        deliverTo: 'Abogada de récord → USCIS (Tab G)',
        signedBy: c.people?.signerUS?.name?.value ?? 'Firmante autorizado',
        tab: 'Tab G — Puesto propuesto en EE.UU.',
        entityKey: PT,
        proves: 'Elemento 5: plantilla que sostiene el puesto ejecutivo.',
        blocks: [
          b.letterhead(PT),
          b.date(S(today)),
          b.title(S('POSITION DESCRIPTION')),
          b.subtitle(titleSeg),
          b.subtitle(ctx.entityName(PT)),
          b.heading(S('1. Reporting line')),
          b.p(S('This position reports directly to '), sub.reportsTo ? S(sub.reportsTo) : { t: '[FALTA DATO: línea de reporte]', missing: { path: `subordinatesUS.${i}.reportsTo`, label: 'línea de reporte' } }, S('.')),
          b.heading(S('2. Duties and allocation of time')),
          b.table(rows),
          b.heading(S('3. Required education')),
          b.p(sub.education ? S(sub.education) : { t: '[FALTA DATO: educación requerida]', missing: { path: `subordinatesUS.${i}.education`, label: 'educación requerida' } }),
          b.heading(S('4. Required skills')),
          b.p({ t: '[FALTA DATO: habilidades requeridas]', missing: { path: `subordinatesUS.${i}.skills`, label: 'habilidades requeridas' } }),
          b.heading(S('5. Salary')),
          b.p(sub.salary != null ? S(`${sub.salary.toLocaleString('en-US')}${sub.currency ? ` ${sub.currency}` : ' [FALTA DATO: moneda]'}`) : { t: '[FALTA DATO: salario]', missing: { path: `subordinatesUS.${i}.salary`, label: 'salario' } }),
          b.signature(PT, c.people?.signerUS?.name?.value ?? null, c.people?.signerUS?.title?.value ?? null),
        ],
      });
    });
  }

  // ------------------------------------------------------------------ B4 ---
  {
    const b = blockFactory('B4');
    const rows: Seg[][][] = [R([S('Position', { b: true })], [S('Name', { b: true })], [S('Reports to', { b: true })], [S('Month of hire', { b: true })])];
    rows.push(R(
      [ctx.F('people.signerUS.title', 'cargo del directivo de la peticionaria')],
      [ctx.F('people.signerUS.name', 'nombre del directivo de la peticionaria')],
      [S('—')],
      [S('In place')],
    ));
    rows.push(R(
      [ctx.F('beneficiary.proposedTitle', 'puesto propuesto en EE.UU.')],
      [ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria')],
      [ctx.F('people.signerUS.name', 'nombre del directivo de la peticionaria')],
      [S('Month 1 (upon approval)')],
    ));
    const plan = c.businessPlan?.hiringPlan12Months ?? [];
    if (plan.length === 0) {
      rows.push(R(
        [{ t: '[FALTA DATO: plan de contratación de los primeros 12 meses]', missing: { path: 'businessPlan.hiringPlan12Months', label: 'plan de contratación de los primeros 12 meses' } }],
        [S('—')],
        [ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria')],
        [{ t: '[FALTA DATO: mes de contratación]', missing: { path: 'businessPlan.hiringPlan12Months', label: 'mes de contratación' } }],
      ));
    } else {
      plan.forEach((h, i) => {
        rows.push(R(
          [h.title ? S(h.title) : { t: '[FALTA DATO: puesto a contratar]', missing: { path: `businessPlan.hiringPlan12Months.${i}.title`, label: 'puesto a contratar' } }],
          [S('To be hired')],
          [ctx.F('beneficiary.proposedTitle', 'puesto propuesto en EE.UU.')],
          [h.month != null ? S(`Month ${h.month}`) : { t: '[FALTA DATO: mes de contratación]', missing: { path: `businessPlan.hiringPlan12Months.${i}.month`, label: 'mes de contratación' } }],
        ));
      });
    }
    docs.push({
      docId: 'B4', group: 'B', code: 'B4',
      title: 'Organigrama proyectado de EE.UU. (año 1)',
      deliverTo: 'Abogada de récord → USCIS (Tab G)',
      signedBy: '— (no requiere firma)',
      tab: 'Tab G — Puesto propuesto en EE.UU.',
      entityKey: PT,
      proves: 'Elemento 5: estructura que sostendrá un puesto ejecutivo dentro de un año.',
      blocks: [
        b.letterhead(PT),
        b.date(S(today)),
        b.title(S('PROJECTED ORGANIZATIONAL CHART — YEAR ONE')),
        b.subtitle(ctx.entityName(PT)),
        b.p(S('This chart reflects the structure projected for the first twelve months of operation of the new U.S. office, consistent with the hiring plan set out in the business plan.')),
        b.table(rows),
      ],
    });
  }

  // ------------------------------------------------------------------ B5 ---
  {
    const b = blockFactory('B5');
    docs.push({
      docId: 'B5', group: 'B', code: 'B5',
      title: 'Carta de referencia bancaria — borrador para el banco (GSCG)',
      deliverTo: 'Banco de la peticionaria (para que la emita en su membrete)',
      signedBy: 'Funcionario del banco',
      tab: 'Tab A — Peticionaria estadounidense',
      entityKey: 'bank',
      proves: 'Elemento 2/5: capacidad financiera y operación de la peticionaria.',
      blocks: [
        b.letterhead('bank'),
        b.note(S('BORRADOR para que el banco lo emita en su propio membrete y lo firme un funcionario autorizado. La app no imita el membrete de un banco.')),
        b.date(S(today)),
        b.p(S('To Whom It May Concern:')),
        b.p(
          S('This is to confirm that '), ctx.entityName(PT),
          S(', EIN '), ctx.F('entities.petitioner.ein', 'EIN de la peticionaria'),
          S(', maintains account number '), { t: '[FALTA DATO: número de cuenta bancaria de la peticionaria]', missing: { path: 'entities.petitioner.bankAccount', label: 'número de cuenta bancaria de la peticionaria' } },
          S(' with this institution, opened on '), { t: '[FALTA DATO: fecha de apertura de la cuenta]', missing: { path: 'entities.petitioner.bankAccountOpened', label: 'fecha de apertura de la cuenta' } },
          S('. The account is active and in good standing.'),
        ),
        b.p(S('This letter is issued at the request of the account holder and without liability on the part of this institution.')),
        b.signature('bank', null, null),
      ],
    });
  }

  return docs;
}
