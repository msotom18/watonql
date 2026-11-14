// Actividades con su MET (Compendium of Physical Activities). kcal netas = (MET - 1) × kg × horas
const EXERCISES = [
  ['Caminar tranquilo', 3.0], ['Caminar rápido', 4.3], ['Trotar', 7.0], ['Correr', 9.8],
  ['Saltar la cuerda', 11.0], ['Andar en bici (paseo)', 5.5], ['Andar en bici (intenso)', 8.0],
  ['Bicicleta estática', 6.8], ['Subir escaleras / cerro', 8.0], ['Bailar / carrete', 5.0],
  ['Rutina en casa (peso corporal)', 4.5], ['HIIT / circuito intenso', 8.0], ['Burpees', 8.0],
  ['Jumping jacks', 7.7], ['Sentadillas / zancadas', 5.0], ['Flexiones', 3.8],
  ['Abdominales / plancha', 3.8], ['Yoga', 2.5], ['Pilates', 3.0], ['Estiramientos', 2.3],
  ['Pesas (moderado)', 3.5], ['Pesas (intenso)', 6.0], ['Pichanga / fútbol', 7.0], ['Básquetbol', 6.5],
  ['Natación', 6.0], ['Tenis / pádel', 7.0], ['Boxeo / saco', 7.8], ['Trekking', 6.0],
  ['Limpieza de casa', 3.3], ['Jardinería', 3.8], ['Jugar con niños (activo)', 4.0],
].map(([n, met], i) => ({ id: 'ex' + i, n, met }));

// Cómo se hace cada ejercicio de las rutinas.
// img: fotos de free-exercise-db (dominio público) · textos marcados [MIT]: exercises-dataset (hasaneyldrm, licencia MIT)
const EXINFO = {
  sentadilla: { n: 'Sentadilla', img: 'Bodyweight_Squat', es: 'De pie, pies al ancho de hombros. Baja llevando la cadera hacia atrás como si te sentaras en una silla, espalda recta y rodillas en la dirección de los pies. Baja hasta que los muslos queden paralelos al suelo y sube empujando con los talones.' },
  flexion: { n: 'Flexión de brazos', img: 'Pushups', mit: 1, es: 'Comienza en una posición de plancha alta con las manos un poco más separadas que la anchura de los hombros y los pies juntos. Activa el core y baja el cuerpo hacia el suelo flexionando los codos, manteniendo el cuerpo en línea recta. Haz una pausa cuando el pecho esté justo por encima del suelo y luego empújate de vuelta estirando los brazos. Si cuesta, apoya las rodillas.' },
  zancada: { n: 'Zancada', img: 'Bodyweight_Walking_Lunge', mit: 1, es: 'Ponte de pie con los pies separados a la altura de los hombros. Da un paso adelante, bajando el cuerpo a una posición de zancada. Mantén el torso erguido y la rodilla delantera alineada con el tobillo. Empújate de vuelta y alterna las piernas con un ritmo controlado.' },
  plancha: { n: 'Plancha', img: 'Plank', es: 'Apoya antebrazos y puntas de los pies. Cuerpo en línea recta de la cabeza a los talones, abdomen y glúteos apretados. No dejes caer la cadera y respira normal.' },
  jumping: { n: 'Jumping jacks', img: 'Star_Jump', mit: 1, es: 'Ponte de pie con los pies juntos y los brazos a los costados. Salta, separando los pies y levantando los brazos por encima de la cabeza. Al aterrizar, salta rápidamente de vuelta a la posición inicial.' },
  burpee: { n: 'Burpee', mit: 1, es: 'De pie, baja a una sentadilla y apoya las manos en el suelo. Lleva los pies hacia atrás de un salto hasta la posición de flexión y haz una flexión. Salta con los pies de vuelta a la sentadilla y salta hacia arriba explosivamente con los brazos sobre la cabeza. Aterriza suave y repite.' },
  escalador: { n: 'Escaladores (mountain climbers)', img: 'Mountain_Climbers', mit: 1, es: 'Comienza en plancha alta con las manos bajo los hombros. Lleva la rodilla derecha hacia el pecho y cambia rápidamente a la izquierda, como si corrieras. Mantén las caderas bajas y el core activado.' },
  sent_salto: { n: 'Sentadilla con salto', img: 'Freehand_Jump_Squat', mit: 1, es: 'Pies al ancho de hombros. Baja a una sentadilla empujando las caderas hacia atrás y salta de forma explosiva extendiendo caderas, rodillas y tobillos. Aterriza suavemente sobre la punta de los pies y pasa de inmediato a la siguiente repetición.' },
  skipping: { n: 'Rodillas al pecho (skipping)', img: 'Fast_Skipping', es: 'Trota en el lugar subiendo las rodillas a la altura de la cadera, ayudándote con los brazos. Apoya en la punta de los pies.' },
  puente: { n: 'Puente de glúteo', img: 'Butt_Lift_Bridge', mit: 1, es: 'Acuéstate de espalda con las rodillas flexionadas y los pies apoyados en el suelo, brazos a los lados. Aprieta glúteos y abdomen y eleva la cadera hasta formar una línea recta de rodillas a hombros. Pausa arriba apretando los glúteos y baja lento.' },
  bulgara: { n: 'Sentadilla búlgara', img: 'Split_Squats', es: 'De espaldas a una silla, a un paso largo, apoya el empeine de un pie en el asiento. Baja flexionando la rodilla delantera hasta que el muslo quede casi paralelo al suelo, con el torso recto. Sube empujando con el talón delantero. Haz todas las repeticiones y cambia de pierna.' },
  talones: { n: 'Elevación de talones', mit: 1, es: 'De pie, pies al ancho de hombros y puntas hacia adelante. Apoya las manos en una pared para equilibrarte. Levanta lentamente los talones llevando el peso a la punta de los pies, pausa arriba y baja lento.' },
  fondos: { n: 'Fondos de tríceps en silla', img: 'Bench_Dips', mit: 1, es: 'Siéntate en el borde de una silla firme con las manos sujetando el borde junto a las caderas. Saca los glúteos de la silla con los talones en el suelo. Flexiona los codos y baja el cuerpo, con la espalda cerca de la silla. Empuja de vuelta arriba.' },
  pica: { n: 'Flexión pica (hombros)', es: 'Desde la posición de flexión, sube la cadera formando una V invertida, con la cabeza entre los brazos. Flexiona los codos y baja la cabeza hacia el suelo, luego empuja de vuelta.' },
  remo: { n: 'Remo con mochila', img: 'One-Arm_Dumbbell_Row', es: 'Llena una mochila con libros o botellas de agua. Apoya una mano y una rodilla en una silla o cama, espalda recta. Con la otra mano tira la mochila hacia la cadera, llevando el codo atrás y pegado al cuerpo. Baja controlado.' },
  toque_hombros: { n: 'Plancha con toque de hombros', img: 'Plank', mit: 1, es: 'En plancha alta con las manos bajo los hombros, levanta la mano derecha y toca el hombro izquierdo; vuelve y repite con la otra mano. Mantén caderas y torso estables, sin balancearte.' },
  crunch: { n: 'Crunch abdominal', img: 'Crunches', mit: 1, es: 'Acuéstate de espalda con las rodillas flexionadas y los pies en el suelo, manos detrás de la cabeza. Activa el abdomen y levanta los hombros del suelo hacia las rodillas. Pausa breve y baja lento.' },
  bici_abd: { n: 'Bicicleta abdominal', img: 'Air_Bike', mit: 1, es: 'Acuéstate de espalda con las manos detrás de la cabeza y las piernas en el aire, rodillas a 90°. Lleva el codo derecho hacia la rodilla izquierda mientras estiras la pierna derecha; luego cambia de lado con un movimiento de pedaleo.' },
  elev_piernas: { n: 'Elevación de piernas', img: 'Flat_Bench_Lying_Leg_Raise', es: 'Acuéstate de espalda con las manos bajo los glúteos. Con las piernas estiradas y juntas, súbelas hasta 90° y bájalas lento sin tocar el suelo, con la zona lumbar pegada al piso.' },
  plancha_lat: { n: 'Plancha lateral', img: 'Side_Bridge', mit: 1, es: 'Acuéstate de lado con las piernas estiradas una sobre otra. Apoya el antebrazo bajo el hombro. Levanta la cadera formando una línea recta de la cabeza a los pies y mantén. Repite del otro lado.' },
  marcha: { n: 'Marcha con rodillas altas', img: 'Fast_Skipping', es: 'Marcha en el lugar subiendo las rodillas lo más alto que puedas, sin saltar. Mueve los brazos con energía.' },
  boxeo: { n: 'Golpes de boxeo al aire', es: 'Piernas semiflexionadas y guardia arriba. Lanza golpes rectos alternando brazos, girando levemente el torso. Ritmo rápido y constante, sin trabar los codos.' },
  sent_brazos: { n: 'Sentadilla + brazos arriba', img: 'Bodyweight_Squat', es: 'Haz una sentadilla y al subir estira los brazos por sobre la cabeza. Mantén un ritmo continuo.' },
  paso_lat: { n: 'Paso lateral rápido', es: 'Semiflexionado, da 2-3 pasos laterales rápidos hacia un lado y luego hacia el otro. Si puedes, toca el suelo con la mano al final de cada lado.' },
  talon_gluteo: { n: 'Talones al glúteo', img: 'Single_Leg_Butt_Kick', es: 'Trota en el lugar (o camina rápido si no quieres saltar) llevando los talones hacia los glúteos, alternando.' },
  gato_vaca: { n: 'Gato-vaca', img: 'Cat_Stretch', es: 'En cuatro apoyos: al inhalar hunde la espalda y mira al frente (vaca); al exhalar redondea la espalda y mete la cabeza (gato). Movimiento lento.' },
  nino: { n: 'Postura del niño', img: 'Childs_Pose', es: 'De rodillas, siéntate sobre los talones y estira los brazos al frente apoyando la frente en el suelo. Relaja la espalda y respira profundo.' },
  cuadriceps: { n: 'Estiramiento de cuádriceps', img: 'Quad_Stretch', es: 'De pie, toma un pie por detrás y llévalo hacia el glúteo con las rodillas juntas. Apóyate en una pared si necesitas. Cambia de pierna.' },
  isquio: { n: 'Estiramiento de isquiotibiales', img: 'Seated_Floor_Hamstring_Stretch', es: 'Sentado con las piernas estiradas, inclínate hacia adelante desde la cadera con la espalda recta, intentando alcanzar los pies. Sin rebotes.' },
  estocada_baja: { n: 'Estocada baja (cadera)', img: 'Kneeling_Hip_Flexor', es: 'Apoya una rodilla en el suelo y el otro pie adelante. Empuja la cadera hacia adelante hasta sentir el estiramiento en la parte delantera de la cadera. Cambia de lado.' },
  rotacion: { n: 'Rotación de torso acostado', mit: 1, es: 'Acuéstate de espalda con las rodillas flexionadas y los brazos abiertos en cruz. Con las rodillas juntas, bájalas lentamente hacia un lado, pausa y vuelve al centro. Repite hacia el otro lado.' },
};

// Rutinas en casa sin equipamiento.
// mode 'int': intervalos (work s de trabajo / rest s de descanso por ejercicio) · mode 'reps': rondas de repeticiones con descanso entre rondas
const ROUTINES = [
  {
    id: 'r1', n: 'Full body principiante', min: 20, met: 4.5, emoji: '🧍', mode: 'reps', rounds: 3, rest: 60,
    desc: '3 rondas. Descansa 60 s entre rondas. Si te cuesta, haz menos repeticiones.',
    items: [['12 sentadillas', 'sentadilla'], ['8 flexiones (rodillas apoyadas si hace falta)', 'flexion'], ['10 zancadas por pierna', 'zancada'], ['20 s de plancha', 'plancha'], ['20 jumping jacks', 'jumping']],
  },
  {
    id: 'r2', n: 'HIIT quema grasa', min: 15, met: 8.0, emoji: '🔥', mode: 'int', work: 40, rest: 20, rounds: 3,
    desc: '40 s de trabajo / 20 s de descanso por ejercicio. 3 rondas. Ve a tope en los 40 s.',
    items: [['Burpees', 'burpee'], ['Escaladores', 'escalador'], ['Sentadilla con salto', 'sent_salto'], ['Jumping jacks', 'jumping'], ['Rodillas al pecho', 'skipping']],
  },
  {
    id: 'r3', n: 'Piernas y glúteos', min: 25, met: 5.0, emoji: '🦵', mode: 'reps', rounds: 4, rest: 60,
    desc: '4 rondas. Descansa 60 s entre rondas. Controla la bajada.',
    items: [['15 sentadillas', 'sentadilla'], ['12 zancadas por pierna', 'zancada'], ['15 puentes de glúteo', 'puente'], ['10 sentadillas búlgaras por pierna', 'bulgara'], ['20 elevaciones de talones', 'talones']],
  },
  {
    id: 'r4', n: 'Tren superior', min: 20, met: 4.5, emoji: '💪', mode: 'reps', rounds: 4, rest: 60,
    desc: '4 rondas. Descansa 60 s entre rondas. Usa una mochila con libros como peso.',
    items: [['10 flexiones', 'flexion'], ['10 fondos de tríceps en silla', 'fondos'], ['8 flexiones pica', 'pica'], ['12 remos con mochila por brazo', 'remo'], ['30 s de plancha tocando hombros', 'toque_hombros']],
  },
  {
    id: 'r5', n: 'Core / abdomen', min: 15, met: 3.8, emoji: '🎯', mode: 'int', work: 40, rest: 20, rounds: 3,
    desc: '40 s de trabajo / 20 s de descanso. 3 rondas.',
    items: [['Plancha', 'plancha'], ['Crunch abdominal', 'crunch'], ['Bicicleta abdominal', 'bici_abd'], ['Elevación de piernas', 'elev_piernas'], ['Plancha lateral (20 s por lado)', 'plancha_lat']],
  },
  {
    id: 'r6', n: 'Cardio sin saltos', min: 20, met: 5.0, emoji: '🤫', mode: 'int', work: 45, rest: 15, rounds: 4,
    desc: '45 s de trabajo / 15 s de descanso. 4 rondas. Sin impacto, no molesta a los vecinos.',
    items: [['Marcha con rodillas altas', 'marcha'], ['Golpes de boxeo al aire', 'boxeo'], ['Sentadilla + brazos arriba', 'sent_brazos'], ['Paso lateral rápido', 'paso_lat'], ['Talones al glúteo caminando', 'talon_gluteo']],
  },
  {
    id: 'r7', n: 'Movilidad y estiramiento', min: 10, met: 2.3, emoji: '🧘', mode: 'int', work: 40, rest: 10, rounds: 2,
    desc: 'Ideal para días de descanso o después de entrenar. 40 s por posición, 2 vueltas (cambia de lado en la segunda).',
    items: [['Gato-vaca', 'gato_vaca'], ['Postura del niño', 'nino'], ['Estiramiento de cuádriceps', 'cuadriceps'], ['Isquiotibiales sentado', 'isquio'], ['Estocada baja', 'estocada_baja'], ['Rotación de torso acostado', 'rotacion']],
  },
];
