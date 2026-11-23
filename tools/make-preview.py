"""Make an artifact preview of the static export (./out) — preview only, not for production.
- picks every page except most of the 456 posts (preview hosting allows ~500 files per version)
- turns root-absolute URLs into relative ones (the preview isn't served from a domain root)
- swaps bynh.sa images (blocked in the preview sandbox) for local thumbnails
Output: ../preview/ (publish with index.html as the entry)."""
import os, re, json, shutil, urllib.parse, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
DST = os.path.join(os.path.dirname(ROOT), 'bynh-preview')
THUMBS = '/home/user/bynh2/wp/img'          # local copies of featured images, by post id
SNAP = '/home/user/bynh2/wp/posts.json'      # post id <-> slug

shutil.rmtree(DST, ignore_errors=True)
os.makedirs(DST)

idx = json.load(open(os.path.join(OUT, 'blog-index.json')))
posts = idx['posts']
snap = {p['slug'].strip('/'): p['id'] for p in json.load(open(SNAP))['posts']}
keep_posts = [p['slug'] for p in posts[:28]]          # blog pages 1–3 (+ home's latest)
pages = ['', 'about-us', 'contact-us', 'privacy-policy', 'terms-and-conditions', 'service-provider-agreement',
         'استشارات-قانونية', 'خدمات-قانونية', 'طلب-تسجيل-محامي', 'الأسئلة-الشائعة', 'التسجيل', 'المدونة',
         'المدونة/page/2', 'المدونة/page/3', '404'] + keep_posts
present = set(pages)

def base(u):  # image base name without WP size suffix
    n = urllib.parse.unquote(u.split('?')[0].split('/')[-1])
    return re.sub(r'-\d+x\d+(?=\.\w+$)', '', n).rsplit('.', 1)[0].lower()

img_by_base = {}
for p in posts:
    if p['imageSmall'] and p['slug'] in snap and os.path.exists(f"{THUMBS}/{snap[p['slug']]}.webp"):
        img_by_base[base(p['imageSmall'])] = snap[p['slug']]

used_thumbs = set()

def rel_target(path, prefix):
    """'/about-us/#x' -> '<prefix>about-us/index.html#x' (or the missing-page stub)."""
    path, _, frag = path.partition('#')
    clean = urllib.parse.unquote(path).strip('/')
    if path.startswith(('/_next/', '/img/', '/wp/')) or re.search(r'\.\w+$', clean):
        t = prefix + path.lstrip('/')
    else:
        page = 'home' if clean == '' else clean
        t = prefix + (f'{page}/index.html' if clean in present else 'missing.html')
    return t + (('#' + frag) if frag else '')

def fix_html(h, depth):
    prefix = '../' * depth
    def img(m):
        attr, q, val = m.group(1), m.group(2), m.group(3)
        if 'wp-content/uploads' in val:
            pid = img_by_base.get(base(val))
            if pid:
                used_thumbs.add(pid)
                return f'{attr}={q}{prefix}wp/img/{pid}.webp{q}'
        return m.group(0)
    def anyurl(m):
        pid = img_by_base.get(base(m.group(0)))
        if pid:
            used_thumbs.add(pid)
            return f'{prefix}wp/img/{pid}.webp'
        return 'data:,'   # inline post images: blocked in the preview sandbox, hidden by preview.js
    # swap images only in markup, never inside <script> (React's payload is length-prefixed)
    parts = re.split(r'(<script[\s\S]*?</script>)', h)
    h = ''.join(x if x.startswith('<script') else re.sub(r'https?://(?:www\.)?bynh\.sa/wp-content/uploads/[^"\\\s,)]+', anyurl, x) for x in parts)
    h = re.sub(r'(href|src)="(/(?!/)[^"]*)"', lambda m: f'{m.group(1)}="{rel_target(m.group(2), prefix)}"', h)
    h = re.sub(r'srcSet="[^"]*"|srcset="[^"]*"', '', h)
    # React's inline page payload also references /_next/ (fonts, css) inside JS strings
    h = h.replace('\\"/_next/', '\\"' + prefix + '_next/').replace('"/_next/', '"' + prefix + '_next/')
    helper = f'<script>window.__P={json.dumps(prefix)};</script><script src="{prefix}preview.js"></script>'
    h = h.replace('</head>', helper + '</head>', 1)
    return h

for pg in pages:
    src = os.path.join(OUT, pg, 'index.html') if pg else os.path.join(OUT, 'index.html')
    if pg == '404':
        src = os.path.join(OUT, '404.html')
    name = 'home' if pg == '' else pg
    depth = name.count('/') + 1
    out = os.path.join(DST, name, 'index.html')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w').write(fix_html(open(src).read(), depth))

