/*
  Warnings:

  - You are about to drop the column `correo` on the `informacionusuario` table. All the data in the column will be lost.
  - You are about to drop the column `documento` on the `informacionusuario` table. All the data in the column will be lost.
  - You are about to drop the column `tipoDocumento` on the `informacionusuario` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `informacionUsuario_correo_key` ON `informacionusuario`;

-- DropIndex
DROP INDEX `informacionUsuario_documento_key` ON `informacionusuario`;

-- AlterTable
ALTER TABLE `informacionusuario` DROP COLUMN `correo`,
    DROP COLUMN `documento`,
    DROP COLUMN `tipoDocumento`;
