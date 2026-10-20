import { jsonOk } from "@/core/api/responses";

export const GET = async () => jsonOk({ status: "ok", service: "crm" });
