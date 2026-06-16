/**
 * Safely extracts and parses JSON content from a text string.
 * Handles:
 *   - Raw JSON
 *   - Markdown code fences: ```json ... ```
 *   - JSON embedded inside prose text (LLM preamble/postamble)
 */
export function safeParseJSON<T = any>(text: string): T {
    let cleaned = text.trim();

    // 1. Strip markdown code block wrapper if present
    if (cleaned.startsWith('```')) {
        cleaned = cleaned
            .replace(/^```(?:json)?\n?/i, '')
            .replace(/\n?```$/, '')
            .trim();
    }

    // 2. Strip any leading prose before the first JSON bracket (LLM preamble)
    const firstBracket = Math.min(
        cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('['),
        cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{'),
    );
    if (firstBracket > 0) {
        cleaned = cleaned.slice(firstBracket);
    }

    // 3. Try direct parse first
    try {
        return JSON.parse(cleaned) as T;
    } catch {
        // 4. Use greedy match to capture the FULL array or object (not just up to first `}`)
        //    Find the last `]` to correctly bound a JSON array.
        const arrayStart = cleaned.indexOf('[');
        const arrayEnd = cleaned.lastIndexOf(']');
        if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
            try {
                return JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1)) as T;
            } catch { /* fall through */ }
        }

        const objectStart = cleaned.indexOf('{');
        const objectEnd = cleaned.lastIndexOf('}');
        if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
            try {
                return JSON.parse(cleaned.slice(objectStart, objectEnd + 1)) as T;
            } catch { /* fall through */ }
        }

        // 5. Nothing worked – throw a clear error with the raw model output
        throw new Error(`AI returned non-JSON response: ${cleaned.slice(0, 200)}`);
    }
}

