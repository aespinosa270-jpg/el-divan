import { createClient, type Client } from '@libsql/client/web';

let client: Client | null = null;

const DEMO =
  process.env.DEMO_MODE === 'true' ||
  !process.env.TURSO_DATABASE_URL;

const DEMO_PRODUCTS = [
  {
    id: 'demo-1',
    slug: 'clinica-y-escucha',
    title: 'Clínica y escucha',
    author: 'Sigmund Freud',
    publisher: 'El Diván Editorial',
    description:
      'Una selección demostrativa para explorar conceptos fundamentales de la escucha clínica y el pensamiento psicoanalítico.',
    isbn: '9780000000001',
    sku: 'DEMO-001',
    price_cents: 42000,
    stock: 8,
    cover: '',
    images: '[]',
    category: 'Psicoanálisis',
    tags: 'clinica,psicoanalisis',
    weight: 420,
    length: 21,
    width: 14,
    height: 2,
    published: 1,
    featured: 1,
    created_at: '2026-09-01T12:00:00.000Z',
    updated_at: '2026-09-10T12:00:00.000Z',
  },
  {
    id: 'demo-2',
    slug: 'deseo-y-lenguaje',
    title: 'Deseo y lenguaje',
    author: 'Jacques Lacan',
    publisher: 'El Diván Editorial',
    description:
      'Libro demostrativo sobre lenguaje, deseo y las preguntas que atraviesan la experiencia analítica.',
    isbn: '9780000000002',
    sku: 'DEMO-002',
    price_cents: 49500,
    stock: 5,
    cover: '',
    images: '[]',
    category: 'Psicoanálisis',
    tags: 'deseo,lenguaje',
    weight: 460,
    length: 21,
    width: 14,
    height: 2,
    published: 1,
    featured: 1,
    created_at: '2026-08-28T12:00:00.000Z',
    updated_at: '2026-09-09T12:00:00.000Z',
  },
  {
    id: 'demo-3',
    slug: 'infancia-y-vinculo',
    title: 'Infancia y vínculo',
    author: 'Donald Winnicott',
    publisher: 'Biblioteca Clínica',
    description:
      'Contenido de demostración dedicado a la infancia, el vínculo y la construcción de la experiencia emocional.',
    isbn: '9780000000003',
    sku: 'DEMO-003',
    price_cents: 38000,
    stock: 12,
    cover: '',
    images: '[]',
    category: 'Clínica',
    tags: 'infancia,vinculo,clinica',
    weight: 390,
    length: 21,
    width: 14,
    height: 2,
    published: 1,
    featured: 1,
    created_at: '2026-08-20T12:00:00.000Z',
    updated_at: '2026-09-08T12:00:00.000Z',
  },
  {
    id: 'demo-4',
    slug: 'sujeto-y-cultura',
    title: 'Sujeto y cultura',
    author: 'Sigmund Freud',
    publisher: 'Biblioteca Clínica',
    description:
      'Una lectura demostrativa sobre la relación entre subjetividad, sociedad y cultura.',
    isbn: '9780000000004',
    sku: 'DEMO-004',
    price_cents: 35000,
    stock: 3,
    cover: '',
    images: '[]',
    category: 'Cultura',
    tags: 'cultura,sociedad',
    weight: 350,
    length: 20,
    width: 13,
    height: 2,
    published: 1,
    featured: 0,
    created_at: '2026-08-15T12:00:00.000Z',
    updated_at: '2026-09-07T12:00:00.000Z',
  },
  {
    id: 'demo-5',
    slug: 'la-pregunta-por-el-inconsciente',
    title: 'La pregunta por el inconsciente',
    author: 'Jacques Lacan',
    publisher: 'El Diván Editorial',
    description:
      'Material de demostración para presentar una colección especializada en teoría psicoanalítica.',
    isbn: '9780000000005',
    sku: 'DEMO-005',
    price_cents: 56000,
    stock: 7,
    cover: '',
    images: '[]',
    category: 'Teoría',
    tags: 'inconsciente,teoria',
    weight: 510,
    length: 22,
    width: 15,
    height: 3,
    published: 1,
    featured: 1,
    created_at: '2026-08-10T12:00:00.000Z',
    updated_at: '2026-09-06T12:00:00.000Z',
  },
  {
    id: 'demo-6',
    slug: 'pensar-lo-cotidiano',
    title: 'Pensar lo cotidiano',
    author: 'Donald Winnicott',
    publisher: 'Lecturas Abiertas',
    description:
      'Una publicación demostrativa para mostrar la experiencia editorial y visual de la tienda.',
    isbn: '9780000000006',
    sku: 'DEMO-006',
    price_cents: 31000,
    stock: 10,
    cover: '',
    images: '[]',
    category: 'Psicología',
    tags: 'psicologia,cotidiano',
    weight: 330,
    length: 20,
    width: 13,
    height: 2,
    published: 1,
    featured: 0,
    created_at: '2026-08-01T12:00:00.000Z',
    updated_at: '2026-09-05T12:00:00.000Z',
  },
];

