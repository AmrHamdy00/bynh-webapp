"""Convert the approved HTML prototype markup into JSX (one-off porting helper).
Usage: python3 tools/html2jsx.py <html-fragment-file>  -> prints JSX to stdout."""
import re, sys

ATTR = {'class': 'className', 'for': 'htmlFor', 'autocomplete': 'autoComplete', 'novalidate': 'noValidate',
        'tabindex': 'tabIndex', 'srcset': 'srcSet', 'datetime': 'dateTime', 'crossorigin': 'crossOrigin',
        'readonly': 'readOnly', 'maxlength': 'maxLength', 'colspan': 'colSpan', 'rowspan': 'rowSpan',
        'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
        'fill-rule': 'fillRule', 'clip-rule': 'clipRule', 'viewbox': 'viewBox', 'xlink:href': 'href'}
VOID = {'img', 'input', 'source', 'br', 'hr', 'meta', 'link', 'use', 'path', 'rect', 'circle'}
BOOL = {'required', 'hidden', 'open', 'selected', 'disabled', 'checked', 'inert', 'multiple'}

def style_obj(s):
    out = []
    for decl in [d for d in s.split(';') if d.strip()]:
        k, _, v = decl.partition(':')
        k = k.strip(); v = v.strip().replace("'", "\\'")
        key = f"'{k}'" if k.startswith('--') else re.sub(r'-([a-z])', lambda m: m.group(1).upper(), k)
        out.append(f"{key}: '{v}'")
    return '{{ ' + ', '.join(out) + ' }}'

def conv_tag(m):
    whole, name, attrs, selfclose = m.group(0), m.group(1), m.group(2) or '', m.group(3)
    parts = []
    for am in re.finditer(r'([\w:@.-]+)(?:\s*=\s*(?:"([^"]*)"|\'([^\']*)\'))?', attrs):
        k, v = am.group(1), am.group(2) if am.group(2) is not None else am.group(3)
        kl = k.lower()
        nk = ATTR.get(kl, k)
        if v is None:
            parts.append(nk if kl in BOOL else f'{nk}')
        elif kl == 'style':
            parts.append(f'style={style_obj(v)}')
        elif kl == 'inert':
            parts.append('inert')
        else:
            v = v.replace('{', '&#123;').replace('}', '&#125;')
            parts.append(f'{nk}="{v}"')
    close = ' /' if (name.lower() in VOID or selfclose) else ''
    return f'<{name}{(" " + " ".join(parts)) if parts else ""}{close}>'

def convert(html):
    html = re.sub(r'<!--\s*([\s\S]*?)\s*-->', lambda m: '{/* ' + m.group(1).replace('*/', '') + ' */}', html)
    # escape braces in text nodes (outside tags)
    segs = re.split(r'(<[^>]+>)', html)
    for i, s in enumerate(segs):
        if not s.startswith('<'):
            segs[i] = s.replace('{', "{'{'}").replace('}', "{'}'}") if '{/*' not in s else s
    html = ''.join(segs)
    html = re.sub(r'<([a-zA-Z][\w-]*)((?:\s+[^<>]*?)?)\s*(/)?>', conv_tag, html)
    # drop explicit closing tags of void elements we self-closed
    html = re.sub(r'</(use|path|rect|circle|source)>', '', html)
    return html

if __name__ == '__main__':
    print(convert(open(sys.argv[1]).read()))
