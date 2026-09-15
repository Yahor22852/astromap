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

for page in out.rglob('*.html'):
    parser = Links()
    parser.page = page
    parser.feed(page.read_text())
for script in out.rglob('*.js'):
    subprocess.run(['node', '--check', str(script)], check=True, capture_output=True)
print('Static build passed: HTML assets and JavaScript syntax verified.')
