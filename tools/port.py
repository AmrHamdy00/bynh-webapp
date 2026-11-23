"""One-off: port the approved HTML prototype (../bynh2) into React components for the Next.js app."""
import re, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from html2jsx import convert

SRC = '/home/user/bynh2'
DST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'components')
os.makedirs(os.path.join(DST, 'pages'), exist_ok=True)

ROUTES = {
    'index.html': '/', 'about.html': '/about-us/', 'consultations.html': '/استشارات-قانونية/',
    'services.html': '/خدمات-قانونية/', 'lawyers.html': '/طلب-تسجيل-محامي/', 'faq.html': '/الأسئلة-الشائعة/',
    'contact.html': '/contact-us/', 'register.html': '/التسجيل/', 'blog.html': '/المدونة/',
    'privacy.html': '/privacy-policy/', 'terms.html': '/terms-and-conditions/', 'provider-agreement.html': '/service-provider-agreement/',
}

def relink(h):
    def rep(m):
        href = m.group(1)
        f, _, frag = href.partition('#')
        if f in ROUTES:
            return f'href="{ROUTES[f]}{("#" + frag) if frag else ""}"'
        if f == '' and frag:
            return m.group(0)
        return m.group(0)
    h = re.sub(r'href="([^"]*)"', rep, h)
    h = h.replace('src="img/', 'src="/img/').replace('srcset="img/', 'srcset="/img/')
    return h

def main_of(f):
    s = open(os.path.join(SRC, f)).read()
    m = re.search(r'<main[^>]*>([\s\S]*?)</main>', s)
    return m.group(1).strip()

def write(name, jsx, props='', sig='()'):
    body = f"""// Ported from the approved prototype. Copy is verbatim from bynh.sa.
/* eslint-disable react/no-unescaped-entities */
import type {{ ReactNode }} from 'react';

export default function {name}{sig} {{
  return (
    <>
{jsx}
    </>
  );
}}
"""
    open(os.path.join(DST, 'pages', name + '.tsx'), 'w').write(body)
    print('wrote', name)

# --- pages ---
pages = {'about.html': 'AboutPage', 'consultations.html': 'ConsultationsPage', 'services.html': 'ServicesPage',
         'lawyers.html': 'LawyersPage', 'faq.html': 'FaqPage', 'contact.html': 'ContactPage', 'register.html': 'RegisterPage'}
for f, name in pages.items():
    write(name, convert(relink(main_of(f))))

# home: latest posts injected from WordPress at build time
home = relink(main_of('index.html'))
home = home.replace('<div class="posts" id="latest" data-wp-latest="3"></div>', '@@LATEST@@')
home_jsx = convert(home).replace('@@LATEST@@', '{latest}')
write('HomePage', home_jsx, sig='({ latest }: { latest: ReactNode })')

# --- header / footer / icons ---
about = open(os.path.join(SRC, 'about.html')).read()
hdr = re.search(r'(<header class="hdr">[\s\S]*?</header>\n<nav class="mnav"[\s\S]*?</nav>)', about).group(1)
hdr = relink(hdr).replace(' aria-current="page"', '')
hjsx = convert(hdr)
# active nav state
hjsx = re.sub(r'<a href="(/[^"]*)">', lambda m: f'<a href="{m.group(1)}" aria-current={{current === \'{m.group(1)}\' ? \'page\' : undefined}}>', hjsx, count=6)
open(os.path.join(DST, 'Header.tsx'), 'w').write(f"""export default function Header({{ current }}: {{ current?: string }}) {{
  return (
    <>
{hjsx}
    </>
  );
}}
""")
ft = re.search(r'(<footer class="ft">[\s\S]*?</footer>\n<a class="wa"[\s\S]*?</a>)', about).group(1)
open(os.path.join(DST, 'Footer.tsx'), 'w').write(f"""export default function Footer() {{
  return (
    <>
{convert(relink(ft))}
    </>
  );
}}
""")
icons = open(os.path.join(SRC, 'icons.html')).read()
icons = re.sub(r'<!--[\s\S]*?-->', '', icons)
open(os.path.join(DST, 'Icons.tsx'), 'w').write(f"""/** Shared SVG sprite: <svg><use href="#i-doc" /></svg> */
export default function Icons() {{
  return (
{convert(icons).strip()}
  );
}}
""")
print('header/footer/icons done')
