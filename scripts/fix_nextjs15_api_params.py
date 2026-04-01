from pathlib import Path

files = [
    'src/app/api/chantiers/[id]/route.js',
    'src/app/api/chantiers/[id]/taches/route.js',
    'src/app/api/chantiers/[id]/journal/route.js',
    'src/app/api/chantiers/[id]/photos/route.js',
    'src/app/api/chantiers/[id]/lots/route.js',
]

for rel in files:
    path = Path(rel)
    text = path.read_text(encoding='utf-8')
    new = text.replace(
        'function parseChantierId(params) {\n  const chantierId = parseInt(params.id, 10);\n',
        'async function parseChantierId(params) {\n  const resolvedParams = await params;\n  const chantierId = parseInt(resolvedParams.id, 10);\n',
    ).replace(
        'const chantierId = parseChantierId(params);',
        'const chantierId = await parseChantierId(params);'
    )
    if new != text:
        path.write_text(new, encoding='utf-8')
        print(f'Updated {rel}')
    else:
        print(f'No changes in {rel}')
