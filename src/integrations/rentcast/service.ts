import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RENTCAST_API_KEY = import.meta.env.RENTCAST_API_KEY;

export const getRentcastProperties = createServerFn({ method: 'GET' })
  .validator(z.object({
    zip: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { zip } = data;
    const properties = await getRentcastProperties(zip);
    return properties;
  });