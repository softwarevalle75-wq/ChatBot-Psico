/*
  Warnings:

  - A unique constraint covering the columns `[telefono]` on the table `practicante` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `telefono` to the `practicante` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `practicante` ADD COLUMN `telefono` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `admin` (
    `idPracticante` VARCHAR(191) NOT NULL,
    `numero_documento` VARCHAR(191) NOT NULL,
    `tipo_documento` VARCHAR(191) NOT NULL DEFAULT 'CC',
    `nombre` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `admin_idPracticante_key`(`idPracticante`),
    UNIQUE INDEX `admin_numero_documento_key`(`numero_documento`),
    UNIQUE INDEX `admin_telefono_key`(`telefono`),
    PRIMARY KEY (`idPracticante`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `practicante_telefono_key` ON `practicante`(`telefono`);
