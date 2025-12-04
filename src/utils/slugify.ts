const CYRILLIC_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

export function slugify(source: string): string {
  const lower = source.toLowerCase()
  const transliterated = Array.from(lower)
    .map((ch) => CYRILLIC_MAP[ch] ?? ch)
    .join('')

  return transliterated
    .replace(/[^a-z0-9]+/g, '-') // всё лишнее в дефисы
    .replace(/^-+|-+$/g, '') // обрезать дефисы по краям
    .replace(/-{2,}/g, '-') // убрать дубль-дефисы
}


