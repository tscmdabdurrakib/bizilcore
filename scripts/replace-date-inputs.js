#!/usr/bin/env node
/**
 * Replaces all <input type="date" ...> with <DatePicker ...> across the project.
 * Transforms onChange handlers from event-based to value-based.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");

// Get all tsx files with type="date"
const files = execSync(
  `grep -rl 'type="date"' ${ROOT}/app ${ROOT}/components --include="*.tsx" 2>/dev/null`,
  { encoding: "utf-8" }
)
  .trim()
  .split("\n")
  .filter(Boolean);

console.log(`Found ${files.length} files to process\n`);

let totalReplaced = 0;

for (const file of files) {
  let src = fs.readFileSync(file, "utf-8");
  const original = src;

  // ── Step 1: Replace <input ... type="date" ... /> elements ──
  // Match a self-closing <input ... type="date" ... /> possibly spanning multiple lines
  // We'll use a stateful parser approach to handle this reliably
  src = replaceInputElements(src);

  // ── Step 2: Add import if we made changes ──
  if (src !== original) {
    src = addImport(src, file);
    fs.writeFileSync(file, src, "utf-8");
    const count = (original.match(/type="date"/g) || []).length;
    totalReplaced += count;
    console.log(`✓ ${path.relative(ROOT, file)} (${count} replaced)`);
  }
}

console.log(`\nDone! Replaced ${totalReplaced} date inputs across ${files.length} files.`);

// ─────────────────────────────────────────────────────────────────────────────

function replaceInputElements(src) {
  // Find all <input ...> tags that contain type="date"
  // Strategy: find <input, then scan forward to find the closing />
  let result = "";
  let i = 0;

  while (i < src.length) {
    // Look for <input
    const inputStart = src.indexOf("<input", i);
    if (inputStart === -1) {
      result += src.slice(i);
      break;
    }

    result += src.slice(i, inputStart);

    // Find the end of this input element (/>)
    const inputEnd = findInputEnd(src, inputStart);
    if (inputEnd === -1) {
      result += src.slice(inputStart);
      break;
    }

    const inputElement = src.slice(inputStart, inputEnd);

    // Check if it's a type="date" input
    if (/type\s*=\s*["']date["']/.test(inputElement)) {
      const replacement = transformInput(inputElement);
      result += replacement;
    } else {
      result += inputElement;
    }

    i = inputEnd;
  }

  return result;
}

function findInputEnd(src, start) {
  // Find /> that closes this input element
  // Need to handle nested strings and JSX expressions
  let i = start + 6; // skip "<input"
  let depth = 0; // depth of { } nesting
  let inString = false;
  let stringChar = "";

  while (i < src.length) {
    const ch = src[i];

    if (inString) {
      if (ch === stringChar && src[i - 1] !== "\\") {
        inString = false;
      }
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      i++;
      continue;
    }

    if (ch === "{") {
      depth++;
      i++;
      continue;
    }
    if (ch === "}") {
      depth--;
      i++;
      continue;
    }

    if (depth === 0 && ch === "/" && src[i + 1] === ">") {
      return i + 2;
    }

    // Handle case where input might have > without / (rare for inputs but handle it)
    if (depth === 0 && ch === ">" && src[i - 1] !== "/") {
      return i + 1;
    }

    i++;
  }
  return -1;
}

function transformInput(inputElement) {
  // Extract all props from the input element
  const props = extractProps(inputElement);

  if (!props.value && !props.onChange) {
    // Can't meaningfully convert, leave as is
    return inputElement;
  }

  // Transform onChange: convert event handler to value handler
  let onChangeProp = "";
  if (props.onChange) {
    let handler = props.onChange;

    // Normalize: remove outer { } if present
    handler = handler.trim();

    // Transform patterns:
    // e => something(e.target.value) → v => something(v)
    // (e) => something(e.target.value) → v => something(v)
    // e => setForm(f => ({...f, key: e.target.value})) → v => setForm(f => ({...f, key: v}))
    handler = handler
      .replace(/^\(e\)\s*=>/, "v =>")
      .replace(/^e\s*=>/, "v =>")
      .replace(/^\(event\)\s*=>/, "v =>")
      .replace(/^event\s*=>/, "v =>")
      .replace(/e\.target\.value/g, "v")
      .replace(/event\.target\.value/g, "v");

    onChangeProp = `onChange={${handler}}`;
  }

  // Build DatePicker element preserving original indentation
  const indent = getIndent(inputElement);

  const parts = [indent + "<DatePicker"];

  if (props.value) parts.push(`${indent}  value={${props.value}}`);
  if (onChangeProp) parts.push(`${indent}  ${onChangeProp}`);
  if (props.className) parts.push(`${indent}  className={${props.className}}`);
  if (props.classNameStr) parts.push(`${indent}  className="${props.classNameStr}"`);
  if (props.style) parts.push(`${indent}  style={${props.style}}`);
  if (props.min) parts.push(`${indent}  min={${props.min}}`);
  if (props.max) parts.push(`${indent}  max={${props.max}}`);
  if (props.disabled) parts.push(`${indent}  disabled={${props.disabled}}`);
  if (props.required !== undefined) {
    if (props.required === "required" || props.required === "{true}" || props.required === "true") {
      parts.push(`${indent}  required`);
    }
  }
  if (props.id) parts.push(`${indent}  id=${props.id}`);
  if (props.name) parts.push(`${indent}  name=${props.name}`);
  if (props.placeholder) parts.push(`${indent}  placeholder=${props.placeholder}`);

  parts.push(`${indent}/>`);

  // If original was single-line, keep single-line
  if (!inputElement.includes("\n")) {
    const singleLine = `<DatePicker` +
      (props.value ? ` value={${props.value}}` : "") +
      (onChangeProp ? ` ${onChangeProp}` : "") +
      (props.className ? ` className={${props.className}}` : "") +
      (props.classNameStr ? ` className="${props.classNameStr}"` : "") +
      (props.style ? ` style={${props.style}}` : "") +
      (props.min ? ` min={${props.min}}` : "") +
      (props.max ? ` max={${props.max}}` : "") +
      (props.disabled ? ` disabled={${props.disabled}}` : "") +
      (props.placeholder ? ` placeholder=${props.placeholder}` : "") +
      ` />`;
    return singleLine;
  }

  return parts.join("\n");
}

function extractProps(inputElement) {
  const props = {};

  // Extract value={...}
  const valueMatch = inputElement.match(/\bvalue=\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
  if (valueMatch) props.value = valueMatch[1];

  // Extract onChange={...} - handle nested braces
  const onChangeStart = inputElement.indexOf("onChange={");
  if (onChangeStart !== -1) {
    props.onChange = extractBracedValue(inputElement, onChangeStart + "onChange={".length - 1);
  }

  // Extract className={...} or className="..."
  const classNameBrace = inputElement.match(/\bclassName=\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
  if (classNameBrace) {
    props.className = classNameBrace[1];
  } else {
    const classNameStr = inputElement.match(/\bclassName="([^"]*)"/);
    if (classNameStr) props.classNameStr = classNameStr[1];
  }

  // Extract style={...}
  const styleStart = inputElement.indexOf("style={");
  if (styleStart !== -1) {
    props.style = extractBracedValue(inputElement, styleStart + "style={".length - 1);
  }

  // Extract min
  const minMatch = inputElement.match(/\bmin=\{([^}]+)\}/) || inputElement.match(/\bmin="([^"]+)"/);
  if (minMatch) props.min = minMatch[1];

  // Extract max
  const maxMatch = inputElement.match(/\bmax=\{([^}]+)\}/) || inputElement.match(/\bmax="([^"]+)"/);
  if (maxMatch) props.max = maxMatch[1];

  // Extract disabled
  const disabledMatch = inputElement.match(/\bdisabled=\{([^}]+)\}/);
  if (disabledMatch) props.disabled = disabledMatch[1];
  else if (/\bdisabled\b/.test(inputElement)) props.disabled = "true";

  // Extract required
  if (/\brequired\b/.test(inputElement)) props.required = "required";

  // Extract id
  const idMatch = inputElement.match(/\bid=\{([^}]+)\}/) || inputElement.match(/\bid="([^"]+)"/);
  if (idMatch) props.id = `{${idMatch[1]}}` || `"${idMatch[1]}"`;

  // Extract name
  const nameMatch = inputElement.match(/\bname=\{([^}]+)\}/) || inputElement.match(/\bname="([^"]+)"/);
  if (nameMatch) props.name = `{${nameMatch[1]}}` || `"${nameMatch[1]}"`;

  // Extract placeholder
  const phMatch = inputElement.match(/\bplaceholder=\{([^}]+)\}/) || inputElement.match(/\bplaceholder="([^"]+)"/);
  if (phMatch) {
    props.placeholder = phMatch[0].replace(/\bplaceholder=/, "");
  }

  return props;
}

function extractBracedValue(str, openBracePos) {
  // Find matching closing brace, handling nesting and strings
  let depth = 0;
  let inStr = false;
  let strCh = "";
  let start = openBracePos;

  for (let i = openBracePos; i < str.length; i++) {
    const ch = str[i];
    if (inStr) {
      if (ch === strCh && str[i - 1] !== "\\") inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; strCh = ch; continue; }
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return str.slice(start + 1, i);
    }
  }
  return null;
}

function getIndent(element) {
  const match = element.match(/^(\s*)/);
  return match ? match[1] : "";
}

function addImport(src, file) {
  const importLine = `import DatePicker from "@/components/ui/DatePicker";`;

  // Don't add if already imported
  if (src.includes('from "@/components/ui/DatePicker"') || src.includes("from '@/components/ui/DatePicker'")) {
    return src;
  }

  // Find a good position: after the last "use client" or after existing imports
  const lines = src.split("\n");
  let lastImportIdx = -1;
  let hasUseClient = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '"use client"' || lines[i].trim() === "'use client'") {
      hasUseClient = true;
    }
    if (lines[i].startsWith("import ")) {
      lastImportIdx = i;
    }
  }

  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, importLine);
  } else if (hasUseClient) {
    lines.splice(1, 0, "", importLine);
  } else {
    lines.unshift(importLine);
  }

  return lines.join("\n");
}
