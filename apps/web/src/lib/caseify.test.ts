import {
  CASE_DEFINITIONS,
  COMMON_CASES,
  PROGRAMMING_CASES,
  convertText,
  tokenize,
} from './caseify';

// ---------------------------------------------------------------------------
// tokenize()
// ---------------------------------------------------------------------------

describe('tokenize', () => {
  // --- camelCase / PascalCase inputs ---
  it('splits camelCase', () => {
    expect(tokenize('helloWorld')).toEqual(['hello', 'World']);
  });

  it('splits PascalCase', () => {
    expect(tokenize('HelloWorld')).toEqual(['Hello', 'World']);
  });

  it('preserves acronyms in camelCase', () => {
    expect(tokenize('parseXMLDocument')).toEqual(['parse', 'XML', 'Document']);
  });

  it('preserves consecutive acronyms where possible', () => {
    // Adjacent all-caps acronyms with no casing transition are ambiguous
    expect(tokenize('XMLHTTPRequest')).toEqual(['XMLHTTP', 'Request']);
  });

  it('handles acronym at end', () => {
    expect(tokenize('getHTTPS')).toEqual(['get', 'HTTPS']);
  });

  it('handles acronym followed by digits', () => {
    expect(tokenize('getHTTP2Response')).toEqual([
      'get',
      'HTTP',
      '2',
      'Response',
    ]);
  });

  // --- Delimiter-based inputs ---
  it('splits snake_case', () => {
    expect(tokenize('my_variable_name')).toEqual(['my', 'variable', 'name']);
  });

  it('splits SCREAMING_SNAKE_CASE', () => {
    expect(tokenize('ALL_CAPS_CONSTANT')).toEqual(['ALL', 'CAPS', 'CONSTANT']);
  });

  it('splits kebab-case', () => {
    expect(tokenize('kebab-case-input')).toEqual(['kebab', 'case', 'input']);
  });

  it('splits dot.case', () => {
    expect(tokenize('dot.case.input')).toEqual(['dot', 'case', 'input']);
  });

  it('splits path/case', () => {
    expect(tokenize('path/to/file')).toEqual(['path', 'to', 'file']);
  });

  it('splits namespace\\case (PHP)', () => {
    expect(tokenize('App\\Http\\Controller')).toEqual([
      'App',
      'Http',
      'Controller',
    ]);
  });

  it('splits package::case (C++)', () => {
    expect(tokenize('std::string::npos')).toEqual(['std', 'string', 'npos']);
  });

  // --- Space-separated inputs ---
  it('splits space-separated words', () => {
    expect(tokenize('hello world')).toEqual(['hello', 'world']);
  });

  it('normalises extra whitespace', () => {
    expect(tokenize('  hello   world  ')).toEqual(['hello', 'world']);
  });

  // --- Mixed delimiters ---
  it('handles mixed delimiters', () => {
    expect(tokenize('mixed_case-Input.here')).toEqual([
      'mixed',
      'case',
      'Input',
      'here',
    ]);
  });

  // --- Numbers ---
  it('keeps digits attached as separate tokens', () => {
    expect(tokenize('item42name')).toEqual(['item', '42', 'name']);
  });

  it('handles leading digits', () => {
    expect(tokenize('2fast2furious')).toEqual(['2', 'fast', '2', 'furious']);
  });

  // --- Special characters ---
  it('strips special characters', () => {
    expect(tokenize('price$amount')).toEqual(['price', 'amount']);
  });

  it('strips multiple special characters', () => {
    expect(tokenize('hello@world#test')).toEqual(['hello', 'world', 'test']);
  });

  // --- Edge cases ---
  it('returns empty array for empty string', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('returns empty array for whitespace only', () => {
    expect(tokenize('   ')).toEqual([]);
  });

  it('returns empty array for special chars only', () => {
    expect(tokenize('$@#!')).toEqual([]);
  });

  it('handles single word', () => {
    expect(tokenize('hello')).toEqual(['hello']);
  });

  it('handles single uppercase word', () => {
    expect(tokenize('HELLO')).toEqual(['HELLO']);
  });

  it('handles single character', () => {
    expect(tokenize('a')).toEqual(['a']);
  });
});

// ---------------------------------------------------------------------------
// convertText() – multi-line handling
// ---------------------------------------------------------------------------

describe('convertText', () => {
  const toSnake = (tokens: string[]) =>
    tokens.map(t => t.toLowerCase()).join('_');

  it('converts single-line input', () => {
    expect(convertText('helloWorld', toSnake)).toBe('hello_world');
  });

  it('converts each line independently for multi-line input', () => {
    const input = 'helloWorld\ngoodMorning';
    expect(convertText(input, toSnake)).toBe('hello_world\ngood_morning');
  });

  it('preserves blank lines in multi-line input', () => {
    const input = 'helloWorld\n\ngoodMorning';
    expect(convertText(input, toSnake)).toBe('hello_world\n\ngood_morning');
  });

  it('returns empty string for empty input', () => {
    expect(convertText('', toSnake)).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(convertText('   ', toSnake)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Case converter correctness
// ---------------------------------------------------------------------------

describe('case converters', () => {
  const tokens = ['parse', 'XML', 'Document'];

  const expected: Record<string, string> = {
    lowercase: 'parse xml document',
    uppercase: 'PARSE XML DOCUMENT',
    'sentence-case': 'Parse xml document',
    'title-case': 'Parse Xml Document',
    'inverse-case': 'pARSE xML dOCUMENT',
    'alternating-case': 'pArSe xMl dOcUmEnT',
    'camel-case': 'parseXmlDocument',
    'pascal-case': 'ParseXmlDocument',
    'snake-case': 'parse_xml_document',
    'screaming-snake-case': 'PARSE_XML_DOCUMENT',
    'kebab-case': 'parse-xml-document',
    'screaming-kebab-case': 'PARSE-XML-DOCUMENT',
    'train-case': 'Parse-Xml-Document',
    'dot-case': 'parse.xml.document',
    'path-case': 'parse/xml/document',
    flatcase: 'parsexmldocument',
    'upper-flatcase': 'PARSEXMLDOCUMENT',
    'ada-case': 'Parse_Xml_Document',
    'namespace-case': 'Parse\\Xml\\Document',
    'package-case': 'Parse::Xml::Document',
    'reverse-domain-case': 'document.xml.parse',
  };

  for (const def of CASE_DEFINITIONS) {
    it(`${def.id}: converts correctly`, () => {
      expect(def.convert(tokens)).toBe(expected[def.id]);
    });
  }
});

// ---------------------------------------------------------------------------
// Filtered arrays
// ---------------------------------------------------------------------------

describe('filtered arrays', () => {
  it('COMMON_CASES contains only common category', () => {
    expect(COMMON_CASES.every(d => d.category === 'common')).toBe(true);
    expect(COMMON_CASES.length).toBe(6);
  });

  it('PROGRAMMING_CASES contains only programming category', () => {
    expect(PROGRAMMING_CASES.every(d => d.category === 'programming')).toBe(
      true
    );
    expect(PROGRAMMING_CASES.length).toBe(15);
  });
});
