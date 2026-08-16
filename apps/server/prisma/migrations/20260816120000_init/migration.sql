-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VIEWER', 'ENGINEER');

-- CreateEnum
CREATE TYPE "RoverState" AS ENUM ('IDLE', 'DRIVING', 'CHARGING', 'FAULT', 'ESTOP');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_readings" (
    "id" TEXT NOT NULL,
    "batteryVoltage" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "state" "RoverState" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredById" TEXT,

    CONSTRAINT "telemetry_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "telemetry_readings_timestamp_idx" ON "telemetry_readings"("timestamp");

-- AddForeignKey
ALTER TABLE "telemetry_readings" ADD CONSTRAINT "telemetry_readings_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
