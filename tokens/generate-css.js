const fs = require('fs');
const path = require('path');

const designTokensPath = path.join(__dirname, 'design-tokens.json');
const colorTokensPath = path.join(__dirname, 'color-token.json');
const outputCssPath = path.join(__dirname, 'tokens.css');

const designTokens = JSON.parse(fs.readFileSync(designTokensPath, 'utf8'));
const colorTokens = JSON.parse(fs.readFileSync(colorTokensPath, 'utf8'));

let cssContent = '/* Generated CSS Variables */\n\n';
cssContent += ':root {\n';
cssContent += '  /* Typography */\n';

function processTypography(obj, prefix) {
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object' && !obj[key].type) {
      processTypography(obj[key], prefix ? `${prefix}-${key}` : key);
    } else if (obj[key] && obj[key].type) {
      const type = obj[key].type;
      let value = obj[key].value;
      if (type === 'dimension' && value !== 0) {
        value = `${value}px`;
      }
      // camelCase to kebab-case
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      const cssVarName = `--${prefix.replace(/\s+/g, '-')}-${kebabKey}`.toLowerCase();
      cssContent += `  ${cssVarName}: ${value};\n`;
    }
  }
}

if (designTokens.typography) {
  processTypography(designTokens.typography, 'typography');
}

function resolveColorRef(refStr, fullTokens) {
  if (typeof refStr === 'string' && refStr.startsWith('{') && refStr.endsWith('}')) {
    const path = refStr.slice(1, -1).split('.');
    let current = fullTokens;
    for (const p of path) {
      if (current && current[p] !== undefined) {
        current = current[p];
      } else {
        return refStr; // Return unresovled if not found
      }
    }
    return current;
  }
  return refStr;
}

const colorData = colorTokens.color || {};
const rolesLight = (colorData.role && colorData.role.light) ? colorData.role.light : {};
const rolesDark = (colorData.role && colorData.role.dark) ? colorData.role.dark : {};

cssContent += '\n  /* Color Roles - Light */\n';
for (const [role, value] of Object.entries(rolesLight)) {
  const resolved = resolveColorRef(value, colorTokens);
  const kebabRole = role.replace(/([A-Z])/g, '-$1').toLowerCase();
  cssContent += `  --color-${kebabRole}: ${resolved};\n`;
}

cssContent += '}\n\n';

cssContent += '@media (prefers-color-scheme: dark) {\n';
cssContent += '  :root {\n';
cssContent += '    /* Color Roles - Dark */\n';
for (const [role, value] of Object.entries(rolesDark)) {
  const resolved = resolveColorRef(value, colorTokens);
  const kebabRole = role.replace(/([A-Z])/g, '-$1').toLowerCase();
  cssContent += `    --color-${kebabRole}: ${resolved};\n`;
}
cssContent += '  }\n';
cssContent += '}\n';

fs.writeFileSync(outputCssPath, cssContent);
console.log(`Successfully generated ${outputCssPath}`);
