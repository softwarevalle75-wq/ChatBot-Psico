/*
  Warnings:

  - You are about to drop the column `apellido` on the `informacionusuario` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `informacionusuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `informacionusuario` DROP COLUMN `apellido`,
    DROP COLUMN `nombre`,
    ADD COLUMN `carrera` VARCHAR(191) NULL,
    ADD COLUMN `consentimientoInformado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `fechaNacimiento` DATETIME(3) NULL,
    ADD COLUMN `isAuthenticated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `jornada` VARCHAR(191) NULL,
    ADD COLUMN `password` VARCHAR(191) NULL,
    ADD COLUMN `perteneceUniversidad` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `primerApellido` VARCHAR(191) NULL,
    ADD COLUMN `primerNombre` VARCHAR(191) NULL,
    ADD COLUMN `segundoApellido` VARCHAR(191) NULL,
    ADD COLUMN `segundoCorreo` VARCHAR(191) NULL,
    ADD COLUMN `segundoNombre` VARCHAR(191) NULL,
    ADD COLUMN `segundoTelefono` VARCHAR(191) NULL,
    ADD COLUMN `semestre` VARCHAR(191) NULL,
    MODIFY `testActual` VARCHAR(191) NOT NULL DEFAULT '';