const DEMO_AUTHORS = [
  {
    name: 'Sigmund Freud',
    slug: 'sigmund-freud',
    bio: 'Autor fundamental para la historia del psicoanálisis. Esta biografía es contenido demostrativo del sitio.',
  },
  {
    name: 'Jacques Lacan',
    slug: 'jacques-lacan',
    bio: 'Figura central del pensamiento psicoanalítico contemporáneo. Contenido utilizado para la demostración de El Diván.',
  },
  {
    name: 'Donald Winnicott',
    slug: 'donald-winnicott',
    bio: 'Psicoanalista reconocido por sus aportaciones al estudio del desarrollo emocional y los vínculos tempranos.',
  },
];

const DEMO_CATEGORIES = [
  {
    name: 'Psicoanálisis',
    slug: 'psicoanalisis',
    description: 'Teoría, clínica y pensamiento psicoanalítico.',
  },
  {
    name: 'Psicología',
    slug: 'psicologia',
    description: 'Lecturas sobre psicología y experiencia humana.',
  },
  {
    name: 'Clínica',
    slug: 'clinica',
    description: 'Libros dedicados a la práctica y escucha clínica.',
  },
  {
    name: 'Cultura',
    slug: 'cultura',
    description: 'Cruces entre subjetividad, sociedad, arte y cultura.',
  },
  {
    name: 'Teoría',
    slug: 'teoria',
    description: 'Textos para profundizar en conceptos y escuelas de pensamiento.',
  },
];

const DEMO_POSTS = [
  {
    id: 'post-demo-1',
    slug: 'por-que-seguimos-leyendo-a-freud',
    title: '¿Por qué seguimos leyendo a Freud?',
    excerpt:
      'Una introducción a las preguntas que mantienen vivo al pensamiento psicoanalítico.',
    body:
      'El psicoanálisis continúa abriendo preguntas sobre el deseo, los vínculos y aquello que no siempre puede decirse directamente. Este artículo forma parte del contenido demostrativo de El Diván.',
    author: 'El Diván',
    category: 'Psicoanálisis',
    cover: '',
    published: 1,
    created_at: '2026-09-10T12:00:00.000Z',
    updated_at: '2026-09-10T12:00:00.000Z',
  },
  {
    id: 'post-demo-2',
    slug: 'leer-la-clinica',
    title: 'Leer la clínica',
    excerpt:
      'Libros que acompañan la formación, la práctica y las preguntas del consultorio.',
    body:
      'Leer la clínica también es construir nuevas maneras de escuchar. Este texto es contenido demostrativo para mostrar la sección editorial del sitio.',
    author: 'El Diván',
    category: 'Clínica',
    cover: '',
    published: 1,
    created_at: '2026-09-05T12:00:00.000Z',
    updated_at: '2026-09-05T12:00:00.000Z',
  },
  {
    id: 'post-demo-3',
    slug: 'libros-que-abren-preguntas',
    title: 'Libros que abren preguntas',
    excerpt:
      'Una biblioteca no sólo responde: también crea nuevas preguntas.',
    body:
      'El Diván propone una biblioteca especializada donde cada lectura pueda convertirse en un punto de partida. Contenido demostrativo.',
    author: 'El Diván',
    category: 'Cultura',
    cover: '',
    published: 1,
    created_at: '2026-09-01T12:00:00.000Z',
    updated_at: '2026-09-01T12:00:00.000Z',
  },
];

function database(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error('Database unavailable');
  }

  client = createClient({
    url,
    authToken,
  });

  return client;
}

function normalize(sql: string) {
  return sql.toLowerCase().replace(/\s+/g, ' ').trim();
}

function value(v: unknown) {
  return String(v ?? '');
}

function limitRows<T>(sql: string, rows: T[]) {
  const match = sql.match(/\blimit\s+(\d+)/i);
  return match ? rows.slice(0, Number(match[1])) : rows;
}

