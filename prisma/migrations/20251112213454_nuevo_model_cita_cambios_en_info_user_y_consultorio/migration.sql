-- AlterTable
ALTER TABLE `cita` ALTER COLUMN `fechaHora` DROP DEFAULT;

-- AlterTable
ALTER TABLE `informacion_sociodemografica` ALTER COLUMN `fechaActualizacion` DROP DEFAULT;

-- AlterTable
ALTER TABLE `informacionusuario` ALTER COLUMN `fechaActualizacion` DROP DEFAULT;

-- AlterTable
ALTER TABLE `registrocitas` ALTER COLUMN `fechaHora` DROP DEFAULT;

-- AlterTable
ALTER TABLE `rolchat` ALTER COLUMN `updatedAt` DROP DEFAULT;
