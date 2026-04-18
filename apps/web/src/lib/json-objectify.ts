export const DEFAULT_JSON = `{
  "name": "John Doe",
  "age": 30,
  "isActive": true,
  "roles": ["admin", "user"],
  "metadata": {
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLogin": null
  }
}`;

export interface ConversionOptions {
  useConst: boolean;
  singleQuotes: boolean;
  trailingComma: boolean;
  semicolons: boolean;
  typescript: boolean;
  variableName: string;
}

export const convertToJsObject = (
  obj: unknown,
  options: ConversionOptions,
  indent = 0
): string => {
  const indentStr = '  '.repeat(indent);
  const nextIndentStr = '  '.repeat(indent + 1);

  if (obj === null) {
    return 'null';
  }

  if (obj === undefined) {
    return 'undefined';
  }

  if (typeof obj === 'string') {
    const quote = options.singleQuotes ? "'" : '"';
    const escaped = options.singleQuotes
      ? obj.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      : obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `${quote}${escaped}${quote}`;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '[]';
    }

    const items = obj.map(item => convertToJsObject(item, options, indent + 1));
    const trailing = options.trailingComma ? ',' : '';
    return `[\n${items.map(item => `${nextIndentStr}${item}`).join(',\n')}${trailing}\n${indentStr}]`;
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj);

    if (entries.length === 0) {
      return '{}';
    }

    const props = entries.map(([key, value]) => {
      const needsQuotes = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
      const quote = options.singleQuotes ? "'" : '"';
      const keyStr = needsQuotes ? `${quote}${key}${quote}` : key;
      const valueStr = convertToJsObject(value, options, indent + 1);
      return `${nextIndentStr}${keyStr}: ${valueStr}`;
    });

    const trailing = options.trailingComma ? ',' : '';
    return `{\n${props.join(',\n')}${trailing}\n${indentStr}}`;
  }

  return String(obj);
};

// --- TypeScript interface generation ---

function toPascalCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

interface InterfaceField {
  name: string;
  type: string;
  optional: boolean;
}

interface InterfaceDefinition {
  name: string;
  fields: InterfaceField[];
}

function resolveInterfaceName(
  preferredName: string,
  parentName: string,
  usedNames: Set<string>
): string {
  if (!usedNames.has(preferredName)) {
    return preferredName;
  }
  const prefixed = parentName + preferredName;
  if (!usedNames.has(prefixed)) {
    return prefixed;
  }
  let counter = 2;
  while (usedNames.has(prefixed + counter)) {
    counter++;
  }
  return prefixed + counter;
}

function inferType(
  value: unknown,
  preferredName: string,
  parentName: string,
  interfaces: InterfaceDefinition[],
  usedNames: Set<string>
): string {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';

  if (Array.isArray(value)) {
    return inferArrayType(
      value,
      preferredName,
      parentName,
      interfaces,
      usedNames
    );
  }

  if (typeof value === 'object') {
    return buildInterface(
      value as Record<string, unknown>,
      preferredName,
      parentName,
      interfaces,
      usedNames
    );
  }

  return 'unknown';
}

function inferArrayType(
  arr: unknown[],
  preferredName: string,
  parentName: string,
  interfaces: InterfaceDefinition[],
  usedNames: Set<string>
): string {
  if (arr.length === 0) {
    return 'unknown[]';
  }

  const elementTypes = new Set<string>();
  const objectItems: Record<string, unknown>[] = [];

  for (const item of arr) {
    if (item === null) {
      elementTypes.add('null');
    } else if (typeof item === 'string') {
      elementTypes.add('string');
    } else if (typeof item === 'number') {
      elementTypes.add('number');
    } else if (typeof item === 'boolean') {
      elementTypes.add('boolean');
    } else if (Array.isArray(item)) {
      const nested = inferArrayType(
        item,
        preferredName,
        parentName,
        interfaces,
        usedNames
      );
      elementTypes.add(nested);
    } else if (typeof item === 'object') {
      objectItems.push(item as Record<string, unknown>);
    }
  }

  if (objectItems.length > 0) {
    // Merge all object shapes into a single interface
    const merged = mergeObjectShapes(objectItems);
    const singularName = preferredName.replace(/s$/, '') || preferredName;
    const interfaceName = buildInterfaceFromMerged(
      merged,
      toPascalCase(singularName),
      parentName,
      interfaces,
      usedNames
    );
    elementTypes.add(interfaceName);
  }

  const types = [...elementTypes];
  if (types.length === 1) {
    return `${types[0]}[]`;
  }
  return `(${types.join(' | ')})[]`;
}

