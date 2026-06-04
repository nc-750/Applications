import { defineCollection, z } from "astro:content";

const docs = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().default(999),
    draft: z.boolean().default(false),
  }),
});

export const collections = { docs };
