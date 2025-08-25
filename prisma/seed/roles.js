import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {

    const practicantes = [
        {
            idPracticante: uuidv4(),
            numero_documento: '1111111',
            tipo_documento: 'CC',
            nombre: 'Astrid Rincon',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573235796364',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111112',
            tipo_documento: 'CC',
            nombre: 'Geraldine Carrero',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573213431364',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111113',
            tipo_documento: 'CC',
            nombre: 'Ximena Rodríguez Murcia',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573142143156',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111114',
            tipo_documento: 'CC',
            nombre: 'Andrea Garcia ',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573052797485',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111115',
            tipo_documento: 'CC',
            nombre: 'Daniela Vacarez ',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573013953828',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111116',
            tipo_documento: 'CC',
            nombre: 'Mirley Polo Silgado ',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573204265870',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111117',
            tipo_documento: 'CC',
            nombre: 'Stiven Andrés Patarroyo Caballero',
            genero: 'M',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '57311 7510986',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111118',
            tipo_documento: 'CC',
            nombre: 'Jhasbleidy Lorena Chapetón Martínez',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '57316 8719489',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111119',
            tipo_documento: 'CC',
            nombre: 'Lady Viviana Colorado Sánchez',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573118589148',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111120',
            tipo_documento: 'CC',
            nombre: 'Saira Viviana Cárdenas Guzmán',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573103005906',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111121',
            tipo_documento: 'CC',
            nombre: 'Andres Santamaria ',
            genero: 'M',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573018762357',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111122',
            tipo_documento: 'CC',
            nombre: 'John Anderson Muñoz Torres',
            genero: 'M',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '57323 8126123',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111123',
            tipo_documento: 'CC',
            nombre: 'Alejandra Rozo ',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573104391217',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111124',
            tipo_documento: 'CC',
            nombre: 'Magalis Soto',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573017651977',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111125',
            tipo_documento: 'CC',
            nombre: 'Alejandra Prieto ',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573059463331',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111126',
            tipo_documento: 'CC',
            nombre: 'Brenda Catalina León Velasquez ',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573213655112',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111127',
            tipo_documento: 'CC',
            nombre: 'Jeiner Velasco Valencia ',
            genero: 'M',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573208270674',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111128',
            tipo_documento: 'CC',
            nombre: 'Ledy Viviana Colorado Sanchez',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573118589148',
        },
        {
            idPracticante: uuidv4(),
            numero_documento: '11111129',
            tipo_documento: 'CC',
            nombre: 'Karol Vega Moreno',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573132329504',
        },
        
        

    ]
    await prisma.practicante.createMany({
      data: practicantes,
      skipDuplicates: true,
    });

    await prisma.rolChat.createMany({
      data: practicantes.map(p => ({
        telefono: p.telefono,
        rol: 'practicante',
        updatedAt: new Date(),
      })),
      skipDuplicates: true,
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
      skipDuplicates: true,
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