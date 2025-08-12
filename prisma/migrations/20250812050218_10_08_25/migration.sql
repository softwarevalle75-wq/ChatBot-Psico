-- CreateTable
CREATE TABLE `dass21` (
    `idDass21` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `historial` JSON NULL,
    `Puntaje` INTEGER NOT NULL DEFAULT 0,
    `preguntaActual` INTEGER NOT NULL DEFAULT 0,
    `resPreg` JSON NULL,
    `respuestas` JSON NULL,

    UNIQUE INDEX `dass21_idDass21_key`(`idDass21`),
    UNIQUE INDEX `dass21_telefono_key`(`telefono`),
    PRIMARY KEY (`idDass21`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dass21` ADD CONSTRAINT `dass21_telefono_fkey` FOREIGN KEY (`telefono`) REFERENCES `informacionUsuario`(`telefonoPersonal`) ON DELETE RESTRICT ON UPDATE CASCADE;
