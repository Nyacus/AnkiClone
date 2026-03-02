export const vocabularyPairs = [
  { en: "Happy", es: "Feliz" },
  { en: "Proud", es: "Orgulloso" },
  { en: "Confident", es: "seguro de si mismo" },
  { en: "Worried", es: "Preocupado" },
  { en: "Sad", es: "Triste" },
  { en: "Angry", es: "Enfadado" },
  { en: "Jealous", es: "Celoso" },
  { en: "Annoyed", es: "Molesto" },
  { en: "Surprised", es: "Sorprendido" },
  { en: "Embarrassed", es: "Avergonzado" },
  { en: "Tired", es: "Cansado" },
  { en: "Disappointed", es: "Decepcionado" },
  { en: "Bored", es: "Aburrido" },
  { en: "Hungry", es: "hambriento" },
  { en: "Thirsty", es: "Sediento" },
  { en: "Scared", es: "Asustado" },
  { en: "Sick", es: "Enfermo" },
  { en: "Shy", es: "vergonzoso" },
  { en: "Brave", es: "Valiente" },
  { en: "Serious", es: "Serio" },
  { en: "Helpful", es: "servicial" },
  { en: "Shy", es: "Tímido" },
  { en: "Selfish", es: "Egoísta" },
  { en: "Trustworthy", es: "Fiable" },
  { en: "Stubborn", es: "cabezon" },
  { en: "Mean", es: "tacaño" },
  { en: "Grumpy", es: "Gruñón" },
  { en: "Bad-tempered", es: "De mal carácter" },
  { en: "Charming", es: "Encantador" },
  { en: "Forgetful", es: "Despistado" },
  { en: "Quiet", es: "Callado" },
  { en: "Reliable", es: "Fiable" },
  { en: "Talkative", es: "Hablador" },
  { en: "Two-faced", es: "falso" },
  { en: "Friendly", es: "Amable" },
  { en: "Unfriendly", es: "Antipático" },
  { en: "Generous", es: "Generoso" },
  { en: "Open-minded", es: "De mente abierta" },
  { en: "Narrow-minded", es: "De mente cerrada" },
  { en: "Lazy", es: "Vago" },
  { en: "Polite", es: "Educado" },
  { en: "Smart", es: "Listo" },
  { en: "Funny", es: "Divertido" },
  { en: "Clever", es: "inteligente" },
  { en: "Sensible", es: "Sensato" },
  { en: "Sensitive", es: "sensible" },
  { en: "Messy", es: "Desordenado" },
  { en: "Hard-working", es: "Trabajador" },
  { en: "Patient", es: "Paciente" }
];

export const generateTsv = () => {
  let tsv = "Front\tBack\tDirection\tTag\n";
  vocabularyPairs.forEach(pair => {
    tsv += `${pair.en}\t${pair.es}\tEN->ES\tvocab\n`;
    tsv += `${pair.es}\t${pair.en}\tES->EN\tvocab\n`;
  });
  return tsv;
};
