from pathlib import Path
import shutil
import subprocess
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

root = Path(__file__).resolve().parent
out = root / 'dist'
out.mkdir(exist_ok=True)
shutil.copytree(root / 'funnel', out, dirs_exist_ok=True, ignore=shutil.ignore_patterns('.DS_Store', 'README.md'))
shutil.copytree(root / 'product', out / 'product', dirs_exist_ok=True, ignore=shutil.ignore_patterns('.DS_Store', 'README.md'))

# ВЕРСИЯ НА ССЫЛКАХ. GitHub Pages отдаёт файлы с max-age=600, а встроенные
# браузеры приложений (TikTok, Telegram, Instagram) держат кэш ещё дольше:
# после выкладки человек видел новый index.html со старыми CSS и JS. Теперь
# к каждой ссылке на свои .js/.css дописывается ?v=<хэш содержимого> —
# изменился любой файл, изменились и адреса, и браузер берёт новые.
# В исходниках версии нет: она ставится только в собранном dist/.
import hashlib, re
_h = hashlib.sha1()
for f in sorted(list(out.rglob('*.js')) + list(out.rglob('*.css'))):
    _h.update(f.read_bytes())
VER = _h.hexdigest()[:10]
for page in out.rglob('*.html'):
    t = page.read_text()
    t = re.sub(r'((?:src|href)=")((?![a-z]+:|//)[^"?#]+\.(?:js|css))"', r'\1\2?v=' + VER + '"', t)
    t = t.replace('.js"><\\/script>', '.js?v=' + VER + '"><\\/script>')
    t = t.replace('<head>', '<head>\n<script>window.ASTROMAP_V = ' + repr(VER) + ';</script>', 1)
    page.write_text(t)

class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key not in ('src', 'href') or not value:
                continue
            u = urlsplit(value)
            if u.scheme or u.netloc or not u.path:
                continue
            target = (out if u.path.startswith('/') else self.page.parent) / unquote(u.path.lstrip('/'))
            assert target.exists(), f'Missing asset: {self.page}: {value}'

# Языковые файлы воронки подключаются через document.write, поэтому парсер
# ссылок ниже их не видит: в разметке этих src нет. Проверяем отдельно — иначе
# опечатка в коде языка означала бы молчаливый откат на английский в проде.
FUNNEL_LANGS = ['ru', 'uk', 'de', 'es', 'fr', 'it', 'pt', 'tr']
for code in FUNNEL_LANGS:
    for name in (f'{code}.js', f'{code}-reading.js'):
        target = out / 'js' / 'lang' / name
        assert target.exists(), f'Missing funnel locale: js/lang/{name}'

# Квиз v2: тексты на каждом языке воронки, ключ в ключ как английский
# (js/quiz-copy.js). Недостающий ключ на экране молча стал бы английским,
# лишний — опечаткой в имени, которую никто не читает.
QUIZ_CHECK = r'''
const vm = require('vm'), fs = require('fs');
const g = { LANG: 'en' }; g.window = g; vm.createContext(g);
const run = f => vm.runInContext(fs.readFileSync(f, 'utf8'), g);
run(process.argv[1] + '/js/quiz-copy.js');
const shape = (o, p = '') => typeof o !== 'object' || o === null ? [p + ':' + typeof o]
  : Array.isArray(o) ? [p + ':array' + o.length].concat(...o.map((x, i) => shape(x, p + '.' + i)))
  : [].concat(...Object.keys(o).sort().map(k => shape(o[k], p + '.' + k)));
const en = shape(g.QUIZ_ALL.en).join('\n');
const bad = [];
for (const l of process.argv.slice(2)) {
  run(process.argv[1] + '/js/lang/' + l + '-quiz.js');
  if (!g.QUIZ_ALL[l]) { bad.push(l + ': not registered'); continue; }
  const got = shape(g.QUIZ_ALL[l]).join('\n');
  if (got !== en) {
    const a = new Set(en.split('\n')), b = new Set(got.split('\n'));
    bad.push(l + ': missing ' + [...a].filter(x => !b.has(x)).slice(0, 5) + ' extra ' + [...b].filter(x => !a.has(x)).slice(0, 5));
  }
}
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
'''
QUIZ_LANGS = ['pl'] + FUNNEL_LANGS
for code in QUIZ_LANGS:
    assert (out / 'js' / 'lang' / f'{code}-quiz.js').exists(), f'Missing quiz locale: js/lang/{code}-quiz.js'
r = subprocess.run(['node', '-e', QUIZ_CHECK, str(out)] + QUIZ_LANGS, capture_output=True, text=True)
assert r.returncode == 0, 'Quiz locales differ from English:\n' + r.stderr

for page in out.rglob('*.html'):
    parser = Links()
    parser.page = page
    parser.feed(page.read_text())
for script in out.rglob('*.js'):
    subprocess.run(['node', '--check', str(script)], check=True, capture_output=True)
print('Static build passed: HTML assets and JavaScript syntax verified.')
