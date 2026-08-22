import type { Block, CaseData, DocumentSpec, Seg } from '../../types';
import { blockFactory, Ctx, S } from '../blocks';
import { formatDateEN, todayISO } from '../../fields';
import { EVIDENCE_CHECKLIST, TABS } from '../../evidence';

const PT = 'petitioner';
const FE = 'foreignEmployer';
const R = (...cells: Seg[][]): Seg[][] => cells;

export function buildGroupC(c: CaseData, priorDocs: DocumentSpec[]): DocumentSpec[] {
  const ctx = new Ctx(c);
  const docs: DocumentSpec[] = [];
  const today = formatDateEN(todayISO()) as string;

  // ---------------------------------------- C1 Petition Support Letter -----
  {
    const b = blockFactory('C1');
    const duties = c.proposedUSDuties ?? [];
    const timeRows: Seg[][][] = [R([S('Function', { b: true })], [S('% of time', { b: true })], [S('Executive / managerial character', { b: true })])];
    if (duties.length === 0) {
      timeRows.push(R(
        [{ t: '[FALTA DATO: funciones del puesto propuesto en EE.UU. con % de tiempo]', missing: { path: 'proposedUSDuties', label: 'funciones del puesto propuesto en EE.UU. con % de tiempo' } }],
        [{ t: '[FALTA DATO: % de tiempo]', missing: { path: 'proposedUSDuties', label: '% de tiempo' } }],
        [{ t: '[FALTA DATO: quién ejecuta el trabajo subyacente]', missing: { path: 'proposedUSDuties', label: 'quién ejecuta el trabajo subyacente' } }],
      ));
    } else {
      duties.forEach((d, i) => {
        timeRows.push(R(
          [d.task ? S(d.task) : { t: '[FALTA DATO: función]', missing: { path: `proposedUSDuties.${i}.task`, label: 'función' } }],
          [d.percentTime != null ? S(`${d.percentTime}%`) : { t: '[FALTA DATO: % de tiempo]', missing: { path: `proposedUSDuties.${i}.percentTime`, label: '% de tiempo' } }],
          [d.whoExecutes ? S(`Underlying work performed by: ${d.whoExecutes}`) : { t: '[FALTA DATO: quién ejecuta el trabajo subyacente]', missing: { path: `proposedUSDuties.${i}.whoExecutes`, label: 'quién ejecuta el trabajo subyacente' } }],
        ));
      });
      const total = duties.reduce((s, d) => s + (d.percentTime ?? 0), 0);
      timeRows.push(R([S('TOTAL', { b: true })], [S(`${total}%`, { b: true })], [S('')]));
    }

    const own = c.ownershipChain ?? [];
    const ownRows: Seg[][][] = [R([S('Owner', { b: true })], [S('Owned entity', { b: true })], [S('Percentage', { b: true })], [S('Proof', { b: true })])];
    own.forEach((o, i) => {
      ownRows.push(R(
        [S(o.owner)],
        [S(o.owned)],
        [o.percent != null ? S(`${o.percent}%`) : { t: '[FALTA DATO: porcentaje de participación]', missing: { path: `ownershipChain.${i}.percent`, label: 'porcentaje de participación' } }],
        [o.proof ? S(o.proof) : { t: '[FALTA DATO: prueba documental de la participación]', missing: { path: `ownershipChain.${i}.proof`, label: 'prueba documental de la participación' } }],
      ));
    });

    const blocks: Block[] = [
      b.letterhead(PT),
      b.date(S(today)),
      b.p(S('U.S. Citizenship and Immigration Services')),
      b.title(S('PETITION SUPPORT LETTER')),
      b.subtitle(S('Form I-129 with L Classification Supplement — L-1A, New Office')),
      b.subtitle(S('Petitioner: '), ctx.entityName(PT), S('  |  Beneficiary: '), ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria')),

      b.heading(S('I. Introduction and relief sought')),
      b.p(
        ctx.entityName(PT), S(' (the "Petitioner") respectfully requests classification of '),
        ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria'),
        S(' (the "Beneficiary") as an intracompany transferee in executive or managerial capacity under section 101(a)(15)(L) of the Immigration and Nationality Act. The Petitioner seeks approval under the new office provisions of 8 C.F.R. § 214.2(l)(3)(v).'),
      ),
      b.p(
        S('The Beneficiary, a national of '), ctx.F('beneficiary.nationality', 'nacionalidad de la beneficiaria'),
        S(' born on '), ctx.FDate('beneficiary.dob', 'fecha de nacimiento de la beneficiaria'),
        S(', is currently employed by '), ctx.entityName(FE),
        S(' in '), ctx.F('beneficiary.workLocation', 'ubicación física de trabajo de la beneficiaria'), S('.'),
      ),

      b.heading(S('II. The Petitioner')),
      b.p(
        ctx.entityName(PT), S(' was incorporated in '), ctx.F('entities.petitioner.state', 'estado de constitución de la peticionaria'),
        S(' on '), ctx.FDate('entities.petitioner.incDate', 'fecha de constitución de la peticionaria'),
        S(', and holds Employer Identification Number '), ctx.F('entities.petitioner.ein', 'EIN de la peticionaria'),
        S('. Its principal place of business is '), ctx.F('entities.petitioner.address', 'domicilio de la peticionaria'), S('.'),
      ),
      b.p(S('Evidence of the Petitioner\'s formation, tax filings, banking and ongoing operations is submitted at Tab A.')),

      b.heading(S('III. The foreign employer')),
      b.p(
        S('The Beneficiary\'s foreign employer is '), ctx.entityName(FE),
        S(', a sociedad anónima de capital variable organized under the laws of Mexico, with its place of business in '),
        ctx.F('entities.foreignEmployer.city', 'ciudad de la empleadora extranjera'),
        S(', taxpayer registry (RFC) '), ctx.F('entities.foreignEmployer.rfc', 'RFC de la empleadora extranjera'),
        S(', operating a regenerative medicine clinic and laboratory under health authorization '),
        ctx.F('entities.foreignEmployer.cofepris', 'licencia COFEPRIS de la empleadora extranjera'), S('.'),
      ),
      b.p(
        S('The foreign employer currently employs '), ctx.F('entities.foreignEmployer.employeeCount', 'número total de empleados de la empleadora extranjera'),
        S(' persons. Evidence of its regular, systematic and continuous course of business — payroll, banking, invoices, contracts and lease — is submitted at Tab B.'),
      ),
      b.note(S('Nota interna, no se presenta: "Cellgenic" es una unidad de negocio o marca, no la entidad empleadora. La empleadora extranjera es la que aparece arriba y está bloqueada en un solo campo del sistema.')),

      b.heading(S('IV. Qualifying relationship')),
      b.p(S('The Petitioner and the foreign employer are members of the same qualifying organization within the meaning of 8 C.F.R. § 214.2(l)(1)(ii)(G). The ownership chain is as follows:')),
      b.table(ownRows),
      b.p(S('Supporting share certificates, the stock ledger of the foreign employer and the parent company\'s public filings are submitted at Tab C. A detailed memorandum on the qualifying relationship accompanies this letter.')),

      b.heading(S('V. The Beneficiary\'s qualifying employment abroad')),
      b.p(
        S('The Beneficiary has been employed by '), ctx.entityName(FE),
        S(' on a full-time basis since '), ctx.FDate('beneficiary.employmentStartDate', 'fecha exacta de inicio de empleo en la empleadora extranjera'),
        S(', which establishes at least one continuous year of employment abroad within the three years immediately preceding the filing of this petition.'),
      ),
      b.p(S('This employment is documented by SAT-stamped payroll receipts (CFDI), the IMSS record of contributed weeks, the immigration work permit issued by the Instituto Nacional de Migración and the employment agreement, submitted at Tab D.')),

      b.heading(S('VI. The Beneficiary\'s position abroad was executive or managerial')),
      b.p(
        S('Abroad the Beneficiary serves as '), ctx.F('beneficiary.currentTitle', 'puesto actual de la beneficiaria'),
        S(', reporting to '), ctx.F('people.signerForeign.name', 'nombre de la persona a quien reporta la beneficiaria'),
        S('. The attached position description states, function by function, the percentage of her time, the specific decisions she makes and approves, and the personnel who perform the underlying operational work. Her direct reports and their qualifications are documented at Tab E.'),
      ),

      b.heading(S('VII. The proposed U.S. position is executive or managerial')),
      b.p(
        S('The Petitioner offers the Beneficiary the position of '), ctx.F('beneficiary.proposedTitle', 'puesto propuesto en EE.UU.'),
        S(' at an annual salary of '), ctx.FMoney('beneficiary.proposedSalary', 'salario propuesto en EE.UU. y su moneda'),
        S('. The allocation of her working time is as follows:'),
      ),
      b.table(timeRows),
      b.p(S('Each function above is exercised through decisions, approvals and budget authority; the underlying operational work is performed by the personnel identified. The offer letter, position description and projected organizational chart are submitted at Tab G.')),

      b.heading(S('VIII. New office requirements — 8 C.F.R. § 214.2(l)(3)(v)')),
      b.p(
        S('(A) Sufficient physical premises to house the new office have been secured at '),
        ctx.F('usOffice.address', 'domicilio de la oficina de EE.UU.'),
        S('. The lease is held by '), ctx.F('usOffice.leaseHolder', 'titular del arrendamiento de la oficina de EE.UU.'),
        S(', the Petitioner in this proceeding. Lease status: '), ctx.F('usOffice.leaseSigned', 'estado de firma del arrendamiento de Plantation'), S('.'),
      ),
      b.p(S('(B) The Beneficiary has been employed for one continuous year in the three-year period preceding the filing in an executive or managerial capacity, as set out in sections V and VI above.')),
      b.p(S('(C) The intended U.S. operation will, within one year of approval, support an executive or managerial position. The business plan submitted at Tab F sets out the projected revenue, the staffing plan for the first twelve months and the capital committed to the U.S. operation.')),

      b.heading(S('IX. Conclusion')),
      b.p(S('For the reasons set out above and on the evidence submitted at Tabs A through H, the Petitioner respectfully requests that this petition be approved.')),
      b.p(S('Respectfully submitted,')),
      b.signature(PT, c.people?.signerUS?.name?.value ?? null, c.people?.signerUS?.title?.value ?? null),
      b.pagebreak(),
      b.heading(S('Index of exhibits')),
      b.p(S('See the master exhibit index accompanying this petition (document C5).')),
    ];
    docs.push({
      docId: 'C1', group: 'C', code: 'C1',
      title: 'Petition Support Letter (I-129, L-1A oficina nueva)',
      deliverTo: 'Abogada de récord → USCIS',
      signedBy: c.people?.signerUS?.name?.value ?? 'Firmante autorizado',
      tab: 'Encabeza el paquete',
      entityKey: PT,
      proves: 'Los cinco elementos, en orden, con remisión a la pestaña donde está la prueba.',
      blocks,
    });
  }

  // ------------------------------------------ C2 Beneficiary Declaration ---
  {
    const b = blockFactory('C2');
    docs.push({
      docId: 'C2', group: 'C', code: 'C2',
      title: 'Beneficiary Declaration (declaración de la beneficiaria)',
      deliverTo: 'Abogada de récord → USCIS (Tab H)',
      signedBy: c.beneficiary?.fullName?.value ?? 'Beneficiaria',
      tab: 'Tab H — Identidad y respaldo personal de la beneficiaria',
      entityKey: null,
      proves: 'Elementos 3 y 4: relato de primera mano del empleo y de las funciones.',
      blocks: [
        b.title(S('DECLARATION OF ')),
        b.subtitle(ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria', { b: true })),
        b.date(S(today)),
        b.note(S('Esta declaración se redacta hoy y describe hechos pasados. No se antedata: la fecha del documento es la fecha real de firma.')),
        b.p(S('I, '), ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria'), S(', declare as follows:')),
        b.numbered(S('I was born on '), ctx.FDate('beneficiary.dob', 'fecha de nacimiento de la beneficiaria'), S(', and I am a national of '), ctx.F('beneficiary.nationality', 'nacionalidad de la beneficiaria'), S('.')),
        b.numbered(S('I reside and work in '), ctx.F('beneficiary.workLocation', 'ubicación física de trabajo de la beneficiaria'), S('. My immigration status in Mexico is: '), ctx.F('beneficiary.mexicanStatus', 'estatus migratorio de la beneficiaria en México'), S('.')),
        b.numbered(S('Since '), ctx.FDate('beneficiary.employmentStartDate', 'fecha exacta de inicio de empleo en la empleadora extranjera'), S(' I have been employed full time by '), ctx.entityName(FE), S(' as '), ctx.F('beneficiary.currentTitle', 'puesto actual de la beneficiaria'), S('.')),
        b.numbered(S('My education is: '), ctx.F('beneficiary.education', 'educación de la beneficiaria'), S('.')),
        b.numbered(S('In my position I perform the functions set out in the position description accompanying this petition, in the proportions of time stated there. For each function, the underlying operational work is performed by the personnel identified in that description.')),
        b.numbered({ t: '[FALTA DATO: relato en primera persona de la beneficiaria sobre cómo ejerce su autoridad — qué aprueba, qué presupuesto controla, a quién contrata, qué juntas preside. Se captura en la pestaña Preguntas y no se redacta por la app]', missing: { path: 'beneficiary.declarationNarrative', label: 'relato en primera persona de la beneficiaria sobre cómo ejerce su autoridad' } }),
        b.numbered(S('I have been offered the position of '), ctx.F('beneficiary.proposedTitle', 'puesto propuesto en EE.UU.'), S(' with '), ctx.entityName(PT), S(', at the office located at '), ctx.F('usOffice.address', 'domicilio de la oficina de EE.UU.'), S('.')),
        b.p(S('I declare under penalty of perjury under the laws of the United States of America that the foregoing is true and correct.')),
        b.signature('none', c.beneficiary?.fullName?.value ?? null, null),
      ],
    });
  }

  // ------------------------------------------------- C3 Business Plan ------
  {
    const b = blockFactory('C3');
    const plan = c.businessPlan?.hiringPlan12Months ?? [];
    const hireRows: Seg[][][] = [R([S('Month', { b: true })], [S('Position', { b: true })], [S('Headcount', { b: true })], [S('Annual salary', { b: true })])];
    if (plan.length === 0) {
      hireRows.push(R(
        [{ t: '[FALTA DATO: mes]', missing: { path: 'businessPlan.hiringPlan12Months', label: 'plan de contratación a 12 meses' } }],
        [{ t: '[FALTA DATO: puesto a contratar]', missing: { path: 'businessPlan.hiringPlan12Months', label: 'puesto a contratar' } }],
        [{ t: '[FALTA DATO: número de personas]', missing: { path: 'businessPlan.hiringPlan12Months', label: 'número de personas' } }],
        [{ t: '[FALTA DATO: salario]', missing: { path: 'businessPlan.hiringPlan12Months', label: 'salario' } }],
      ));
    } else {
      plan.forEach((h, i) => hireRows.push(R(
        [h.month != null ? S(String(h.month)) : { t: '[FALTA DATO: mes]', missing: { path: `businessPlan.hiringPlan12Months.${i}.month`, label: 'mes' } }],
        [h.title ? S(h.title) : { t: '[FALTA DATO: puesto]', missing: { path: `businessPlan.hiringPlan12Months.${i}.title`, label: 'puesto' } }],
        [h.count != null ? S(String(h.count)) : { t: '[FALTA DATO: número de personas]', missing: { path: `businessPlan.hiringPlan12Months.${i}.count`, label: 'número de personas' } }],
        [h.salary != null ? S(`${h.salary.toLocaleString('en-US')}${h.currency ? ` ${h.currency}` : ' [FALTA DATO: moneda]'}`) : { t: '[FALTA DATO: salario]', missing: { path: `businessPlan.hiringPlan12Months.${i}.salary`, label: 'salario' } }],
      )));
    }

    const proj = c.businessPlan?.revenueProjections ?? [];
    const projRows: Seg[][][] = [R([S('Period', { b: true })], [S('Projected revenue', { b: true })], [S('Projected expenses', { b: true })])];
    if (proj.length === 0) {
      projRows.push(R(
        [{ t: '[FALTA DATO: periodo]', missing: { path: 'businessPlan.revenueProjections', label: 'proyecciones financieras' } }],
        [{ t: '[FALTA DATO: ingresos proyectados]', missing: { path: 'businessPlan.revenueProjections', label: 'ingresos proyectados' } }],
        [{ t: '[FALTA DATO: gastos proyectados]', missing: { path: 'businessPlan.revenueProjections', label: 'gastos proyectados' } }],
      ));
    } else {
      proj.forEach((p, i) => projRows.push(R(
        [p.period ? S(p.period) : { t: '[FALTA DATO: periodo]', missing: { path: `businessPlan.revenueProjections.${i}.period`, label: 'periodo' } }],
        [p.revenue != null ? S(`${p.revenue.toLocaleString('en-US')} ${p.currency ?? ''}`) : { t: '[FALTA DATO: ingresos proyectados]', missing: { path: `businessPlan.revenueProjections.${i}.revenue`, label: 'ingresos proyectados' } }],
        [p.expenses != null ? S(`${p.expenses.toLocaleString('en-US')} ${p.currency ?? ''}`) : { t: '[FALTA DATO: gastos proyectados]', missing: { path: `businessPlan.revenueProjections.${i}.expenses`, label: 'gastos proyectados' } }],
      )));
    }

    docs.push({
      docId: 'C3', group: 'C', code: 'C3',
      title: 'Business Plan de oficina nueva',
      deliverTo: 'Abogada de récord → USCIS (Tab F)',
      signedBy: c.people?.signerUS?.name?.value ?? 'Firmante autorizado',
      tab: 'Tab F — Plan de negocio de oficina nueva',
      entityKey: PT,
      proves: 'Elemento 5: que la operación sostendrá un puesto ejecutivo dentro de un año de la aprobación.',
      blocks: [
        b.letterhead(PT),
        b.date(S(today)),
        b.title(S('BUSINESS PLAN — NEW U.S. OFFICE')),
        b.subtitle(ctx.entityName(PT), S(' — '), ctx.F('usOffice.address', 'domicilio de la oficina de EE.UU.')),
        b.heading(S('1. The new office')),
        b.p(
          S('The Petitioner has secured premises at '), ctx.F('usOffice.address', 'domicilio de la oficina de EE.UU.'),
          S(', comprising '), ctx.F('usOffice.squareFeet', 'superficie en pies cuadrados de la oficina de EE.UU.'),
          S(' at a monthly rent of '), ctx.FMoney('usOffice.monthlyRent', 'renta mensual de la oficina de EE.UU.'),
          S('. The lease is held by '), ctx.F('usOffice.leaseHolder', 'titular del arrendamiento'), S('.'),
        ),
        b.heading(S('2. Business activity')),
        b.p({ t: '[FALTA DATO: descripción de la actividad que realizará la oficina de EE.UU. — servicios que prestará, a qué pacientes o clientes, con qué equipo]', missing: { path: 'businessPlan.activityDescription', label: 'descripción de la actividad de la oficina de EE.UU.' } }),
        b.heading(S('3. Capital committed')),
        b.p(ctx.FMoney('businessPlan.startupCapital', 'capital comprometido para la operación de EE.UU.')),
        b.heading(S('4. Twelve-month hiring plan')),
        b.table(hireRows),
        b.heading(S('5. Financial projections')),
        b.table(projRows),
        b.heading(S('6. Support for an executive position within one year')),
        b.p(S('The staffing and revenue set out above are intended to demonstrate that, within one year of approval, the U.S. operation will support the Beneficiary in an executive or managerial capacity, as required by 8 C.F.R. § 214.2(l)(3)(v)(C).')),
        b.signature(PT, c.people?.signerUS?.name?.value ?? null, c.people?.signerUS?.title?.value ?? null),
      ],
    });
  }

  // ------------------------------ C4 Memorándum de relación calificada -----
  {
    const b = blockFactory('C4');
    const own = c.ownershipChain ?? [];
    const rows: Seg[][][] = [R([S('Link', { b: true })], [S('Owner', { b: true })], [S('Owned', { b: true })], [S('%', { b: true })], [S('Documentary proof', { b: true })], [S('Status', { b: true })])];
    own.forEach((o, i) => rows.push(R(
      [S(String(i + 1))],
      [S(o.owner)],
      [S(o.owned)],
      [o.percent != null ? S(`${o.percent}%`) : { t: '[FALTA DATO: porcentaje]', missing: { path: `ownershipChain.${i}.percent`, label: 'porcentaje de participación' } }],
      [o.proof ? S(o.proof) : { t: '[FALTA DATO: prueba documental]', missing: { path: `ownershipChain.${i}.proof`, label: 'prueba documental' } }],
      [S(o.status)],
    )));
    docs.push({
      docId: 'C4', group: 'C', code: 'C4',
      title: 'Memorándum de relación calificada',
      deliverTo: 'Abogada de récord → USCIS (Tab C)',
      signedBy: c.people?.signerUS?.name?.value ?? 'Firmante autorizado',
      tab: 'Tab C — Relación calificada',
      entityKey: PT,
      proves: 'Elemento 1: relación calificada entre peticionaria y empleadora extranjera.',
      blocks: [
        b.letterhead(PT),
        b.date(S(today)),
        b.title(S('MEMORANDUM ON QUALIFYING RELATIONSHIP')),
        b.heading(S('1. Statutory standard')),
        b.p(S('A qualifying relationship exists where the U.S. petitioner and the foreign employer are the same employer, or are parent and subsidiary, or affiliates, or branch offices, within the meaning of 8 C.F.R. § 214.2(l)(1)(ii)(G)–(L). Ownership and control must both be shown.')),
        b.heading(S('2. The chain')),
        b.table(rows),
        b.heading(S('3. Control')),
        b.p(
          S('Control of '), ctx.entityName(FE), S(' by '), ctx.entityName(PT),
          S(' is asserted on the basis of the ownership stated above. '),
          { t: '[FALTA DATO: si existe un segundo accionista en la empleadora extranjera, identificarlo y explicar cómo la peticionaria conserva el control — bajo ley mexicana una S.A. de C.V. típicamente requiere dos o más accionistas]', missing: { path: 'entities.foreignEmployer.secondShareholder', label: 'identidad del segundo accionista y explicación del control' } },
        ),
        b.heading(S('4. Documentary support')),
        b.bullet(S('Share certificate of the Petitioner held by '), ctx.entityName('parent'), S(', dated 2021-08-21, together with the parent company\'s public filings (Tab C).')),
        b.bullet(S('Stock ledger (libro de accionistas) of '), ctx.entityName(FE), S(': '), ctx.F('entities.foreignEmployer.actaConstitutiva', 'acta constitutiva y libro de accionistas de la empleadora extranjera')),
        b.note(S('Nota interna, no se presenta: no declarar 100% de participación sobre la empleadora extranjera sin haber visto el libro de accionistas.')),
        b.signature(PT, c.people?.signerUS?.name?.value ?? null, c.people?.signerUS?.title?.value ?? null),
      ],
    });
  }

  // ------------------------- C5 Índice maestro + carátulas de exhibit ------
  {
    const b = blockFactory('C5');
    const rows: Seg[][][] = [R([S('Tab', { b: true })], [S('Exhibit', { b: true })], [S('Document', { b: true })], [S('Proves', { b: true })], [S('Status', { b: true })])];
    let n = 0;
    for (const tab of TABS) {
      const inTab = EVIDENCE_CHECKLIST.filter((e) => e.tab === tab.id);
      const docsInTab = priorDocs.filter((d) => d.tab.startsWith(tab.id));
      for (const d of docsInTab) {
        n += 1;
        rows.push(R([S(tab.id)], [S(String(n))], [S(`${d.code} — ${d.title}`)], [S(d.proves)], [S('Generado por la app')]));
      }
      for (const e of inTab) {
        n += 1;
        const item = (c.evidenceInventory ?? []).find((x) => x.id === e.id);
        rows.push(R([S(tab.id)], [S(String(n))], [S(e.name)], [S(e.proves)], [S(item?.status ?? 'Falta')]));
      }
    }
    const coverBlocks: Block[] = [];
    for (const tab of TABS) {
      coverBlocks.push(b.pagebreak());
      coverBlocks.push(b.title(S(tab.id)));
      coverBlocks.push(b.subtitle(S(tab.name)));
      coverBlocks.push(b.p(S('Petitioner: '), ctx.entityName(PT)));
      coverBlocks.push(b.p(S('Beneficiary: '), ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria')));
    }
    docs.push({
      docId: 'C5', group: 'C', code: 'C5',
      title: 'Índice maestro de exhibits + carátulas Tab A–H',
      deliverTo: 'Abogada de récord → USCIS',
      signedBy: '— (no requiere firma)',
      tab: 'Encabeza el paquete',
      entityKey: PT,
      proves: 'Permite que el oficial encuentre cada prueba sin llamar a nadie.',
      blocks: [
        b.letterhead(PT),
        b.date(S(today)),
        b.title(S('INDEX OF EXHIBITS')),
        b.subtitle(S('Petitioner: '), ctx.entityName(PT), S('  |  Beneficiary: '), ctx.F('beneficiary.fullName', 'nombre completo de la beneficiaria')),
        b.table(rows),
        ...coverBlocks,
      ],
    });
  }

  // -------------------------------- C6 Registro de evidencia faltante ------
  {
    const b = blockFactory('C6');
    const rows: Seg[][][] = [R([S('Qué necesitamos', { b: true })], [S('Por qué importa', { b: true })], [S('Dónde buscarlo', { b: true })], [S('Alternativa si no existe', { b: true })])];
    const items = c.missingEvidence ?? [];
    const pending = EVIDENCE_CHECKLIST.filter((e) => {
      const item = (c.evidenceInventory ?? []).find((x) => x.id === e.id);
      return (item?.status ?? 'Falta') !== 'Tengo';
    });
    for (const e of pending) {
      rows.push(R([S(e.name)], [S(e.proves)], [S(e.whereToLook)], [S(e.alternative)]));
    }
    for (const m of items) {
      rows.push(R([S(m.need)], [S(m.why)], [S(m.whereToLook)], [S(m.alternative)]));
    }
    if (rows.length === 1) rows.push(R([S('—')], [S('—')], [S('—')], [S('—')]));
    docs.push({
      docId: 'C6', group: 'C', code: 'C6',
      title: 'Registro de evidencia faltante',
      deliverTo: 'Uso interno + abogada de récord',
      signedBy: '— (no requiere firma)',
      tab: 'Uso interno',
      entityKey: PT,
      proves: 'Mantiene visible lo que falta, para que ninguna laguna se vuelva una afirmación silenciosa.',
      blocks: [
        b.letterhead(PT),
        b.date(S(today)),
        b.title(S('REGISTRO DE EVIDENCIA FALTANTE')),
        b.note(S('Documento de trabajo interno. No forma parte del paquete que se presenta ante USCIS.')),
        b.table(rows),
      ],
    });
  }

  return docs;
}
