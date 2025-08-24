import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {

    const practicantes = [
        {
            idPracticante: uuidv4(),
            numero_documento: '1031651700',
            tipo_documento: 'CC',
            nombre: 'Mercho',
            genero: 'M',
            estrato: '3', 
            barrio: 'Suba',
            localidad: 'Suba', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573153340800',
        }
    ]
    await prisma.practicante.createMany({
    data: practicantes,
    skipDuplicates: true
  });

//-------------------------------------------------------------------------------------------------------------------------------------------
  const admins = [
    {
      telefono: '573183644600',
      rol: 'admin',
      updatedAt: new Date(),
    }
  ]
    await prisma.rolChat.createMany({
      data: admins,
      skipDuplicates: true
    });


}

main()
  .catch((e) => {
    console.error("Error en categorías:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });