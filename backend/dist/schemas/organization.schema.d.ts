import { z } from "zod";
export declare const registerOrganizationSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type RegisterOrganizationInput = z.output<typeof registerOrganizationSchema>;
//# sourceMappingURL=organization.schema.d.ts.map