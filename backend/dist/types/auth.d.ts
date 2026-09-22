import { UserRole } from "../constants/user.js";
export type AuthPayload = {
    type: "org";
    orgId: string;
} | {
    type: "user";
    orgId: string;
    userId: string;
    role: UserRole;
};
//# sourceMappingURL=auth.d.ts.map