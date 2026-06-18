import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();

  console.log("Limpiando datos existentes...");

  // Delete in correct order for FK constraints
  await prisma.activityLog.deleteMany();
  await prisma.evidenciaEntrega.deleteMany();
  await prisma.fulfillment.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.solicitudDocumento.deleteMany();
  await prisma.solicitud.deleteMany();
  await prisma.inventario.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.medicoDocumento.deleteMany();
  await prisma.medico.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.user.deleteMany();

  console.log("Datos eliminados. Creando seed data...");

  // ─── Users ──────────────────────────────────────────────────────
  const userSarah = await prisma.user.create({
    data: {
      name: "Sarah Barros",
      email: "sarah@cellgenic.com",
      role: "admin",
    },
  });

  const userCarlos = await prisma.user.create({
    data: {
      name: "Carlos Mendez",
      email: "carlos@cellgenic.com",
      role: "vendedor",
    },
  });

  const userLaura = await prisma.user.create({
    data: {
      name: "Laura Garcia",
      email: "laura@cellgenic.com",
      role: "laboratorio",
    },
  });

  const userRoberto = await prisma.user.create({
    data: {
      name: "Dr. Roberto Silva",
      email: "roberto@cellgenic.com",
      role: "medico",
    },
  });

  console.log("Usuarios creados: 4");

  // ─── Medicos ────────────────────────────────────────────────────
  const medicoRoberto = await prisma.medico.create({
    data: {
      userId: userRoberto.id,
      nombre: "Dr. Roberto Silva",
      dni: "28456789",
      matriculaNacional: "MN-45678",
      matriculaProvincial: "MP-BA-12345",
      especialidad: "Traumatologia",
      institucion: "Hospital Italiano",
      telefono: "+54 11 4567-8901",
      whatsapp: "+5411 4567-8901",
      email: "roberto@cellgenic.com",
      direccion: "Av. Corrientes 1234",
      ciudad: "Buenos Aires",
      provincia: "Buenos Aires",
      codigoPostal: "C1043",
      miembroSAMHRE: true,
      numMiembroSAMHRE: "SAMHRE-001",
      certificadoISSCA: true,
      numCertificadoISSCA: "ISSCA-2024-001",
      workshopCellgenic: true,
      fechaWorkshop: new Date("2024-06-15"),
      estado: "validado",
    },
  });

  const medicoMaria = await prisma.medico.create({
    data: {
      nombre: "Dra. Maria Lopez",
      dni: "30789456",
      matriculaNacional: "MN-56789",
      matriculaProvincial: "MP-CBA-23456",
      especialidad: "Dermatologia",
      institucion: "Clinica Dermatologica del Sur",
      telefono: "+54 351 456-7890",
      whatsapp: "+54351 456-7890",
      email: "maria.lopez@clinicadelsur.com",
      direccion: "Bv. San Juan 890",
      ciudad: "Cordoba",
      provincia: "Cordoba",
      codigoPostal: "X5000",
      miembroSAMHRE: true,
      numMiembroSAMHRE: "SAMHRE-042",
      certificadoISSCA: false,
      workshopCellgenic: true,
      fechaWorkshop: new Date("2024-09-20"),
      estado: "validado",
    },
  });

  const medicoJuan = await prisma.medico.create({
    data: {
      nombre: "Dr. Juan Perez",
      dni: "33456123",
      matriculaNacional: "MN-67890",
      especialidad: "Medicina Deportiva",
      institucion: "Centro Deportivo Rosario",
      telefono: "+54 341 567-8901",
      whatsapp: "+54341 567-8901",
      email: "juan.perez@deportivorosario.com",
      direccion: "Calle Mitre 456",
      ciudad: "Rosario",
      provincia: "Santa Fe",
      codigoPostal: "S2000",
      miembroSAMHRE: false,
      certificadoISSCA: false,
      workshopCellgenic: false,
      estado: "pendiente",
    },
  });

  const medicoAna = await prisma.medico.create({
    data: {
      nombre: "Dra. Ana Martinez",
      dni: "29123456",
      matriculaNacional: "MN-34567",
      matriculaProvincial: "MP-MZA-34567",
      especialidad: "Neurologia",
      institucion: "Hospital Central de Mendoza",
      telefono: "+54 261 678-9012",
      whatsapp: "+54261 678-9012",
      email: "ana.martinez@hcmendoza.com",
      direccion: "Av. San Martin 1500",
      ciudad: "Mendoza",
      provincia: "Mendoza",
      codigoPostal: "M5500",
      miembroSAMHRE: true,
      numMiembroSAMHRE: "SAMHRE-089",
      certificadoISSCA: true,
      numCertificadoISSCA: "ISSCA-2023-055",
      workshopCellgenic: true,
      fechaWorkshop: new Date("2023-11-10"),
      estado: "validado",
    },
  });

  const medicoDiego = await prisma.medico.create({
    data: {
      nombre: "Dr. Diego Torres",
      dni: "35678901",
      matriculaNacional: "MN-78901",
      especialidad: "Medicina Estetica",
      institucion: "Torres Estetica Avanzada",
      telefono: "+54 11 7890-1234",
      whatsapp: "+5411 7890-1234",
      email: "diego.torres@torresmed.com",
      direccion: "Av. Santa Fe 2345",
      ciudad: "CABA",
      provincia: "Buenos Aires",
      codigoPostal: "C1123",
      miembroSAMHRE: false,
      certificadoISSCA: false,
      workshopCellgenic: false,
      estado: "pendiente",
    },
  });

  console.log("Medicos creados: 5");

  // ─── Pacientes ──────────────────────────────────────────────────
  const pacientes = await Promise.all([
    prisma.paciente.create({
      data: {
        nombre: "Alejandro Fernandez",
        dni: "20345678",
        fechaNacimiento: new Date("1960-03-15"),
        edad: 66,
        sexo: "masculino",
        peso: "82",
        altura: "175",
        telefono: "+54 11 3456-7890",
        email: "afernandez@gmail.com",
        medicoId: medicoRoberto.id,
      },
    }),
    prisma.paciente.create({
      data: {
        nombre: "Gabriela Sosa",
        dni: "25678901",
        fechaNacimiento: new Date("1970-07-22"),
        edad: 55,
        sexo: "femenino",
        peso: "65",
        altura: "163",
        telefono: "+54 11 4567-8901",
        email: "gsosa@hotmail.com",
        medicoId: medicoRoberto.id,
      },
    }),
    prisma.paciente.create({
      data: {
        nombre: "Ricardo Gomez",
        dni: "22456789",
        fechaNacimiento: new Date("1965-11-08"),
        edad: 60,
        sexo: "masculino",
        peso: "90",
        altura: "180",
        telefono: "+54 351 567-8901",
        email: "rgomez@yahoo.com",
        medicoId: medicoMaria.id,
      },
    }),
    prisma.paciente.create({
      data: {
        nombre: "Lucia Morales",
        dni: "30123456",
        fechaNacimiento: new Date("1980-01-25"),
        edad: 46,
        sexo: "femenino",
        peso: "58",
        altura: "160",
        telefono: "+54 351 678-9012",
        email: "lmorales@gmail.com",
        medicoId: medicoMaria.id,
      },
    }),
    prisma.paciente.create({
      data: {
        nombre: "Martin Acosta",
        dni: "27890123",
        fechaNacimiento: new Date("1975-05-12"),
        edad: 51,
        sexo: "masculino",
        peso: "78",
        altura: "172",
        telefono: "+54 341 789-0123",
        email: "macosta@gmail.com",
        medicoId: medicoJuan.id,
      },
    }),
    prisma.paciente.create({
      data: {
        nombre: "Valentina Ruiz",
        dni: "32567890",
        fechaNacimiento: new Date("1985-09-30"),
        edad: 40,
        sexo: "femenino",
        peso: "62",
        altura: "168",
        telefono: "+54 261 890-1234",
        email: "vruiz@outlook.com",
        medicoId: medicoAna.id,
      },
    }),
    prisma.paciente.create({
      data: {
        nombre: "Fernando Castro",
        dni: "24789012",
        fechaNacimiento: new Date("1968-12-05"),
        edad: 57,
        sexo: "masculino",
        peso: "85",
        altura: "178",
        telefono: "+54 261 901-2345",
        email: "fcastro@gmail.com",
        medicoId: medicoAna.id,
      },
    }),
    prisma.paciente.create({
      data: {
        nombre: "Camila Herrera",
        dni: "34901234",
        fechaNacimiento: new Date("1993-04-18"),
        edad: 33,
        sexo: "femenino",
        peso: "55",
        altura: "165",
        telefono: "+54 11 0123-4567",
        email: "cherrera@gmail.com",
        medicoId: medicoDiego.id,
      },
    }),
  ]);

  console.log("Pacientes creados:", pacientes.length);

  // ─── Productos ──────────────────────────────────────────────────
  const productoEXO = await prisma.producto.create({
    data: {
      sku: "EXO-001",
      nombre: "Exosomas Mesenquimales 50M",
      descripcion: "Exosomas derivados de celulas madre mesenquimales, concentracion 50 millones",
      categoria: "exosomas",
      presentacion: "Vial 1ml",
      precioUnitario: 450000,
      costoUnitario: 180000,
      requiereFrio: true,
    },
  });

  const productoCM = await prisma.producto.create({
    data: {
      sku: "CM-001",
      nombre: "Celulas Madre Adiposas 10M",
      descripcion: "Celulas madre derivadas de tejido adiposo, concentracion 10 millones",
      categoria: "celulas_madre",
      presentacion: "Vial 2ml",
      precioUnitario: 680000,
      costoUnitario: 280000,
      requiereFrio: true,
    },
  });

  const productoFIB = await prisma.producto.create({
    data: {
      sku: "FIB-001",
      nombre: "Fibroblastos Dermicos 5M",
      descripcion: "Fibroblastos dermicos autologos, concentracion 5 millones",
      categoria: "fibroblastos",
      presentacion: "Vial 1ml",
      precioUnitario: 320000,
      costoUnitario: 130000,
      requiereFrio: true,
    },
  });

  const productoPEP = await prisma.producto.create({
    data: {
      sku: "PEP-001",
      nombre: "Peptidos Regenerativos",
      descripcion: "Cocktail de peptidos bioactivos para regeneracion tisular",
      categoria: "peptidos",
      presentacion: "Ampolla 5ml",
      precioUnitario: 180000,
      costoUnitario: 55000,
      requiereFrio: false,
    },
  });

  const productoFP = await prisma.producto.create({
    data: {
      sku: "FP-001",
      nombre: "Celulas de Foliculo Piloso",
      descripcion: "Celulas progenitoras de foliculo piloso para regeneracion capilar",
      categoria: "foliculo_piloso",
      presentacion: "Vial 1ml",
      precioUnitario: 520000,
      costoUnitario: 210000,
      requiereFrio: true,
    },
  });

  const productoLP = await prisma.producto.create({
    data: {
      sku: "LP-001",
      nombre: "Lisado Plaquetario Concentrado",
      descripcion: "Lisado plaquetario concentrado para estimulacion de crecimiento celular",
      categoria: "lisado_plaquetario",
      presentacion: "Ampolla 10ml",
      precioUnitario: 150000,
      costoUnitario: 45000,
      requiereFrio: true,
    },
  });

  console.log("Productos creados: 6");

  // ─── Inventario (2 lotes por producto) ──────────────────────────
  await Promise.all([
    // EXO-001
    prisma.inventario.create({
      data: {
        productoId: productoEXO.id,
        lote: "EXO-L2026-001",
        cantidad: 25,
        fechaVencimiento: new Date("2026-12-15"),
        ubicacion: "Laboratorio Principal",
        tipoAlmacenamiento: "frio",
        umbralMinimo: 5,
      },
    }),
    prisma.inventario.create({
      data: {
        productoId: productoEXO.id,
        lote: "EXO-L2026-002",
        cantidad: 3,
        fechaVencimiento: new Date("2026-09-30"),
        ubicacion: "Laboratorio Principal",
        tipoAlmacenamiento: "frio",
        umbralMinimo: 5,
      },
    }),
    // CM-001
    prisma.inventario.create({
      data: {
        productoId: productoCM.id,
        lote: "CM-L2026-001",
        cantidad: 12,
        fechaVencimiento: new Date("2026-11-20"),
        ubicacion: "Laboratorio Principal",
        tipoAlmacenamiento: "frio",
        umbralMinimo: 3,
      },
    }),
    prisma.inventario.create({
      data: {
        productoId: productoCM.id,
        lote: "CM-L2026-002",
        cantidad: 2,
        fechaVencimiento: new Date("2027-03-15"),
        ubicacion: "Laboratorio Principal",
        tipoAlmacenamiento: "frio",
        umbralMinimo: 3,
      },
    }),
    // FIB-001
    prisma.inventario.create({
      data: {
        productoId: productoFIB.id,
        lote: "FIB-L2026-001",
        cantidad: 18,
        fechaVencimiento: new Date("2027-01-10"),
        ubicacion: "Laboratorio Principal",
        tipoAlmacenamiento: "frio",
        umbralMinimo: 5,
      },
    }),
    prisma.inventario.create({
      data: {
        productoId: productoFIB.id,
        lote: "FIB-L2026-002",
        cantidad: 8,
        fechaVencimiento: new Date("2027-04-25"),
        ubicacion: "Laboratorio Principal",
        tipoAlmacenamiento: "frio",
        umbralMinimo: 5,
      },
    }),
    // PEP-001
    prisma.inventario.create({
      data: {
        productoId: productoPEP.id,
        lote: "PEP-L2026-001",
        cantidad: 40,
        fechaVencimiento: new Date("2027-06-30"),
        ubicacion: "Laboratorio Principal",
        tipoAlmacenamiento: "seco",
        umbralMinimo: 10,
      },
    }),
    prisma.inventario.create({
      data: {
        productoId: productoPEP.id,
        lote: "PEP-L2026-002",
        cantidad: 15,
        fechaVencimiento: new Date("2027-08-15"),
        ubicacion: "Laboratorio Principal",
        tipoAlmacenamiento: "seco",
        umbralMinimo: 10,
      },
    }),
    // FP-001
    prisma.inventario.create({
      data: {
        productoId: productoFP.id,
        lote: "FP-L2026-001",
        cantidad: 6,
        fechaVencimiento: new Date("2026-10-20"),
        ubicacion: "Laboratorio Principal",
        tipoAlmacenamiento: "frio",
        umbralMinimo: 3,
      },
    }),
    prisma.inventario.create({
      data: {
        productoId: productoFP.id,
        lote: "FP-L2026-002",
        cantidad: 1,
        fechaVencimiento: new Date("2026-08-10"),
        ubicacion: "Laboratorio Principal",
        tipoAlmacenamiento: "frio",
        umbralMinimo: 3,
      },
    }),
    // LP-001
    prisma.inventario.create({
      data: {
        productoId: productoLP.id,
        lote: "LP-L2026-001",
        cantidad: 30,
        fechaVencimiento: new Date("2026-12-01"),
        ubicacion: "Laboratorio Principal",
        tipoAlmacenamiento: "frio",
        umbralMinimo: 8,
      },
    }),
    prisma.inventario.create({
      data: {
        productoId: productoLP.id,
        lote: "LP-L2026-002",
        cantidad: 4,
        fechaVencimiento: new Date("2027-02-28"),
        ubicacion: "Laboratorio Principal",
        tipoAlmacenamiento: "frio",
        umbralMinimo: 8,
      },
    }),
  ]);

  console.log("Inventario creado: 12 registros");

  // ─── Solicitudes ────────────────────────────────────────────────
  const sol1 = await prisma.solicitud.create({
    data: {
      numero: "SOL-2026-00001",
      medicoId: medicoRoberto.id,
      pacienteId: pacientes[0].id,
      estado: "cerrado",
      diagnosticoPrincipal: "Artrosis de rodilla grado III",
      objetivoTerapeutico: "regeneracion_articular",
      categoriaProducto: "exosomas",
      nombreProducto: "Exosomas Mesenquimales 50M",
      cantidadSolicitada: 2,
      numeroViales: 2,
      viaAdministracion: "intraarticular",
      numSesiones: 3,
      fechaAplicacion: new Date("2026-03-10"),
      lugarAplicacion: "Hospital Italiano - Buenos Aires",
      nombreReceptor: "Dr. Roberto Silva",
      telefonoReceptor: "+54 11 4567-8901",
      institucionEntrega: "Hospital Italiano",
      direccionEntrega: "Av. Corrientes 1234",
      ciudadEntrega: "Buenos Aires",
      provinciaEntrega: "Buenos Aires",
      tipoEntrega: "cadena_frio",
      medicoRegistrado: true,
      medicoValidado: true,
      historiaClinicaRecibida: true,
      consentimientoRecibido: true,
      ordenMedicaRecibida: true,
      documentacionCompleta: true,
      montoTotal: 900000,
      estadoPago: "pagado",
      fechaPago: new Date("2026-03-05"),
      createdById: userCarlos.id,
      validadoPorId: userSarah.id,
      fechaValidacion: new Date("2026-03-06"),
      createdAt: new Date("2026-03-01"),
    },
  });

  const sol2 = await prisma.solicitud.create({
    data: {
      numero: "SOL-2026-00002",
      medicoId: medicoMaria.id,
      pacienteId: pacientes[2].id,
      estado: "entregado",
      diagnosticoPrincipal: "Envejecimiento cutaneo avanzado",
      objetivoTerapeutico: "rejuvenecimiento_facial",
      categoriaProducto: "fibroblastos",
      nombreProducto: "Fibroblastos Dermicos 5M",
      cantidadSolicitada: 3,
      numeroViales: 3,
      viaAdministracion: "intradermica",
      numSesiones: 4,
      fechaAplicacion: new Date("2026-04-15"),
      lugarAplicacion: "Clinica Dermatologica del Sur - Cordoba",
      nombreReceptor: "Dra. Maria Lopez",
      telefonoReceptor: "+54 351 456-7890",
      institucionEntrega: "Clinica Dermatologica del Sur",
      direccionEntrega: "Bv. San Juan 890",
      ciudadEntrega: "Cordoba",
      provinciaEntrega: "Cordoba",
      tipoEntrega: "cadena_frio",
      medicoRegistrado: true,
      medicoValidado: true,
      historiaClinicaRecibida: true,
      consentimientoRecibido: true,
      ordenMedicaRecibida: true,
      documentacionCompleta: true,
      montoTotal: 960000,
      estadoPago: "pagado",
      fechaPago: new Date("2026-04-10"),
      createdById: userCarlos.id,
      validadoPorId: userSarah.id,
      fechaValidacion: new Date("2026-04-08"),
      createdAt: new Date("2026-04-05"),
    },
  });

  const sol3 = await prisma.solicitud.create({
    data: {
      numero: "SOL-2026-00003",
      medicoId: medicoRoberto.id,
      pacienteId: pacientes[1].id,
      estado: "despachado",
      diagnosticoPrincipal: "Tendinopatia cronica del manguito rotador",
      objetivoTerapeutico: "regeneracion_tendinosa",
      categoriaProducto: "celulas_madre",
      nombreProducto: "Celulas Madre Adiposas 10M",
      cantidadSolicitada: 1,
      numeroViales: 1,
      viaAdministracion: "intraarticular",
      numSesiones: 2,
      fechaAplicacion: new Date("2026-05-20"),
      lugarAplicacion: "Hospital Italiano - Buenos Aires",
      nombreReceptor: "Dr. Roberto Silva",
      telefonoReceptor: "+54 11 4567-8901",
      institucionEntrega: "Hospital Italiano",
      direccionEntrega: "Av. Corrientes 1234",
      ciudadEntrega: "Buenos Aires",
      provinciaEntrega: "Buenos Aires",
      tipoEntrega: "cadena_frio",
      medicoRegistrado: true,
      medicoValidado: true,
      historiaClinicaRecibida: true,
      consentimientoRecibido: true,
      ordenMedicaRecibida: true,
      documentacionCompleta: true,
      montoTotal: 680000,
      estadoPago: "pagado",
      fechaPago: new Date("2026-05-15"),
      createdById: userSarah.id,
      validadoPorId: userSarah.id,
      fechaValidacion: new Date("2026-05-12"),
      createdAt: new Date("2026-05-10"),
    },
  });

  const sol4 = await prisma.solicitud.create({
    data: {
      numero: "SOL-2026-00004",
      medicoId: medicoAna.id,
      pacienteId: pacientes[5].id,
      estado: "en_preparacion",
      diagnosticoPrincipal: "Neuropatia periferica post-traumatica",
      objetivoTerapeutico: "regeneracion_nerviosa",
      categoriaProducto: "exosomas",
      nombreProducto: "Exosomas Mesenquimales 50M",
      cantidadSolicitada: 4,
      numeroViales: 4,
      viaAdministracion: "intravenosa",
      numSesiones: 6,
      fechaAplicacion: new Date("2026-07-01"),
      lugarAplicacion: "Hospital Central de Mendoza",
      nombreReceptor: "Dra. Ana Martinez",
      telefonoReceptor: "+54 261 678-9012",
      institucionEntrega: "Hospital Central de Mendoza",
      direccionEntrega: "Av. San Martin 1500",
      ciudadEntrega: "Mendoza",
      provinciaEntrega: "Mendoza",
      tipoEntrega: "cadena_frio",
      medicoRegistrado: true,
      medicoValidado: true,
      historiaClinicaRecibida: true,
      consentimientoRecibido: true,
      ordenMedicaRecibida: true,
      documentacionCompleta: true,
      montoTotal: 1800000,
      estadoPago: "pagado",
      fechaPago: new Date("2026-06-10"),
      createdById: userCarlos.id,
      validadoPorId: userSarah.id,
      fechaValidacion: new Date("2026-06-08"),
      createdAt: new Date("2026-06-05"),
    },
  });

  const sol5 = await prisma.solicitud.create({
    data: {
      numero: "SOL-2026-00005",
      medicoId: medicoMaria.id,
      pacienteId: pacientes[3].id,
      estado: "aprobado",
      diagnosticoPrincipal: "Alopecia androgenica",
      objetivoTerapeutico: "regeneracion_capilar",
      categoriaProducto: "foliculo_piloso",
      nombreProducto: "Celulas de Foliculo Piloso",
      cantidadSolicitada: 2,
      numeroViales: 2,
      viaAdministracion: "intradermica",
      numSesiones: 5,
      fechaAplicacion: new Date("2026-07-15"),
      lugarAplicacion: "Clinica Dermatologica del Sur - Cordoba",
      nombreReceptor: "Dra. Maria Lopez",
      telefonoReceptor: "+54 351 456-7890",
      institucionEntrega: "Clinica Dermatologica del Sur",
      direccionEntrega: "Bv. San Juan 890",
      ciudadEntrega: "Cordoba",
      provinciaEntrega: "Cordoba",
      tipoEntrega: "cadena_frio",
      medicoRegistrado: true,
      medicoValidado: true,
      historiaClinicaRecibida: true,
      consentimientoRecibido: true,
      ordenMedicaRecibida: false,
      documentacionCompleta: false,
      montoTotal: 1040000,
      estadoPago: "pendiente",
      createdById: userCarlos.id,
      validadoPorId: userSarah.id,
      fechaValidacion: new Date("2026-06-14"),
      createdAt: new Date("2026-06-12"),
    },
  });

  await prisma.solicitud.create({
    data: {
      numero: "SOL-2026-00006",
      medicoId: medicoAna.id,
      pacienteId: pacientes[6].id,
      estado: "validacion_documental",
      diagnosticoPrincipal: "Dolor cronico lumbar",
      objetivoTerapeutico: "dolor_cronico",
      categoriaProducto: "peptidos",
      nombreProducto: "Peptidos Regenerativos",
      cantidadSolicitada: 5,
      numeroViales: 5,
      viaAdministracion: "intramuscular",
      numSesiones: 8,
      fechaAplicacion: new Date("2026-08-01"),
      lugarAplicacion: "Hospital Central de Mendoza",
      nombreReceptor: "Dra. Ana Martinez",
      telefonoReceptor: "+54 261 678-9012",
      institucionEntrega: "Hospital Central de Mendoza",
      direccionEntrega: "Av. San Martin 1500",
      ciudadEntrega: "Mendoza",
      provinciaEntrega: "Mendoza",
      tipoEntrega: "temperatura_ambiente",
      medicoRegistrado: true,
      medicoValidado: true,
      historiaClinicaRecibida: true,
      consentimientoRecibido: false,
      ordenMedicaRecibida: false,
      documentacionCompleta: false,
      montoTotal: 900000,
      estadoPago: "pendiente",
      createdById: userSarah.id,
      createdAt: new Date("2026-06-14"),
    },
  });

  const sol7 = await prisma.solicitud.create({
    data: {
      numero: "SOL-2026-00007",
      medicoId: medicoJuan.id,
      pacienteId: pacientes[4].id,
      estado: "pendiente",
      diagnosticoPrincipal: "Lesion de ligamento cruzado anterior",
      objetivoTerapeutico: "regeneracion_articular",
      categoriaProducto: "celulas_madre",
      nombreProducto: "Celulas Madre Adiposas 10M",
      cantidadSolicitada: 2,
      numeroViales: 2,
      viaAdministracion: "intraarticular",
      numSesiones: 3,
      fechaAplicacion: new Date("2026-08-15"),
      lugarAplicacion: "Centro Deportivo Rosario",
      nombreReceptor: "Dr. Juan Perez",
      telefonoReceptor: "+54 341 567-8901",
      institucionEntrega: "Centro Deportivo Rosario",
      direccionEntrega: "Calle Mitre 456",
      ciudadEntrega: "Rosario",
      provinciaEntrega: "Santa Fe",
      tipoEntrega: "cadena_frio",
      medicoRegistrado: true,
      medicoValidado: false,
      historiaClinicaRecibida: false,
      consentimientoRecibido: false,
      ordenMedicaRecibida: false,
      documentacionCompleta: false,
      montoTotal: 1360000,
      estadoPago: "pendiente",
      createdById: userCarlos.id,
      createdAt: new Date("2026-06-16"),
    },
  });

  const sol8 = await prisma.solicitud.create({
    data: {
      numero: "SOL-2026-00008",
      medicoId: medicoDiego.id,
      pacienteId: pacientes[7].id,
      estado: "pendiente",
      diagnosticoPrincipal: "Cicatrices de acne",
      objetivoTerapeutico: "rejuvenecimiento_facial",
      categoriaProducto: "fibroblastos",
      nombreProducto: "Fibroblastos Dermicos 5M",
      cantidadSolicitada: 2,
      numeroViales: 2,
      viaAdministracion: "intradermica",
      numSesiones: 4,
      fechaAplicacion: new Date("2026-09-01"),
      lugarAplicacion: "Torres Estetica Avanzada - CABA",
      nombreReceptor: "Dr. Diego Torres",
      telefonoReceptor: "+54 11 7890-1234",
      institucionEntrega: "Torres Estetica Avanzada",
      direccionEntrega: "Av. Santa Fe 2345",
      ciudadEntrega: "CABA",
      provinciaEntrega: "Buenos Aires",
      tipoEntrega: "cadena_frio",
      medicoRegistrado: true,
      medicoValidado: false,
      historiaClinicaRecibida: false,
      consentimientoRecibido: false,
      ordenMedicaRecibida: false,
      documentacionCompleta: false,
      montoTotal: 640000,
      estadoPago: "pendiente",
      createdById: userCarlos.id,
      createdAt: new Date("2026-06-17"),
    },
  });

  const sol9 = await prisma.solicitud.create({
    data: {
      numero: "SOL-2026-00009",
      medicoId: medicoRoberto.id,
      pacienteId: pacientes[0].id,
      estado: "en_preparacion",
      diagnosticoPrincipal: "Condropatia rotuliana bilateral",
      objetivoTerapeutico: "regeneracion_articular",
      categoriaProducto: "lisado_plaquetario",
      nombreProducto: "Lisado Plaquetario Concentrado",
      cantidadSolicitada: 3,
      numeroViales: 3,
      viaAdministracion: "intraarticular",
      numSesiones: 4,
      fechaAplicacion: new Date("2026-07-10"),
      lugarAplicacion: "Hospital Italiano - Buenos Aires",
      nombreReceptor: "Dr. Roberto Silva",
      telefonoReceptor: "+54 11 4567-8901",
      institucionEntrega: "Hospital Italiano",
      direccionEntrega: "Av. Corrientes 1234",
      ciudadEntrega: "Buenos Aires",
      provinciaEntrega: "Buenos Aires",
      tipoEntrega: "cadena_frio",
      medicoRegistrado: true,
      medicoValidado: true,
      historiaClinicaRecibida: true,
      consentimientoRecibido: true,
      ordenMedicaRecibida: true,
      documentacionCompleta: true,
      montoTotal: 450000,
      estadoPago: "pagado",
      fechaPago: new Date("2026-06-12"),
      createdById: userSarah.id,
      validadoPorId: userSarah.id,
      fechaValidacion: new Date("2026-06-10"),
      createdAt: new Date("2026-06-08"),
    },
  });

  await prisma.solicitud.create({
    data: {
      numero: "SOL-2026-00010",
      medicoId: medicoMaria.id,
      pacienteId: pacientes[2].id,
      estado: "aprobado",
      diagnosticoPrincipal: "Rejuvenecimiento de manos",
      objetivoTerapeutico: "rejuvenecimiento",
      categoriaProducto: "peptidos",
      nombreProducto: "Peptidos Regenerativos",
      cantidadSolicitada: 2,
      numeroViales: 2,
      viaAdministracion: "intradermica",
      numSesiones: 3,
      fechaAplicacion: new Date("2026-07-20"),
      lugarAplicacion: "Clinica Dermatologica del Sur - Cordoba",
      nombreReceptor: "Dra. Maria Lopez",
      telefonoReceptor: "+54 351 456-7890",
      institucionEntrega: "Clinica Dermatologica del Sur",
      direccionEntrega: "Bv. San Juan 890",
      ciudadEntrega: "Cordoba",
      provinciaEntrega: "Cordoba",
      tipoEntrega: "temperatura_ambiente",
      medicoRegistrado: true,
      medicoValidado: true,
      historiaClinicaRecibida: true,
      consentimientoRecibido: true,
      ordenMedicaRecibida: true,
      documentacionCompleta: true,
      montoTotal: 360000,
      estadoPago: "pendiente",
      createdById: userCarlos.id,
      validadoPorId: userSarah.id,
      fechaValidacion: new Date("2026-06-16"),
      createdAt: new Date("2026-06-15"),
    },
  });

  console.log("Solicitudes creadas: 10");

  // ─── Fulfillment (for en_preparacion, despachado, entregado, cerrado) ──
  await prisma.fulfillment.create({
    data: {
      solicitudId: sol1.id,
      loteAsignado: "EXO-L2026-001",
      productoReservado: "Exosomas Mesenquimales 50M",
      cantidad: 2,
      fechaVencimiento: new Date("2026-12-15"),
      ubicacion: "Laboratorio Principal",
      fechaPreparacion: new Date("2026-03-07"),
      responsableId: userLaura.id,
      fechaDespacho: new Date("2026-03-08"),
      metodoEnvio: "transporte_especializado",
      tracking: "TE-2026-00001",
      temperaturaEnvio: "-20C",
      estado: "entregado",
    },
  });

  await prisma.fulfillment.create({
    data: {
      solicitudId: sol2.id,
      loteAsignado: "FIB-L2026-001",
      productoReservado: "Fibroblastos Dermicos 5M",
      cantidad: 3,
      fechaVencimiento: new Date("2027-01-10"),
      ubicacion: "Laboratorio Principal",
      fechaPreparacion: new Date("2026-04-12"),
      responsableId: userLaura.id,
      fechaDespacho: new Date("2026-04-13"),
      metodoEnvio: "andreani",
      tracking: "AND-9876543210",
      temperaturaEnvio: "-20C",
      estado: "entregado",
    },
  });

  await prisma.fulfillment.create({
    data: {
      solicitudId: sol3.id,
      loteAsignado: "CM-L2026-001",
      productoReservado: "Celulas Madre Adiposas 10M",
      cantidad: 1,
      fechaVencimiento: new Date("2026-11-20"),
      ubicacion: "Laboratorio Principal",
      fechaPreparacion: new Date("2026-05-16"),
      responsableId: userLaura.id,
      fechaDespacho: new Date("2026-05-18"),
      metodoEnvio: "moto",
      tracking: "MOTO-2026-00003",
      temperaturaEnvio: "-20C",
      estado: "despachado",
    },
  });

  await prisma.fulfillment.create({
    data: {
      solicitudId: sol4.id,
      loteAsignado: "EXO-L2026-001",
      productoReservado: "Exosomas Mesenquimales 50M",
      cantidad: 4,
      fechaVencimiento: new Date("2026-12-15"),
      ubicacion: "Laboratorio Principal",
      fechaPreparacion: new Date("2026-06-18"),
      responsableId: userLaura.id,
      estado: "preparando",
    },
  });

  await prisma.fulfillment.create({
    data: {
      solicitudId: sol9.id,
      loteAsignado: "LP-L2026-001",
      productoReservado: "Lisado Plaquetario Concentrado",
      cantidad: 3,
      fechaVencimiento: new Date("2026-12-01"),
      ubicacion: "Laboratorio Principal",
      fechaPreparacion: new Date("2026-06-15"),
      responsableId: userLaura.id,
      estado: "preparando",
    },
  });

  console.log("Fulfillment creados: 5");

  // ─── EvidenciaEntrega (for entregado and cerrado) ───────────────
  await prisma.evidenciaEntrega.create({
    data: {
      solicitudId: sol1.id,
      nombreReceptor: "Dr. Roberto Silva",
      dniReceptor: "28456789",
      fechaHoraEntrega: new Date("2026-03-09T10:30:00"),
      observaciones: "Entregado en consultorio, cadena de frio verificada",
      estado: "confirmada",
      creadoPorId: userCarlos.id,
    },
  });

  await prisma.evidenciaEntrega.create({
    data: {
      solicitudId: sol2.id,
      nombreReceptor: "Dra. Maria Lopez",
      dniReceptor: "30789456",
      fechaHoraEntrega: new Date("2026-04-14T14:00:00"),
      observaciones: "Recibido en clinica, temperatura correcta",
      estado: "confirmada",
      creadoPorId: userCarlos.id,
    },
  });

  console.log("Evidencias de entrega creadas: 2");

  // ─── Pagos ──────────────────────────────────────────────────────
  await Promise.all([
    prisma.pago.create({
      data: {
        solicitudNum: "SOL-2026-00001",
        monto: 900000,
        metodo: "transferencia",
        comprobante: "TRANSF-2026-0001",
        estado: "confirmado",
        fechaPago: new Date("2026-03-05"),
      },
    }),
    prisma.pago.create({
      data: {
        solicitudNum: "SOL-2026-00002",
        monto: 960000,
        metodo: "quickbooks",
        comprobante: "QB-INV-2026-0042",
        estado: "confirmado",
        fechaPago: new Date("2026-04-10"),
      },
    }),
    prisma.pago.create({
      data: {
        solicitudNum: "SOL-2026-00003",
        monto: 680000,
        metodo: "transferencia",
        comprobante: "TRANSF-2026-0015",
        estado: "confirmado",
        fechaPago: new Date("2026-05-15"),
      },
    }),
    prisma.pago.create({
      data: {
        solicitudNum: "SOL-2026-00004",
        monto: 1800000,
        metodo: "efectivo",
        comprobante: "REC-2026-0008",
        estado: "confirmado",
        fechaPago: new Date("2026-06-10"),
      },
    }),
    prisma.pago.create({
      data: {
        solicitudNum: "SOL-2026-00009",
        monto: 450000,
        metodo: "transferencia",
        comprobante: "TRANSF-2026-0022",
        estado: "confirmado",
        fechaPago: new Date("2026-06-12"),
      },
    }),
    prisma.pago.create({
      data: {
        solicitudNum: "SOL-2026-00005",
        monto: 1040000,
        metodo: "transferencia",
        estado: "pendiente",
      },
    }),
    prisma.pago.create({
      data: {
        solicitudNum: "SOL-2026-00006",
        monto: 900000,
        metodo: "quickbooks",
        estado: "pendiente",
      },
    }),
    prisma.pago.create({
      data: {
        solicitudNum: "SOL-2026-00010",
        monto: 360000,
        metodo: "efectivo",
        estado: "pendiente",
      },
    }),
  ]);

  console.log("Pagos creados: 8");

  // ─── Alertas ────────────────────────────────────────────────────
  await Promise.all([
    // 2 critical
    prisma.alert.create({
      data: {
        type: "stock_bajo",
        severity: "critical",
        title: "Stock critico: Celulas de Foliculo Piloso",
        message:
          "El lote FP-L2026-002 tiene solo 1 unidad disponible. Se requiere reposicion urgente para cubrir solicitudes pendientes.",
        entityType: "inventario",
        entityId: "FP-L2026-002",
        isRead: false,
        isDismissed: false,
        createdAt: new Date("2026-06-18T08:00:00"),
      },
    }),
    prisma.alert.create({
      data: {
        type: "documento_faltante",
        severity: "critical",
        title: "Documentacion incompleta: SOL-2026-00008",
        message:
          "La solicitud SOL-2026-00008 del Dr. Diego Torres no tiene historia clinica, consentimiento ni orden medica. El medico aun no esta validado.",
        entityType: "solicitud",
        entityId: sol8.id,
        isRead: false,
        isDismissed: false,
        createdAt: new Date("2026-06-17T15:30:00"),
      },
    }),
    // 2 warning
    prisma.alert.create({
      data: {
        type: "solicitud_pendiente",
        severity: "warning",
        title: "Solicitud pendiente de revision: SOL-2026-00007",
        message:
          "La solicitud SOL-2026-00007 del Dr. Juan Perez lleva 2 dias en estado pendiente sin asignar validador.",
        entityType: "solicitud",
        entityId: sol7.id,
        isRead: false,
        isDismissed: false,
        createdAt: new Date("2026-06-18T09:00:00"),
      },
    }),
    prisma.alert.create({
      data: {
        type: "vencimiento",
        severity: "warning",
        title: "Vencimiento proximo: Lote FP-L2026-002",
        message:
          "El lote FP-L2026-002 de Celulas de Foliculo Piloso vence el 10/08/2026. Quedan menos de 2 meses.",
        entityType: "inventario",
        entityId: "FP-L2026-002",
        isRead: false,
        isDismissed: false,
        createdAt: new Date("2026-06-18T07:00:00"),
      },
    }),
    // 2 info
    prisma.alert.create({
      data: {
        type: "nuevo_medico",
        severity: "info",
        title: "Nuevo medico registrado: Dr. Diego Torres",
        message:
          "Dr. Diego Torres (Medicina Estetica, CABA) se registro en la plataforma y esta pendiente de validacion.",
        entityType: "medico",
        entityId: medicoDiego.id,
        isRead: false,
        isDismissed: false,
        createdAt: new Date("2026-06-17T10:00:00"),
      },
    }),
    prisma.alert.create({
      data: {
        type: "pago_confirmado",
        severity: "info",
        title: "Pago confirmado: SOL-2026-00009",
        message:
          "Se confirmo el pago de $450.000 por transferencia para la solicitud SOL-2026-00009 del Dr. Roberto Silva.",
        entityType: "solicitud",
        entityId: sol9.id,
        isRead: true,
        isDismissed: false,
        createdAt: new Date("2026-06-12T16:00:00"),
      },
    }),
  ]);

  console.log("Alertas creadas: 6");

  console.log("\nSeed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