# static assets
shutil.copytree(os.path.join(OUT, '_next'), os.path.join(DST, '_next'))
shutil.copytree(os.path.join(OUT, 'img'), os.path.join(DST, 'img'))
# the preview host reserves names starting with "_": serve Next's _next/ as nx/
os.rename(os.path.join(DST, '_next'), os.path.join(DST, 'nx'))
for f in glob.glob(os.path.join(DST, '**/*'), recursive=True):
    if os.path.isfile(f) and f.endswith(('.html', '.js', '.css')):
        t = open(f).read()
        if '_next/' in t:
            open(f, 'w').write(t.replace('_next/', 'nx/'))

for css in glob.glob(os.path.join(DST, 'nx/static/css/*.css')):
    s = open(css).read().replace('url(/nx/static/media/', 'url(../media/')
    open(css, 'w').write(s)
for js in glob.glob(os.path.join(DST, 'nx/static/chunks/webpack-*.js')):
    s = open(js).read().replace('.p="/nx/"', '.p=(window.__P||"")+"nx/"')
    open(js, 'w').write(s)

# literal U+FFFD in Next's polyfills: use the equivalent JS escape (preview host rejects the raw character)
for f in glob.glob(os.path.join(DST, 'nx/**/*.js'), recursive=True):
    t = open(f, encoding='utf-8').read()
    if '\ufffd' in t:
        open(f, 'w', encoding='utf-8').write(t.replace('\ufffd', '\\ufffd'))

# search index: relative thumbnails where we have them
lite = []
for p in posts:
    pid = snap.get(p['slug'])
    th = f'/wp/img/{pid}.webp' if pid and os.path.exists(f'{THUMBS}/{pid}.webp') and p['slug'] in present else None
    if th: used_thumbs.add(pid)
    lite.append({**p, 'imageSmall': th})
json.dump({'total': idx['total'], 'posts': lite}, open(os.path.join(DST, 'blog-index.json'), 'w'), ensure_ascii=False)

os.makedirs(os.path.join(DST, 'wp/img'), exist_ok=True)
for pid in used_thumbs:
    shutil.copy(f'{THUMBS}/{pid}.webp', os.path.join(DST, f'wp/img/{pid}.webp'))

# helper: keep client-rendered links/images relative, route fetch(), hide blocked inline post images
open(os.path.join(DST, 'preview.js'), 'w').write(r"""(function(){
var P=window.__P||'';var have=%s;
function rel(u){if(!u||u[0]!=='/'||u[1]==='/')return u;var p=u.split('#'),path=p[0],c=decodeURIComponent(path).replace(/^\/|\/$/g,'');
 if(/^(_next|nx|img|wp)\//.test(c)||/\.\w+$/.test(c))return P+path.replace(/^\//,'')+(p[1]?'#'+p[1]:'');
 var t=c===''?'home/index.html':(have.indexOf(c)>-1?c+'/index.html':'missing.html');return P+t+(p[1]?'#'+p[1]:'');}
var f=window.fetch;window.fetch=function(u,o){if(typeof u==='string')u=rel(u);return f.call(this,u,o);};
function fix(root){(root.querySelectorAll?root:document).querySelectorAll('a[href^="/"]').forEach(function(a){a.setAttribute('href',rel(a.getAttribute('href')));});
 (root.querySelectorAll?root:document).querySelectorAll('img[src^="/"]').forEach(function(i){i.setAttribute('src',rel(i.getAttribute('src')));});}
document.addEventListener('DOMContentLoaded',function(){fix(document);new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)fix(n);});});}).observe(document.body,{childList:true,subtree:true});});
var s=document.createElement('style');s.textContent='.prose img[src^="http"],.prose img[src^="data:"]{display:none}';document.head.appendChild(s);
})();""" % json.dumps(sorted(present)))

open(os.path.join(DST, 'missing.html'), 'w').write("""<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>معاينة</title><style>body{margin:0;font-family:system-ui,sans-serif;background:#F6F8FA;color:#0B2A3A;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px}a{color:#083A51;font-weight:600}</style></head>
<body><div><h1 style="font-size:22px">هذه الصفحة غير مضمّنة في المعاينة</h1><p>المعاينة تضم الصفحات الرئيسية وأحدث 28 مقالاً. الموقع الكامل يضم جميع المقالات الـ 456.</p><p><a href="home/index.html">الرئيسية</a> · <a href="المدونة/index.html">المدونة</a></p></div></body></html>""")

# artifact entry page (fragment): open the real home page
open(os.path.join(DST, 'index.html'), 'w').write("""<title>بيّنه — Next.js</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>body{background:#fff}</style>
<script>location.replace('home/index.html');</script>
<p style="font-family:system-ui;text-align:center;padding:40px"><a href="home/index.html">بيّنه</a></p>
""")

files = [os.path.relpath(f, DST) for f in glob.glob(os.path.join(DST, '**/*'), recursive=True) if os.path.isfile(f)]
json.dump(sorted(f for f in files if f != 'index.html'), open(os.path.join(DST, '..', 'bynh-preview-files.json'), 'w'), ensure_ascii=False)
print('files', len(files), 'thumbs', len(used_thumbs), 'pages', len(pages))
