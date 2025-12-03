declare module "https://deno.land/std@0.190.0/http/server.ts" {
    export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module "https://esm.sh/@google/genai@0.1.0?target=deno" {
    export * from "@google/genai";
}