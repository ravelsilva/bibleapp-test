/**
 * Robust Bible reference parser
 * Supports: genesis, gênesis, genesis 5, exodo 5:20, ageu 1:2-8, Mt 1:6-15
 */
import { BIBLE_BOOKS } from "./bibleApi";

export function normalize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// Extended aliases for common abbreviations and alternate spellings
const ALIASES = {
  "genesis": "gn", "geneses": "gn", "gn": "gn",
  "exodo": "ex", "exodus": "ex", "ex": "ex",
  "levitico": "lv", "lv": "lv",
  "numeros": "nm", "nm": "nm",
  "deuteronomio": "dt", "dt": "dt",
  "josue": "js", "js": "js",
  "juizes": "jz", "jz": "jz",
  "rute": "rt", "rt": "rt",
  "1samuel": "1sm", "1sm": "1sm",
  "2samuel": "2sm", "2sm": "2sm",
  "1reis": "1rs", "1rs": "1rs",
  "2reis": "2rs", "2rs": "2rs",
  "1cronicas": "1cr", "1cr": "1cr",
  "2cronicas": "2cr", "2cr": "2cr",
  "esdras": "ed", "ed": "ed",
  "neemias": "ne", "ne": "ne",
  "ester": "et", "et": "et",
  "job": "job",
  "salmos": "sl", "salmo": "sl", "sl": "sl", "ps": "sl",
  "proverbios": "pv", "pv": "pv",
  "eclesiastes": "ec", "ec": "ec",
  "cantares": "ct", "ct": "ct",
  "isaias": "is", "is": "is",
  "jeremias": "jr", "jr": "jr",
  "lamentacoes": "lm", "lm": "lm",
  "ezequiel": "ez", "ez": "ez",
  "daniel": "dn", "dn": "dn",
  "oseias": "os", "os": "os",
  "joel": "jl", "jl": "jl",
  "amos": "am", "am": "am",
  "obadias": "ob", "ob": "ob",
  "jonas": "jn", "jn": "jn",
  "miqueias": "mq", "mq": "mq",
  "naum": "na", "na": "na",
  "habacuque": "hc", "hc": "hc",
  "sofonias": "sf", "sf": "sf",
  "ageu": "ag", "ag": "ag",
  "zacarias": "zc", "zc": "zc",
  "malaquias": "ml", "ml": "ml",
  "mateus": "mt", "mt": "mt",
  "marcos": "mc", "mc": "mc",
  "lucas": "lc", "lc": "lc",
  "joao": "jo", "juan": "jo",
  "atos": "at", "at": "at",
  "romanos": "rm", "rm": "rm",
  "1corintios": "1co", "1co": "1co",
  "2corintios": "2co", "2co": "2co",
  "galatas": "gl", "gl": "gl",
  "efesios": "ef", "ef": "ef",
  "filipenses": "fp", "fp": "fp",
  "colossenses": "cl", "cl": "cl",
  "1tessalonicenses": "1ts", "1ts": "1ts",
  "2tessalonicenses": "2ts", "2ts": "2ts",
  "1timoteo": "1tm", "1tm": "1tm",
  "2timoteo": "2tm", "2tm": "2tm",
  "tito": "tt", "tt": "tt",
  "filemom": "fm", "fm": "fm",
  "hebreus": "hb", "hb": "hb",
  "tiago": "tg", "tg": "tg",
  "1pedro": "1pe", "1pe": "1pe",
  "2pedro": "2pe", "2pe": "2pe",
  "1joao": "1jo", "1jo": "1jo",
  "2joao": "2jo", "2jo": "2jo",
  "3joao": "3jo", "3jo": "3jo",
  "judas": "jd", "jd": "jd",
  "apocalipse": "ap", "ap": "ap",
};

function findBookByNormalized(rawName) {
  const n = normalize(rawName).replace(/\s+/g, "");
  
  // Direct alias match
  if (ALIASES[n]) {
    const bookId = ALIASES[n];
    const book = BIBLE_BOOKS.find(b => b.id === bookId);
    if (book) return book;
  }

  // Try with number prefix (e.g. "1 corintios" -> "1corintios")
  const withNum = normalize(rawName).replace(/^(\d)\s+/, "$1");
  if (ALIASES[withNum.replace(/\s+/g, "")]) {
    const bookId = ALIASES[withNum.replace(/\s+/g, "")];
    const book = BIBLE_BOOKS.find(b => b.id === bookId);
    if (book) return book;
  }

  // Fuzzy match against book names
  const nospace = n.replace(/\s+/g, "");
  return BIBLE_BOOKS.find(b => {
    const bn = normalize(b.name).replace(/\s+/g, "");
    const ba = normalize(b.abbrev).replace(/\s+/g, "");
    const bid = b.id.replace(/\s+/g, "");
    return bn === nospace || ba === nospace || bid === nospace ||
      bn.startsWith(nospace) || nospace.startsWith(bn.substring(0, Math.min(4, bn.length)));
  });
}

/**
 * Parse a Bible reference string.
 * Returns: { book, chapter, verse, verseEnd } or null
 * 
 * Examples:
 *   "genesis" -> { book, chapter: 1, verse: null, verseEnd: null }
 *   "genesis 5" -> { book, chapter: 5, verse: null, verseEnd: null }
 *   "exodo 5:20" -> { book, chapter: 5, verse: 20, verseEnd: null }
 *   "ageu 1:2-8" -> { book, chapter: 1, verse: 2, verseEnd: 8 }
 *   "Mt 1:6-15" -> { book, chapter: 1, verse: 6, verseEnd: 15 }
 */
export function parseReference(ref) {
  const str = ref.trim();

  // Pattern: (optional number + space + bookname) + optional (space + chapter + optional(:verse + optional(-verseEnd)))
  // Handles: "1 Corintios 3:15-20", "ageu 1:2-8", "genesis 5", "mateus"
  
  // Try: Book Chapter:Verse-VerseEnd  e.g. "ageu 1:2-8"
  const m1 = str.match(/^((?:\d\s+)?[^\d]+?)\s+(\d+):(\d+)-(\d+)$/i);
  if (m1) {
    const book = findBookByNormalized(m1[1]);
    if (book) return { book, chapter: parseInt(m1[2]), verse: parseInt(m1[3]), verseEnd: parseInt(m1[4]) };
  }

  // Try: Book Chapter:Verse  e.g. "exodo 5:20"
  const m2 = str.match(/^((?:\d\s+)?[^\d]+?)\s+(\d+):(\d+)$/i);
  if (m2) {
    const book = findBookByNormalized(m2[1]);
    if (book) return { book, chapter: parseInt(m2[2]), verse: parseInt(m2[3]), verseEnd: null };
  }

  // Try: Book Chapter  e.g. "genesis 5"
  const m3 = str.match(/^((?:\d\s+)?[^\d]+?)\s+(\d+)$/i);
  if (m3) {
    const book = findBookByNormalized(m3[1]);
    if (book) return { book, chapter: parseInt(m3[2]), verse: null, verseEnd: null };
  }

  // Try just book name
  const book = findBookByNormalized(str);
  return book ? { book, chapter: 1, verse: null, verseEnd: null } : null;
}