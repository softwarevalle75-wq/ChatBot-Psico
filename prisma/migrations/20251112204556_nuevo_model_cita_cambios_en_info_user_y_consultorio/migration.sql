/*
  Warnings:

  - You are about to drop the column `estado` on the `cita` table. All the data in the column will be lost.
  - You are about to drop the column `fechaHora` on the `cita` table. All the data in the column will be lost.
  - You are about to drop the column `idConsultorio` on the `cita` table. All the data in the column will be lost.
  - You are about to drop the column `idPracticante` on the `cita` table. All the data in the column will be lost.
  - You are about to drop the column `idUsuario` on the `cita` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nombre]` on the table `consultorio` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[primerNombre,segundoNombre,primerApellido]` on the table `informacionUsuario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre]` on the table `practicante` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nombreConsultorio` to the `cita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombrePracticante` to the `cita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primerApellido` to the `cita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primerNombre` to the `cita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `segundoNombre` to the `cita` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `cita` DROP FOREIGN KEY `cita_idConsultorio_fkey`;

-- DropForeignKey
ALTER TABLE `cita` DROP FOREIGN KEY `cita_idPracticante_fkey`;

-- DropForeignKey
ALTER TABLE `cita` DROP FOREIGN KEY `cita_idUsuario_fkey`;

-- DropIndex
DROP INDEX `cita_idConsultorio_fkey` ON `cita`;

-- DropIndex
DROP INDEX `cita_idPracticante_fkey` ON `cita`;

-- DropIndex
DROP INDEX `cita_idUsuario_fkey` ON `cita`;

-- AlterTable
ALTER TABLE `cita` DROP COLUMN `estado`,
    DROP COLUMN `fechaHora`,
    DROP COLUMN `idConsultorio`,
    DROP COLUMN `idPracticante`,
    DROP COLUMN `idUsuario`,
    ADD COLUMN `nombreConsultorio` VARCHAR(191) NOT NULL,
    ADD COLUMN `nombrePracticante` VARCHAR(191) NOT NULL,
    ADD COLUMN `primerApellido` VARCHAR(191) NOT NULL,
    ADD COLUMN `primerNombre` VARCHAR(191) NOT NULL,
    ADD COLUMN `segundoNombre` VARCHAR(191) NOT NULL,
    ALTER COLUMN `fechaCreacion` DROP DEFAULT;

-- AlterTable
ALTER TABLE `informacion_sociodemografica` ALTER COLUMN `fechaActualizacion` DROP DEFAULT;

-- AlterTable
ALTER TABLE `informacionusuario` ALTER COLUMN `fechaActualizacion` DROP DEFAULT;

-- AlterTable
ALTER TABLE `registrocitas` ALTER COLUMN `fechaHora` DROP DEFAULT;

-- AlterTable
ALTER TABLE `rolchat` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX `consultorio_nombre_key` ON `consultorio`(`nombre`);

-- CreateIndex
CREATE UNIQUE INDEX `informacionUsuario_primerNombre_segundoNombre_primerApellido_key` ON `informacionUsuario`(`primerNombre`, `segundoNombre`, `primerApellido`);

-- CreateIndex
CREATE UNIQUE INDEX `practicante_nombre_key` ON `practicante`(`nombre`);

-- AddForeignKey
ALTER TABLE `cita` ADD CONSTRAINT `cita_primerNombre_segundoNombre_primerApellido_fkey` FOREIGN KEY (`primerNombre`, `segundoNombre`, `primerApellido`) REFERENCES `informacionUsuario`(`primerNombre`, `segundoNombre`, `primerApellido`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cita` ADD CONSTRAINT `cita_nombreConsultorio_fkey` FOREIGN KEY (`nombreConsultorio`) REFERENCES `consultorio`(`nombre`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cita` ADD CONSTRAINT `cita_nombrePracticante_fkey` FOREIGN KEY (`nombrePracticante`) REFERENCES `practicante`(`nombre`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `cita` ADD COLUMN `estado` VARCHAR(191) NOT NULL DEFAULT 'pendiente',
    ALTER COLUMN `fechaCreacion` DROP DEFAULT;

-- AlterTable
ALTER TABLE `informacion_sociodemografica` ALTER COLUMN `fechaActualizacion` DROP DEFAULT;

-- AlterTable
ALTER TABLE `informacionusuario` ALTER COLUMN `fechaActualizacion` DROP DEFAULT;

-- AlterTable
ALTER TABLE `registrocitas` ALTER COLUMN `fechaHora` DROP DEFAULT;

-- AlterTable
ALTER TABLE `rolchat` ALTER COLUMN `updatedAt` DROP DEFAULT;

