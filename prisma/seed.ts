import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { getDatabaseUrl } from "../src/lib/database-url";

const prisma = new PrismaClient({
  datasourceUrl: getDatabaseUrl(),
});

const defaultStages = [
  { name: "Triagem", order: 0, isTerminal: false, terminalType: null },
  { name: "Entrevista", order: 1, isTerminal: false, terminalType: null },
  { name: "Proposta", order: 2, isTerminal: false, terminalType: null },
  { name: "Contratado", order: 3, isTerminal: true, terminalType: "HIRED" },
  { name: "Declinado", order: 4, isTerminal: true, terminalType: "DECLINED" },
];

async function seedOrganization(data: {
  name: string;
  tradeName: string;
  cnpj: string;
  city: string;
  region: string;
}) {
  const org = await prisma.organization.create({ data });

  const stages = await Promise.all(
    defaultStages.map((stage) =>
      prisma.pipelineStage.create({
        data: { organizationId: org.id, ...stage },
      }),
    ),
  );

  const stageByName = Object.fromEntries(stages.map((s) => [s.name, s]));

  return { org, stageByName };
}

async function main() {
  await prisma.onboarding.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.task.deleteMany();
  await prisma.jobOpening.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "admin@shift.rh",
      name: "Admin Shift",
      password: "demo123",
      role: "SHIFT_ADMIN",
    },
  });

  const consultant = await prisma.user.create({
    data: {
      email: "patricia@shift.rh",
      name: "Patricia Barros",
      password: "demo123",
      role: "SHIFT_CONSULTANT",
    },
  });

  const { org: landscape, stageByName: lsStages } = await seedOrganization({
    name: "Ecossistema Landscape",
    tradeName: "LandscapeLABs",
    cnpj: "12.345.678/0001-90",
    city: "São Paulo",
    region: "SP",
  });

  const { org: acme, stageByName: acmeStages } = await seedOrganization({
    name: "Acme Tecnologia Ltda",
    tradeName: "Acme Tech",
    cnpj: "98.765.432/0001-10",
    city: "Porto Alegre",
    region: "RS",
  });

  const jobDesigner = await prisma.jobOpening.create({
    data: {
      organizationId: landscape.id,
      title: "Designer de Produto",
      area: "Produto",
      seniority: "Pleno",
      employmentType: "CLT",
      quantity: 1,
      priority: "HIGH",
      status: "OPEN",
      ownerName: "Patricia Barros",
    },
  });

  const jobDev = await prisma.jobOpening.create({
    data: {
      organizationId: landscape.id,
      title: "Desenvolvedor Full Stack",
      area: "Engenharia",
      seniority: "Sênior",
      employmentType: "PJ",
      quantity: 2,
      priority: "MEDIUM",
      status: "OPEN",
      ownerName: "Patricia Barros",
    },
  });

  await prisma.jobOpening.create({
    data: {
      organizationId: acme.id,
      title: "Analista de RH",
      area: "People",
      seniority: "Pleno",
      employmentType: "CLT",
      quantity: 1,
      priority: "LOW",
      status: "OPEN",
      ownerName: "Admin Shift",
    },
  });

  await prisma.candidate.createMany({
    data: [
      {
        organizationId: landscape.id,
        jobOpeningId: jobDesigner.id,
        stageId: lsStages.Triagem.id,
        ownerId: consultant.id,
        name: "Marina Costa",
        email: "marina.costa@email.com",
        source: "LinkedIn",
      },
      {
        organizationId: landscape.id,
        jobOpeningId: jobDesigner.id,
        stageId: lsStages.Entrevista.id,
        ownerId: consultant.id,
        name: "Felipe Andrade",
        email: "felipe.a@email.com",
        source: "Indicação",
      },
      {
        organizationId: landscape.id,
        jobOpeningId: jobDev.id,
        stageId: lsStages.Proposta.id,
        ownerId: consultant.id,
        name: "Juliana Mendes",
        email: "ju.mendes@email.com",
        source: "Gupy",
      },
      {
        organizationId: landscape.id,
        jobOpeningId: jobDev.id,
        stageId: lsStages.Declinado.id,
        ownerId: consultant.id,
        name: "Ricardo Lima",
        email: "ricardo.l@email.com",
        source: "Site",
        declineReason: "Pretensão salarial",
      },
      {
        organizationId: acme.id,
        jobOpeningId: null,
        stageId: acmeStages.Triagem.id,
        ownerId: admin.id,
        name: "Camila Souza",
        email: "camila.s@email.com",
        source: "LinkedIn",
      },
    ],
  });

  const hiredCandidate = await prisma.candidate.create({
    data: {
      organizationId: landscape.id,
      jobOpeningId: jobDesigner.id,
      stageId: lsStages.Contratado.id,
      ownerId: consultant.id,
      name: "Ana Paula Ribeiro",
      email: "ana.ribeiro@email.com",
      source: "Indicação",
    },
  });

  await prisma.task.createMany({
    data: [
      {
        organizationId: landscape.id,
        assigneeId: consultant.id,
        title: "Enviar shortlist Designer para cliente",
        description: "Consolidar 3 perfis para reunião de alinhamento",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: new Date(Date.now() + 2 * 86400000),
      },
      {
        organizationId: landscape.id,
        assigneeId: consultant.id,
        title: "Atualizar descrição vaga Full Stack",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 5 * 86400000),
      },
      {
        organizationId: landscape.id,
        assigneeId: admin.id,
        title: "Preparar relatório mensal R&S",
        status: "TODO",
        priority: "LOW",
        dueDate: new Date(Date.now() + 7 * 86400000),
      },
      {
        organizationId: acme.id,
        assigneeId: admin.id,
        title: "Mapear processos em Excel para migração",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 10 * 86400000),
      },
    ],
  });

  await prisma.employee.createMany({
    data: [
      {
        organizationId: landscape.id,
        name: "Vinicius Meyer",
        email: "vinicius@landscape.to",
        document: "123.456.789-00",
        employmentType: "CLT",
        role: "Head de Produto",
        area: "Produto",
        startDate: new Date("2024-03-01"),
      },
      {
        organizationId: landscape.id,
        name: "Consultor PJ Alpha",
        email: "alpha@consultoria.com",
        document: "11.222.333/0001-44",
        employmentType: "PJ",
        role: "Consultor Financeiro",
        area: "Financeiro",
        pjCompanyName: "Alpha Consultoria ME",
        pjCnpj: "11.222.333/0001-44",
        startDate: new Date("2025-01-15"),
      },
    ],
  });

  await prisma.onboarding.createMany({
    data: [
      {
        organizationId: landscape.id,
        candidateId: hiredCandidate.id,
        employeeName: "Ana Paula Ribeiro",
        employmentType: "CLT",
        status: "SIGNATURE",
        signatureStatus: "PENDING",
      },
      {
        organizationId: landscape.id,
        employeeName: "Consultor PJ Beta",
        employmentType: "PJ",
        status: "DOCS_PENDING",
        signatureStatus: "PENDING",
      },
      {
        organizationId: landscape.id,
        employeeName: "Carlos Eduardo",
        employmentType: "CLT",
        status: "COMPLETED",
        signatureStatus: "SIGNED",
      },
    ],
  });

  console.log("Seed concluído:");
  console.log("  Login admin: admin@shift.rh / demo123");
  console.log("  Login consultor: patricia@shift.rh / demo123");
  console.log(`  Clientes: ${landscape.tradeName}, ${acme.tradeName}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
