import { NextResponse } from 'next/server';
import { ingestDocument } from '@/lib/db/ingestion';
import { verifyToken } from '@/lib/auth';

// ── Node.js polyfills required by pdfjs-dist (used internally by pdf-parse) ──
// pdfjs-dist expects browser globals. Without these it throws "DOMMatrix is not defined".
function applyPdfPolyfills() {
    const g = globalThis as any;

    if (!g.DOMMatrix) {
        g.DOMMatrix = class DOMMatrix {
            a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
            m11 = 1; m12 = 0; m13 = 0; m14 = 0;
            m21 = 0; m22 = 1; m23 = 0; m24 = 0;
            m31 = 0; m32 = 0; m33 = 1; m34 = 0;
            m41 = 0; m42 = 0; m43 = 0; m44 = 1;
            is2D = true; isIdentity = true;
            multiply() { return this; }
            translate() { return this; }
            scale() { return this; }
            rotate() { return this; }
            inverse() { return this; }
            transformPoint(p: any) { return p; }
            toString() { return 'matrix(1, 0, 0, 1, 0, 0)'; }
        };
    }

    if (!g.ImageData) {
        g.ImageData = class ImageData {
            width: number; height: number; data: Uint8ClampedArray;
            constructor(widthOrData: number | Uint8ClampedArray, height: number) {
                if (typeof widthOrData === 'number') {
                    this.width = widthOrData;
                    this.height = height;
                    this.data = new Uint8ClampedArray(widthOrData * height * 4);
                } else {
                    this.width = height;
                    this.height = widthOrData.length / (height * 4);
                    this.data = widthOrData;
                }
            }
        };
    }

    if (!g.Path2D) {
        g.Path2D = class Path2D {
            addPath() { } closePath() { } moveTo() { } lineTo() { }
            bezierCurveTo() { } quadraticCurveTo() { } arc() { }
            arcTo() { } ellipse() { } rect() { }
        };
    }

    if (!g.OffscreenCanvas) {
        g.OffscreenCanvas = class OffscreenCanvas {
            width: number; height: number;
            constructor(w: number, h: number) { this.width = w; this.height = h; }
            getContext() {
                return {
                    fillRect() { }, clearRect() { }, getImageData() {
                        return { data: new Uint8ClampedArray(4) };
                    },
                    putImageData() { }, createImageData() { return { data: [] }; },
                    setTransform() { }, drawImage() { }, save() { }, fillText() { },
                    restore() { }, beginPath() { }, moveTo() { }, lineTo() { },
                    closePath() { }, stroke() { }, translate() { }, scale() { },
                    rotate() { }, arc() { }, fill() { }, measureText() { return { width: 0 }; },
                    transform() { }, rect() { }, clip() { },
                };
            }
        };
    }
}

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get('content-type') || '';

        let title = '';
        let text = '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            const file = formData.get('file') as File | null;
            if (!file) {
                return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
            }

            title = file.name.replace(/\.[^/.]+$/, '');
            const buffer = Buffer.from(await file.arrayBuffer());

            // Apply polyfills immediately before requiring pdf-parse / pdfjs-dist
            applyPdfPolyfills();

            // This version of pdf-parse exports named classes. PDFParse takes { data }
            // in the constructor, then .load() initialises it, then .getText() extracts text.
            // @ts-ignore
            const pdfParseModule = require('pdf-parse');

            let pdfText: string;

            if (typeof pdfParseModule === 'function') {
                // Legacy pdf-parse ≤ 1.x: module itself is directly callable
                const parsed = await pdfParseModule(buffer);
                pdfText = parsed.text;
            } else if (typeof pdfParseModule.PDFParse === 'function') {
                // New pdf-parse: class-based API { PDFParse }
                const parser = new pdfParseModule.PDFParse({ data: buffer });
                const textResult = await parser.getText();
                pdfText = textResult?.text || '';
            } else if (typeof pdfParseModule.default === 'function') {
                // ESM-wrapped default export fallback
                const parsed = await pdfParseModule.default(buffer);
                pdfText = parsed.text;
            } else {
                throw new Error(
                    'Unsupported pdf-parse version. Exported keys: ' +
                    Object.keys(pdfParseModule).join(', ')
                );
            }

            text = pdfText;
            console.log(`[Ingest] Extracted text length: ${text?.length ?? 0} chars, preview: "${text?.slice(0, 100).replace(/\n/g, ' ')}"`);

            if (!text || !text.trim()) {
                return NextResponse.json(
                    { error: 'Could not extract text from PDF file. The file may be scanned/image-only.' },
                    { status: 400 }
                );
            }
        } else {
            const body = await req.json();
            title = body.title;
            text = body.text;
        }

        if (!title || !text) {
            return NextResponse.json({ error: 'Missing title or text content' }, { status: 400 });
        }

        // Get user ID from cookie token
        const cookieHeader = req.headers.get('cookie') || '';
        const tokenMatch = cookieHeader.match(/token=([^;]+)/);
        const token = tokenMatch ? tokenMatch[1] : null;
        let userId: string | undefined;
        console.log('[Ingest] cookie present:', Boolean(cookieHeader));
        console.log('[Ingest] token extracted:', Boolean(token));

        if (token) {
            const payload = await verifyToken(token);
            console.log('[Ingest] token payload:', payload ? { userId: payload.userId } : null);
            if (payload) userId = payload.userId;
        } else {
            console.log('[Ingest] No token provided in cookie header');
        }

        const documentId = await ingestDocument(title, text, userId);
        console.log(`[Ingest] created documentId=${documentId} for userId=${userId}`);
        return NextResponse.json({ success: true, documentId, title });
    } catch (error: any) {
        console.error('[Ingest] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}