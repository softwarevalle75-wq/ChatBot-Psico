/*
  Warnings:

  - Changed the type of `horaInicio` on the `horario` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `horaFin` on the `horario` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE `horario` DROP COLUMN `horaInicio`,
    ADD COLUMN `horaInicio` INTEGER NOT NULL,
    DROP COLUMN `horaFin`,
    ADD COLUMN `horaFin` INTEGER NOT NULL;
