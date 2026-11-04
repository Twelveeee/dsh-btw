(() => {
  // node_modules/marked/lib/marked.esm.js
  function _getDefaults() {
    return {
      async: false,
      breaks: false,
      extensions: null,
      gfm: true,
      hooks: null,
      pedantic: false,
      renderer: null,
      silent: false,
      tokenizer: null,
      walkTokens: null
    };
  }
  var _defaults = _getDefaults();
  function changeDefaults(newDefaults) {
    _defaults = newDefaults;
  }
  var noopTest = { exec: () => null };
  function edit(regex, opt = "") {
    let source = typeof regex === "string" ? regex : regex.source;
    const obj = {
      replace: (name, val) => {
        let valSource = typeof val === "string" ? val : val.source;
        valSource = valSource.replace(other.caret, "$1");
        source = source.replace(name, valSource);
        return obj;
      },
      getRegex: () => {
        return new RegExp(source, opt);
      }
    };
    return obj;
  }
  var other = {
    codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
    outputLinkReplace: /\\([\[\]])/g,
    indentCodeCompensation: /^(\s+)(?:```)/,
    beginningSpace: /^\s+/,
    endingHash: /#$/,
    startingSpaceChar: /^ /,
    endingSpaceChar: / $/,
    nonSpaceChar: /[^ ]/,
    newLineCharGlobal: /\n/g,
    tabCharGlobal: /\t/g,
    multipleSpaceGlobal: /\s+/g,
    blankLine: /^[ \t]*$/,
    doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
    blockquoteStart: /^ {0,3}>/,
    blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
    blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
    listReplaceTabs: /^\t+/,
    listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
    listIsTask: /^\[[ xX]\] /,
    listReplaceTask: /^\[[ xX]\] +/,
    anyLine: /\n.*\n/,
    hrefBrackets: /^<(.*)>$/,
    tableDelimiter: /[:|]/,
    tableAlignChars: /^\||\| *$/g,
    tableRowBlankLine: /\n[ \t]*$/,
    tableAlignRight: /^ *-+: *$/,
    tableAlignCenter: /^ *:-+: *$/,
    tableAlignLeft: /^ *:-+ *$/,
    startATag: /^<a /i,
    endATag: /^<\/a>/i,
    startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
    endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
    startAngleBracket: /^</,
    endAngleBracket: />$/,
    pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
    unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
    escapeTest: /[&<>"']/,
    escapeReplace: /[&<>"']/g,
    escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
    escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
    unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,
    caret: /(^|[^\[])\^/g,
    percentDecode: /%25/g,
    findPipe: /\|/g,
    splitPipe: / \|/,
    slashPipe: /\\\|/g,
    carriageReturn: /\r\n|\r/g,
    spaceLine: /^ +$/gm,
    notSpaceStart: /^\S*/,
    endingNewline: /\n$/,
    listItemRegex: (bull) => new RegExp(`^( {0,3}${bull})((?:[	 ][^\\n]*)?(?:\\n|$))`),
    nextBulletRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
    hrRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
    fencesBeginRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:\`\`\`|~~~)`),
    headingBeginRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}#`),
    htmlBeginRegex: (indent) => new RegExp(`^ {0,${Math.min(3, indent - 1)}}<(?:[a-z].*>|!--)`, "i")
  };
  var newline = /^(?:[ \t]*(?:\n|$))+/;
  var blockCode = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
  var fences = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
  var hr = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
  var heading = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
  var bullet = /(?:[*+-]|\d{1,9}[.)])/;
  var lheadingCore = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
  var lheading = edit(lheadingCore).replace(/bull/g, bullet).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
  var lheadingGfm = edit(lheadingCore).replace(/bull/g, bullet).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
  var _paragraph = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
  var blockText = /^[^\n]+/;
  var _blockLabel = /(?!\s*\])(?:\\.|[^\[\]\\])+/;
  var def = edit(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", _blockLabel).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
  var list = edit(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, bullet).getRegex();
  var _tag = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
  var _comment = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
  var html = edit(
    "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))",
    "i"
  ).replace("comment", _comment).replace("tag", _tag).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
  var paragraph = edit(_paragraph).replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex();
  var blockquote = edit(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", paragraph).getRegex();
  var blockNormal = {
    blockquote,
    code: blockCode,
    def,
    fences,
    heading,
    hr,
    html,
    lheading,
    list,
    newline,
    paragraph,
    table: noopTest,
    text: blockText
  };
  var gfmTable = edit(
    "^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
  ).replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex();
  var blockGfm = {
    ...blockNormal,
    lheading: lheadingGfm,
    table: gfmTable,
    paragraph: edit(_paragraph).replace("hr", hr).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", gfmTable).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _tag).getRegex()
  };
  var blockPedantic = {
    ...blockNormal,
    html: edit(
      `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`
    ).replace("comment", _comment).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
    heading: /^(#{1,6})(.*)(?:\n+|$)/,
    fences: noopTest,
    // fences not supported
    lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
    paragraph: edit(_paragraph).replace("hr", hr).replace("heading", " *#{1,6} *[^\n]").replace("lheading", lheading).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
  };
  var escape = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
  var inlineCode = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
  var br = /^( {2,}|\\)\n(?!\s*$)/;
  var inlineText = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
  var _punctuation = /[\p{P}\p{S}]/u;
  var _punctuationOrSpace = /[\s\p{P}\p{S}]/u;
  var _notPunctuationOrSpace = /[^\s\p{P}\p{S}]/u;
  var punctuation = edit(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, _punctuationOrSpace).getRegex();
  var _punctuationGfmStrongEm = /(?!~)[\p{P}\p{S}]/u;
  var _punctuationOrSpaceGfmStrongEm = /(?!~)[\s\p{P}\p{S}]/u;
  var _notPunctuationOrSpaceGfmStrongEm = /(?:[^\s\p{P}\p{S}]|~)/u;
  var blockSkip = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g;
  var emStrongLDelimCore = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/;
  var emStrongLDelim = edit(emStrongLDelimCore, "u").replace(/punct/g, _punctuation).getRegex();
  var emStrongLDelimGfm = edit(emStrongLDelimCore, "u").replace(/punct/g, _punctuationGfmStrongEm).getRegex();
  var emStrongRDelimAstCore = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
  var emStrongRDelimAst = edit(emStrongRDelimAstCore, "gu").replace(/notPunctSpace/g, _notPunctuationOrSpace).replace(/punctSpace/g, _punctuationOrSpace).replace(/punct/g, _punctuation).getRegex();
  var emStrongRDelimAstGfm = edit(emStrongRDelimAstCore, "gu").replace(/notPunctSpace/g, _notPunctuationOrSpaceGfmStrongEm).replace(/punctSpace/g, _punctuationOrSpaceGfmStrongEm).replace(/punct/g, _punctuationGfmStrongEm).getRegex();
  var emStrongRDelimUnd = edit(
    "^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)",
    "gu"
  ).replace(/notPunctSpace/g, _notPunctuationOrSpace).replace(/punctSpace/g, _punctuationOrSpace).replace(/punct/g, _punctuation).getRegex();
  var anyPunctuation = edit(/\\(punct)/, "gu").replace(/punct/g, _punctuation).getRegex();
  var autolink = edit(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
  var _inlineComment = edit(_comment).replace("(?:-->|$)", "-->").getRegex();
  var tag = edit(
    "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>"
  ).replace("comment", _inlineComment).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
  var _inlineLabel = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
  var link = edit(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", _inlineLabel).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
  var reflink = edit(/^!?\[(label)\]\[(ref)\]/).replace("label", _inlineLabel).replace("ref", _blockLabel).getRegex();
  var nolink = edit(/^!?\[(ref)\](?:\[\])?/).replace("ref", _blockLabel).getRegex();
  var reflinkSearch = edit("reflink|nolink(?!\\()", "g").replace("reflink", reflink).replace("nolink", nolink).getRegex();
  var inlineNormal = {
    _backpedal: noopTest,
    // only used for GFM url
    anyPunctuation,
    autolink,
    blockSkip,
    br,
    code: inlineCode,
    del: noopTest,
    emStrongLDelim,
    emStrongRDelimAst,
    emStrongRDelimUnd,
    escape,
    link,
    nolink,
    punctuation,
    reflink,
    reflinkSearch,
    tag,
    text: inlineText,
    url: noopTest
  };
  var inlinePedantic = {
    ...inlineNormal,
    link: edit(/^!?\[(label)\]\((.*?)\)/).replace("label", _inlineLabel).getRegex(),
    reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", _inlineLabel).getRegex()
  };
  var inlineGfm = {
    ...inlineNormal,
    emStrongRDelimAst: emStrongRDelimAstGfm,
    emStrongLDelim: emStrongLDelimGfm,
    url: edit(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
    _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
    del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
    text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
  };
  var inlineBreaks = {
    ...inlineGfm,
    br: edit(br).replace("{2,}", "*").getRegex(),
    text: edit(inlineGfm.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
  };
  var block = {
    normal: blockNormal,
    gfm: blockGfm,
    pedantic: blockPedantic
  };
  var inline = {
    normal: inlineNormal,
    gfm: inlineGfm,
    breaks: inlineBreaks,
    pedantic: inlinePedantic
  };
  var escapeReplacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  var getEscapeReplacement = (ch) => escapeReplacements[ch];
  function escape2(html2, encode) {
    if (encode) {
      if (other.escapeTest.test(html2)) {
        return html2.replace(other.escapeReplace, getEscapeReplacement);
      }
    } else {
      if (other.escapeTestNoEncode.test(html2)) {
        return html2.replace(other.escapeReplaceNoEncode, getEscapeReplacement);
      }
    }
    return html2;
  }
  function cleanUrl(href) {
    try {
      href = encodeURI(href).replace(other.percentDecode, "%");
    } catch {
      return null;
    }
    return href;
  }
  function splitCells(tableRow, count) {
    const row = tableRow.replace(other.findPipe, (match, offset, str) => {
      let escaped = false;
      let curr = offset;
      while (--curr >= 0 && str[curr] === "\\") escaped = !escaped;
      if (escaped) {
        return "|";
      } else {
        return " |";
      }
    }), cells = row.split(other.splitPipe);
    let i = 0;
    if (!cells[0].trim()) {
      cells.shift();
    }
    if (cells.length > 0 && !cells.at(-1)?.trim()) {
      cells.pop();
    }
    if (count) {
      if (cells.length > count) {
        cells.splice(count);
      } else {
        while (cells.length < count) cells.push("");
      }
    }
    for (; i < cells.length; i++) {
      cells[i] = cells[i].trim().replace(other.slashPipe, "|");
    }
    return cells;
  }
  function rtrim(str, c, invert) {
    const l = str.length;
    if (l === 0) {
      return "";
    }
    let suffLen = 0;
    while (suffLen < l) {
      const currChar = str.charAt(l - suffLen - 1);
      if (currChar === c && !invert) {
        suffLen++;
      } else if (currChar !== c && invert) {
        suffLen++;
      } else {
        break;
      }
    }
    return str.slice(0, l - suffLen);
  }
  function findClosingBracket(str, b) {
    if (str.indexOf(b[1]) === -1) {
      return -1;
    }
    let level = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "\\") {
        i++;
      } else if (str[i] === b[0]) {
        level++;
      } else if (str[i] === b[1]) {
        level--;
        if (level < 0) {
          return i;
        }
      }
    }
    if (level > 0) {
      return -2;
    }
    return -1;
  }
  function outputLink(cap, link2, raw, lexer2, rules) {
    const href = link2.href;
    const title = link2.title || null;
    const text = cap[1].replace(rules.other.outputLinkReplace, "$1");
    lexer2.state.inLink = true;
    const token = {
      type: cap[0].charAt(0) === "!" ? "image" : "link",
      raw,
      href,
      title,
      text,
      tokens: lexer2.inlineTokens(text)
    };
    lexer2.state.inLink = false;
    return token;
  }
  function indentCodeCompensation(raw, text, rules) {
    const matchIndentToCode = raw.match(rules.other.indentCodeCompensation);
    if (matchIndentToCode === null) {
      return text;
    }
    const indentToCode = matchIndentToCode[1];
    return text.split("\n").map((node) => {
      const matchIndentInNode = node.match(rules.other.beginningSpace);
      if (matchIndentInNode === null) {
        return node;
      }
      const [indentInNode] = matchIndentInNode;
      if (indentInNode.length >= indentToCode.length) {
        return node.slice(indentToCode.length);
      }
      return node;
    }).join("\n");
  }
  var _Tokenizer = class {
    options;
    rules;
    // set by the lexer
    lexer;
    // set by the lexer
    constructor(options2) {
      this.options = options2 || _defaults;
    }
    space(src) {
      const cap = this.rules.block.newline.exec(src);
      if (cap && cap[0].length > 0) {
        return {
          type: "space",
          raw: cap[0]
        };
      }
    }
    code(src) {
      const cap = this.rules.block.code.exec(src);
      if (cap) {
        const text = cap[0].replace(this.rules.other.codeRemoveIndent, "");
        return {
          type: "code",
          raw: cap[0],
          codeBlockStyle: "indented",
          text: !this.options.pedantic ? rtrim(text, "\n") : text
        };
      }
    }
    fences(src) {
      const cap = this.rules.block.fences.exec(src);
      if (cap) {
        const raw = cap[0];
        const text = indentCodeCompensation(raw, cap[3] || "", this.rules);
        return {
          type: "code",
          raw,
          lang: cap[2] ? cap[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : cap[2],
          text
        };
      }
    }
    heading(src) {
      const cap = this.rules.block.heading.exec(src);
      if (cap) {
        let text = cap[2].trim();
        if (this.rules.other.endingHash.test(text)) {
          const trimmed = rtrim(text, "#");
          if (this.options.pedantic) {
            text = trimmed.trim();
          } else if (!trimmed || this.rules.other.endingSpaceChar.test(trimmed)) {
            text = trimmed.trim();
          }
        }
        return {
          type: "heading",
          raw: cap[0],
          depth: cap[1].length,
          text,
          tokens: this.lexer.inline(text)
        };
      }
    }
    hr(src) {
      const cap = this.rules.block.hr.exec(src);
      if (cap) {
        return {
          type: "hr",
          raw: rtrim(cap[0], "\n")
        };
      }
    }
    blockquote(src) {
      const cap = this.rules.block.blockquote.exec(src);
      if (cap) {
        let lines = rtrim(cap[0], "\n").split("\n");
        let raw = "";
        let text = "";
        const tokens = [];
        while (lines.length > 0) {
          let inBlockquote = false;
          const currentLines = [];
          let i;
          for (i = 0; i < lines.length; i++) {
            if (this.rules.other.blockquoteStart.test(lines[i])) {
              currentLines.push(lines[i]);
              inBlockquote = true;
            } else if (!inBlockquote) {
              currentLines.push(lines[i]);
            } else {
              break;
            }
          }
          lines = lines.slice(i);
          const currentRaw = currentLines.join("\n");
          const currentText = currentRaw.replace(this.rules.other.blockquoteSetextReplace, "\n    $1").replace(this.rules.other.blockquoteSetextReplace2, "");
          raw = raw ? `${raw}
${currentRaw}` : currentRaw;
          text = text ? `${text}
${currentText}` : currentText;
          const top = this.lexer.state.top;
          this.lexer.state.top = true;
          this.lexer.blockTokens(currentText, tokens, true);
          this.lexer.state.top = top;
          if (lines.length === 0) {
            break;
          }
          const lastToken = tokens.at(-1);
          if (lastToken?.type === "code") {
            break;
          } else if (lastToken?.type === "blockquote") {
            const oldToken = lastToken;
            const newText = oldToken.raw + "\n" + lines.join("\n");
            const newToken = this.blockquote(newText);
            tokens[tokens.length - 1] = newToken;
            raw = raw.substring(0, raw.length - oldToken.raw.length) + newToken.raw;
            text = text.substring(0, text.length - oldToken.text.length) + newToken.text;
            break;
          } else if (lastToken?.type === "list") {
            const oldToken = lastToken;
            const newText = oldToken.raw + "\n" + lines.join("\n");
            const newToken = this.list(newText);
            tokens[tokens.length - 1] = newToken;
            raw = raw.substring(0, raw.length - lastToken.raw.length) + newToken.raw;
            text = text.substring(0, text.length - oldToken.raw.length) + newToken.raw;
            lines = newText.substring(tokens.at(-1).raw.length).split("\n");
            continue;
          }
        }
        return {
          type: "blockquote",
          raw,
          tokens,
          text
        };
      }
    }
    list(src) {
      let cap = this.rules.block.list.exec(src);
      if (cap) {
        let bull = cap[1].trim();
        const isordered = bull.length > 1;
        const list2 = {
          type: "list",
          raw: "",
          ordered: isordered,
          start: isordered ? +bull.slice(0, -1) : "",
          loose: false,
          items: []
        };
        bull = isordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;
        if (this.options.pedantic) {
          bull = isordered ? bull : "[*+-]";
        }
        const itemRegex = this.rules.other.listItemRegex(bull);
        let endsWithBlankLine = false;
        while (src) {
          let endEarly = false;
          let raw = "";
          let itemContents = "";
          if (!(cap = itemRegex.exec(src))) {
            break;
          }
          if (this.rules.block.hr.test(src)) {
            break;
          }
          raw = cap[0];
          src = src.substring(raw.length);
          let line = cap[2].split("\n", 1)[0].replace(this.rules.other.listReplaceTabs, (t) => " ".repeat(3 * t.length));
          let nextLine = src.split("\n", 1)[0];
          let blankLine = !line.trim();
          let indent = 0;
          if (this.options.pedantic) {
            indent = 2;
            itemContents = line.trimStart();
          } else if (blankLine) {
            indent = cap[1].length + 1;
          } else {
            indent = cap[2].search(this.rules.other.nonSpaceChar);
            indent = indent > 4 ? 1 : indent;
            itemContents = line.slice(indent);
            indent += cap[1].length;
          }
          if (blankLine && this.rules.other.blankLine.test(nextLine)) {
            raw += nextLine + "\n";
            src = src.substring(nextLine.length + 1);
            endEarly = true;
          }
          if (!endEarly) {
            const nextBulletRegex = this.rules.other.nextBulletRegex(indent);
            const hrRegex = this.rules.other.hrRegex(indent);
            const fencesBeginRegex = this.rules.other.fencesBeginRegex(indent);
            const headingBeginRegex = this.rules.other.headingBeginRegex(indent);
            const htmlBeginRegex = this.rules.other.htmlBeginRegex(indent);
            while (src) {
              const rawLine = src.split("\n", 1)[0];
              let nextLineWithoutTabs;
              nextLine = rawLine;
              if (this.options.pedantic) {
                nextLine = nextLine.replace(this.rules.other.listReplaceNesting, "  ");
                nextLineWithoutTabs = nextLine;
              } else {
                nextLineWithoutTabs = nextLine.replace(this.rules.other.tabCharGlobal, "    ");
              }
              if (fencesBeginRegex.test(nextLine)) {
                break;
              }
              if (headingBeginRegex.test(nextLine)) {
                break;
              }
              if (htmlBeginRegex.test(nextLine)) {
                break;
              }
              if (nextBulletRegex.test(nextLine)) {
                break;
              }
              if (hrRegex.test(nextLine)) {
                break;
              }
              if (nextLineWithoutTabs.search(this.rules.other.nonSpaceChar) >= indent || !nextLine.trim()) {
                itemContents += "\n" + nextLineWithoutTabs.slice(indent);
              } else {
                if (blankLine) {
                  break;
                }
                if (line.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4) {
                  break;
                }
                if (fencesBeginRegex.test(line)) {
                  break;
                }
                if (headingBeginRegex.test(line)) {
                  break;
                }
                if (hrRegex.test(line)) {
                  break;
                }
                itemContents += "\n" + nextLine;
              }
              if (!blankLine && !nextLine.trim()) {
                blankLine = true;
              }
              raw += rawLine + "\n";
              src = src.substring(rawLine.length + 1);
              line = nextLineWithoutTabs.slice(indent);
            }
          }
          if (!list2.loose) {
            if (endsWithBlankLine) {
              list2.loose = true;
            } else if (this.rules.other.doubleBlankLine.test(raw)) {
              endsWithBlankLine = true;
            }
          }
          let istask = null;
          let ischecked;
          if (this.options.gfm) {
            istask = this.rules.other.listIsTask.exec(itemContents);
            if (istask) {
              ischecked = istask[0] !== "[ ] ";
              itemContents = itemContents.replace(this.rules.other.listReplaceTask, "");
            }
          }
          list2.items.push({
            type: "list_item",
            raw,
            task: !!istask,
            checked: ischecked,
            loose: false,
            text: itemContents,
            tokens: []
          });
          list2.raw += raw;
        }
        const lastItem = list2.items.at(-1);
        if (lastItem) {
          lastItem.raw = lastItem.raw.trimEnd();
          lastItem.text = lastItem.text.trimEnd();
        } else {
          return;
        }
        list2.raw = list2.raw.trimEnd();
        for (let i = 0; i < list2.items.length; i++) {
          this.lexer.state.top = false;
          list2.items[i].tokens = this.lexer.blockTokens(list2.items[i].text, []);
          if (!list2.loose) {
            const spacers = list2.items[i].tokens.filter((t) => t.type === "space");
            const hasMultipleLineBreaks = spacers.length > 0 && spacers.some((t) => this.rules.other.anyLine.test(t.raw));
            list2.loose = hasMultipleLineBreaks;
          }
        }
        if (list2.loose) {
          for (let i = 0; i < list2.items.length; i++) {
            list2.items[i].loose = true;
          }
        }
        return list2;
      }
    }
    html(src) {
      const cap = this.rules.block.html.exec(src);
      if (cap) {
        const token = {
          type: "html",
          block: true,
          raw: cap[0],
          pre: cap[1] === "pre" || cap[1] === "script" || cap[1] === "style",
          text: cap[0]
        };
        return token;
      }
    }
    def(src) {
      const cap = this.rules.block.def.exec(src);
      if (cap) {
        const tag2 = cap[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " ");
        const href = cap[2] ? cap[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "";
        const title = cap[3] ? cap[3].substring(1, cap[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : cap[3];
        return {
          type: "def",
          tag: tag2,
          raw: cap[0],
          href,
          title
        };
      }
    }
    table(src) {
      const cap = this.rules.block.table.exec(src);
      if (!cap) {
        return;
      }
      if (!this.rules.other.tableDelimiter.test(cap[2])) {
        return;
      }
      const headers = splitCells(cap[1]);
      const aligns = cap[2].replace(this.rules.other.tableAlignChars, "").split("|");
      const rows = cap[3]?.trim() ? cap[3].replace(this.rules.other.tableRowBlankLine, "").split("\n") : [];
      const item = {
        type: "table",
        raw: cap[0],
        header: [],
        align: [],
        rows: []
      };
      if (headers.length !== aligns.length) {
        return;
      }
      for (const align of aligns) {
        if (this.rules.other.tableAlignRight.test(align)) {
          item.align.push("right");
        } else if (this.rules.other.tableAlignCenter.test(align)) {
          item.align.push("center");
        } else if (this.rules.other.tableAlignLeft.test(align)) {
          item.align.push("left");
        } else {
          item.align.push(null);
        }
      }
      for (let i = 0; i < headers.length; i++) {
        item.header.push({
          text: headers[i],
          tokens: this.lexer.inline(headers[i]),
          header: true,
          align: item.align[i]
        });
      }
      for (const row of rows) {
        item.rows.push(splitCells(row, item.header.length).map((cell, i) => {
          return {
            text: cell,
            tokens: this.lexer.inline(cell),
            header: false,
            align: item.align[i]
          };
        }));
      }
      return item;
    }
    lheading(src) {
      const cap = this.rules.block.lheading.exec(src);
      if (cap) {
        return {
          type: "heading",
          raw: cap[0],
          depth: cap[2].charAt(0) === "=" ? 1 : 2,
          text: cap[1],
          tokens: this.lexer.inline(cap[1])
        };
      }
    }
    paragraph(src) {
      const cap = this.rules.block.paragraph.exec(src);
      if (cap) {
        const text = cap[1].charAt(cap[1].length - 1) === "\n" ? cap[1].slice(0, -1) : cap[1];
        return {
          type: "paragraph",
          raw: cap[0],
          text,
          tokens: this.lexer.inline(text)
        };
      }
    }
    text(src) {
      const cap = this.rules.block.text.exec(src);
      if (cap) {
        return {
          type: "text",
          raw: cap[0],
          text: cap[0],
          tokens: this.lexer.inline(cap[0])
        };
      }
    }
    escape(src) {
      const cap = this.rules.inline.escape.exec(src);
      if (cap) {
        return {
          type: "escape",
          raw: cap[0],
          text: cap[1]
        };
      }
    }
    tag(src) {
      const cap = this.rules.inline.tag.exec(src);
      if (cap) {
        if (!this.lexer.state.inLink && this.rules.other.startATag.test(cap[0])) {
          this.lexer.state.inLink = true;
        } else if (this.lexer.state.inLink && this.rules.other.endATag.test(cap[0])) {
          this.lexer.state.inLink = false;
        }
        if (!this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(cap[0])) {
          this.lexer.state.inRawBlock = true;
        } else if (this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(cap[0])) {
          this.lexer.state.inRawBlock = false;
        }
        return {
          type: "html",
          raw: cap[0],
          inLink: this.lexer.state.inLink,
          inRawBlock: this.lexer.state.inRawBlock,
          block: false,
          text: cap[0]
        };
      }
    }
    link(src) {
      const cap = this.rules.inline.link.exec(src);
      if (cap) {
        const trimmedUrl = cap[2].trim();
        if (!this.options.pedantic && this.rules.other.startAngleBracket.test(trimmedUrl)) {
          if (!this.rules.other.endAngleBracket.test(trimmedUrl)) {
            return;
          }
          const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), "\\");
          if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
            return;
          }
        } else {
          const lastParenIndex = findClosingBracket(cap[2], "()");
          if (lastParenIndex === -2) {
            return;
          }
          if (lastParenIndex > -1) {
            const start = cap[0].indexOf("!") === 0 ? 5 : 4;
            const linkLen = start + cap[1].length + lastParenIndex;
            cap[2] = cap[2].substring(0, lastParenIndex);
            cap[0] = cap[0].substring(0, linkLen).trim();
            cap[3] = "";
          }
        }
        let href = cap[2];
        let title = "";
        if (this.options.pedantic) {
          const link2 = this.rules.other.pedanticHrefTitle.exec(href);
          if (link2) {
            href = link2[1];
            title = link2[3];
          }
        } else {
          title = cap[3] ? cap[3].slice(1, -1) : "";
        }
        href = href.trim();
        if (this.rules.other.startAngleBracket.test(href)) {
          if (this.options.pedantic && !this.rules.other.endAngleBracket.test(trimmedUrl)) {
            href = href.slice(1);
          } else {
            href = href.slice(1, -1);
          }
        }
        return outputLink(cap, {
          href: href ? href.replace(this.rules.inline.anyPunctuation, "$1") : href,
          title: title ? title.replace(this.rules.inline.anyPunctuation, "$1") : title
        }, cap[0], this.lexer, this.rules);
      }
    }
    reflink(src, links) {
      let cap;
      if ((cap = this.rules.inline.reflink.exec(src)) || (cap = this.rules.inline.nolink.exec(src))) {
        const linkString = (cap[2] || cap[1]).replace(this.rules.other.multipleSpaceGlobal, " ");
        const link2 = links[linkString.toLowerCase()];
        if (!link2) {
          const text = cap[0].charAt(0);
          return {
            type: "text",
            raw: text,
            text
          };
        }
        return outputLink(cap, link2, cap[0], this.lexer, this.rules);
      }
    }
    emStrong(src, maskedSrc, prevChar = "") {
      let match = this.rules.inline.emStrongLDelim.exec(src);
      if (!match) return;
      if (match[3] && prevChar.match(this.rules.other.unicodeAlphaNumeric)) return;
      const nextChar = match[1] || match[2] || "";
      if (!nextChar || !prevChar || this.rules.inline.punctuation.exec(prevChar)) {
        const lLength = [...match[0]].length - 1;
        let rDelim, rLength, delimTotal = lLength, midDelimTotal = 0;
        const endReg = match[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
        endReg.lastIndex = 0;
        maskedSrc = maskedSrc.slice(-1 * src.length + lLength);
        while ((match = endReg.exec(maskedSrc)) != null) {
          rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
          if (!rDelim) continue;
          rLength = [...rDelim].length;
          if (match[3] || match[4]) {
            delimTotal += rLength;
            continue;
          } else if (match[5] || match[6]) {
            if (lLength % 3 && !((lLength + rLength) % 3)) {
              midDelimTotal += rLength;
              continue;
            }
          }
          delimTotal -= rLength;
          if (delimTotal > 0) continue;
          rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);
          const lastCharLength = [...match[0]][0].length;
          const raw = src.slice(0, lLength + match.index + lastCharLength + rLength);
          if (Math.min(lLength, rLength) % 2) {
            const text2 = raw.slice(1, -1);
            return {
              type: "em",
              raw,
              text: text2,
              tokens: this.lexer.inlineTokens(text2)
            };
          }
          const text = raw.slice(2, -2);
          return {
            type: "strong",
            raw,
            text,
            tokens: this.lexer.inlineTokens(text)
          };
        }
      }
    }
    codespan(src) {
      const cap = this.rules.inline.code.exec(src);
      if (cap) {
        let text = cap[2].replace(this.rules.other.newLineCharGlobal, " ");
        const hasNonSpaceChars = this.rules.other.nonSpaceChar.test(text);
        const hasSpaceCharsOnBothEnds = this.rules.other.startingSpaceChar.test(text) && this.rules.other.endingSpaceChar.test(text);
        if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
          text = text.substring(1, text.length - 1);
        }
        return {
          type: "codespan",
          raw: cap[0],
          text
        };
      }
    }
    br(src) {
      const cap = this.rules.inline.br.exec(src);
      if (cap) {
        return {
          type: "br",
          raw: cap[0]
        };
      }
    }
    del(src) {
      const cap = this.rules.inline.del.exec(src);
      if (cap) {
        return {
          type: "del",
          raw: cap[0],
          text: cap[2],
          tokens: this.lexer.inlineTokens(cap[2])
        };
      }
    }
    autolink(src) {
      const cap = this.rules.inline.autolink.exec(src);
      if (cap) {
        let text, href;
        if (cap[2] === "@") {
          text = cap[1];
          href = "mailto:" + text;
        } else {
          text = cap[1];
          href = text;
        }
        return {
          type: "link",
          raw: cap[0],
          text,
          href,
          tokens: [
            {
              type: "text",
              raw: text,
              text
            }
          ]
        };
      }
    }
    url(src) {
      let cap;
      if (cap = this.rules.inline.url.exec(src)) {
        let text, href;
        if (cap[2] === "@") {
          text = cap[0];
          href = "mailto:" + text;
        } else {
          let prevCapZero;
          do {
            prevCapZero = cap[0];
            cap[0] = this.rules.inline._backpedal.exec(cap[0])?.[0] ?? "";
          } while (prevCapZero !== cap[0]);
          text = cap[0];
          if (cap[1] === "www.") {
            href = "http://" + cap[0];
          } else {
            href = cap[0];
          }
        }
        return {
          type: "link",
          raw: cap[0],
          text,
          href,
          tokens: [
            {
              type: "text",
              raw: text,
              text
            }
          ]
        };
      }
    }
    inlineText(src) {
      const cap = this.rules.inline.text.exec(src);
      if (cap) {
        const escaped = this.lexer.state.inRawBlock;
        return {
          type: "text",
          raw: cap[0],
          text: cap[0],
          escaped
        };
      }
    }
  };
  var _Lexer = class __Lexer {
    tokens;
    options;
    state;
    tokenizer;
    inlineQueue;
    constructor(options2) {
      this.tokens = [];
      this.tokens.links = /* @__PURE__ */ Object.create(null);
      this.options = options2 || _defaults;
      this.options.tokenizer = this.options.tokenizer || new _Tokenizer();
      this.tokenizer = this.options.tokenizer;
      this.tokenizer.options = this.options;
      this.tokenizer.lexer = this;
      this.inlineQueue = [];
      this.state = {
        inLink: false,
        inRawBlock: false,
        top: true
      };
      const rules = {
        other,
        block: block.normal,
        inline: inline.normal
      };
      if (this.options.pedantic) {
        rules.block = block.pedantic;
        rules.inline = inline.pedantic;
      } else if (this.options.gfm) {
        rules.block = block.gfm;
        if (this.options.breaks) {
          rules.inline = inline.breaks;
        } else {
          rules.inline = inline.gfm;
        }
      }
      this.tokenizer.rules = rules;
    }
    /**
     * Expose Rules
     */
    static get rules() {
      return {
        block,
        inline
      };
    }
    /**
     * Static Lex Method
     */
    static lex(src, options2) {
      const lexer2 = new __Lexer(options2);
      return lexer2.lex(src);
    }
    /**
     * Static Lex Inline Method
     */
    static lexInline(src, options2) {
      const lexer2 = new __Lexer(options2);
      return lexer2.inlineTokens(src);
    }
    /**
     * Preprocessing
     */
    lex(src) {
      src = src.replace(other.carriageReturn, "\n");
      this.blockTokens(src, this.tokens);
      for (let i = 0; i < this.inlineQueue.length; i++) {
        const next = this.inlineQueue[i];
        this.inlineTokens(next.src, next.tokens);
      }
      this.inlineQueue = [];
      return this.tokens;
    }
    blockTokens(src, tokens = [], lastParagraphClipped = false) {
      if (this.options.pedantic) {
        src = src.replace(other.tabCharGlobal, "    ").replace(other.spaceLine, "");
      }
      while (src) {
        let token;
        if (this.options.extensions?.block?.some((extTokenizer) => {
          if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            return true;
          }
          return false;
        })) {
          continue;
        }
        if (token = this.tokenizer.space(src)) {
          src = src.substring(token.raw.length);
          const lastToken = tokens.at(-1);
          if (token.raw.length === 1 && lastToken !== void 0) {
            lastToken.raw += "\n";
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (token = this.tokenizer.code(src)) {
          src = src.substring(token.raw.length);
          const lastToken = tokens.at(-1);
          if (lastToken?.type === "paragraph" || lastToken?.type === "text") {
            lastToken.raw += "\n" + token.raw;
            lastToken.text += "\n" + token.text;
            this.inlineQueue.at(-1).src = lastToken.text;
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (token = this.tokenizer.fences(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.heading(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.hr(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.blockquote(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.list(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.html(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.def(src)) {
          src = src.substring(token.raw.length);
          const lastToken = tokens.at(-1);
          if (lastToken?.type === "paragraph" || lastToken?.type === "text") {
            lastToken.raw += "\n" + token.raw;
            lastToken.text += "\n" + token.raw;
            this.inlineQueue.at(-1).src = lastToken.text;
          } else if (!this.tokens.links[token.tag]) {
            this.tokens.links[token.tag] = {
              href: token.href,
              title: token.title
            };
          }
          continue;
        }
        if (token = this.tokenizer.table(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.lheading(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        let cutSrc = src;
        if (this.options.extensions?.startBlock) {
          let startIndex = Infinity;
          const tempSrc = src.slice(1);
          let tempStart;
          this.options.extensions.startBlock.forEach((getStartIndex) => {
            tempStart = getStartIndex.call({ lexer: this }, tempSrc);
            if (typeof tempStart === "number" && tempStart >= 0) {
              startIndex = Math.min(startIndex, tempStart);
            }
          });
          if (startIndex < Infinity && startIndex >= 0) {
            cutSrc = src.substring(0, startIndex + 1);
          }
        }
        if (this.state.top && (token = this.tokenizer.paragraph(cutSrc))) {
          const lastToken = tokens.at(-1);
          if (lastParagraphClipped && lastToken?.type === "paragraph") {
            lastToken.raw += "\n" + token.raw;
            lastToken.text += "\n" + token.text;
            this.inlineQueue.pop();
            this.inlineQueue.at(-1).src = lastToken.text;
          } else {
            tokens.push(token);
          }
          lastParagraphClipped = cutSrc.length !== src.length;
          src = src.substring(token.raw.length);
          continue;
        }
        if (token = this.tokenizer.text(src)) {
          src = src.substring(token.raw.length);
          const lastToken = tokens.at(-1);
          if (lastToken?.type === "text") {
            lastToken.raw += "\n" + token.raw;
            lastToken.text += "\n" + token.text;
            this.inlineQueue.pop();
            this.inlineQueue.at(-1).src = lastToken.text;
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (src) {
          const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
          if (this.options.silent) {
            console.error(errMsg);
            break;
          } else {
            throw new Error(errMsg);
          }
        }
      }
      this.state.top = true;
      return tokens;
    }
    inline(src, tokens = []) {
      this.inlineQueue.push({ src, tokens });
      return tokens;
    }
    /**
     * Lexing/Compiling
     */
    inlineTokens(src, tokens = []) {
      let maskedSrc = src;
      let match = null;
      if (this.tokens.links) {
        const links = Object.keys(this.tokens.links);
        if (links.length > 0) {
          while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
            if (links.includes(match[0].slice(match[0].lastIndexOf("[") + 1, -1))) {
              maskedSrc = maskedSrc.slice(0, match.index) + "[" + "a".repeat(match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
            }
          }
        }
      }
      while ((match = this.tokenizer.rules.inline.anyPunctuation.exec(maskedSrc)) != null) {
        maskedSrc = maskedSrc.slice(0, match.index) + "++" + maskedSrc.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
      }
      while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
        maskedSrc = maskedSrc.slice(0, match.index) + "[" + "a".repeat(match[0].length - 2) + "]" + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
      }
      let keepPrevChar = false;
      let prevChar = "";
      while (src) {
        if (!keepPrevChar) {
          prevChar = "";
        }
        keepPrevChar = false;
        let token;
        if (this.options.extensions?.inline?.some((extTokenizer) => {
          if (token = extTokenizer.call({ lexer: this }, src, tokens)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            return true;
          }
          return false;
        })) {
          continue;
        }
        if (token = this.tokenizer.escape(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.tag(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.link(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.reflink(src, this.tokens.links)) {
          src = src.substring(token.raw.length);
          const lastToken = tokens.at(-1);
          if (token.type === "text" && lastToken?.type === "text") {
            lastToken.raw += token.raw;
            lastToken.text += token.text;
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (token = this.tokenizer.emStrong(src, maskedSrc, prevChar)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.codespan(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.br(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.del(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (token = this.tokenizer.autolink(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        if (!this.state.inLink && (token = this.tokenizer.url(src))) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }
        let cutSrc = src;
        if (this.options.extensions?.startInline) {
          let startIndex = Infinity;
          const tempSrc = src.slice(1);
          let tempStart;
          this.options.extensions.startInline.forEach((getStartIndex) => {
            tempStart = getStartIndex.call({ lexer: this }, tempSrc);
            if (typeof tempStart === "number" && tempStart >= 0) {
              startIndex = Math.min(startIndex, tempStart);
            }
          });
          if (startIndex < Infinity && startIndex >= 0) {
            cutSrc = src.substring(0, startIndex + 1);
          }
        }
        if (token = this.tokenizer.inlineText(cutSrc)) {
          src = src.substring(token.raw.length);
          if (token.raw.slice(-1) !== "_") {
            prevChar = token.raw.slice(-1);
          }
          keepPrevChar = true;
          const lastToken = tokens.at(-1);
          if (lastToken?.type === "text") {
            lastToken.raw += token.raw;
            lastToken.text += token.text;
          } else {
            tokens.push(token);
          }
          continue;
        }
        if (src) {
          const errMsg = "Infinite loop on byte: " + src.charCodeAt(0);
          if (this.options.silent) {
            console.error(errMsg);
            break;
          } else {
            throw new Error(errMsg);
          }
        }
      }
      return tokens;
    }
  };
  var _Renderer = class {
    options;
    parser;
    // set by the parser
    constructor(options2) {
      this.options = options2 || _defaults;
    }
    space(token) {
      return "";
    }
    code({ text, lang, escaped }) {
      const langString = (lang || "").match(other.notSpaceStart)?.[0];
      const code = text.replace(other.endingNewline, "") + "\n";
      if (!langString) {
        return "<pre><code>" + (escaped ? code : escape2(code, true)) + "</code></pre>\n";
      }
      return '<pre><code class="language-' + escape2(langString) + '">' + (escaped ? code : escape2(code, true)) + "</code></pre>\n";
    }
    blockquote({ tokens }) {
      const body = this.parser.parse(tokens);
      return `<blockquote>
${body}</blockquote>
`;
    }
    html({ text }) {
      return text;
    }
    heading({ tokens, depth }) {
      return `<h${depth}>${this.parser.parseInline(tokens)}</h${depth}>
`;
    }
    hr(token) {
      return "<hr>\n";
    }
    list(token) {
      const ordered = token.ordered;
      const start = token.start;
      let body = "";
      for (let j = 0; j < token.items.length; j++) {
        const item = token.items[j];
        body += this.listitem(item);
      }
      const type = ordered ? "ol" : "ul";
      const startAttr = ordered && start !== 1 ? ' start="' + start + '"' : "";
      return "<" + type + startAttr + ">\n" + body + "</" + type + ">\n";
    }
    listitem(item) {
      let itemBody = "";
      if (item.task) {
        const checkbox = this.checkbox({ checked: !!item.checked });
        if (item.loose) {
          if (item.tokens[0]?.type === "paragraph") {
            item.tokens[0].text = checkbox + " " + item.tokens[0].text;
            if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === "text") {
              item.tokens[0].tokens[0].text = checkbox + " " + escape2(item.tokens[0].tokens[0].text);
              item.tokens[0].tokens[0].escaped = true;
            }
          } else {
            item.tokens.unshift({
              type: "text",
              raw: checkbox + " ",
              text: checkbox + " ",
              escaped: true
            });
          }
        } else {
          itemBody += checkbox + " ";
        }
      }
      itemBody += this.parser.parse(item.tokens, !!item.loose);
      return `<li>${itemBody}</li>
`;
    }
    checkbox({ checked }) {
      return "<input " + (checked ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
    }
    paragraph({ tokens }) {
      return `<p>${this.parser.parseInline(tokens)}</p>
`;
    }
    table(token) {
      let header = "";
      let cell = "";
      for (let j = 0; j < token.header.length; j++) {
        cell += this.tablecell(token.header[j]);
      }
      header += this.tablerow({ text: cell });
      let body = "";
      for (let j = 0; j < token.rows.length; j++) {
        const row = token.rows[j];
        cell = "";
        for (let k = 0; k < row.length; k++) {
          cell += this.tablecell(row[k]);
        }
        body += this.tablerow({ text: cell });
      }
      if (body) body = `<tbody>${body}</tbody>`;
      return "<table>\n<thead>\n" + header + "</thead>\n" + body + "</table>\n";
    }
    tablerow({ text }) {
      return `<tr>
${text}</tr>
`;
    }
    tablecell(token) {
      const content = this.parser.parseInline(token.tokens);
      const type = token.header ? "th" : "td";
      const tag2 = token.align ? `<${type} align="${token.align}">` : `<${type}>`;
      return tag2 + content + `</${type}>
`;
    }
    /**
     * span level renderer
     */
    strong({ tokens }) {
      return `<strong>${this.parser.parseInline(tokens)}</strong>`;
    }
    em({ tokens }) {
      return `<em>${this.parser.parseInline(tokens)}</em>`;
    }
    codespan({ text }) {
      return `<code>${escape2(text, true)}</code>`;
    }
    br(token) {
      return "<br>";
    }
    del({ tokens }) {
      return `<del>${this.parser.parseInline(tokens)}</del>`;
    }
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const cleanHref = cleanUrl(href);
      if (cleanHref === null) {
        return text;
      }
      href = cleanHref;
      let out = '<a href="' + href + '"';
      if (title) {
        out += ' title="' + escape2(title) + '"';
      }
      out += ">" + text + "</a>";
      return out;
    }
    image({ href, title, text, tokens }) {
      if (tokens) {
        text = this.parser.parseInline(tokens, this.parser.textRenderer);
      }
      const cleanHref = cleanUrl(href);
      if (cleanHref === null) {
        return escape2(text);
      }
      href = cleanHref;
      let out = `<img src="${href}" alt="${text}"`;
      if (title) {
        out += ` title="${escape2(title)}"`;
      }
      out += ">";
      return out;
    }
    text(token) {
      return "tokens" in token && token.tokens ? this.parser.parseInline(token.tokens) : "escaped" in token && token.escaped ? token.text : escape2(token.text);
    }
  };
  var _TextRenderer = class {
    // no need for block level renderers
    strong({ text }) {
      return text;
    }
    em({ text }) {
      return text;
    }
    codespan({ text }) {
      return text;
    }
    del({ text }) {
      return text;
    }
    html({ text }) {
      return text;
    }
    text({ text }) {
      return text;
    }
    link({ text }) {
      return "" + text;
    }
    image({ text }) {
      return "" + text;
    }
    br() {
      return "";
    }
  };
  var _Parser = class __Parser {
    options;
    renderer;
    textRenderer;
    constructor(options2) {
      this.options = options2 || _defaults;
      this.options.renderer = this.options.renderer || new _Renderer();
      this.renderer = this.options.renderer;
      this.renderer.options = this.options;
      this.renderer.parser = this;
      this.textRenderer = new _TextRenderer();
    }
    /**
     * Static Parse Method
     */
    static parse(tokens, options2) {
      const parser2 = new __Parser(options2);
      return parser2.parse(tokens);
    }
    /**
     * Static Parse Inline Method
     */
    static parseInline(tokens, options2) {
      const parser2 = new __Parser(options2);
      return parser2.parseInline(tokens);
    }
    /**
     * Parse Loop
     */
    parse(tokens, top = true) {
      let out = "";
      for (let i = 0; i < tokens.length; i++) {
        const anyToken = tokens[i];
        if (this.options.extensions?.renderers?.[anyToken.type]) {
          const genericToken = anyToken;
          const ret = this.options.extensions.renderers[genericToken.type].call({ parser: this }, genericToken);
          if (ret !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(genericToken.type)) {
            out += ret || "";
            continue;
          }
        }
        const token = anyToken;
        switch (token.type) {
          case "space": {
            out += this.renderer.space(token);
            continue;
          }
          case "hr": {
            out += this.renderer.hr(token);
            continue;
          }
          case "heading": {
            out += this.renderer.heading(token);
            continue;
          }
          case "code": {
            out += this.renderer.code(token);
            continue;
          }
          case "table": {
            out += this.renderer.table(token);
            continue;
          }
          case "blockquote": {
            out += this.renderer.blockquote(token);
            continue;
          }
          case "list": {
            out += this.renderer.list(token);
            continue;
          }
          case "html": {
            out += this.renderer.html(token);
            continue;
          }
          case "paragraph": {
            out += this.renderer.paragraph(token);
            continue;
          }
          case "text": {
            let textToken = token;
            let body = this.renderer.text(textToken);
            while (i + 1 < tokens.length && tokens[i + 1].type === "text") {
              textToken = tokens[++i];
              body += "\n" + this.renderer.text(textToken);
            }
            if (top) {
              out += this.renderer.paragraph({
                type: "paragraph",
                raw: body,
                text: body,
                tokens: [{ type: "text", raw: body, text: body, escaped: true }]
              });
            } else {
              out += body;
            }
            continue;
          }
          default: {
            const errMsg = 'Token with "' + token.type + '" type was not found.';
            if (this.options.silent) {
              console.error(errMsg);
              return "";
            } else {
              throw new Error(errMsg);
            }
          }
        }
      }
      return out;
    }
    /**
     * Parse Inline Tokens
     */
    parseInline(tokens, renderer = this.renderer) {
      let out = "";
      for (let i = 0; i < tokens.length; i++) {
        const anyToken = tokens[i];
        if (this.options.extensions?.renderers?.[anyToken.type]) {
          const ret = this.options.extensions.renderers[anyToken.type].call({ parser: this }, anyToken);
          if (ret !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(anyToken.type)) {
            out += ret || "";
            continue;
          }
        }
        const token = anyToken;
        switch (token.type) {
          case "escape": {
            out += renderer.text(token);
            break;
          }
          case "html": {
            out += renderer.html(token);
            break;
          }
          case "link": {
            out += renderer.link(token);
            break;
          }
          case "image": {
            out += renderer.image(token);
            break;
          }
          case "strong": {
            out += renderer.strong(token);
            break;
          }
          case "em": {
            out += renderer.em(token);
            break;
          }
          case "codespan": {
            out += renderer.codespan(token);
            break;
          }
          case "br": {
            out += renderer.br(token);
            break;
          }
          case "del": {
            out += renderer.del(token);
            break;
          }
          case "text": {
            out += renderer.text(token);
            break;
          }
          default: {
            const errMsg = 'Token with "' + token.type + '" type was not found.';
            if (this.options.silent) {
              console.error(errMsg);
              return "";
            } else {
              throw new Error(errMsg);
            }
          }
        }
      }
      return out;
    }
  };
  var _Hooks = class {
    options;
    block;
    constructor(options2) {
      this.options = options2 || _defaults;
    }
    static passThroughHooks = /* @__PURE__ */ new Set([
      "preprocess",
      "postprocess",
      "processAllTokens"
    ]);
    /**
     * Process markdown before marked
     */
    preprocess(markdown) {
      return markdown;
    }
    /**
     * Process HTML after marked is finished
     */
    postprocess(html2) {
      return html2;
    }
    /**
     * Process all tokens before walk tokens
     */
    processAllTokens(tokens) {
      return tokens;
    }
    /**
     * Provide function to tokenize markdown
     */
    provideLexer() {
      return this.block ? _Lexer.lex : _Lexer.lexInline;
    }
    /**
     * Provide function to parse tokens
     */
    provideParser() {
      return this.block ? _Parser.parse : _Parser.parseInline;
    }
  };
  var Marked = class {
    defaults = _getDefaults();
    options = this.setOptions;
    parse = this.parseMarkdown(true);
    parseInline = this.parseMarkdown(false);
    Parser = _Parser;
    Renderer = _Renderer;
    TextRenderer = _TextRenderer;
    Lexer = _Lexer;
    Tokenizer = _Tokenizer;
    Hooks = _Hooks;
    constructor(...args) {
      this.use(...args);
    }
    /**
     * Run callback for every token
     */
    walkTokens(tokens, callback) {
      let values = [];
      for (const token of tokens) {
        values = values.concat(callback.call(this, token));
        switch (token.type) {
          case "table": {
            const tableToken = token;
            for (const cell of tableToken.header) {
              values = values.concat(this.walkTokens(cell.tokens, callback));
            }
            for (const row of tableToken.rows) {
              for (const cell of row) {
                values = values.concat(this.walkTokens(cell.tokens, callback));
              }
            }
            break;
          }
          case "list": {
            const listToken = token;
            values = values.concat(this.walkTokens(listToken.items, callback));
            break;
          }
          default: {
            const genericToken = token;
            if (this.defaults.extensions?.childTokens?.[genericToken.type]) {
              this.defaults.extensions.childTokens[genericToken.type].forEach((childTokens) => {
                const tokens2 = genericToken[childTokens].flat(Infinity);
                values = values.concat(this.walkTokens(tokens2, callback));
              });
            } else if (genericToken.tokens) {
              values = values.concat(this.walkTokens(genericToken.tokens, callback));
            }
          }
        }
      }
      return values;
    }
    use(...args) {
      const extensions = this.defaults.extensions || { renderers: {}, childTokens: {} };
      args.forEach((pack) => {
        const opts = { ...pack };
        opts.async = this.defaults.async || opts.async || false;
        if (pack.extensions) {
          pack.extensions.forEach((ext) => {
            if (!ext.name) {
              throw new Error("extension name required");
            }
            if ("renderer" in ext) {
              const prevRenderer = extensions.renderers[ext.name];
              if (prevRenderer) {
                extensions.renderers[ext.name] = function(...args2) {
                  let ret = ext.renderer.apply(this, args2);
                  if (ret === false) {
                    ret = prevRenderer.apply(this, args2);
                  }
                  return ret;
                };
              } else {
                extensions.renderers[ext.name] = ext.renderer;
              }
            }
            if ("tokenizer" in ext) {
              if (!ext.level || ext.level !== "block" && ext.level !== "inline") {
                throw new Error("extension level must be 'block' or 'inline'");
              }
              const extLevel = extensions[ext.level];
              if (extLevel) {
                extLevel.unshift(ext.tokenizer);
              } else {
                extensions[ext.level] = [ext.tokenizer];
              }
              if (ext.start) {
                if (ext.level === "block") {
                  if (extensions.startBlock) {
                    extensions.startBlock.push(ext.start);
                  } else {
                    extensions.startBlock = [ext.start];
                  }
                } else if (ext.level === "inline") {
                  if (extensions.startInline) {
                    extensions.startInline.push(ext.start);
                  } else {
                    extensions.startInline = [ext.start];
                  }
                }
              }
            }
            if ("childTokens" in ext && ext.childTokens) {
              extensions.childTokens[ext.name] = ext.childTokens;
            }
          });
          opts.extensions = extensions;
        }
        if (pack.renderer) {
          const renderer = this.defaults.renderer || new _Renderer(this.defaults);
          for (const prop in pack.renderer) {
            if (!(prop in renderer)) {
              throw new Error(`renderer '${prop}' does not exist`);
            }
            if (["options", "parser"].includes(prop)) {
              continue;
            }
            const rendererProp = prop;
            const rendererFunc = pack.renderer[rendererProp];
            const prevRenderer = renderer[rendererProp];
            renderer[rendererProp] = (...args2) => {
              let ret = rendererFunc.apply(renderer, args2);
              if (ret === false) {
                ret = prevRenderer.apply(renderer, args2);
              }
              return ret || "";
            };
          }
          opts.renderer = renderer;
        }
        if (pack.tokenizer) {
          const tokenizer = this.defaults.tokenizer || new _Tokenizer(this.defaults);
          for (const prop in pack.tokenizer) {
            if (!(prop in tokenizer)) {
              throw new Error(`tokenizer '${prop}' does not exist`);
            }
            if (["options", "rules", "lexer"].includes(prop)) {
              continue;
            }
            const tokenizerProp = prop;
            const tokenizerFunc = pack.tokenizer[tokenizerProp];
            const prevTokenizer = tokenizer[tokenizerProp];
            tokenizer[tokenizerProp] = (...args2) => {
              let ret = tokenizerFunc.apply(tokenizer, args2);
              if (ret === false) {
                ret = prevTokenizer.apply(tokenizer, args2);
              }
              return ret;
            };
          }
          opts.tokenizer = tokenizer;
        }
        if (pack.hooks) {
          const hooks = this.defaults.hooks || new _Hooks();
          for (const prop in pack.hooks) {
            if (!(prop in hooks)) {
              throw new Error(`hook '${prop}' does not exist`);
            }
            if (["options", "block"].includes(prop)) {
              continue;
            }
            const hooksProp = prop;
            const hooksFunc = pack.hooks[hooksProp];
            const prevHook = hooks[hooksProp];
            if (_Hooks.passThroughHooks.has(prop)) {
              hooks[hooksProp] = (arg) => {
                if (this.defaults.async) {
                  return Promise.resolve(hooksFunc.call(hooks, arg)).then((ret2) => {
                    return prevHook.call(hooks, ret2);
                  });
                }
                const ret = hooksFunc.call(hooks, arg);
                return prevHook.call(hooks, ret);
              };
            } else {
              hooks[hooksProp] = (...args2) => {
                let ret = hooksFunc.apply(hooks, args2);
                if (ret === false) {
                  ret = prevHook.apply(hooks, args2);
                }
                return ret;
              };
            }
          }
          opts.hooks = hooks;
        }
        if (pack.walkTokens) {
          const walkTokens2 = this.defaults.walkTokens;
          const packWalktokens = pack.walkTokens;
          opts.walkTokens = function(token) {
            let values = [];
            values.push(packWalktokens.call(this, token));
            if (walkTokens2) {
              values = values.concat(walkTokens2.call(this, token));
            }
            return values;
          };
        }
        this.defaults = { ...this.defaults, ...opts };
      });
      return this;
    }
    setOptions(opt) {
      this.defaults = { ...this.defaults, ...opt };
      return this;
    }
    lexer(src, options2) {
      return _Lexer.lex(src, options2 ?? this.defaults);
    }
    parser(tokens, options2) {
      return _Parser.parse(tokens, options2 ?? this.defaults);
    }
    parseMarkdown(blockType) {
      const parse2 = (src, options2) => {
        const origOpt = { ...options2 };
        const opt = { ...this.defaults, ...origOpt };
        const throwError = this.onError(!!opt.silent, !!opt.async);
        if (this.defaults.async === true && origOpt.async === false) {
          return throwError(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
        }
        if (typeof src === "undefined" || src === null) {
          return throwError(new Error("marked(): input parameter is undefined or null"));
        }
        if (typeof src !== "string") {
          return throwError(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(src) + ", string expected"));
        }
        if (opt.hooks) {
          opt.hooks.options = opt;
          opt.hooks.block = blockType;
        }
        const lexer2 = opt.hooks ? opt.hooks.provideLexer() : blockType ? _Lexer.lex : _Lexer.lexInline;
        const parser2 = opt.hooks ? opt.hooks.provideParser() : blockType ? _Parser.parse : _Parser.parseInline;
        if (opt.async) {
          return Promise.resolve(opt.hooks ? opt.hooks.preprocess(src) : src).then((src2) => lexer2(src2, opt)).then((tokens) => opt.hooks ? opt.hooks.processAllTokens(tokens) : tokens).then((tokens) => opt.walkTokens ? Promise.all(this.walkTokens(tokens, opt.walkTokens)).then(() => tokens) : tokens).then((tokens) => parser2(tokens, opt)).then((html2) => opt.hooks ? opt.hooks.postprocess(html2) : html2).catch(throwError);
        }
        try {
          if (opt.hooks) {
            src = opt.hooks.preprocess(src);
          }
          let tokens = lexer2(src, opt);
          if (opt.hooks) {
            tokens = opt.hooks.processAllTokens(tokens);
          }
          if (opt.walkTokens) {
            this.walkTokens(tokens, opt.walkTokens);
          }
          let html2 = parser2(tokens, opt);
          if (opt.hooks) {
            html2 = opt.hooks.postprocess(html2);
          }
          return html2;
        } catch (e) {
          return throwError(e);
        }
      };
      return parse2;
    }
    onError(silent, async) {
      return (e) => {
        e.message += "\nPlease report this to https://github.com/markedjs/marked.";
        if (silent) {
          const msg = "<p>An error occurred:</p><pre>" + escape2(e.message + "", true) + "</pre>";
          if (async) {
            return Promise.resolve(msg);
          }
          return msg;
        }
        if (async) {
          return Promise.reject(e);
        }
        throw e;
      };
    }
  };
  var markedInstance = new Marked();
  function marked(src, opt) {
    return markedInstance.parse(src, opt);
  }
  marked.options = marked.setOptions = function(options2) {
    markedInstance.setOptions(options2);
    marked.defaults = markedInstance.defaults;
    changeDefaults(marked.defaults);
    return marked;
  };
  marked.getDefaults = _getDefaults;
  marked.defaults = _defaults;
  marked.use = function(...args) {
    markedInstance.use(...args);
    marked.defaults = markedInstance.defaults;
    changeDefaults(marked.defaults);
    return marked;
  };
  marked.walkTokens = function(tokens, callback) {
    return markedInstance.walkTokens(tokens, callback);
  };
  marked.parseInline = markedInstance.parseInline;
  marked.Parser = _Parser;
  marked.parser = _Parser.parse;
  marked.Renderer = _Renderer;
  marked.TextRenderer = _TextRenderer;
  marked.Lexer = _Lexer;
  marked.lexer = _Lexer.lex;
  marked.Tokenizer = _Tokenizer;
  marked.Hooks = _Hooks;
  marked.parse = marked;
  var options = marked.options;
  var setOptions = marked.setOptions;
  var use = marked.use;
  var walkTokens = marked.walkTokens;
  var parseInline = marked.parseInline;
  var parser = _Parser.parse;
  var lexer = _Lexer.lex;

  // client-markdown.js
  function textOnlyMarkdown(text) {
    text = text.replace(/\r\n?/g, "\n");
    function rewrite(source, tokens) {
      let offset = 0, output = "";
      for (const token of tokens || []) {
        if (!token.raw) continue;
        const index = source.indexOf(token.raw, offset);
        if (index < 0) continue;
        output += source.slice(offset, index);
        let replacement = token.raw;
        if (token.type === "image") {
          replacement = (token.text || "[image]").replace(/[\\`*_{}\[\]()#+.!<>|~-]/g, "\\$&");
        } else {
          const children = token.tokens || token.items || (token.type === "table" ? [...token.header, ...token.rows.flat()].flatMap((cell) => cell.tokens || []) : []);
          replacement = rewrite(replacement, children);
        }
        output += replacement;
        offset = index + token.raw.length;
      }
      return output + source.slice(offset);
    }
    return rewrite(text, marked.lexer(text, { gfm: true }));
  }

  // client-model-directory.js
  var BtwModelDirectory = class {
    constructor({ rpc, sourceSessionId, thread, onSaved, followLabel }) {
      Object.assign(this, { rpc, sourceSessionId, thread, onSaved, followLabel });
      this.followProvider = `btw-follow:${globalThis.crypto.randomUUID()}`;
      this.listeners = /* @__PURE__ */ new Set();
      this.disposed = false;
      this.generation = 0;
      this.state = { current: this.current(), groups: [], failures: [], status: "idle", pending: null, error: null, routable: null };
      this.publish({ groups: this.withRetained([]) });
    }
    current() {
      return this.thread.modelSettings?.mode === "follow" ? { provider: this.followProvider, model: "source" } : { ...this.thread.model };
    }
    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }
    getSnapshot() {
      return this.state;
    }
    publish(patch) {
      if (this.disposed) return;
      this.state = { ...this.state, ...patch };
      for (const listener of this.listeners) listener();
    }
    withRetained(groups) {
      const result = groups.filter((group2) => group2.id !== this.followProvider).map((group2) => ({ ...group2, models: [...group2.models] }));
      const route = this.thread.model;
      let group = result.find((group2) => group2.id === route.provider);
      if (!group) {
        group = { id: route.provider, name: route.provider, models: [] };
        result.push(group);
      }
      if (!group.models.some((model) => model.id === route.model)) group.models.push({ id: route.model, name: route.model });
      const source = this.thread.sourceModel ?? (this.thread.modelSettings?.mode === "follow" ? route : null);
      const sourceName = source && result.find((group2) => group2.id === source.provider)?.models.find((model) => model.id === source.model)?.name;
      result.push({ id: this.followProvider, name: this.followLabel, models: [{ id: "source", name: sourceName || source?.model || this.followLabel }] });
      return result;
    }
    setThread(thread) {
      if (this.disposed || thread.id !== this.thread.id || thread.revision < this.thread.revision) return;
      const before = JSON.stringify(this.current());
      this.thread = thread;
      if (before !== JSON.stringify(this.current())) this.publish({ current: this.current(), groups: this.withRetained(this.state.groups) });
    }
    async load() {
      this.loading?.abort();
      const controller = new AbortController();
      this.loading = controller;
      const generation = this.generation;
      this.publish({ status: this.state.pending ? "selecting" : "loading", error: null });
      try {
        const config = await this.rpc("config", { sourceSessionId: this.sourceSessionId, threadId: this.thread.id }, controller.signal);
        const groups = [], failures = [];
        const results = await Promise.allSettled((config.providers || []).map(async (provider) => {
          const result = await this.rpc("models", { provider: provider.id }, controller.signal);
          return {
            id: provider.id,
            name: provider.name || provider.id,
            models: (result.models || []).map((model) => ({ id: model.id, name: model.name || model.id }))
          };
        }));
        if (this.disposed || controller.signal.aborted) return;
        results.forEach((result, index) => result.status === "fulfilled" ? groups.push(result.value) : failures.push({ id: config.providers[index].id, name: config.providers[index].name || config.providers[index].id, message: result.reason?.message || String(result.reason) }));
        if (generation === this.generation && !this.state.pending && config.thread?.revision >= this.thread.revision) {
          this.thread = { ...config.thread, modelSettings: config.settings };
        }
        this.publish({ groups: this.withRetained(groups), failures, current: this.current(), status: this.state.pending ? "selecting" : "ready", routable: true });
      } catch (error) {
        if (!controller.signal.aborted) this.publish({ status: this.state.pending ? "selecting" : "error", error: error.message });
      }
    }
    async select(selection) {
      if (this.disposed) return;
      if (this.thread.status === "running" || this.state.pending) return { ok: false, error: { code: "THREAD_BUSY", message: "Stop or wait for the current reply before changing its model." } };
      const settings = selection.provider === this.followProvider && selection.model === "source" ? { mode: "follow" } : { mode: "fixed", provider: selection.provider, model: selection.model };
      this.generation++;
      this.publish({ status: "selecting", pending: selection, error: null });
      try {
        const result = await this.rpc("config", { sourceSessionId: this.sourceSessionId, threadId: this.thread.id, settings });
        if (this.disposed) return;
        if (!result.thread || result.thread.id !== this.thread.id) throw new Error("Model save returned no matching BTW thread.");
        this.thread = { ...result.thread, modelSettings: result.settings };
        this.publish({ current: this.current(), groups: this.withRetained(this.state.groups), pending: null, status: "ready", error: null });
        this.onSaved(result.thread);
        return { ok: true, value: void 0 };
      } catch (error) {
        this.publish({ status: "error", pending: null, error: error.message });
        return { ok: false, error: { code: error.code || "BTW_ERROR", message: error.message } };
      }
    }
    dispose() {
      this.disposed = true;
      this.loading?.abort();
      this.listeners.clear();
    }
  };

  // client.source.js
  window.__ModuleLoader__.load({
    id: "dsh-btw",
    factory(require2) {
      const React = require2("react");
      const { MarkdownText, MarkdownDelegateProvider, IconCopyOutlineRegular, IconCheckOutlineRegular, IconChevronDownOutlineRegular, IconApiOutlineRegular, IconGaugeOutlineRegular, IconDatabaseOutlineRegular, Tooltip, useAnchoredPosition, useDismissOnOutsidePointer } = require2("@deepseek-ai/dsh-client-ui-primitives");
      const { createPortal } = require2("react-dom");
      const h = React.createElement;
      const { useState, useEffect, useRef, useCallback, useSyncExternalStore } = React;
      const words = {
        zh: {
          title: "dsh-btw",
          ask: "\u987A\u4FBF\u95EE\u4E00\u53E5",
          loading: "\u6B63\u5728\u8BFB\u53D6\u4E0A\u4E0B\u6587\u2026",
          retry: "\u91CD\u8BD5\u8FDE\u63A5",
          context: "\u4E0A\u4E0B\u6587\u4E3A\u622A\u81F3\u8FD9\u6761\u56DE\u7B54\u7684\u6587\u5B57\u95EE\u7B54\u3002",
          empty: "\u6709\u4EC0\u4E48\u60F3\u987A\u4FBF\u95EE\u7684\uFF1F",
          placeholder: "\u56F4\u7ED5\u8FD9\u6761\u56DE\u7B54\u7EE7\u7EED\u95EE\u2026",
          send: "\u53D1\u9001",
          stop: "\u505C\u6B62",
          stopping: "\u6B63\u5728\u505C\u6B62\u2026",
          thinking: "\u6B63\u5728\u601D\u8003\u2026",
          running: "\u6B63\u5728\u56DE\u7B54",
          stopped: "\u5DF2\u505C\u6B62",
          settings: "\u6A21\u578B\u8BBE\u7F6E",
          done: "\u8FD4\u56DE\u8FFD\u95EE",
          copy: "\u590D\u5236",
          copied: "\u5DF2\u590D\u5236",
          code: "\u4EE3\u7801",
          wrap: "\u81EA\u52A8\u6362\u884C",
          unwrap: "\u53D6\u6D88\u6362\u884C",
          footnotes: "\u811A\u6CE8",
          elapsed: "\u8017\u65F6",
          firstToken: "\u9996\u5B57",
          outputTokens: "\u8F93\u51FA token",
          usage: "\u7528\u91CF",
          replyStats: "\u56DE\u590D\u7EDF\u8BA1",
          discussionStats: "\u4F1A\u8BDD\u7EDF\u8BA1",
          llmTime: "\u6A21\u578B\u7528\u65F6",
          toolTime: "\u5DE5\u5177\u8C03\u7528\u7528\u65F6",
          avgTtft: "\u9996 token \u5E73\u5747\uFF08TTFT\uFF09",
          decodeSpeed: "\u8F93\u51FA\u901F\u5EA6\uFF08TPS\uFF09",
          tokenUsage: "Token \u7528\u91CF",
          secondUnit: "\u79D2",
          minuteUnit: "\u5206",
          inputTokens: "\u8F93\u5165 token",
          cacheRead: "\u7F13\u5B58\u8BFB\u53D6",
          cacheWrite: "\u7F13\u5B58\u5199\u5165",
          replies: "\u6B21\u56DE\u590D",
          recordedUsage: "\u5DF2\u8BB0\u5F55\u7528\u91CF",
          turns: "\u8F6E",
          steps: "\u6B65",
          cacheHit: "\u7F13\u5B58\u547D\u4E2D",
          contextUsed: "\u4E0A\u4E0B\u6587\u5360\u7528",
          capacity: "\u4E0A\u4E0B\u6587\u5BB9\u91CF",
          latestUsage: "\u6700\u8FD1\u8BF7\u6C42\u7528\u91CF",
          noData: "\u6682\u65E0\u6570\u636E",
          updated: "\u66F4\u65B0\u4E8E",
          justNow: "\u521A\u521A",
          minutesAgo: "\u5206\u949F\u524D",
          hoursAgo: "\u5C0F\u65F6\u524D",
          sessionCost: "\u4F1A\u8BDD\u8D39\u7528",
          noPricing: "\u6682\u65E0\u8BA1\u4EF7",
          noPricingHint: "\u6682\u4E0D\u652F\u6301\u8D39\u7528\u7EDF\u8BA1\u3002",
          you: "\u4F60",
          assistant: "dsh-btw",
          hint: "Enter \u53D1\u9001 \xB7 Shift+Enter \u6362\u884C",
          follow: "\u8DDF\u968F\u6240\u70B9\u56DE\u7B54\u7684\u6A21\u578B",
          fixed: "\u4F7F\u7528\u6307\u5B9A\u6A21\u578B",
          modelMode: "\u9ED8\u8BA4\u6A21\u578B",
          provider: "\u63D0\u4F9B\u5546",
          model: "\u6A21\u578B",
          select: "\u8BF7\u9009\u62E9",
          save: "\u4FDD\u5B58\u8BBE\u7F6E",
          saved: "\u5DF2\u4FDD\u5B58",
          modelHint: "\u7528\u4E8E\u65B0\u8BA8\u8BBA\u3002",
          threadModel: "\u5F53\u524D\u8BA8\u8BBA\u6A21\u578B",
          modelBusy: "\u56DE\u590D\u7ED3\u675F\u6216\u505C\u6B62\u540E\u53EF\u5207\u6362\u6A21\u578B\u3002",
          noProviders: "\u6CA1\u6709\u53EF\u7528\u63D0\u4F9B\u5546\uFF0C\u8BF7\u5148\u5728 DSH \u6A21\u578B\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u3002",
          missingModel: "\u8BF7\u9009\u62E9\u63D0\u4F9B\u5546\u548C\u6A21\u578B\u3002",
          source: "\u5F15\u7528\u7684\u56DE\u7B54",
          noSource: "\u8BF7\u4ECE\u4E00\u6761\u5DF2\u5B8C\u6210\u56DE\u7B54\u65C1\u7684 BTW \u6309\u94AE\u6253\u5F00\u3002",
          prompt1: "\u8FD9\u6BB5\u80FD\u4E0D\u80FD\u8BF4\u5F97\u66F4\u76F4\u767D\u4E00\u70B9\uFF1F",
          prompt2: "\u4E3A\u4EC0\u4E48\u9009\u62E9\u8FD9\u4E2A\u65B9\u6848\uFF1F",
          connectionError: "\u8FDE\u63A5\u4E2D\u65AD\uFF0C\u8BF7\u91CD\u8BD5\u3002",
          unavailable: "\u5F53\u524D\u9875\u9762\u65E0\u6CD5\u6253\u5F00\u53F3\u4FA7\u8BA8\u8BBA\u3002",
          tooLong: "\u95EE\u9898\u4E0D\u80FD\u8D85\u8FC7 20,000 \u4E2A\u5B57\u7B26\u3002",
          noText: "\u8BF7\u8F93\u5165\u95EE\u9898\u3002"
        },
        en: {
          title: "dsh-btw",
          ask: "Ask on the side",
          loading: "Loading context\u2026",
          retry: "Reconnect",
          context: "Context includes text messages through this answer.",
          empty: "A quick question on the side?",
          placeholder: "Ask about this answer\u2026",
          send: "Send",
          stop: "Stop",
          stopping: "Stopping\u2026",
          thinking: "Thinking\u2026",
          running: "Answering",
          stopped: "Stopped",
          settings: "Model settings",
          done: "Back to chat",
          copy: "Copy",
          copied: "Copied",
          code: "Code",
          wrap: "Wrap lines",
          unwrap: "Unwrap lines",
          footnotes: "Footnotes",
          elapsed: "Elapsed",
          firstToken: "First token",
          outputTokens: "Output tokens",
          usage: "Usage",
          replyStats: "Reply statistics",
          discussionStats: "Session statistics",
          llmTime: "Model time",
          toolTime: "Tool time",
          avgTtft: "Average TTFT",
          decodeSpeed: "Decode speed (TPS)",
          tokenUsage: "Token usage",
          secondUnit: "s",
          minuteUnit: "m",
          inputTokens: "Input tokens",
          cacheRead: "Cache read",
          cacheWrite: "Cache write",
          replies: "replies",
          recordedUsage: "Recorded usage",
          turns: "turns",
          steps: "steps",
          cacheHit: "Cache hit",
          contextUsed: "Context usage",
          capacity: "Context capacity",
          latestUsage: "Last request tokens",
          noData: "Unavailable",
          updated: "Updated",
          justNow: "just now",
          minutesAgo: "min ago",
          hoursAgo: "hr ago",
          sessionCost: "Session cost",
          noPricing: "Unpriced",
          noPricingHint: "Cost tracking is not available yet.",
          you: "You",
          assistant: "dsh-btw",
          hint: "Enter to send \xB7 Shift+Enter for a new line",
          follow: "Use the source answer\u2019s model",
          fixed: "Use a specific model",
          modelMode: "Default model",
          provider: "Provider",
          model: "Model",
          select: "Choose\u2026",
          save: "Save settings",
          saved: "Saved",
          modelHint: "Applies to new threads.",
          threadModel: "Current thread model",
          modelBusy: "Stop or wait for the current reply before changing its model.",
          noProviders: "No providers available. Configure one in DSH model settings first.",
          missingModel: "Choose a provider and model.",
          source: "Source answer",
          noSource: "Open BTW next to a completed answer.",
          prompt1: "Could you explain this more plainly?",
          prompt2: "Why did you choose this approach?",
          connectionError: "Connection interrupted. Please reconnect.",
          unavailable: "The sidebar is unavailable on this page.",
          tooLong: "Keep the question within 20,000 characters.",
          noText: "Enter a question."
        }
      };
      const css = `
      .btw-root{--btw-bg:var(--dsw-alias-bg-base);--btw-border:var(--dsw-alias-border-l1);--btw-text:var(--dsw-alias-label-primary);--btw-muted:var(--dsw-alias-label-secondary);--btw-accent:var(--dsw-alias-state-business-primary);color:var(--btw-text);font-family:var(--dsw-font-family,inherit);font-size:var(--dsh-content-font-size,14px);line-height:calc(24px + var(--dsh-content-font-delta,0px));box-sizing:border-box;min-width:0}
      .btw-root *{box-sizing:border-box}.btw-panel{height:100%;min-height:0;display:flex;flex-direction:column;background:var(--btw-bg)}
      .btw-root button[data-btw-control],.btw-root select,.btw-root textarea,.btw-root input{font:inherit;color:inherit}
      .btw-root button[data-btw-control]{cursor:pointer;background:transparent;border:0;border-radius:var(--dsw-radius-sm,6px);padding:6px 8px;line-height:20px}
      .btw-root button[data-btw-control]:hover{background:var(--dsw-alias-interactive-bg-hover)}.btw-root button[data-btw-control]:disabled{opacity:.4;cursor:default}
      .btw-root :is(button[data-btw-control],input,select,textarea):focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--btw-accent));outline-offset:2px}
      .btw-icon{display:inline-flex;align-items:center;justify-content:center;gap:5px;font-size:12px!important;vertical-align:middle}
      .btw-action{position:relative;display:inline-flex}.btw-action>button{color:var(--dsw-alias-label-tertiary);width:calc(28px + var(--dsh-content-font-delta,0px));height:calc(28px + var(--dsh-content-font-delta,0px));padding:6px}.btw-action>button svg{width:calc(17px + var(--dsh-content-font-delta,0px));height:calc(17px + var(--dsh-content-font-delta,0px))}
      .btw-action-error{position:absolute;bottom:100%;right:0;z-index:3;width:240px;padding:8px;background:var(--dsw-specific-menu,var(--btw-bg));border:1px solid var(--btw-border);border-radius:var(--dsw-radius-md,8px);color:var(--dsw-alias-state-error-primary);font-size:12px}
      .btw-panel{container-type:inline-size;--btw-gutter:clamp(16px,4.8cqw,40px);--btw-width:var(--dsh-chat-content-width,748px)}
      .btw-scroll{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:24px var(--btw-gutter) 16px;scrollbar-gutter:stable;container-type:inline-size}
      .btw-column{width:100%;max-width:var(--btw-width);margin:0 auto;min-width:0}
      .btw-empty{padding:32px 0}.btw-empty>svg{color:var(--dsw-alias-label-tertiary)}.btw-empty h3{font-size:18px;font-weight:500;margin:12px 0 8px}.btw-empty p{font-size:var(--dsh-content-font-size-secondary,13px);line-height:22px;color:var(--btw-muted);margin:0 0 18px}
      .btw-suggestions{display:flex;align-items:flex-start;flex-direction:column;gap:8px}.btw-suggestions button{border:1px solid var(--btw-border);border-radius:var(--dsw-radius-lg,12px);text-align:left;font-size:12px}
      .btw-message{margin-bottom:28px;min-width:0;display:flex;flex-direction:column;align-items:flex-start}.btw-message[data-role=user]{align-items:flex-end;margin-bottom:24px}
      .btw-message-actions{display:flex;align-items:center;gap:8px;min-height:28px;margin-top:16px;margin-left:-6px;color:var(--dsw-alias-label-tertiary);font-size:12px}.btw-message[data-role=user] .btw-message-actions{margin:6px -6px 0 0}
      .btw-root .btw-message-actions button{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:6px}.btw-message-actions button svg{width:17px;height:17px}
      .btw-sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
      .btw-user{max-width:82%;white-space:pre-wrap;overflow-wrap:anywhere;padding:10px 16px;background:var(--dsw-specific-bubble);border-radius:var(--dsw-radius-xl,16px);line-height:calc(22px + var(--dsh-content-font-delta,0px))}
      .btw-markdown{width:100%;min-width:0;overflow-wrap:anywhere}.btw-markdown>div{min-width:0}
      .btw-stat{display:inline-flex;min-width:0;font-size:calc(var(--dsh-content-font-size-secondary,13px) - 1px);line-height:calc(20px + var(--dsh-content-font-delta-secondary,0px));font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-tertiary)}
      .btw-root button.btw-stat-trigger{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:100%;padding:1px 8px;font:inherit;color:var(--dsw-alias-label-tertiary);white-space:nowrap}.btw-stat-trigger:hover,.btw-stat-trigger[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--btw-muted)}.btw-stat-trigger>svg{width:14px;height:14px;flex:none}.btw-stat-trigger>span{overflow:hidden;text-overflow:ellipsis}
      /* rc.2 ui-chat/stat-dialog.module.css: same geometry and typography,
         with an opaque base below the menu tint to keep sidebar text legible. */
      .btw-root.btw-stat-panel{z-index:1100;box-sizing:border-box;border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-base,#fff);background-image:linear-gradient(var(--dsw-specific-menu,transparent),var(--dsw-specific-menu,transparent));width:max-content;min-width:min(300px,100vw - 24px);max-width:min(440px,100vw - 24px);max-height:calc(100vh - 24px);overflow:auto;--dsw-elevation-stroke-color:var(--dsw-alias-border-l1);box-shadow:var(--dsw-elevation-prominent);color:var(--dsw-alias-label-secondary);cursor:default;border:0;padding:16px;font-size:12px;line-height:18px;position:fixed}
      .btw-stat-title{color:var(--dsw-alias-label-primary);justify-content:space-between;gap:16px;margin-bottom:8px;font-weight:500;display:flex}.btw-stat-title-rule{border-top:.5px solid var(--dsw-alias-border-l2);margin-bottom:10px}.btw-stat-title-value{font-variant-numeric:tabular-nums}.btw-stat-title-label{align-items:center;gap:6px;min-width:0;display:inline-flex}.btw-stat-title-label svg{flex:none;width:14px;height:14px}
      .btw-stat-panel dl{color:var(--dsw-alias-label-tertiary);grid-template-columns:minmax(76px,auto) minmax(0,1fr);gap:6px 16px;margin:0;display:grid}.btw-stat-panel dt,.btw-stat-panel dd{min-width:0;margin:0}.btw-stat-panel dd{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;text-align:right}.btw-stat-panel p{margin:8px 0 0}
      .btw-note{font-size:12px;line-height:20px;color:var(--btw-muted);padding:8px 0}.btw-error{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:20px;white-space:pre-wrap;overflow-wrap:anywhere;padding:9px 12px;border-left:2px solid currentColor;margin:8px 0}.btw-status{font-size:var(--dsh-content-font-size-secondary,13px);color:var(--dsw-alias-label-deep-diving,var(--btw-muted))}
      .btw-composer{flex:none;min-width:0;padding:0 max(16px,calc(var(--btw-gutter) - 16px)) 4px;background:var(--btw-bg)}
      .btw-composer-inner{position:relative;max-width:calc(var(--btw-width) + 32px);width:100%;margin:0 auto}
      .btw-input-card{--dsw-elevation-stroke-color:var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-panel,24px);background:var(--dsw-specific-input-major);box-shadow:var(--dsw-elevation-soft);padding-top:8px;display:flex;flex-direction:column;gap:12px}
      .btw-composer textarea{box-sizing:border-box;display:block;width:100%;height:36px;min-height:36px;max-height:200px;resize:none;background:transparent;border:0;border-radius:var(--dsw-radius-md,8px);padding:4px 14px 0;line-height:inherit;outline:none;caret-color:var(--btw-accent)}.btw-composer textarea::placeholder{color:var(--dsw-alias-label-caption)}.btw-root .btw-composer textarea:focus-visible{outline:none}.btw-input-card:focus-within{--dsw-elevation-stroke-color:var(--dsw-alias-border-l2)}
      .btw-composer-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;min-width:0;padding:2px 8px 6px}
      .btw-root button.btw-context-toggle{display:inline-flex;align-items:center;gap:6px;min-width:28px;flex-shrink:0;height:28px;font-size:13px;color:var(--btw-muted);padding:0 6px}.btw-context-toggle svg{width:16px;height:16px;flex:none}
      .btw-composer-trailing{display:flex;align-items:center;justify-content:flex-end;min-width:0;gap:12px;margin-left:auto}
      .btw-native-model{min-width:0}.btw-native-model>div{min-width:0}.btw-model{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .btw-root button.btw-send{display:grid;place-items:center;width:34px;height:34px;flex:none;padding:0;border-radius:999px;background:var(--dsw-alias-button-info-fill);color:#fff;transform:translateY(-2px)}.btw-root button.btw-send:hover:not(:disabled){background:var(--dsw-alias-button-info-hover)}.btw-send svg{width:16px;height:16px}
      .btw-dock{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:4px 12px;min-height:28px;max-width:100%;padding-top:4px;color:var(--dsw-alias-label-tertiary)}.btw-dock:empty{display:none}.btw-dock .btw-stat{max-width:100%}.btw-dock time{font-size:12px;line-height:20px;white-space:nowrap}.btw-cost-badge{border:1px solid var(--btw-border);border-radius:4px;padding:0 3px;margin-left:4px;font-size:10px}
      .btw-root.btw-context-panel{width:min(480px,calc(100vw - 24px))}.btw-context-panel p{margin:8px 0 0}.btw-source{white-space:pre-wrap;border-left:2px solid var(--btw-border);padding-left:12px}
      .btw-root button.btw-primary{background:var(--dsw-alias-button-info-fill);color:#fff;border-radius:999px;padding:6px 12px;font-size:13px;font-weight:500}.btw-root button.btw-primary:hover{background:var(--dsw-alias-button-info-hover)}
      @container (width<440px){.btw-context-toggle>span{display:none}.btw-composer-trailing{gap:8px}.btw-native-model{max-width:calc(100cqw - 120px)}.btw-scroll{padding-top:16px}.btw-dock{gap:4px}}
      .btw-settings{padding:18px;overflow:auto;max-width:620px}.btw-settings h3{font-size:16px;font-weight:500;margin:0 0 12px}.btw-field{display:block;margin:16px 0;font-size:13px}.btw-field>span{display:block;margin-bottom:7px}.btw-field select,.btw-field input{display:block;width:100%;min-height:36px;background:var(--dsw-specific-input-major);border:1px solid var(--btw-border);border-radius:var(--dsw-radius-sm,6px);padding:7px 9px}.btw-settings p{font-size:12px;color:var(--btw-muted);line-height:20px}.btw-setting-actions{display:flex;align-items:center;gap:10px}.btw-saved{font-size:12px;color:var(--dsw-alias-state-success-primary)}
      @media(prefers-reduced-motion:no-preference){.btw-pulse{animation:btw-pulse 1.5s ease-in-out infinite}@keyframes btw-pulse{50%{opacity:.45}}}
    `;
      function Icon({ size = 16 }) {
        return h(
          "svg",
          { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, "aria-hidden": true },
          h("path", { d: "M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a8 8 0 1 1 18 0Z" }),
          h("path", { d: "M7 9h8M7 13h5", strokeLinecap: "round" })
        );
      }
      return {
        inject: ["slots", "sidebarRight", "sidebarRightTabs", "connection", "locale"],
        apply(ctx) {
          ctx.effect(() => ctx.locale.register("btw", "zh", words.zh));
          ctx.effect(() => ctx.locale.register("btw", "en", words.en));
          const translate = ctx.locale.bind("btw");
          function useT() {
            useSyncExternalStore((fn) => ctx.locale.subscribe(fn), () => ctx.locale.getLocale(), () => ctx.locale.getLocale());
            return translate;
          }
          const focusTargets = /* @__PURE__ */ new Map();
          const lifetime = new AbortController();
          ctx.effect(() => () => lifetime.abort());
          async function rpc(action, data = {}, signal) {
            const result = await ctx.connection.rpc.call("/btw-rpc", "dsh-btw/dispatch", { action, ...data }, signal ? AbortSignal.any([signal, lifetime.signal]) : lifetime.signal);
            if (!result.ok) throw Object.assign(new Error(result.error?.message || "BTW request failed"), { code: result.error?.code });
            return result.value;
          }
          const address = (sessionId, messageId) => `dsh-resource://btw/${encodeURIComponent(sessionId)}/${encodeURIComponent(messageId)}`;
          function parseAddress(value) {
            try {
              const url = new URL(value);
              const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
              return url.protocol === "dsh-resource:" && url.hostname === "btw" && parts.length === 2 ? { sourceSessionId: parts[0], messageId: parts[1] } : null;
            } catch {
              return null;
            }
          }
          function Markdown({ text, streaming = false }) {
            const t = useT();
            const labels = React.useMemo(() => ({ code: {
              copyLabel: t("copy"),
              copiedLabel: t("copied"),
              toolbarLabels: { codeLabel: t("code"), wrapLabel: t("wrap"), unwrapLabel: t("unwrap") }
            }, footnotes: t("footnotes") }), [t, ctx.locale.getLocale()]);
            const safeText = React.useMemo(() => textOnlyMarkdown(text || ""), [text]);
            return h("div", { className: "btw-markdown" }, h(MarkdownDelegateProvider, {
              openExternalLink: (url) => {
                if (/^(https?:|mailto:)/i.test(url)) window.open(url, "_blank", "noopener,noreferrer");
              }
            }, h(MarkdownText, { text: safeText, streaming, labels })));
          }
          const count = (value) => value >= 1e6 ? `${(value / 1e6).toFixed(1)}M` : value >= 1e3 ? `${(value / 1e3).toFixed(1)}k` : String(value);
          const validCount = (value) => Number.isFinite(value) && value >= 0;
          const speedText = (value) => `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10} tok/s`;
          function durationText(ms, t) {
            if (ms < 6e4) return `${Math.round(ms / 100) / 10}${t("secondUnit")}`;
            const seconds = Math.round(ms / 1e3);
            return `${Math.floor(seconds / 60)}${t("minuteUnit")}${seconds % 60}${t("secondUnit")}`;
          }
          function readings(message, t) {
            const rows = [], metrics = message.metrics, usage = message.usage;
            if (validCount(metrics?.tokensPerSecond)) rows.push(["TPS", `${metrics.tokensPerSecond.toFixed(1)} tok/s`]);
            for (const [key, label] of [["inputTokens", "inputTokens"], ["cacheReadTokens", "cacheRead"], ["cacheWriteTokens", "cacheWrite"], ["outputTokens", "outputTokens"]]) {
              if (validCount(usage?.[key])) rows.push([t(label), String(usage[key])]);
            }
            if (validCount(metrics?.durationMs)) rows.push([t("elapsed"), `${(metrics.durationMs / 1e3).toFixed(1)}s`]);
            if (validCount(metrics?.firstTokenMs)) rows.push([t("firstToken"), `${(metrics.firstTokenMs / 1e3).toFixed(2)}s`]);
            return rows;
          }
          function recordedTokens(usage) {
            if (validCount(usage?.totalTokens)) return usage.totalTokens;
            if (!validCount(usage?.outputTokens)) return null;
            return usage.outputTokens + ["inputTokens", "cacheReadTokens", "cacheWriteTokens"].reduce((sum, key) => sum + (validCount(usage[key]) ? usage[key] : 0), 0);
          }
          function FloatingPanel({ anchorRef, open, setOpen, title, icon: Glyph, titleValue, className = "", id, children }) {
            const panelRef = useRef(null);
            const position = useAnchoredPosition({ open, anchorRef, panelRef, side: "top", align: "start", gap: 8, margin: 12 });
            useDismissOnOutsidePointer(anchorRef, open, setOpen, panelRef);
            useEffect(() => {
              if (!open || typeof document === "undefined") return;
              const close = (event) => {
                if (event.key === "Escape") {
                  setOpen(false);
                  anchorRef.current?.focus();
                }
              };
              document.addEventListener("keydown", close);
              return () => document.removeEventListener("keydown", close);
            }, [open, setOpen, anchorRef]);
            return open ? createPortal(h(
              "div",
              { id, ref: panelRef, className: `btw-root btw-stat-panel ${className}`.trim(), style: position || { visibility: "hidden", left: 0, top: 0 }, role: "dialog", "aria-label": title },
              h("div", { className: "btw-stat-title" }, h("span", { className: "btw-stat-title-label" }, Glyph && h(Glyph, { size: 14 }), title), titleValue !== void 0 && h("span", { className: "btw-stat-title-value" }, titleValue)),
              h("div", { className: "btw-stat-title-rule", "aria-hidden": true }),
              children
            ), document.body) : null;
          }
          function Stat({ icon: Glyph, label, title, titleValue, rows, children }) {
            const root = useRef(null), [open, setOpen] = useState(false);
            return h(
              "span",
              { className: "btw-stat" },
              h(
                "button",
                { "data-btw-control": true, ref: root, type: "button", className: "btw-stat-trigger", "aria-label": title, "aria-haspopup": "dialog", "aria-expanded": open, onClick: () => setOpen((value) => !value) },
                Glyph && h(Glyph, { size: 14 }),
                h("span", null, label)
              ),
              h(
                FloatingPanel,
                { anchorRef: root, open, setOpen, title, icon: Glyph, titleValue },
                rows?.length ? h("dl", null, rows.map(([name, value]) => h(React.Fragment, { key: name }, h("dt", null, name), h("dd", null, value)))) : null,
                children
              )
            );
          }
          function Metrics({ message }) {
            const t = useT(), rows = readings(message, t), tokens = recordedTokens(message.usage);
            if (!rows.length) return null;
            return h(Stat, { icon: IconDatabaseOutlineRegular, label: tokens === null ? t("replyStats") : `${t("usage")} ${count(tokens)} tok`, title: t("replyStats"), rows });
          }
          function ContextRing({ percent }) {
            const length = 2 * Math.PI * 5.5;
            return h(
              "svg",
              { width: 14, height: 14, viewBox: "0 0 14 14", "aria-hidden": true },
              h("circle", { cx: 7, cy: 7, r: 5.5, fill: "none", stroke: "var(--dsw-alias-border-l3)", strokeWidth: 2 }),
              Number.isFinite(percent) && h("circle", { cx: 7, cy: 7, r: 5.5, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeDasharray: `${length * Math.min(100, percent) / 100} ${length}`, transform: "rotate(-90 7 7)" })
            );
          }
          function DiscussionStats({ thread, contextWindow }) {
            const t = useT(), messages = thread?.messages || [], replies = messages.filter((message) => message.role === "assistant");
            const [now, setNow] = useState(Date.now);
            useEffect(() => {
              const timer = setInterval(() => setNow(Date.now()), 6e4);
              return () => clearInterval(timer);
            }, []);
            if (!replies.length && !thread?.statistics?.steps) return null;
            let tokens = 0, hasTokens = false, decodeSeconds = 0, decodeTokens = 0, elapsed = 0, hasElapsed = false;
            let input = 0, output = 0, cacheRead = 0, cacheWrite = 0, hasInput = false, hasCache = false, ttft = 0, ttftCount = 0;
            for (const message of replies) {
              const usage = message.usage, recorded = recordedTokens(usage);
              if (recorded !== null) {
                tokens += recorded;
                hasTokens = true;
              }
              if (validCount(usage?.inputTokens)) {
                input += usage.inputTokens;
                hasInput = true;
              }
              if (validCount(usage?.outputTokens)) output += usage.outputTokens;
              if (validCount(usage?.cacheReadTokens)) {
                cacheRead += usage.cacheReadTokens;
                hasCache = true;
              }
              if (validCount(usage?.cacheWriteTokens)) cacheWrite += usage.cacheWriteTokens;
              if (validCount(message.metrics?.durationMs)) {
                elapsed += message.metrics.durationMs;
                hasElapsed = true;
              }
              if (validCount(message.metrics?.firstTokenMs)) {
                ttft += message.metrics.firstTokenMs;
                ttftCount++;
              }
              if (message.metrics?.tokensPerSecond > 0 && usage?.outputTokens > 0) {
                decodeTokens += usage.outputTokens;
                decodeSeconds += usage.outputTokens / message.metrics.tokensPerSecond;
              }
            }
            const speed = decodeSeconds > 0 ? speedText(decodeTokens / decodeSeconds) : null;
            const turns = thread.statistics?.turns ?? messages.filter((message) => message.role === "user").length;
            const steps = thread.statistics?.steps ?? replies.length;
            const activity = `${turns} ${t("turns")} ${steps} ${t("steps")}`;
            const rows = [];
            if (hasElapsed && elapsed > 0) rows.push([t("llmTime"), durationText(elapsed, t)]);
            if (ttftCount) rows.push([t("avgTtft"), durationText(ttft / ttftCount, t)]);
            if (speed) rows.push([t("decodeSpeed"), speed]);
            const billedInput = input + cacheRead + cacheWrite;
            const hit = hasInput && hasCache && billedInput > 0 ? cacheRead / billedInput * 100 : null;
            let precision = 0;
            while (hit !== null && hit < 100 && Number(hit.toFixed(precision)) >= 100 && precision < 8) precision++;
            const hitText = hit === null ? null : `${hit.toFixed(precision)}%`;
            const usageRows = [...hitText ? [[t("cacheHit"), hitText]] : [], ...hasInput ? [[t("inputTokens"), String(input)]] : [], ...hasCache ? [[t("cacheRead"), String(cacheRead)]] : [], ...cacheWrite ? [[t("cacheWrite"), String(cacheWrite)]] : [], [t("outputTokens"), String(output)]];
            const latest = [...replies].reverse().find((message) => message.model?.provider === thread.model?.provider && message.model?.model === thread.model?.model);
            const used = latest && recordedTokens(latest.usage);
            const percent = validCount(used) && Number.isFinite(contextWindow) && contextWindow > 0 ? Math.min(100, Math.round(used / contextWindow * 100)) : null;
            const contextRows = [[t("latestUsage"), validCount(used) ? `${count(used)} tok` : t("noData")], [t("capacity"), contextWindow ? `${count(contextWindow)} tok` : t("noData")]];
            const updatedAt = thread.statistics?.updatedAt;
            const minutes = validCount(updatedAt) ? Math.max(0, Math.floor((now - updatedAt) / 6e4)) : null;
            const updated = minutes === null ? null : minutes === 0 ? t("justNow") : minutes < 60 ? `${minutes} ${t("minutesAgo")}` : `${Math.floor(minutes / 60)} ${t("hoursAgo")}`;
            return h(
              "div",
              { className: "btw-dock", "aria-label": t("discussionStats") },
              h(Stat, { icon: IconGaugeOutlineRegular, label: `${activity}${speed ? ` \xB7 ${speed}` : ""}`, title: t("discussionStats"), rows }),
              hasTokens && h(Stat, { icon: IconDatabaseOutlineRegular, label: `${count(tokens)} tok${hitText ? ` \xB7 ${t("cacheHit")} ${hitText}` : ""}`, title: t("tokenUsage"), titleValue: `${count(tokens)} tok`, rows: usageRows }),
              h(Stat, { label: h(React.Fragment, null, `${t("sessionCost")} \u2014`, h("span", { className: "btw-cost-badge" }, t("noPricing"))), title: t("sessionCost") }, h("p", null, t("noPricingHint"))),
              updated && h("time", { dateTime: new Date(updatedAt).toISOString(), title: new Date(updatedAt).toLocaleString() }, `${t("updated")} ${updated}`),
              h(Stat, { icon: () => h(ContextRing, { percent }), label: percent === null ? "\u2014" : `${percent}%`, title: t("contextUsed"), rows: contextRows })
            );
          }
          function Copy({ text }) {
            const t = useT();
            const [state, setState] = useState("");
            const timer = useRef();
            useEffect(() => () => clearTimeout(timer.current), []);
            async function copy() {
              try {
                await navigator.clipboard.writeText(text);
                setState(t("copied"));
                clearTimeout(timer.current);
                timer.current = setTimeout(() => setState(""), 1500);
              } catch (error) {
                setState(error.message);
              }
            }
            return h("button", { "data-btw-control": true, type: "button", onClick: copy, title: state || t("copy"), "aria-label": t("copy") }, h(state === t("copied") ? IconCheckOutlineRegular : IconCopyOutlineRegular, { size: 16 }), state && state !== t("copied") ? state : null);
          }
          function ModelControl({ thread, sourceSessionId, onSaved }) {
            const t = useT();
            useSyncExternalStore((fn) => {
              const unsubscribers = ["conversation.input.model", "conversation.input.model.label"].map((key) => ctx.slots.subscribe(key, fn));
              return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
            }, () => `${ctx.slots.getVersion("conversation.input.model")}:${ctx.slots.getVersion("conversation.input.model.label")}`);
            const entry = ctx.slots.entriesOfSlot("conversation.input.model")[0];
            const directory = React.useMemo(() => thread?.id ? new BtwModelDirectory({ rpc, sourceSessionId, thread, onSaved, followLabel: t("follow") }) : null, [thread?.id, sourceSessionId]);
            useEffect(() => {
              if (thread) directory?.setThread(thread);
            }, [directory, thread]);
            useEffect(() => {
              directory?.load();
              return () => directory?.dispose();
            }, [directory]);
            if (!entry?.component || !directory) return h("span", { className: "btw-model" }, thread?.model?.model || t("loading"));
            return h("div", { className: "btw-native-model" }, h(entry.component, {
              locked: thread.status === "running",
              available: true,
              directory,
              load: () => directory.load(),
              select: (selection) => directory.select(selection),
              t: ctx.locale.bind("model"),
              // Label extensions have a pure presentation contract. Never invoke a
              // Session slot injector: that would bind this control to the main chat.
              renderSlot: (key, owner, options2) => {
                const label = ctx.slots.entriesOfSlot(key)[0];
                return label?.component ? h(label.component, owner) : options2?.fallback ?? null;
              }
            }));
          }
          function Settings({ onClose, sourceSessionId, thread, onSaved }) {
            const t = useT();
            const threadId = thread?.id;
            const running = thread?.status === "running";
            const target = threadId ? { sourceSessionId, threadId } : {};
            const [form, setForm] = useState(null);
            const [providers, setProviders] = useState([]);
            const [models, setModels] = useState([]);
            const [error, setError] = useState("");
            const [busy, setBusy] = useState(false);
            const [saved, setSaved] = useState(false);
            useEffect(() => {
              const ac = new AbortController();
              rpc("config", target, ac.signal).then((value) => {
                setForm(value.settings);
                setProviders(value.providers || []);
              }).catch((e) => {
                if (!ac.signal.aborted) setError(e.message);
              });
              return () => ac.abort();
            }, [threadId, sourceSessionId]);
            useEffect(() => {
              if (!form?.provider || form.mode !== "fixed") {
                setModels([]);
                return;
              }
              const ac = new AbortController();
              setModels([]);
              rpc("models", { provider: form.provider }, ac.signal).then((value) => setModels(value.models || [])).catch((e) => {
                if (!ac.signal.aborted) setError(e.message);
              });
              return () => ac.abort();
            }, [form?.provider, form?.mode]);
            function update(next) {
              setForm((previous) => ({ ...previous, ...next }));
              setSaved(false);
              setError("");
            }
            async function save() {
              if (!form || busy || running) return;
              if (form.mode === "fixed" && (!form.provider || !form.model)) {
                setError(t("missingModel"));
                return;
              }
              setBusy(true);
              setSaved(false);
              setError("");
              try {
                const settings = form.mode === "follow" ? { mode: "follow" } : { mode: "fixed", provider: form.provider, model: form.model };
                const result = await rpc("config", { ...target, settings });
                setForm(result.settings);
                if (result.thread) onSaved?.(result.thread);
                setSaved(true);
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }
            return h(
              "section",
              { className: "btw-root btw-settings", "aria-label": t("settings") },
              h("style", null, css),
              h("h3", null, t("settings")),
              !threadId && h("p", null, t("modelHint")),
              running && h("p", { role: "status" }, t("modelBusy")),
              error && h("div", { className: "btw-error", role: "alert" }, error),
              !form ? !error && h("p", null, t("loading")) : h(
                React.Fragment,
                null,
                h("label", { className: "btw-field" }, h("span", null, t(threadId ? "threadModel" : "modelMode")), h("select", { disabled: busy || running, value: form.mode, onChange: (e) => update({ mode: e.target.value }) }, h("option", { value: "follow" }, t("follow")), h("option", { value: "fixed" }, t("fixed")))),
                form.mode === "fixed" && h(
                  React.Fragment,
                  null,
                  providers.length === 0 && h("p", null, t("noProviders")),
                  h("label", { className: "btw-field" }, h("span", null, t("provider")), h("select", { disabled: busy || running, value: form.provider || "", onChange: (e) => update({ provider: e.target.value, model: "" }) }, h("option", { value: "" }, t("select")), providers.map((p) => h("option", { key: p.id, value: p.id }, p.name || p.id)))),
                  h("label", { className: "btw-field" }, h("span", null, t("model")), h("input", { disabled: busy || running, value: form.model || "", list: "btw-model-list", placeholder: t("select"), onChange: (e) => update({ model: e.target.value }), autoComplete: "off" }), h("datalist", { id: "btw-model-list" }, models.map((m) => h("option", { key: m.id, value: m.id }, m.name || m.id))))
                ),
                h("div", { className: "btw-setting-actions" }, h("button", { "data-btw-control": true, type: "button", className: "btw-primary", onClick: save, disabled: busy || running }, t("save")), saved && h("span", { className: "btw-saved", role: "status" }, t("saved")), onClose && h("button", { "data-btw-control": true, type: "button", onClick: onClose, disabled: busy }, t("done")))
              )
            );
          }
          function Action({ sessionId, messageId }) {
            const t = useT();
            const [error, setError] = useState("");
            function open() {
              try {
                if (ctx.sidebarRight.mounted.getSnapshot() !== sessionId) throw new Error(t("unavailable"));
                const uri = address(sessionId, messageId);
                ctx.sidebarRight.openResource(uri);
                focusTargets.get(uri)?.();
                setError("");
              } catch (e) {
                setError(e.message);
              }
            }
            return h(
              "span",
              { className: "btw-root btw-action" },
              h("style", null, css),
              h("button", { "data-btw-control": true, type: "button", className: "btw-icon", title: t("ask"), "aria-label": t("ask"), onClick: open }, h(Icon, null)),
              error && h("span", { className: "btw-action-error", role: "alert" }, error)
            );
          }
          function Panel(props) {
            const t = useT();
            const info = props.useTabInfo();
            const source = parseAddress(info.tab.navigation.address);
            const sourceSessionId = source?.sourceSessionId;
            const messageId = source?.messageId;
            const [thread, setThread] = useState(null);
            const [error, setError] = useState("");
            const [draft, setDraft] = useState("");
            const [contextOpen, setContextOpen] = useState(false);
            const [contextWindow, setContextWindow] = useState(null);
            const contextAnchor = useRef(null);
            const contextId = React.useId();
            const [sending, setSending] = useState(false);
            const [stopping, setStopping] = useState(false);
            const [reload, setReload] = useState(0);
            const composer = useRef(null);
            const scroller = useRef(null);
            const followBottom = useRef(true);
            const pending = useRef(null);
            const threadRef = useRef(null);
            const accept = useCallback((next) => {
              if (!next) return;
              setThread((previous) => !previous || previous.id !== next.id || next.revision >= previous.revision ? next : previous);
              if (!threadRef.current || threadRef.current.id !== next.id || next.revision >= threadRef.current.revision) threadRef.current = next;
            }, []);
            useEffect(() => {
              setContextWindow(null);
              if (!thread?.id) return;
              const ac = new AbortController();
              rpc("config", { sourceSessionId, threadId: thread.id }, ac.signal).then((value) => {
                if (!ac.signal.aborted) setContextWindow(value.contextWindow ?? null);
              }).catch(() => {
              });
              return () => ac.abort();
            }, [sourceSessionId, thread?.id, thread?.model?.provider, thread?.model?.model]);
            const draftKey = sourceSessionId && messageId ? `dsh-btw:draft:${sourceSessionId}:${messageId}` : null;
            useEffect(() => {
              try {
                setDraft(draftKey ? sessionStorage.getItem(draftKey) || "" : "");
              } catch {
                setDraft("");
              }
            }, [draftKey]);
            function changeDraft(text) {
              setDraft(text);
              if (pending.current?.text !== text) pending.current = null;
              try {
                if (draftKey) text ? sessionStorage.setItem(draftKey, text) : sessionStorage.removeItem(draftKey);
              } catch {
              }
            }
            useEffect(() => {
              if (!sourceSessionId || !messageId) return;
              const ac = new AbortController();
              setError("");
              let disposed = false;
              (async () => {
                const result = await rpc("open", { sourceSessionId, messageId }, ac.signal);
                if (disposed) return;
                let current = result.thread;
                accept(current);
                while (!ac.signal.aborted) {
                  const result2 = await rpc("watch", { sourceSessionId, threadId: current.id, afterRevision: current.revision, timeoutMs: 2e4 }, ac.signal);
                  if (disposed) return;
                  current = result2.thread;
                  accept(current);
                }
              })().catch((e) => {
                if (!disposed) setError(e.message || t("connectionError"));
              });
              return () => {
                disposed = true;
                ac.abort();
              };
            }, [sourceSessionId, messageId, reload, accept]);
            useEffect(() => {
              if (!sourceSessionId || !messageId) return;
              const uri = address(sourceSessionId, messageId);
              const focus = () => {
                composer.current?.focus({ preventScroll: true });
              };
              focusTargets.set(uri, focus);
              return () => {
                if (focusTargets.get(uri) === focus) focusTargets.delete(uri);
              };
            }, [sourceSessionId, messageId]);
            useEffect(() => {
              if (info.tab.visible) composer.current?.focus({ preventScroll: true });
            }, [info.tab.visible, thread?.id]);
            useEffect(() => {
              if (followBottom.current && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
            }, [thread?.revision]);
            useEffect(() => {
              const input = composer.current;
              if (!input || !Number.isFinite(input.scrollHeight)) return;
              input.style.height = "0px";
              input.style.height = `${Math.min(200, Math.max(36, input.scrollHeight))}px`;
            }, [draft]);
            const running = thread?.status === "running";
            async function send() {
              if (sending || running || !thread) return;
              const text = draft.trim();
              if (!text) {
                setError(t("noText"));
                return;
              }
              if (text.length > 2e4) {
                setError(t("tooLong"));
                return;
              }
              if (!pending.current || pending.current.text !== text) pending.current = { text, requestId: crypto.randomUUID() };
              const request = pending.current;
              setSending(true);
              setError("");
              followBottom.current = true;
              try {
                const result = await rpc("send", { sourceSessionId, threadId: thread.id, ...request });
                accept(result.thread);
                changeDraft("");
              } catch (e) {
                setError(e.message);
              } finally {
                setSending(false);
              }
            }
            async function stop() {
              setStopping(true);
              setError("");
              try {
                accept((await rpc("stop", { sourceSessionId, threadId: thread.id })).thread);
              } catch (e) {
                setError(e.message);
              } finally {
                setStopping(false);
              }
            }
            if (!source) return h("div", { className: "btw-root btw-settings" }, t("noSource"));
            const inputArea = h("footer", { className: "btw-composer" }, h(
              "div",
              { className: "btw-composer-inner" },
              h(
                FloatingPanel,
                { anchorRef: contextAnchor, open: contextOpen, setOpen: setContextOpen, id: contextId, className: "btw-context-panel", title: t("source") },
                h("p", null, t("context")),
                thread?.sourcePreview && h("p", { className: "btw-source" }, thread.sourcePreview)
              ),
              h(
                "div",
                { className: "btw-input-card", "data-composer-card": "" },
                h("textarea", {
                  ref: composer,
                  rows: 1,
                  value: draft,
                  onChange: (e) => changeDraft(e.target.value),
                  placeholder: t("placeholder"),
                  "aria-label": t("placeholder"),
                  title: t("hint"),
                  maxLength: 2e4,
                  onKeyDown: (e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                      e.preventDefault();
                      send();
                    }
                  }
                }),
                h(
                  "div",
                  { className: "btw-composer-footer" },
                  h("button", { "data-btw-control": true, type: "button", className: "btw-context-toggle", ref: contextAnchor, "aria-haspopup": "dialog", title: t("source"), "aria-label": t("source"), "aria-expanded": contextOpen, "aria-controls": contextId, onClick: () => setContextOpen((value) => !value) }, h(IconApiOutlineRegular, { size: 16 }), h("span", null, t("source"))),
                  h(
                    "div",
                    { className: "btw-composer-trailing" },
                    h(ModelControl, { thread, sourceSessionId, onSaved: accept }),
                    h(
                      Tooltip,
                      { label: running ? t(stopping ? "stopping" : "stop") : `${t("send")} \xB7 ${t("hint")}`, side: "top" },
                      h(
                        "button",
                        { "data-btw-control": true, type: "button", className: "btw-send", "aria-label": running ? t("stop") : t("send"), disabled: running ? stopping : !thread || sending || !draft.trim(), onMouseDown: (e) => e.preventDefault(), onClick: running ? stop : send },
                        h("svg", { viewBox: "0 0 16 16", width: 16, height: 16, "aria-hidden": true }, running ? h("rect", { x: 3, y: 3, width: 10, height: 10, rx: 3, fill: "currentColor" }) : h("path", { d: "M8.3125 0.980183C8.66767 1.0531 8.97902 1.20418 9.2627 1.43233C9.48724 1.61297 9.73029 1.85793 9.97949 2.10714L14.707 6.83468L13.293 8.24874L9 3.95577V15.0417H7V3.95577L2.70703 8.24874L1.29297 6.83468L6.02051 2.10714C6.26971 1.85793 6.51277 1.61297 6.7373 1.43233C6.97662 1.23986 7.28445 1.04402 7.6875 0.980183C7.8973 0.947006 8.1031 0.95516 8.3125 0.980183Z", fill: "currentColor" }))
                      )
                    )
                  )
                )
              ),
              h(DiscussionStats, { thread, contextWindow })
            ));
            return h(
              "section",
              { className: "btw-root btw-panel", "aria-label": "dsh-btw" },
              h("style", null, css),
              h(
                "div",
                { className: "btw-scroll", ref: scroller, onScroll: () => {
                  const el = scroller.current;
                  followBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 70;
                } },
                h(
                  "div",
                  { className: "btw-column" },
                  !thread && !error && h("p", { className: "btw-note", role: "status" }, t("loading")),
                  thread && thread.messages.length === 0 && !running && h(
                    "div",
                    { className: "btw-empty" },
                    h(Icon, { size: 28 }),
                    h("h3", null, t("empty")),
                    h("div", { className: "btw-suggestions" }, ["prompt1", "prompt2"].map((key) => h("button", { "data-btw-control": true, type: "button", key, onClick: () => {
                      changeDraft(t(key));
                      composer.current?.focus();
                    } }, t(key))))
                  ),
                  thread?.messages.map((message) => h(
                    "article",
                    { key: message.id, className: "btw-message", "data-role": message.role },
                    h("span", { className: "btw-sr-only" }, t(message.role === "user" ? "you" : "assistant")),
                    message.role === "user" ? h("div", { className: "btw-user" }, message.text) : h(Markdown, { text: message.text }),
                    h("div", { className: "btw-message-actions" }, h(Copy, { text: message.text }), message.role === "assistant" && h(Metrics, { message }))
                  )),
                  running && h("article", { className: "btw-message", "aria-busy": true }, h("span", { className: "btw-sr-only" }, t("assistant")), thread.draftAssistant ? h(Markdown, { text: thread.draftAssistant, streaming: true }) : h("span", { className: "btw-status btw-pulse", role: "status" }, t("thinking"))),
                  thread?.status === "stopped" && h("p", { className: "btw-note", role: "status" }, t("stopped")),
                  (thread?.warnings || []).map((warning, i) => h("p", { key: i, className: "btw-note" }, warning)),
                  thread?.error && h("div", { className: "btw-error", role: "alert" }, thread.error),
                  error && h("div", { className: "btw-error", role: "alert" }, error, h("div", null, h("button", { "data-btw-control": true, type: "button", onClick: () => setReload((n) => n + 1) }, t("retry"))))
                )
              ),
              inputArea
            );
          }
          ctx.effect(() => ctx.sidebarRightTabs.register({ id: "dsh-btw", kind: "btw", patterns: ["dsh-resource://btw/**"], canOpen: (value) => !!parseAddress(value), title: () => "dsh-btw", multiple: true, keepMounted: false }));
          ctx.slots.inject("conversation.chat.assistant-actions", () => ctx.slots.register({ name: "conversation.chat.assistant-actions", id: "dsh-btw", order: 20, label: () => translate("ask") }, Action));
          ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({ name: "sidebar.right.pane.tab", key: "dsh-btw" }, Panel));
          ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({ name: "plugins.bundle.config", key: "dsh-btw" }, Settings));
        }
      };
    }
  });
})();
