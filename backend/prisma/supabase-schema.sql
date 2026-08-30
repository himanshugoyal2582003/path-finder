-- Generated from prisma/schema.prisma.
-- Run this in the Supabase SQL Editor if `npx prisma db push` cannot reach the database.

CREATE TABLE "pathfinder_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pathfinder_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pathfinder_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skills" TEXT[],
    "interests" TEXT[],
    "goalText" TEXT NOT NULL,
    "hoursPerWeek" INTEGER NOT NULL DEFAULT 10,
    "timelineMonths" INTEGER NOT NULL DEFAULT 6,
    "budgetPref" TEXT NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pathfinder_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pathfinder_role_archetypes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiredSkills" TEXT[],
    "description" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "source" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pathfinder_role_archetypes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pathfinder_raw_ingests" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "pathfinder_raw_ingests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pathfinder_recommendations" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "fitScore" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pathfinder_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pathfinder_roadmap_phases" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "phaseName" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "pathfinder_roadmap_phases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pathfinder_roadmap_items" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "resourceUrl" TEXT,
    "estHours" INTEGER NOT NULL DEFAULT 4,
    "order" INTEGER NOT NULL DEFAULT 0,
    "done" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "pathfinder_roadmap_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pathfinder_users_email_key" ON "pathfinder_users"("email");
CREATE UNIQUE INDEX "pathfinder_profiles_userId_key" ON "pathfinder_profiles"("userId");
CREATE UNIQUE INDEX "pathfinder_role_archetypes_name_key" ON "pathfinder_role_archetypes"("name");

ALTER TABLE "pathfinder_profiles" ADD CONSTRAINT "pathfinder_profiles_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "pathfinder_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pathfinder_recommendations" ADD CONSTRAINT "pathfinder_recommendations_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "pathfinder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pathfinder_recommendations" ADD CONSTRAINT "pathfinder_recommendations_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "pathfinder_role_archetypes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pathfinder_roadmap_phases" ADD CONSTRAINT "pathfinder_roadmap_phases_recommendationId_fkey"
FOREIGN KEY ("recommendationId") REFERENCES "pathfinder_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pathfinder_roadmap_items" ADD CONSTRAINT "pathfinder_roadmap_items_phaseId_fkey"
FOREIGN KEY ("phaseId") REFERENCES "pathfinder_roadmap_phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
