-- AlterTable
ALTER TABLE `informacionusuario` ADD COLUMN `estado` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isAuthenticated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sesion` INTEGER NOT NULL DEFAULT 0;
