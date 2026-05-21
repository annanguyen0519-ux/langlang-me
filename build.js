const fs = require('fs');
const path = require('path');

// Parse frontmatter từ file .md
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = {};
  match[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Parse array (tags: [a, b, c])
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
    }

    // Parse number
    if (!isNaN(value) && value !== '') {
      value = Number(value);
    }

    frontmatter[key] = value;
  });

  // Body là phần còn lại sau ---
  frontmatter.body = match[2].trim();
  return frontmatter;
}

function readCollection(folder) {
  const dir = path.join(__dirname, folder);
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      return parseFrontmatter(content);
    })
    .filter(Boolean)
    // Sắp xếp mới nhất lên đầu theo date
    .sort((a, b) => {
      const parseDate = d => {
        if (!d) return 0;
        const parts = d.split('/');
        if (parts.length === 3) return new Date(parts[2], parts[1]-1, parts[0]);
        return new Date(d);
      };
      return parseDate(b.date) - parseDate(a.date);
    });
}

const data = {
  book: readCollection('content/books'),
  film: readCollection('content/films')
};

// Ghi ra data.json
fs.writeFileSync(
  path.join(__dirname, 'data.json'),
  JSON.stringify(data, null, 2)
);

console.log(`✓ data.json generated: ${data.book.length} books, ${data.film.length} films`);
