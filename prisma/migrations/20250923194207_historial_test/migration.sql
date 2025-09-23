-- CreateTable
CREATE TABLE `HistorialTest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` VARCHAR(191) NOT NULL,
    `tipoTest` VARCHAR(191) NOT NULL,
    `fechaCompletado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resultados` JSON NOT NULL,

    INDEX `HistorialTest_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HistorialTest` ADD CONSTRAINT `HistorialTest_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `informacionUsuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
