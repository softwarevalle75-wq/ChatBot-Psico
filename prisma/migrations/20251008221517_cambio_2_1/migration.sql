/*
  Warnings:

  - You are about to alter the column `tienePersonasACargo` on the `informacion_sociodemografica` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `informacion_sociodemografica` MODIFY `tienePersonasACargo` VARCHAR(191) NOT NULL DEFAULT 'Si';
