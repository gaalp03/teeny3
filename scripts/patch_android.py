#!/usr/bin/env python3
"""Az Android projekt finomhangolása: fekvő tájolás és teljes képernyő."""
import os
import re

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'android', 'app', 'src', 'main')

manifest = os.path.join(root, 'AndroidManifest.xml')
s = open(manifest, encoding='utf-8').read()
if 'screenOrientation' not in s:
    s = s.replace('<activity', '<activity\n            android:screenOrientation="sensorLandscape"', 1)
open(manifest, 'w', encoding='utf-8').write(s)

styles = os.path.join(root, 'res', 'values', 'styles.xml')
s = open(styles, encoding='utf-8').read()
if 'windowFullscreen' not in s:
    s = re.sub(r'(<style name="AppTheme.NoActionBar"[^>]*>)',
               r'\1\n        <item name="android:windowFullscreen">true</item>', s, count=1)
open(styles, 'w', encoding='utf-8').write(s)
print('Android projekt: fekvő tájolás + teljes képernyő beállítva')

# Alkalmazás ikon: a játék saját ikonja (adaptív ikon helyett sima PNG)
import shutil
icon = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'icons', 'icon-192.png')
res = os.path.join(root, 'res')
shutil.rmtree(os.path.join(res, 'mipmap-anydpi-v26'), ignore_errors=True)
for d in os.listdir(res):
    if not d.startswith('mipmap'):
        continue
    for name in ('ic_launcher.png', 'ic_launcher_round.png'):
        target = os.path.join(res, d, name)
        if os.path.exists(target):
            shutil.copyfile(icon, target)
print('Android projekt: ikon lecserélve')
