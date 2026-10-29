import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  // Only top-level notes in posts/ are posts; posts/assets/ holds attachments.
  loader: glob({ base: './src/content/posts', pattern: '*.md' }),
  schema: z
    .object({
      title: z.string().min(1),
      // Obsidian date properties are written as YYYY-MM-DD.
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      // An empty `description:` (as in the template) parses as null.
      description: z
        .string()
        .nullish()
        .transform((d) => d ?? undefined),
      tags: z.array(z.string()).nullish().transform((t) => t ?? []),
      kind: z.enum(['post', 'essay']).default('post'),
      draft: z.boolean().default(true),
      // `false` turns off collapsible sections for this post.
      collapsible: z.boolean().default(true),
    })
    .refine((p) => p.draft || (p.description && p.description.trim().length > 0), {
      message: 'Published posts (draft: false) need a description.',
      path: ['description'],
    }),
});

export const collections = { posts };
