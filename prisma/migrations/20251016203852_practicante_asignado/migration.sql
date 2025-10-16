-- DropIndex
DROP INDEX `informacionUsuario_correo_key` ON `informacionusuario`;

-- AlterTable
ALTER TABLE `informacionusuario` ADD COLUMN `practicanteAsignado` VARCHAR(191) NULL;
