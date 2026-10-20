import { auth } from "./auth";
import { jsonError } from "@/core/api/responses";
import { getAccessScope } from "@/core/rbac/scope";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  tenantId: string;
  permissions: string[];
};

/** Returns the authenticated user or null for an anonymous request. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.tenantId) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name,
    tenantId: session.user.tenantId,
    permissions: session.user.permissions ?? [],
  };
}

type AuthedHandler = (
  request: Request,
  context: { user: SessionUser; params?: Record<string, string> },
) => Promise<Response>;

/** Wraps an API handler with authentication and normalized error handling. */
export function withAuth(handler: AuthedHandler) {
  return async (
    request: Request,
    routeContext?: { params?: Promise<Record<string, string>> },
  ) => {
    const user = await getSessionUser();
    if (!user) return jsonError("UNAUTHORIZED", "Authentication required", 401);

    try {
      const params = routeContext?.params ? await routeContext.params : undefined;
      return await handler(request, { user, params });
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        return jsonError("VALIDATION", "Request body must contain valid JSON", 400);
      }
      const message = error instanceof Error ? error.message : "Unexpected error";
      if (message === "NOT_FOUND") return jsonError("NOT_FOUND", "Record not found", 404);
      if (message === "CUSTOMER_NOT_FOUND") {
        return jsonError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
      }
      if (message === "CONTACT_CUSTOMER_MISMATCH") {
        return jsonError("CONTACT_CUSTOMER_MISMATCH", "The contact does not belong to this customer", 400);
      }
      if (message === "LEAD_NOT_QUALIFIED") {
        return jsonError("LEAD_NOT_QUALIFIED", "Only qualified leads can be converted", 409);
      }
      if (message === "ALREADY_CONVERTED") {
        return jsonError("ALREADY_CONVERTED", "This lead is already converted or connected", 409);
      }
      if (message === "CUSTOMER_IN_USE") {
        return jsonError("CUSTOMER_IN_USE", "Disconnect active leads before deleting this customer", 409);
      }
      if (message === "CONTACT_IN_USE") {
        return jsonError("CONTACT_IN_USE", "Disconnect active leads before deleting this contact", 409);
      }
      return jsonError("INTERNAL", "The request could not be completed", 500);
    }
  };
}

/** Wraps an API handler with authentication and an explicit permission check. */
export function withPermission(permission: string, handler: AuthedHandler) {
  return withAuth(async (request, context) => {
    const scope = await getAccessScope(context.user.id);
    if (!scope.permissions.includes(permission)) {
      return jsonError("FORBIDDEN", `Missing permission: ${permission}`, 403);
    }
    return handler(request, {
      ...context,
      user: { ...context.user, tenantId: scope.tenantId, permissions: scope.permissions },
    });
  });
}

/** Wraps an API handler and requires every specified permission. */
export function withPermissions(permissions: string[], handler: AuthedHandler) {
  return withAuth(async (request, context) => {
    const scope = await getAccessScope(context.user.id);
    const missing = permissions.find((permission) => !scope.permissions.includes(permission));
    if (missing) return jsonError("FORBIDDEN", `Missing permission: ${missing}`, 403);
    return handler(request, {
      ...context,
      user: { ...context.user, tenantId: scope.tenantId, permissions: scope.permissions },
    });
  });
}
