-- CreateTable
CREATE TABLE `informacionUsuario` (
    `idUsuario` VARCHAR(191) NOT NULL,
    `primerNombre` VARCHAR(191) NOT NULL,
    `segundoNombre` VARCHAR(191) NULL,
    `primerApellido` VARCHAR(191) NOT NULL,
    `segundoApellido` VARCHAR(191) NULL,
    `telefonoPersonal` VARCHAR(191) NOT NULL,
    `segundoTelefono` VARCHAR(191) NULL,
    `correo` VARCHAR(191) NOT NULL,
    `segundoCorreo` VARCHAR(191) NULL,
    `fechaNacimiento` DATETIME(3) NOT NULL,
    `perteneceUniversidad` BOOLEAN NOT NULL DEFAULT false,
    `semestre` VARCHAR(191) NULL,
    `jornada` VARCHAR(191) NULL,
    `carrera` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `consentimientoInformado` BOOLEAN NOT NULL DEFAULT false,
    `autorizacionDatos` BOOLEAN NOT NULL DEFAULT false,
    `ayudaPsicologica` VARCHAR(191) NULL,
    `flujo` VARCHAR(191) NULL,
    `historial` JSON NULL,
    `testActual` VARCHAR(191) NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `informacionUsuario_telefonoPersonal_key`(`telefonoPersonal`),
    UNIQUE INDEX `informacionUsuario_correo_key`(`correo`),
    PRIMARY KEY (`idUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `ghq12` (
    `idGhq12` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `historial` JSON NULL,
    `Puntaje` INTEGER NOT NULL DEFAULT 0,
    `preguntaActual` INTEGER NOT NULL DEFAULT 0,
    `resPreg` JSON NULL,

    UNIQUE INDEX `ghq12_idGhq12_key`(`idGhq12`),
    UNIQUE INDEX `ghq12_telefono_key`(`telefono`),
    PRIMARY KEY (`idGhq12`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dass21` (
    `idDass21` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `historial` JSON NULL,
    `puntajeDep` INTEGER NOT NULL DEFAULT 0,
    `puntajeAns` INTEGER NOT NULL DEFAULT 0,
    `puntajeEstr` INTEGER NOT NULL DEFAULT 0,
    `preguntaActual` INTEGER NOT NULL DEFAULT 0,
    `resPreg` JSON NULL,
    `respuestas` JSON NULL,

    UNIQUE INDEX `dass21_idDass21_key`(`idDass21`),
    UNIQUE INDEX `dass21_telefono_key`(`telefono`),
    PRIMARY KEY (`idDass21`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tests` (
    `idTests` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `tratDatos` VARCHAR(191) NOT NULL DEFAULT '',
    `historial` JSON NULL,
    `Puntaje` INTEGER NOT NULL DEFAULT 0,
    `preguntaActual` INTEGER NOT NULL DEFAULT 0,
    `resPreg` JSON NULL,

    UNIQUE INDEX `tests_idTests_key`(`idTests`),
    UNIQUE INDEX `tests_telefono_key`(`telefono`),
    PRIMARY KEY (`idTests`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultorio` (
    `idConsultorio` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `consultorio_idConsultorio_key`(`idConsultorio`),
    PRIMARY KEY (`idConsultorio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `practicante` (
    `idPracticante` VARCHAR(191) NOT NULL,
    `numero_documento` VARCHAR(191) NOT NULL,
    `tipo_documento` VARCHAR(191) NOT NULL DEFAULT 'CC',
    `nombre` VARCHAR(191) NOT NULL,
    `genero` VARCHAR(191) NOT NULL,
    `estrato` VARCHAR(191) NOT NULL,
    `barrio` VARCHAR(191) NOT NULL,
    `localidad` VARCHAR(191) NOT NULL,
    `sesiones` INTEGER NOT NULL DEFAULT 0,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `telefono` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `practicante_idPracticante_key`(`idPracticante`),
    UNIQUE INDEX `practicante_numero_documento_key`(`numero_documento`),
    UNIQUE INDEX `practicante_telefono_key`(`telefono`),
    PRIMARY KEY (`idPracticante`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Horario` (
    `id` VARCHAR(191) NOT NULL,
    `dia` ENUM('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO') NOT NULL,
    `horaInicio` INT NOT NULL,
    `horaFin` INT NOT NULL,
    `practicanteId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rolChat` (
    `telefono` VARCHAR(191) NOT NULL,
    `rol` ENUM('usuario', 'practicante', 'admin') NOT NULL DEFAULT 'usuario',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rolChat_telefono_key`(`telefono`),
    PRIMARY KEY (`telefono`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cita` (
    `idCita` VARCHAR(191) NOT NULL,
    `idConsultorio` VARCHAR(191) NOT NULL,
    `idUsuario` VARCHAR(191) NOT NULL,
    `idPracticante` VARCHAR(191) NOT NULL,
    `fechaHora` DATETIME(3) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'pendiente',
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cita_idCita_key`(`idCita`),
    PRIMARY KEY (`idCita`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registroCitas` (
    `idCita` VARCHAR(191) NOT NULL,
    `idConsultorio` VARCHAR(191) NOT NULL,
    `idUsuario` VARCHAR(191) NOT NULL,
    `idPracticante` VARCHAR(191) NOT NULL,
    `fechaHora` DATETIME(3) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'pendiente',
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `registroCitas_idCita_key`(`idCita`),
    PRIMARY KEY (`idCita`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `informacion_sociodemografica` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `estadoCivil` ENUM('soltero', 'casado', 'union_libre', 'divorciado', 'viudo', 'separado') NOT NULL,
    `numeroHijos` INTEGER NOT NULL DEFAULT 0,
    `numeroHermanos` INTEGER NOT NULL DEFAULT 0,
    `conQuienVive` VARCHAR(191) NOT NULL,
    `tienePersonasACargo` BOOLEAN NOT NULL DEFAULT false,
    `rolFamiliar` ENUM('madre', 'padre', 'hijo', 'hermano', 'abuelo', 'nieto', 'tio', 'sobrino', 'otro') NOT NULL,
    `escolaridad` ENUM('primaria_incompleta', 'primaria_completa', 'secundaria_incompleta', 'secundaria_completa', 'tecnico_incompleto', 'tecnico_completo', 'universitario_incompleto', 'universitario_completo', 'posgrado_incompleto', 'posgrado_completo') NOT NULL,
    `ocupacion` VARCHAR(191) NOT NULL,
    `nivelIngresos` ENUM('nivel_0_1_smmlv', 'nivel_1_2_smmlv', 'nivel_2_3_smmlv', 'nivel_3_4_smmlv', 'mayor_4_smmlv') NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `informacion_sociodemografica_usuarioId_key`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HistorialTest` ADD CONSTRAINT `HistorialTest_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `informacionUsuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ghq12` ADD CONSTRAINT `ghq12_telefono_fkey` FOREIGN KEY (`telefono`) REFERENCES `informacionUsuario`(`telefonoPersonal`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dass21` ADD CONSTRAINT `dass21_telefono_fkey` FOREIGN KEY (`telefono`) REFERENCES `informacionUsuario`(`telefonoPersonal`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tests` ADD CONSTRAINT `tests_telefono_fkey` FOREIGN KEY (`telefono`) REFERENCES `informacionUsuario`(`telefonoPersonal`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Horario` ADD CONSTRAINT `Horario_practicanteId_fkey` FOREIGN KEY (`practicanteId`) REFERENCES `practicante`(`idPracticante`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cita` ADD CONSTRAINT `cita_idConsultorio_fkey` FOREIGN KEY (`idConsultorio`) REFERENCES `consultorio`(`idConsultorio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cita` ADD CONSTRAINT `cita_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `informacionUsuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cita` ADD CONSTRAINT `cita_idPracticante_fkey` FOREIGN KEY (`idPracticante`) REFERENCES `practicante`(`idPracticante`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registroCitas` ADD CONSTRAINT `registroCitas_idConsultorio_fkey` FOREIGN KEY (`idConsultorio`) REFERENCES `consultorio`(`idConsultorio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registroCitas` ADD CONSTRAINT `registroCitas_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `informacionUsuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registroCitas` ADD CONSTRAINT `registroCitas_idPracticante_fkey` FOREIGN KEY (`idPracticante`) REFERENCES `practicante`(`idPracticante`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `informacion_sociodemografica` ADD CONSTRAINT `informacion_sociodemografica_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `informacionUsuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;
