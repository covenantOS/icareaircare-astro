import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const link = z.object({
  href: z.string(),
  label: z.string(),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tag: z.string(),
    date: z.string(),
    read: z.string(),
    image: z.string(),
    imageAlt: z.string().optional(),
    location: z.string(),
    primaryService: link,
    related: z.array(link),
    checklist: z.array(z.string()),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog };
