/*
  Warnings:

  - You are about to drop the column `Puntaje` on the `dass21` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `dass21` DROP COLUMN `Puntaje`,
    ADD COLUMN `puntajeAns` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `puntajeDep` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `puntajeEstr` INTEGER NOT NULL DEFAULT 0;
