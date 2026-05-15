/**
 * VerbumFlame - Bíblia Offline
 * Usa os arquivos JSON das versões: ACF, NVI, NAA, NTLH
 * Estrutura dos arquivos: array de 66 livros, cada um com { abbrev, chapters: [[verses...]], name }
 */

// Cache lazy das versões
const versionCache = {};

// Mapeamento de abreviações para índice no array (padrão dos arquivos)
const BOOK_INDEX_MAP = {
  "gn": 0, "ex": 1, "lv": 2, "nm": 3, "dt": 4, "js": 5, "jz": 6, "rt": 7,
  "1sm": 8, "2sm": 9, "1rs": 10, "2rs": 11, "1cr": 12, "2cr": 13, "ed": 14,
  "ne": 15, "et": 16, "job": 17, "sl": 18, "pv": 19, "ec": 20, "ct": 21,
  "is": 22, "jr": 23, "lm": 24, "ez": 25, "dn": 26, "os": 27, "jl": 28,
  "am": 29, "ob": 30, "jn": 31, "mq": 32, "na": 33, "hc": 34, "sf": 35,
  "ag": 36, "zc": 37, "ml": 38,
  "mt": 39, "mc": 40, "lc": 41, "jo": 42, "at": 43, "rm": 44, "1co": 45,
  "2co": 46, "gl": 47, "ef": 48, "fp": 49, "cl": 50, "1ts": 51, "2ts": 52,
  "1tm": 53, "2tm": 54, "tt": 55, "fm": 56, "hb": 57, "tg": 58, "1pe": 59,
  "2pe": 60, "1jo": 61, "2jo": 62, "3jo": 63, "jd": 64, "ap": 65
};

// URLs dos arquivos carregados pelo usuário
const VERSION_URLS = {
  acf: "https://media.base44.com/files/public/69fcdcad2ef8e66165acb1c7/642c3eb4a_acf.json",
  nvi: "https://media.base44.com/files/public/69fcdcad2ef8e66165acb1c7/2bda6c618_NVI1.json",
  naa: "https://media.base44.com/files/public/69fcdcad2ef8e66165acb1c7/59850fe48_NAA.json",
  ntlh: "https://media.base44.com/files/public/69fcdcad2ef8e66165acb1c7/c4f22a2e7_NTLH.json",
  arc: "https://media.base44.com/files/public/69fcdcad2ef8e66165acb1c7/arc.json",
  kjf: "https://media.base44.com/files/public/69fcdcad2ef8e66165acb1c7/kjf.json",
};

async function loadVersion(versionId) {
  if (versionCache[versionId]) return versionCache[versionId];
  const url = VERSION_URLS[versionId];
  if (!url) throw new Error(`Versão ${versionId} não encontrada`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao carregar versão ${versionId}`);
  const data = await res.json();
  versionCache[versionId] = data;
  return data;
}

// Mapeamento de abreviações com acentos para id sem acento
const ABBREV_NORMALIZE_MAP = {
  "êx": "ex", "ex": "ex", "gn": "gn", "lv": "lv", "nm": "nm", "dt": "dt",
  "js": "js", "jz": "jz", "rt": "rt",
};

/**
 * Retorna todos os versículos de um capítulo
 * @returns { book: {name, abbrev}, chapter: number, verses: [{number, text}] }
 */
export async function getChapterOffline(versionId, bookAbbrev, chapterNumber) {
  const data = await loadVersion(versionId);
  const abbrevRaw = bookAbbrev.toLowerCase();
  // Normalize accented abbreviations
  const normalized = abbrevRaw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const abbrevLower = ABBREV_NORMALIZE_MAP[abbrevRaw] || ABBREV_NORMALIZE_MAP[normalized] || normalized;
  
  // Tenta pelo índice primeiro (mais rápido)
  let bookData = null;
  const idx = BOOK_INDEX_MAP[abbrevLower];
  if (idx !== undefined && data[idx]) {
    bookData = data[idx];
  } else {
    // Busca por abbrev no array, normalizando acentos
    const normalizeStr = (s) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    bookData = data.find(b => normalizeStr(b.abbrev) === abbrevLower || normalizeStr(b.abbrev) === normalized);
  }
  
  if (!bookData) throw new Error(`Livro ${bookAbbrev} não encontrado`);
  
  const chapterIdx = chapterNumber - 1;
  const chapterData = bookData.chapters?.[chapterIdx];
  if (!chapterData) throw new Error(`Capítulo ${chapterNumber} não encontrado`);
  
  const verses = chapterData.map((text, i) => ({ number: i + 1, text }));
  
  return {
    book: { name: bookData.name, abbrev: bookData.abbrev },
    chapter: chapterNumber,
    verses,
    totalChapters: bookData.chapters.length,
  };
}

/**
 * Busca versículos por texto (sem acento, case insensitive)
 */
function normalizeText(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function searchOffline(versionId, query) {
  const data = await loadVersion(versionId);
  const q = normalizeText(query);
  const results = [];
  
  for (const book of data) {
    if (!book.chapters) continue;
    for (let ci = 0; ci < book.chapters.length; ci++) {
      const chapter = book.chapters[ci];
      for (let vi = 0; vi < chapter.length; vi++) {
        const text = chapter[vi];
        if (!text) continue;
        if (normalizeText(text).includes(q)) {
          results.push({
            book: { name: book.name, abbrev: book.abbrev },
            chapter: ci + 1,
            verse: vi + 1,
            text,
          });
          if (results.length >= 50) return results; // limit
        }
      }
    }
  }
  return results;
}

/**
 * Retorna o número de capítulos de um livro
 */
export async function getBookInfo(versionId, bookAbbrev) {
  const data = await loadVersion(versionId);
  const abbrevLower = bookAbbrev.toLowerCase();
  const idx = BOOK_INDEX_MAP[abbrevLower];
  const bookData = (idx !== undefined && data[idx]) ? data[idx] : data.find(b => b.abbrev?.toLowerCase() === abbrevLower);
  if (!bookData) return null;
  return { name: bookData.name, abbrev: bookData.abbrev, totalChapters: bookData.chapters?.length || 0 };
}