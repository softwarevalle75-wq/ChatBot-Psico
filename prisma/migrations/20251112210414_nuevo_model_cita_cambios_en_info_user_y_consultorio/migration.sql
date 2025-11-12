/*
  Warnings:

  - You are about to drop the column `fechaCreacion` on the `cita` table. All the data in the column will be lost.
  - Added the required column `fechaHora` to the `cita` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `cita` DROP COLUMN `fechaCreacion`,
    ADD COLUMN `fechaHora` TIMESTAMP(0) NOT NULL;

-- AlterTable
ALTER TABLE `informacion_sociodemografica` ALTER COLUMN `fechaActualizacion` DROP DEFAULT;

-- AlterTable
ALTER TABLE `informacionusuario` ALTER COLUMN `fechaActualizacion` DROP DEFAULT;

-- AlterTable
ALTER TABLE `registrocitas` ALTER COLUMN `fechaHora` DROP DEFAULT;

-- AlterTable
ALTER TABLE `rolchat` ALTER COLUMN `updatedAt` DROP DEFAULT;
