import {marked} from 'marked';

const singleQuote: marked.TokenizerExtension & marked.RendererExtension = {
  name: 'singleQuote',
  level: 'inline', // This is an inline-level tokenizer
  start(src: string) {
    return src.indexOf("'");
  }, // Hint to Marked.js to stop and check for a match
  tokenizer(src: string) {
    const rule = /^'/; // Regex for the complete token, anchor to string start
    const match = rule.exec(src);
    if (match) {
      return {
        // Token to generate
        type: 'text', // Should match "name" above
        raw: match[0], // Text to consume from the source
        text: match[0], // Additional custom properties
      };
    }

    return undefined;
  },
  renderer(token: marked.Tokens.Generic) {
    return token.text;
  },
};

marked.use({extensions: [singleQuote]});
