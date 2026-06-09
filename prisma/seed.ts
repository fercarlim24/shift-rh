import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { DEFAULT_PIPELINE_STAGES } from "../src/lib/default-pipeline-stages";
import { getDatabaseUrl } from "../src/lib/database-url";

const prisma = new PrismaClient({
  datasourceUrl: getDatabaseUrl(),
});

async function seedOrganization(data: {
  name: string;
  tradeName: string;
  cnpj: string;
  city: string;
  region: string;
  createdById?: string;
}) {
  const org = await prisma.organization.create({
    data: {
      name: data.name,
      tradeName: data.tradeName,
      cnpj: data.cnpj,
      city: data.city,
      region: data.region,
      createdById: data.createdById,
      updatedById: data.createdById,
    },
  });

  const stages = await Promise.all(
    DEFAULT_PIPELINE_STAGES.map((stage) =>
      prisma.pipelineStage.create({
        data: { organizationId: org.id, ...stage },
      }),
    ),
  );

  const stageByName = Object.fromEntries(stages.map((s) => [s.name, s]));

  return { org, stageByName };
}

async function main() {
  const demoPassword = await hashPassword("demo123");

  await prisma.auditLog.deleteMany();
  await prisma.onboardingEvent.deleteMany();
  await prisma.onboarding.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.task.deleteMany();
  await prisma.jobOpening.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.userOrganizationAccess.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "admin@shift.rh",
      name: "Admin Shift",
      password: demoPassword,
      role: "SHIFT_ADMIN",
    },
  });

  const consultant = await prisma.user.create({
    data: {
      email: "patricia@shift.rh",
      name: "Patricia Barros",
      password: demoPassword,
      role: "SHIFT_CONSULTANT",
    },
  });

  const clientManager = await prisma.user.create({
    data: {
      email: "gestor@landscape.to",
      name: "Gestor Landscape",
      password: demoPassword,
      role: "CLIENT_VIEWER",
    },
  });

  const collaborator = await prisma.user.create({
    data: {
      email: "colaborador@landscape.to",
      name: "Vinicius Meyer",
      password: demoPassword,
      role: "COLLABORATOR",
    },
  });

  const { org: landscape, stageByName: lsStages } = await seedOrganization({
    name: "Ecossistema Landscape",
    tradeName: "LandscapeLABs",
    cnpj: "12.345.678/0001-90",
    city: "São Paulo",
    region: "SP",
    createdById: admin.id,
  });

  const { org: acme, stageByName: acmeStages } = await seedOrganization({
    name: "Acme Tecnologia Ltda",
    tradeName: "Acme Tech",
    cnpj: "98.765.432/0001-10",
    city: "Porto Alegre",
    region: "RS",
    createdById: admin.id,
  });

  await prisma.userOrganizationAccess.create({
    data: {
      userId: consultant.id,
      organizationId: landscape.id,
    },
  });

  await prisma.user.update({
    where: { id: clientManager.id },
    data: { organizationId: landscape.id },
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
      createdById: consultant.id,
      updatedById: consultant.id,
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
      createdById: consultant.id,
      updatedById: consultant.id,
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
      createdById: admin.id,
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
        createdById: consultant.id,
      },
      {
        organizationId: landscape.id,
        jobOpeningId: jobDesigner.id,
        stageId: lsStages.Entrevista.id,
        ownerId: consultant.id,
        name: "Felipe Andrade",
        email: "felipe.a@email.com",
        source: "Indicação",
        createdById: consultant.id,
      },
      {
        organizationId: landscape.id,
        jobOpeningId: jobDev.id,
        stageId: lsStages.Proposta.id,
        ownerId: consultant.id,
        name: "Juliana Mendes",
        email: "ju.mendes@email.com",
        source: "Gupy",
        createdById: consultant.id,
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
        createdById: consultant.id,
      },
      {
        organizationId: acme.id,
        jobOpeningId: null,
        stageId: acmeStages.Triagem.id,
        ownerId: admin.id,
        name: "Camila Souza",
        email: "camila.s@email.com",
        source: "LinkedIn",
        createdById: admin.id,
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
      createdById: consultant.id,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        organizationId: landscape.id,
        assigneeId: consultant.id,
        jobOpeningId: jobDesigner.id,
        title: "Enviar shortlist Designer para cliente",
        description: "Consolidar 3 perfis para reunião de alinhamento",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: new Date(Date.now() + 2 * 86400000),
        createdById: consultant.id,
      },
      {
        organizationId: landscape.id,
        assigneeId: consultant.id,
        jobOpeningId: jobDev.id,
        title: "Atualizar descrição vaga Full Stack",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 5 * 86400000),
        createdById: consultant.id,
      },
      {
        organizationId: landscape.id,
        assigneeId: admin.id,
        title: "Preparar relatório mensal R&S",
        status: "TODO",
        priority: "LOW",
        dueDate: new Date(Date.now() + 7 * 86400000),
        createdById: admin.id,
      },
      {
        organizationId: acme.id,
        assigneeId: admin.id,
        title: "Mapear processos em Excel para migração",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 10 * 86400000),
        createdById: admin.id,
      },
    ],
  });

  const employeeVinicius = await prisma.employee.create({
    data: {
      organizationId: landscape.id,
      userId: collaborator.id,
      name: "Vinicius Meyer",
      email: "vinicius@landscape.to",
      document: "123.456.789-00",
      employmentType: "CLT",
      role: "Head de Produto",
      area: "Produto",
      startDate: new Date("2024-03-01"),
      createdById: admin.id,
    },
  });

  await prisma.user.update({
    where: { id: collaborator.id },
    data: { organizationId: landscape.id },
  });

  await prisma.employee.create({
    data: {
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
      createdById: admin.id,
    },
  });

  const onboarding1 = await prisma.onboarding.create({
    data: {
      organizationId: landscape.id,
      candidateId: hiredCandidate.id,
      employeeName: "Ana Paula Ribeiro",
      employmentType: "CLT",
      status: "SIGNATURE",
      signatureStatus: "PENDING",
      responsibleId: consultant.id,
      documents: { files: [{ name: "contrato-clt.pdf", note: "Placeholder" }] },
      createdById: consultant.id,
    },
  });

  await prisma.onboardingEvent.createMany({
    data: [
      {
        onboardingId: onboarding1.id,
        type: "created",
        message: "Admissão iniciada a partir do candidato contratado",
        createdById: consultant.id,
      },
      {
        onboardingId: onboarding1.id,
        type: "status_change",
        message: "Documentos coletados — aguardando assinatura",
        createdById: consultant.id,
      },
    ],
  });

  await prisma.onboarding.create({
    data: {
      organizationId: landscape.id,
      employeeName: "Consultor PJ Beta",
      employmentType: "PJ",
      status: "DOCS_PENDING",
      signatureStatus: "PENDING",
      responsibleId: consultant.id,
      createdById: consultant.id,
    },
  });

  await prisma.onboarding.create({
    data: {
      organizationId: landscape.id,
      employeeName: "Carlos Eduardo",
      employmentType: "CLT",
      status: "COMPLETED",
      signatureStatus: "SIGNED",
      responsibleId: admin.id,
      createdById: admin.id,
    },
  });

  console.log("Seed concluído:");
  console.log("  Login admin: admin@shift.rh / demo123");
  console.log("  Login consultor: patricia@shift.rh / demo123 (acesso: LandscapeLABs)");
  console.log("  Login gestor cliente: gestor@landscape.to / demo123");
  console.log("  Login colaborador: colaborador@landscape.to / demo123");
  console.log(`  Clientes: ${landscape.tradeName}, ${acme.tradeName}`);
  console.log(`  Colaborador vinculado: ${employeeVinicius.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
