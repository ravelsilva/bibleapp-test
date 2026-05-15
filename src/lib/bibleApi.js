/**
 * VerbumFlame - Bible API (Offline Only)
 * Versões: ACF, NVI, NAA, NTLH
 */

export const VERSIONS = [
  { id: "acf", name: "ACF", fullName: "Almeida Corrigida Fiel" },
  { id: "arc", name: "ARC", fullName: "Almeida Revista e Corrigida" },
  { id: "kjf", name: "KJF", fullName: "King James Fiel 2000" },
  { id: "nvi", name: "NVI", fullName: "Nova Versão Internacional" },
  { id: "naa", name: "NAA", fullName: "Nova Almeida Atualizada" },
  { id: "ntlh", name: "NTLH", fullName: "Nova Tradução na Linguagem de Hoje" },
];

export const BIBLE_BOOKS = [
  // Antigo Testamento
  { id: "gn", name: "Gênesis", abbrev: "Gn", testament: "AT", chapters: 50 },
  { id: "ex", name: "Êxodo", abbrev: "Êx", testament: "AT", chapters: 40 },
  { id: "lv", name: "Levítico", abbrev: "Lv", testament: "AT", chapters: 27 },
  { id: "nm", name: "Números", abbrev: "Nm", testament: "AT", chapters: 36 },
  { id: "dt", name: "Deuteronômio", abbrev: "Dt", testament: "AT", chapters: 34 },
  { id: "js", name: "Josué", abbrev: "Js", testament: "AT", chapters: 24 },
  { id: "jz", name: "Juízes", abbrev: "Jz", testament: "AT", chapters: 21 },
  { id: "rt", name: "Rute", abbrev: "Rt", testament: "AT", chapters: 4 },
  { id: "1sm", name: "1 Samuel", abbrev: "1Sm", testament: "AT", chapters: 31 },
  { id: "2sm", name: "2 Samuel", abbrev: "2Sm", testament: "AT", chapters: 24 },
  { id: "1rs", name: "1 Reis", abbrev: "1Rs", testament: "AT", chapters: 22 },
  { id: "2rs", name: "2 Reis", abbrev: "2Rs", testament: "AT", chapters: 25 },
  { id: "1cr", name: "1 Crônicas", abbrev: "1Cr", testament: "AT", chapters: 29 },
  { id: "2cr", name: "2 Crônicas", abbrev: "2Cr", testament: "AT", chapters: 36 },
  { id: "ed", name: "Esdras", abbrev: "Ed", testament: "AT", chapters: 10 },
  { id: "ne", name: "Neemias", abbrev: "Ne", testament: "AT", chapters: 13 },
  { id: "et", name: "Ester", abbrev: "Et", testament: "AT", chapters: 10 },
  { id: "job", name: "Jó", abbrev: "Jó", testament: "AT", chapters: 42 },
  { id: "sl", name: "Salmos", abbrev: "Sl", testament: "AT", chapters: 150 },
  { id: "pv", name: "Provérbios", abbrev: "Pv", testament: "AT", chapters: 31 },
  { id: "ec", name: "Eclesiastes", abbrev: "Ec", testament: "AT", chapters: 12 },
  { id: "ct", name: "Cantares", abbrev: "Ct", testament: "AT", chapters: 8 },
  { id: "is", name: "Isaías", abbrev: "Is", testament: "AT", chapters: 66 },
  { id: "jr", name: "Jeremias", abbrev: "Jr", testament: "AT", chapters: 52 },
  { id: "lm", name: "Lamentações", abbrev: "Lm", testament: "AT", chapters: 5 },
  { id: "ez", name: "Ezequiel", abbrev: "Ez", testament: "AT", chapters: 48 },
  { id: "dn", name: "Daniel", abbrev: "Dn", testament: "AT", chapters: 12 },
  { id: "os", name: "Oséias", abbrev: "Os", testament: "AT", chapters: 14 },
  { id: "jl", name: "Joel", abbrev: "Jl", testament: "AT", chapters: 3 },
  { id: "am", name: "Amós", abbrev: "Am", testament: "AT", chapters: 9 },
  { id: "ob", name: "Obadias", abbrev: "Ob", testament: "AT", chapters: 1 },
  { id: "jn", name: "Jonas", abbrev: "Jn", testament: "AT", chapters: 4 },
  { id: "mq", name: "Miquéias", abbrev: "Mq", testament: "AT", chapters: 7 },
  { id: "na", name: "Naum", abbrev: "Na", testament: "AT", chapters: 3 },
  { id: "hc", name: "Habacuque", abbrev: "Hc", testament: "AT", chapters: 3 },
  { id: "sf", name: "Sofonias", abbrev: "Sf", testament: "AT", chapters: 3 },
  { id: "ag", name: "Ageu", abbrev: "Ag", testament: "AT", chapters: 2 },
  { id: "zc", name: "Zacarias", abbrev: "Zc", testament: "AT", chapters: 14 },
  { id: "ml", name: "Malaquias", abbrev: "Ml", testament: "AT", chapters: 4 },
  // Novo Testamento
  { id: "mt", name: "Mateus", abbrev: "Mt", testament: "NT", chapters: 28 },
  { id: "mc", name: "Marcos", abbrev: "Mc", testament: "NT", chapters: 16 },
  { id: "lc", name: "Lucas", abbrev: "Lc", testament: "NT", chapters: 24 },
  { id: "jo", name: "João", abbrev: "Jo", testament: "NT", chapters: 21 },
  { id: "at", name: "Atos", abbrev: "At", testament: "NT", chapters: 28 },
  { id: "rm", name: "Romanos", abbrev: "Rm", testament: "NT", chapters: 16 },
  { id: "1co", name: "1 Coríntios", abbrev: "1Co", testament: "NT", chapters: 16 },
  { id: "2co", name: "2 Coríntios", abbrev: "2Co", testament: "NT", chapters: 13 },
  { id: "gl", name: "Gálatas", abbrev: "Gl", testament: "NT", chapters: 6 },
  { id: "ef", name: "Efésios", abbrev: "Ef", testament: "NT", chapters: 6 },
  { id: "fp", name: "Filipenses", abbrev: "Fp", testament: "NT", chapters: 4 },
  { id: "cl", name: "Colossenses", abbrev: "Cl", testament: "NT", chapters: 4 },
  { id: "1ts", name: "1 Tessalonicenses", abbrev: "1Ts", testament: "NT", chapters: 5 },
  { id: "2ts", name: "2 Tessalonicenses", abbrev: "2Ts", testament: "NT", chapters: 3 },
  { id: "1tm", name: "1 Timóteo", abbrev: "1Tm", testament: "NT", chapters: 6 },
  { id: "2tm", name: "2 Timóteo", abbrev: "2Tm", testament: "NT", chapters: 4 },
  { id: "tt", name: "Tito", abbrev: "Tt", testament: "NT", chapters: 3 },
  { id: "fm", name: "Filemom", abbrev: "Fm", testament: "NT", chapters: 1 },
  { id: "hb", name: "Hebreus", abbrev: "Hb", testament: "NT", chapters: 13 },
  { id: "tg", name: "Tiago", abbrev: "Tg", testament: "NT", chapters: 5 },
  { id: "1pe", name: "1 Pedro", abbrev: "1Pe", testament: "NT", chapters: 5 },
  { id: "2pe", name: "2 Pedro", abbrev: "2Pe", testament: "NT", chapters: 3 },
  { id: "1jo", name: "1 João", abbrev: "1Jo", testament: "NT", chapters: 5 },
  { id: "2jo", name: "2 João", abbrev: "2Jo", testament: "NT", chapters: 1 },
  { id: "3jo", name: "3 João", abbrev: "3Jo", testament: "NT", chapters: 1 },
  { id: "jd", name: "Judas", abbrev: "Jd", testament: "NT", chapters: 1 },
  { id: "ap", name: "Apocalipse", abbrev: "Ap", testament: "NT", chapters: 22 },
];

// Import offline reader
import { getChapterOffline, searchOffline } from "./bibleOffline";

// Memory cache
const cache = {};

export async function fetchChapter(version, bookAbbrev, chapter) {
  const key = `${version}-${bookAbbrev}-${chapter}`;
  if (cache[key]) return cache[key];
  
  const data = await getChapterOffline(version, bookAbbrev, chapter);
  cache[key] = data;
  return data;
}

export async function searchVerses(version, query) {
  return searchOffline(version, query);
}

// Re-export parseReference from bibleSearch for backward compatibility
export { parseReference } from "./bibleSearch";