with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove orphaned script content between home.js and </script>
start = content.find('    <script src="scripts/home.js" defer></script>')
end = content.find('</script>', start)
if start != -1 and end != -1:
    before = content[:start + len('    <script src="scripts/home.js" defer></script>')]
    after = content[end:]
    new_content = before + '\n' + after
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Removed orphaned script')
else:
    print('Markers not found', start, end)
