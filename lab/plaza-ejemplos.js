/* ==========================================================================
   PLAZA — VITRINAS DE EJEMPLO

   Nueve negocios inventados para poder ver y probar el motor de la Plaza
   antes de que exista una sola vitrina real.

   VIVE EN lab/ A PROPÓSITO Y NO EN js/data/.
   index.html no lo carga, el service worker no lo precachea y la app no
   sabe que existe. Si algún día alguien lo mueve a js/data/, la Plaza
   pasaría a tener vecinos falsos — y esa es exactamente la línea que este
   proyecto no cruza: la Liga puede permitirse rivales simulados porque ahí
   lo que está en juego son puntos, pero aquí el botón dice "Veo valor" y un
   vecino que nunca contesta sería una mentira.

   Lo usan dos cosas, las dos fuera de la app:
     · lab/plaza.html          — la vista previa para decidir por sensación
     · tools/check-motor.js    — las pruebas del motor

   Están escritos con la forma exacta de una vitrina de verdad
   (js/core/plaza.js, CAMPOS), para que lo que se vea aquí sea lo que se
   vería allí. Y con los defectos de una de verdad: uno sin nombre, uno sin
   problema, uno a medio llenar.
   ========================================================================== */
(function (raiz) {
  'use strict';

  /* Cada uno con su puesto decorado. La app nunca carga este archivo, así que
     esto no es "decoración inventada de un vecino": es la única forma de ver
     cómo queda una plaza con puestos distintos antes de que haya gente. */
  var EJEMPLOS = [
    {
      id: 'ej-cafe',
      negocio: 'Café Raíz',
      producto: 'cafetería de barrio con mesas grandes para quedarse a trabajar',
      idea: 'una cafetería donde la gente pueda quedarse a trabajar sin prisa',
      cliente: 'gente que trabaja desde su laptop y no quiere estar en su casa',
      problema: 'Trabajar desde casa aísla y las cafeterías te apuran para que te vayas',
      valor: 'Un lugar donde puedes quedarte toda la tarde sin sentirte incómodo',
      sector: 'comida',
      etapa: 'operating',
      estilo: { toldo: 'rayas',   color: 'oficio', letrero: 'tabla',   adorno: 'macetas',    suelo: 'tarima' }
    },
    {
      id: 'ej-nido',
      negocio: 'Nido Interiores',
      producto: 'asesoría para decorar departamentos rentados sin hacer obra',
      idea: 'ayudar a que un departamento rentado se sienta propio',
      cliente: 'gente joven que renta departamento y quiere que se sienta suyo',
      problema: 'En un departamento rentado no puedes clavar, pintar ni modificar nada',
      valor: 'Tu casa se siente tuya aunque no sea tuya',
      sector: 'servicios',
      etapa: 'starting',
      estilo: { toldo: 'lona',    color: 'menta',  letrero: 'placa',   adorno: 'ninguno',    suelo: 'tapete' }
    },
    {
      id: 'ej-marca',
      negocio: 'Marca Chica',
      producto: 'diseño de logo e identidad para negocios que están empezando',
      idea: 'que un negocio pequeño se vea serio desde el primer día',
      cliente: 'negocios pequeños y emprendedores que apenas arrancan',
      problema: 'Un negocio nuevo se ve improvisado y por eso le compran menos',
      valor: 'Te ven como un negocio de verdad desde el primer día',
      sector: 'digital',
      etapa: 'operating',
      estilo: { toldo: 'picos',   color: 'indigo', letrero: 'ninguno', adorno: 'banderines', suelo: 'ninguno' }
    },
    {
      id: 'ej-empaque',
      negocio: 'Empaques Nube',
      producto: 'cajas y etiquetas personalizadas para productos hechos a mano',
      idea: 'empaque bonito en cantidades chicas, sin pedir mil piezas',
      cliente: 'negocios pequeños que venden productos y necesitan empaque',
      problema: 'Los proveedores de empaque piden pedidos enormes que un negocio chico no puede',
      valor: 'Empaque que se ve caro en cantidades que sí puedes pagar',
      sector: 'reventa',
      etapa: 'operating',
      estilo: { toldo: 'cuadros', color: 'oceano', letrero: 'ninguno', adorno: 'cajas',      suelo: 'adoquin' }
    },
    {
      id: 'ej-velas',
      negocio: 'Velas Aura',
      producto: 'velas de soya con aromas para la casa',
      idea: 'velas naturales que huelen a algo que recuerdas',
      cliente: 'gente que decora su casa y le gusta que huela rico',
      problema: 'Las velas baratas huelen a químico y las buenas cuestan carísimo',
      valor: 'Una vela que huele bien de verdad y dura',
      sector: 'hechoamano',
      etapa: 'starting',
      estilo: { toldo: 'ondas',   color: 'uva',    letrero: 'cinta',   adorno: 'farol',      suelo: 'ninguno' }
    },
    {
      id: 'ej-madero',
      negocio: 'Taller Madero',
      producto: 'muebles pequeños de madera para espacios chicos',
      idea: 'muebles que caben en un departamento pequeño',
      cliente: 'gente que renta departamento chico y no tiene dónde poner nada',
      problema: 'Los muebles normales no caben en un departamento pequeño',
      valor: 'Muebles hechos a la medida de tu espacio',
      sector: 'hechoamano',
      etapa: 'idea',
      estilo: { toldo: 'feston',  color: 'miel',   letrero: 'tabla',   adorno: 'ninguno',    suelo: 'tarima' }
    },
    {
      id: 'ej-postres',
      negocio: 'Postres Lila',
      producto: 'postres por encargo para fiestas y eventos familiares',
      idea: 'postres caseros para cumpleaños sin tener que hornear',
      cliente: 'familias que organizan cumpleaños y bautizos',
      problema: 'Organizar una fiesta es agotador y el postre siempre queda al final',
      valor: 'Un postre que se ve hecho en casa sin que tengas que hacerlo',
      sector: 'comida',
      etapa: 'starting',
      estilo: { toldo: 'rayas',   color: 'cereza', letrero: 'pizarra', adorno: 'pizarron',   suelo: 'ninguno' }
    },
    {
      id: 'ej-ruta',
      negocio: 'Ruta Fácil',
      producto: 'sistema de inventario para tiendas pequeñas',
      idea: 'saber qué tienes y qué te falta sin llevar cuadernos',
      cliente: 'tiendas y negocios pequeños con inventario',
      problema: 'Los negocios chicos no saben qué tienen y compran de más',
      valor: 'Dejas de comprar lo que ya tenías',
      sector: 'digital',
      etapa: 'growing',
      estilo: { toldo: 'lona',    color: 'bosque', letrero: 'ninguno', adorno: 'girasoles',  suelo: 'pasto' }
    },
    {
      /* A propósito incompleto: sin nombre y sin problema. Sirve para
         comprobar que una vitrina floja no sostiene un motivo fuerte y que
         la pantalla no se rompe cuando falta la mitad. */
      id: 'ej-flojo',
      negocio: '',
      producto: 'playeras estampadas',
      idea: 'playeras con frases',
      cliente: 'jóvenes',
      problema: '',
      valor: '',
      sector: 'hechoamano',
      etapa: 'idea'
    }
  ];

  /* La vitrina desde la que se mira la Plaza en la vista previa. Es la misma
     que se usa de ejemplo en toda la documentación del proyecto. */
  var YO = {
    id: 'ej-yo',
    negocio: 'Luz de Barro',
    producto: 'lámparas de cerámica hechas a mano para departamentos pequeños',
    idea: 'lámparas de cerámica hechas a mano',
    cliente: 'gente de 25 a 40 años que renta departamento y quiere que su espacio se sienta suyo',
    problema: 'Los departamentos rentados se sienten fríos y no se pueden modificar',
    valor: 'Que su casa se sienta suya sin hacer obra',
    sector: 'hechoamano',
    etapa: 'starting'
  };

  raiz.PLAZA_EJEMPLOS = { lista: EJEMPLOS, yo: YO };
})(typeof window !== 'undefined' ? window : this);
