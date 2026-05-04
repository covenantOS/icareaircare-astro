// Thin helper around the `blog` content collection so the rest of the app
// keeps a stable shape — `id` (slug) plus all the frontmatter fields flat.
import { getCollection, type CollectionEntry } from 'astro:content';

export interface BlogLink {
  href: string;
  label: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  tag: string;
  date: string;
  read: string;
  image: string;
  imageAlt?: string;
  location: string;
  primaryService: BlogLink;
  related: BlogLink[];
  checklist: string[];
  draft?: boolean;
}

export type BlogEntry = CollectionEntry<'blog'>;

function flatten(entry: BlogEntry): BlogPost {
  return { slug: entry.id, ...entry.data };
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const entries = await getCollection('blog', ({ data }) => !data.draft);
  entries.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
  return entries.map(flatten);
}

export async function getAllEntries(): Promise<BlogEntry[]> {
  const entries = await getCollection('blog', ({ data }) => !data.draft);
  entries.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
  return entries;
}

export async function getFeaturedPosts(): Promise<BlogPost[]> {
  return (await getAllPosts()).slice(0, 3);
}