function demoAll(sql: string, values: unknown[]) {
  const q = normalize(sql);

  if (q.includes('from products')) {
    let rows = [...DEMO_PRODUCTS];
    let index = 0;

    if (q.includes('title like ?') || q.includes('author like ?')) {
      const search = value(values[index]).replaceAll('%', '').toLowerCase();
      index += 3;

      if (search) {
        rows = rows.filter((book) =>
          [
            book.title,
            book.author,
            book.isbn ?? '',
            book.publisher,
            book.category,
          ].some((field) => field.toLowerCase().includes(search))
        );
      }
    }

    if (q.includes('author=?')) {
      const author = value(values[index++]);
      rows = rows.filter((book) => book.author === author);
    }

    if (q.includes('category=?')) {
      const category = value(values[index++]);
      rows = rows.filter((book) => book.category === category);
    }

    if (q.includes('publisher=?')) {
      const publisher = value(values[index++]);
      rows = rows.filter((book) => book.publisher === publisher);
    }

    if (q.includes('stock>0')) {
      rows = rows.filter((book) => book.stock > 0);
    }

    if (q.includes('price_cents>=?')) {
      const min = Number(values[index++]);
      rows = rows.filter((book) => book.price_cents >= min);
    }

    if (q.includes('price_cents<=?')) {
      const max = Number(values[index++]);
      rows = rows.filter((book) => book.price_cents <= max);
    }

    if (q.includes('featured=1')) {
      rows = rows.filter((book) => book.featured === 1);
    }

    return limitRows(sql, rows);
  }

  if (q.includes('from authors')) {
    return limitRows(sql, [...DEMO_AUTHORS]);
  }

  if (q.includes('from categories')) {
    return limitRows(sql, [...DEMO_CATEGORIES]);
  }

  if (q.includes('from posts')) {
    return limitRows(sql, [...DEMO_POSTS]);
  }

  // Carrito, pedidos, newsletter, administración, etc.
  // En demo no necesitan persistencia.
  return [];
}

function demoOne(sql: string, values: unknown[]) {
  const q = normalize(sql);

  if (q.includes('from products')) {
    if (q.includes('count(')) {
      return { n: DEMO_PRODUCTS.length };
    }

    if (q.includes('slug=?')) {
      return DEMO_PRODUCTS.find((book) => book.slug === value(values[0])) ?? null;
    }

    if (q.includes('id=?')) {
      return DEMO_PRODUCTS.find((book) => book.id === value(values[0])) ?? null;
    }

    return DEMO_PRODUCTS[0] ?? null;
  }

  if (q.includes('from authors')) {
    return DEMO_AUTHORS.find((author) => author.slug === value(values[0])) ?? null;
  }

  if (q.includes('from categories')) {
    return DEMO_CATEGORIES.find((category) => category.slug === value(values[0])) ?? null;
  }

  if (q.includes('from posts')) {
    return DEMO_POSTS.find((post) => post.slug === value(values[0])) ?? null;
  }

  if (q.includes('from settings')) {
    return null;
  }

  return null;
}

export function secret(name: string): string {
  return process.env[name] ?? '';
}

export const now = () => new Date().toISOString();

export async function all<T = Record<string, unknown>>(
  sql: string,
  ...values: unknown[]
): Promise<T[]> {
  if (DEMO) {
    return demoAll(sql, values) as T[];
  }

  const result = await database().execute({
    sql,
    args: values as any[],
  });

  return result.rows as unknown as T[];
}

export async function one<T = Record<string, unknown>>(
  sql: string,
  ...values: unknown[]
): Promise<T | null> {
  if (DEMO) {
    return demoOne(sql, values) as T | null;
  }

  const result = await database().execute({
    sql,
    args: values as any[],
  });

  return (result.rows[0] as unknown as T) ?? null;
}

export async function run(
  sql: string,
  ...values: unknown[]
): Promise<{ rowsAffected: number }> {
  if (DEMO) {
    return {
      success: true,
      rowsAffected: 1,
    };
  }

  return database().execute({
    sql,
    args: values as any[],
  });
}

export async function getSetting<T>(
  key: string,
  fallback: T,
): Promise<T> {
  if (DEMO) {
    return fallback;
  }

  const row = await one<{ value: string }>(
    'SELECT value FROM settings WHERE id = ?',
    key,
  );

  return row ? JSON.parse(row.value) : fallback;
}

export const vacationDefault = {
  enabled: false,
  returnDate: '',
  message: '',
  acceptOrders: false,
};

export async function vacation() {
  return getSetting('vacation', vacationDefault);
}

