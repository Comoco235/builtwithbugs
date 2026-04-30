/**
 * Script de vérification et nettoyage des chemins d'images
 * Scanne tous les fichiers .md, .mdx et .astro dans src/
 * Cherche les chemins pointant vers /images/ ou public/images/
 * 
 * Usage : node scripts/check-image-paths.mjs [--clean]
 *   --clean : supprime public/images/ si aucune référence n'est trouvée
 */

import { readdir, readFile, rm, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'src');
const PUBLIC_IMAGES = join(ROOT, 'public', 'images');
const CLEAN_MODE = process.argv.includes('--clean');

const EXTENSIONS = ['.md', '.mdx', '.astro'];
const PATTERNS = [
  /(?<!\.)\/images\//g,       // /images/ (pas ../../images/)
  /public\/images\//g,         // public/images/
];
// Fichiers légitimes dans public/images/ (OG fallback, etc.)
const ALLOWED_REFS = ['/images/og-default.png'];

/**
 * Récupère récursivement tous les fichiers avec les extensions ciblées.
 */
async function getFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await getFiles(fullPath, files);
    } else if (EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  console.log('🔍 Scan des fichiers dans src/ ...\n');

  const files = await getFiles(SRC_DIR);
  const issues = [];

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const fileIssues = [];

    lines.forEach((line, index) => {
      for (const pattern of PATTERNS) {
        // Reset lastIndex car on utilise le flag 'g'
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          // Ignorer les références autorisées (og-default.png, etc.)
          const isAllowed = ALLOWED_REFS.some(ref => line.includes(ref));
          if (!isAllowed) {
            fileIssues.push({
              line: index + 1,
              match: match[0],
              context: line.trim(),
            });
          }
        }
      }
    });

    if (fileIssues.length > 0) {
      issues.push({
        file: relative(ROOT, filePath),
        issues: fileIssues,
      });
    }
  }

  // --- Résultats ---
  if (issues.length > 0) {
    console.log(`⚠️  ${issues.length} fichier(s) contiennent des références vers /images/ ou public/images/ :\n`);

    for (const { file, issues: fileIssues } of issues) {
      console.log(`  📄 ${file}`);
      for (const issue of fileIssues) {
        console.log(`     L${issue.line}: ${issue.context}`);
      }
      console.log('');
    }

    console.log('❌ Impossible de supprimer public/images/ tant que ces références existent.');
    console.log('   Migre ces images vers src/assets/ ou src/content/blog/assets/ d\'abord.');
    process.exit(1);
  } else {
    console.log('✅ Aucune référence vers /images/ ou public/images/ trouvée dans src/.\n');

    if (CLEAN_MODE) {
      // Vérifier si public/images/ existe
      try {
        await stat(PUBLIC_IMAGES);
        console.log('🗑️  Suppression de public/images/ ...');
        await rm(PUBLIC_IMAGES, { recursive: true, force: true });
        console.log('✅ public/images/ supprimé avec succès.');
      } catch {
        console.log('ℹ️  public/images/ n\'existe pas, rien à supprimer.');
      }
    } else {
      console.log('💡 Lance avec --clean pour supprimer automatiquement public/images/');
      console.log('   node scripts/check-image-paths.mjs --clean');
    }
  }
}

main().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
