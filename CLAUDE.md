# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mack is a Markdown to Slack BlockKit Blocks parser. It converts Markdown (including GitHub Flavoured Markdown) into Slack BlockKit block objects that can be sent via Slack's API. The parser uses the `marked` library for lexical analysis and transforms tokens into Slack's block format.

## Development Commands

### Install dependencies
```bash
npm install
```

### Build the project
```bash
npm run compile
```
This compiles TypeScript to JavaScript in the `build/` directory using `tsc`.

### Run tests
```bash
npm test
```
This runs:
1. `npm run compile` (pretest hook)
2. Jest tests with ts-jest preset
3. `npm run lint` (posttest hook)

Tests are located in `test/*.spec.ts` and use the pattern `**/*.spec.ts`.

### Run a single test file
```bash
npx jest test/parser.spec.ts
```
or
```bash
npx jest test/integration.spec.ts
```

### Lint code
```bash
npm run lint
```
Uses Google TypeScript Style (gts).

### Auto-fix lint issues
```bash
npm run fix
```

### Clean build artifacts
```bash
npm run clean
```

## Architecture

### Core Components

**Entry Point (`src/index.ts`)**
- Exports `markdownToBlocks()` function - the main API
- Uses `marked.Lexer` with custom tokenizer for Slack-specific escaping
- Only escapes `&`, `<`, and `>` per Slack's formatting requirements
- Validates input and enforces block count limits
- Delegates token parsing to `parseBlocks()`

**Error Handling (`src/errors.ts`)**
- `MackError`: Base error class for all parser errors
- `ValidationError`: Input validation failures
- `ParseError`: Parsing logic failures
- `BlockLimitError`: Block count limit exceeded
- `SecurityError`: Security-related failures (XXE protection)

**Validation & Security (`src/validation.ts`)**
- `validateInput()`: Validates markdown input (not null, string type)
- `validateUrl()`: Regex-based URL validation for http/https/data URLs
- `safeTruncate()`: UTF-8 aware text truncation that respects character boundaries
- `validateRecursionDepth()`: Prevents stack overflow from deeply nested formatting
- `validateBlockCount()`: Enforces Slack's 50 block maximum
- `SECURE_XML_CONFIG`: XXE-protected XML parser configuration

**Parser (`src/parser/internal.ts`)**
- `parseBlocks()`: Main parser that converts marked tokens to Slack blocks
- `parseToken()`: Routes different token types to specific parsers
- Token-specific parsers: `parseHeading()`, `parseParagraph()`, `parseCode()`, `parseList()`, `parseTable()`, `parseBlockquote()`, `parseHTML()`
- Inline content parsers: `parseMrkdwn()` converts inline elements (bold, italic, links, etc.) to Slack's mrkdwn format
- `parsePhrasingContent()`: Handles inline tokens and accumulates them into section blocks
- `parseList()`: Handles all list token types (paragraphs, code, nested lists) - fixed for issue #24
- `parseBlockquote()`: Supports nested content (lists, code, headings, quotes) - fixed for issue #25
- `parseTable()`: Converts markdown tables to native Slack Table blocks
- `parseHtmlTable()`: Converts HTML tables to native Slack Table blocks - added for HTML support
- `parseHTML()`: Handles HTML images and tables with secure XML parsing

**Slack Block Builders (`src/slack.ts`)**
- Factory functions for creating Slack blocks: `section()`, `header()`, `image()`, `divider()`, `table()`
- `table()`: Creates native Slack Table blocks with full validation
- Enforces Slack API limits (text: 3000 chars, headers: 150 chars, tables: 100 rows max, 20 cells per row)
- Automatically truncates content to fit Slack's constraints
- URL validation before creating image blocks

**Types (`src/types.ts`)**
- `ParsingOptions`: Configuration for the parser
- `ListOptions`: Configure checkbox prefix display

### Key Design Patterns

1. **Token Accumulation**: Section blocks are accumulated when consecutive inline content appears, reducing block count
2. **Recursive Parsing**: Inline elements like links and emphasis recursively parse their children with depth protection
3. **XML Parsing**: HTML tokens are parsed with `fast-xml-parser` using XXE-protected configuration
4. **Length Truncation**: All text is truncated at Slack's API limits using UTF-8 aware truncation
5. **Error Handling**: Graceful degradation with comprehensive error classes and validation

### Native Table Support

Mack supports Slack's native Table blocks (introduced in 2024):
- **Markdown syntax**: Standard markdown table syntax converted to native blocks
- **HTML syntax**: HTML `<table>` elements with `<thead>`, `<tbody>`, and direct `<tr>` rows
- **Rich text formatting** in cells: bold, italic, strikethrough, code, links
- **Column alignment**: left (default), center, or right from markdown or HTML attributes
- **Automatic format detection**: uses `raw_text` for simple cells, `rich_text` for formatted cells
- **Validation**: enforces Slack's limits (100 rows max, 20 cells per row, 20 column settings)

Example:
```markdown
| Header | **Bold** | *Italic* |
|:-------|:--------:|----------:|
| Left   | Center   | Right    |
```

Or HTML:
```html
<table>
  <thead>
    <tr>
      <th>Header</th>
      <th align="center">Center</th>
      <th align="right">Right</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Left</td>
      <td>Center</td>
      <td>Right</td>
    </tr>
  </tbody>
</table>
```

Both produce native Slack Table blocks with proper alignment and formatting.

### Known Limitations

None - all previous limitations have been resolved. See GitHub issues #23-#27 for details.

### GitHub Issues Resolved

- **#24**: Nested bulleted lists not rendered - FIXED
- **#25**: Blockquote format not working - FIXED
- **#26**: Quote characters replaced with `&#39;` - FIXED
- **#27**: Divider block under list incorrectly turns list into header - FIXED
- **#23**: marked.lexer runtime error - FIXED

## Security Features

- **XXE Protection**: XML parser uses secure configuration to prevent XXE attacks
- **Input Validation**: All inputs validated for type and content
- **URL Validation**: Links and image URLs validated before processing
- **Recursion Protection**: Prevents stack overflow from deeply nested formatting
- **Character Escaping**: Only necessary characters escaped for Slack's mrkdwn format

## Test Coverage

- **64 total test cases** covering all features
- **5 GitHub issue tests** validating each fix
- **Robustness tests** for error handling and validation
- **Table tests** for markdown and HTML tables
- **Integration tests** for real-world scenarios

Run tests with:
```bash
npm test
npm run lint
```

Or run specific tests:
```bash
npx jest test/integration.spec.ts -t "GitHub Issues"
```

## Code Style

This project uses Google TypeScript Style (gts). The configuration extends from `node_modules/gts/tsconfig-google.json`.

All code is type-safe, follows strict TypeScript compilation, and passes comprehensive linting checks.
