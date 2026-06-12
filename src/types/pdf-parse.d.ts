declare module "pdf-parse" {
  export default function pdfParse(data: Buffer): Promise<{
    text: string;
    numpages: number;
    info?: unknown;
    metadata?: unknown;
  }>;
}

declare module "pdf-parse/lib/pdf-parse.js" {
  export default function pdfParse(data: Buffer): Promise<{
    text: string;
    numpages: number;
    info?: unknown;
    metadata?: unknown;
  }>;
}
