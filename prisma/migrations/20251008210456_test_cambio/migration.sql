/*
  Warnings:

  - You are about to alter the column `perteneceUniversidad` on the `informacionusuario` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `informacionusuario` MODIFY `perteneceUniversidad` VARCHAR(191) NOT NULL DEFAULT 'No';
