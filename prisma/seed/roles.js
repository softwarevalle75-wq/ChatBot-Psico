import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {

    const practicantes = [
        // IMPORTANTE: EL TELÉFONO NOOOO DEBE TENER ESPACIOS, O NO LO DETECTA COMO VÁLIDO
        //1
        {
            idPracticante: uuidv4(),
            numero_documento: '00000000',
            tipo_documento: 'CC',
            nombre: 'María Del Carmen Corredor Sarmiento',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573125833772',
        },
        //2
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
        //3
        {
            idPracticante: uuidv4(),
            numero_documento: '11111112',
            tipo_documento: 'CC',
            nombre: 'Julian Tulcan',
            genero: 'M',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573222243640',
        },
        //4
        {
            idPracticante: uuidv4(),
            numero_documento: '11111113',
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
        //5
        {
            idPracticante: uuidv4(),
            numero_documento: '11111114',
            tipo_documento: 'CC',
            nombre: 'Jaider Porras',
            genero: 'M',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573014523701',
        },
        //6
        {
            idPracticante: uuidv4(),
            numero_documento: '11111115',
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
        //7
        {
            idPracticante: uuidv4(),
            numero_documento: '11111116',
            tipo_documento: 'CC',
            nombre: 'David Sánchez',
            genero: 'M',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '57321 7230278',
        },
        //8
        {
            idPracticante: uuidv4(),
            numero_documento: '11111117',
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
        //9
        {
            idPracticante: uuidv4(),
            numero_documento: '11111118',
            tipo_documento: 'CC',
            nombre: 'Angela Uribe',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573025270160',
        },
        //10
        {
            idPracticante: uuidv4(),
            numero_documento: '11111119',
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
        //11
        {
            idPracticante: uuidv4(),
            numero_documento: '11111120',
            tipo_documento: 'CC',
            nombre: 'Samuel Montenegro',
            genero: 'M',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573022994218',
        },
        //12
        {
            idPracticante: uuidv4(),
            numero_documento: '11111121',
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
        //13
        {
            idPracticante: uuidv4(),
            numero_documento: '11111122',
            tipo_documento: 'CC',
            nombre: 'Yeimy Paola Rozo Ramos',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573043704552',
        },
        //14
        {
            idPracticante: uuidv4(),
            numero_documento: '11111123',
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
            telefono: '573117510986',
        },
        //15
        {
            idPracticante: uuidv4(),
            numero_documento: '11111124',
            tipo_documento: 'CC',
            nombre: 'Sindy Fiquitiva',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573102308453',
        },
        //16
        {
            idPracticante: uuidv4(),
            numero_documento: '11111125',
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
            telefono: '573168719489',
        },
        //17
        {
            idPracticante: uuidv4(),
            numero_documento: '11111126',
            tipo_documento: 'CC',
            nombre: 'Yirleans Daniela Calvete Coronado',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573132691105',
        },
        //18
        {
            idPracticante: uuidv4(),
            numero_documento: '11111127',
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
        //19
        {
            idPracticante: uuidv4(),
            numero_documento: '11111128',
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
        //20
        {
            idPracticante: uuidv4(),
            numero_documento: '11111129',
            tipo_documento: 'CC',
            nombre: 'Yessi Guzman',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573233216223',
        },
        //21
        {
            idPracticante: uuidv4(),
            numero_documento: '11111130',
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
        //22
        {
            idPracticante: uuidv4(),
            numero_documento: '11111131',
            tipo_documento: 'CC',
            nombre: 'Lizeth Ardila',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573134271402',
        },
        //23
        {
            idPracticante: uuidv4(),
            numero_documento: '11111132',
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
            telefono: '573238126123',
        },
        //24
        {
            idPracticante: uuidv4(),
            numero_documento: '11111133',
            tipo_documento: 'CC',
            nombre: 'Anderson Vargas ',
            genero: 'M',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573209455967',
        },
        //25
        {
            idPracticante: uuidv4(),
            numero_documento: '11111134',
            tipo_documento: 'CC',
            nombre: 'Alejandra Rozo',
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
        //26
        {
            idPracticante: uuidv4(),
            numero_documento: '11111135',
            tipo_documento: 'CC',
            nombre: 'Marleidys Urrutia Mosquera',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573115753174',
        },
        //27
        {
            idPracticante: uuidv4(),
            numero_documento: '11111136',
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
        //28
        {
            idPracticante: uuidv4(),
            numero_documento: '11111137',
            tipo_documento: 'CC',
            nombre: 'Albeiro Rincón',
            genero: 'M',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573219153813',
        },
        //29
        {
            idPracticante: uuidv4(),
            numero_documento: '11111138',
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
        //30
        {
            idPracticante: uuidv4(),
            numero_documento: '11111139',
            tipo_documento: 'CC',
            nombre: 'Catherine Jiménez',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573114792029',
        },
        //31
        {
            idPracticante: uuidv4(),
            numero_documento: '11111140',
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
        //32
        {
            idPracticante: uuidv4(),
            numero_documento: '11111141',
            tipo_documento: 'CC',
            nombre: 'Andrea Valentina Veira Ramos',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573193098508',
        },
        //33
        {
            idPracticante: uuidv4(),
            numero_documento: '11111142',
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
        //34
        {
            idPracticante: uuidv4(),
            numero_documento: '11111143',
            tipo_documento: 'CC',
            nombre: 'Angie Bechara',
            genero: 'F',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573106406637',
        },
        //35
        {
            idPracticante: uuidv4(),
            numero_documento: '11111144',
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
        //36
        {
            idPracticante: uuidv4(),
            numero_documento: '11111145',
            tipo_documento: 'CC',
            nombre: 'Oscar Castañeda',
            genero: 'M',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573103271115',
        },
        //37
        {
            idPracticante: uuidv4(),
            numero_documento: '11111146',
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
        //-
        //Practicante para pruebas
        {
            idPracticante: uuidv4(),
            numero_documento: '22222222',
            tipo_documento: 'CC',
            nombre: 'Practicante para pruebas',
            genero: 'M',
            estrato: '3', 
            barrio: 'Chapinero',
            localidad: 'Chapinero', 
            horario: {
                lunes: "8-10",
                martes: "9-11"
                },
            sesiones: 0, 
            telefono: '573123192484', //agregar telefono
        }

        

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
      telefono: '573212671263',
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