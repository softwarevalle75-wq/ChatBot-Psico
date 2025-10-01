-- CreateTable
CREATE TABLE `informacion_sociodemografica` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `estadoCivil` ENUM('soltero', 'casado', 'union_libre', 'divorciado', 'viudo', 'separado') NOT NULL,
    `numeroHijos` INTEGER NOT NULL DEFAULT 0,
    `numeroHermanos` INTEGER NOT NULL DEFAULT 0,
    `conQuienVive` VARCHAR(500) NOT NULL,
    `tienePersonasACargo` BOOLEAN NOT NULL DEFAULT false,
    `rolFamiliar` ENUM('madre', 'padre', 'hijo', 'hermano', 'abuelo', 'nieto', 'tio', 'sobrino', 'otro') NOT NULL,
    `escolaridad` ENUM('primaria_incompleta', 'primaria_completa', 'secundaria_incompleta', 'secundaria_completa', 'tecnico_incompleto', 'tecnico_completo', 'universitario_incompleto', 'universitario_completo', 'posgrado_incompleto', 'posgrado_completo') NOT NULL,
    `ocupacion` VARCHAR(200) NOT NULL,
    `nivelIngresos` ENUM('0_1_smmlv', '1_2_smmlv', '2_3_smmlv', '3_4_smmlv', 'mayor_4_smmlv') NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `informacion_sociodemografica_usuarioId_key`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `informacion_sociodemografica` ADD CONSTRAINT `informacion_sociodemografica_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `informacionUsuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;
