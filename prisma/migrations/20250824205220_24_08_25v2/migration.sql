/*
  Warnings:

  - A unique constraint covering the columns `[correo]` on the table `informacionUsuario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[documento]` on the table `informacionUsuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `informacionusuario` ADD COLUMN `correo` VARCHAR(191) NULL,
    ADD COLUMN `documento` VARCHAR(191) NULL,
    ADD COLUMN `tipoDocumento` VARCHAR(191) NOT NULL DEFAULT 'CC';

-- CreateIndex
CREATE UNIQUE INDEX `informacionUsuario_correo_key` ON `informacionUsuario`(`correo`);

-- CreateIndex
CREATE UNIQUE INDEX `informacionUsuario_documento_key` ON `informacionUsuario`(`documento`);