interface MergedField {
  types: Set<string>;
  values: unknown[];
  presentCount: number;
  totalCount: number;
}

function mergeObjectShapes(
  objects: Record<string, unknown>[]
): Map<string, MergedField> {
  const merged = new Map<string, MergedField>();
  const total = objects.length;

  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj)) {
      if (!merged.has(key)) {
        merged.set(key, {
          types: new Set(),
          values: [],
          presentCount: 0,
          totalCount: total,
        });
      }
      const field = merged.get(key)!;
      field.values.push(value);
      field.presentCount++;
    }
  }

  return merged;
}

function buildInterfaceFromMerged(
  merged: Map<string, MergedField>,
  preferredName: string,
  parentName: string,
  interfaces: InterfaceDefinition[],
  usedNames: Set<string>
): string {
  const name = resolveInterfaceName(preferredName, parentName, usedNames);
  usedNames.add(name);

  const fields: InterfaceField[] = [];

  for (const [key, field] of merged) {
    // Infer types from all values seen for this field
    const fieldTypes = new Set<string>();
    for (const val of field.values) {
      const t = inferType(val, key, name, interfaces, usedNames);
      fieldTypes.add(t);
    }

    const typeStr =
      fieldTypes.size === 1 ? [...fieldTypes][0] : [...fieldTypes].join(' | ');

    fields.push({
      name: key,
      type: typeStr,
      optional: field.presentCount < field.totalCount,
    });
  }

  interfaces.push({ name, fields });
  return name;
}

function buildInterface(
  obj: Record<string, unknown>,
  preferredName: string,
  parentName: string,
  interfaces: InterfaceDefinition[],
  usedNames: Set<string>
): string {
  const entries = Object.entries(obj);

  if (entries.length === 0) {
    return 'Record<string, unknown>';
  }

  const name = resolveInterfaceName(preferredName, parentName, usedNames);
  usedNames.add(name);

  const fields: InterfaceField[] = [];

  for (const [key, value] of entries) {
    const fieldType = inferType(
      value,
      toPascalCase(key),
      name,
      interfaces,
      usedNames
    );
    fields.push({ name: key, type: fieldType, optional: false });
  }

  interfaces.push({ name, fields });
  return name;
}

function formatInterfaces(interfaces: InterfaceDefinition[]): string {
  return interfaces
    .map(iface => {
      const fields = iface.fields
        .map(f => {
          const opt = f.optional ? '?' : '';
          const needsQuotes = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(f.name);
          const key = needsQuotes ? `'${f.name}'` : f.name;
          return `  ${key}${opt}: ${f.type};`;
        })
        .join('\n');
      return `interface ${iface.name} {\n${fields}\n}`;
    })
    .join('\n\n');
}

export function generateTypeScriptInterfaces(
  json: unknown,
  rootName: string
): { interfaces: string; rootTypeName: string } {
  const interfaces: InterfaceDefinition[] = [];
  const usedNames = new Set<string>();
  const pascalRoot = toPascalCase(rootName) || 'Data';

  if (json === null || typeof json !== 'object') {
    return { interfaces: '', rootTypeName: '' };
  }

  if (Array.isArray(json)) {
    const arrayType = inferArrayType(
      json,
      pascalRoot,
      '',
      interfaces,
      usedNames
    );
    return {
      interfaces: formatInterfaces(interfaces),
      rootTypeName: arrayType,
    };
  }

  buildInterface(
    json as Record<string, unknown>,
    pascalRoot,
    '',
    interfaces,
    usedNames
  );

  return {
    interfaces: formatInterfaces(interfaces),
    rootTypeName: pascalRoot,
  };
}

// --- Code generation ---

export const generateJsCode = (
  json: unknown,
  options: ConversionOptions
): string => {
  const keyword = options.useConst ? 'const' : 'let';
  const varName = options.variableName || 'data';
  const objectStr = convertToJsObject(json, options);
  const semi = options.semicolons ? ';' : '';

  if (options.typescript) {
    const { interfaces, rootTypeName } = generateTypeScriptInterfaces(
      json,
      varName
    );

    if (interfaces && rootTypeName) {
      return `${interfaces}\n\n${keyword} ${varName}: ${rootTypeName} = ${objectStr}${semi}`;
    }

    // Fallback for primitives / null
    return `${keyword} ${varName} = ${objectStr}${semi}`;
  }

  return `${keyword} ${varName} = ${objectStr}${semi}`;
};
