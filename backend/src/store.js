const prisma = require('./db');

const SEED_ROLES = [
  {
    name: 'Product Designer',
    requiredSkills: ['Visual Design', 'Figma Prototyping', 'User Research', 'Design Systems', 'Writing', 'User Empathy'],
    description: 'Focuses on visual communication, prototyping, user research, and crafting digital interfaces that align user needs with business goals.',
    embedding: [],
    source: 'seed',
  },
  {
    name: 'Data Analyst',
    requiredSkills: ['Excel', 'SQL', 'Python (Pandas)', 'PowerBI/Tableau', 'Statistical Modeling', 'Writing'],
    description: 'Deciphers raw numerical inputs to build diagnostic dashboards and explain trends to operational business leaders.',
    embedding: [],
    source: 'seed',
  },
  {
    name: 'Growth Marketer',
    requiredSkills: ['Writing', 'Google Analytics', 'A/B Testing', 'Copywriting for Ads', 'Excel', 'User Empathy'],
    description: 'Aligns copywriting, A/B testing, analytical reporting, and digital marketing channels to build scalable acquisition loops.',
    embedding: [],
    source: 'seed',
  },
];

class PrismaStore {
  constructor() {
    this._seedPromise = null;
  }

  async ensureSeedRoles() {
    if (!this._seedPromise) {
      this._seedPromise = Promise.all(
        SEED_ROLES.map((role) =>
          prisma.roleArchetype.upsert({
            where: { name: role.name },
            update: role,
            create: role,
          })
        )
      ).catch((error) => {
        this._seedPromise = null;
        throw error;
      });
    }
    await this._seedPromise;
  }

  async findUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  async createUser({ email, passwordHash }) {
    return prisma.user.create({ data: { email, passwordHash } });
  }

  async getUserWithProfile(id) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async findProfileByUserId(userId) {
    return prisma.profile.findUnique({ where: { userId } });
  }

  async upsertProfile(userId, data) {
    const normalized = {
      skills: data.skills || [],
      interests: data.interests || [],
      goalText: data.goalText || '',
      hoursPerWeek: data.hoursPerWeek || 10,
      timelineMonths: data.timelineMonths || 6,
      budgetPref: data.budgetPref || 'free',
    };

    return prisma.profile.upsert({
      where: { userId },
      update: normalized,
      create: { userId, ...normalized },
    });
  }

  async findAllRoles() {
    await this.ensureSeedRoles();
    return prisma.roleArchetype.findMany({ orderBy: { name: 'asc' } });
  }

  async upsertRole(data) {
    const normalized = {
      description: data.description || '',
      requiredSkills: data.requiredSkills || [],
      source: data.source || 'ai-service',
      embedding: data.embedding || [],
    };

    return prisma.roleArchetype.upsert({
      where: { name: data.name },
      update: normalized,
      create: { name: data.name, ...normalized },
    });
  }

  async findRecommendationsByProfileId(profileId) {
    const recs = await prisma.recommendation.findMany({
      where: { profileId },
      include: this._recommendationInclude(),
      orderBy: { fitScore: 'desc' },
    });
    return recs.map((rec) => this._formatRecommendation(rec));
  }

  async deleteRecommendationsByProfileId(profileId) {
    await prisma.recommendation.deleteMany({ where: { profileId } });
  }

  async createRecommendation({ profileId, roleId, fitScore, explanation, phases }) {
    const recommendation = await prisma.recommendation.create({
      data: {
        profileId,
        roleId,
        fitScore,
        explanation,
        phases: {
          create: (phases || []).map((phase, phaseIndex) => ({
            phaseName: phase.phaseName,
            order: phaseIndex,
            items: {
              create: (phase.items || []).map((item, itemIndex) => ({
                title: item.title,
                resourceUrl: item.resourceUrl || '',
                estHours: item.estHours || 4,
                order: itemIndex,
                done: Boolean(item.done),
              })),
            },
          })),
        },
      },
      include: this._recommendationInclude(),
    });
    return this._formatRecommendation(recommendation);
  }

  async toggleRoadmapItem(id, userId) {
    const item = await prisma.roadmapItem.findFirst({
      where: {
        id,
        phase: {
          recommendation: {
            profile: { userId },
          },
        },
      },
    });
    if (!item) return null;
    return prisma.roadmapItem.update({
      where: { id },
      data: { done: !item.done },
    });
  }

  _recommendationInclude() {
    return {
      role: true,
      phases: {
        orderBy: { order: 'asc' },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      },
    };
  }

  _formatRecommendation(rec) {
    return {
      ...rec,
      phases: rec.phases.map((phase) => ({
        ...phase,
        items: phase.items,
      })),
    };
  }
}

module.exports = new PrismaStore();
