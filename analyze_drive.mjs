import { google } from 'googleapis';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeDrive() {
  console.log('Autenticando...');
  
  // Carregando as chaves
  const keyPath = path.join(__dirname, 'lms-cursos-streaming-26f801dfa40b.json');
  if (!fs.existsSync(keyPath)) {
    console.error('Arquivo de chave não encontrado!');
    return;
  }
  
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    console.log('Buscando arquivos e pastas (limite de 100 os principais)...');
    const res = await drive.files.list({
      pageSize: 100,
      fields: 'files(id, name, mimeType, parents, size)',
      q: "trashed = false",
    });

    const files = res.data.files;
    if (files.length === 0) {
      console.log('Nenhum arquivo encontrado. O Service Account só enxerga arquivos que foram COMPARTILHADOS com o email dele!');
      console.log('Email do service account que precisa ter acesso: leitor-videos-api@lms-cursos-streaming.iam.gserviceaccount.com');
    } else {
      console.log(`\nForam encontrados ${files.length} arquivos/pastas:`);
      
      const folders = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
      const videos = files.filter(f => f.mimeType.startsWith('video/'));
      const others = files.filter(f => f.mimeType !== 'application/vnd.google-apps.folder' && !f.mimeType.startsWith('video/'));

      console.log('\n--- PASTAS ---');
      folders.forEach(f => console.log(`- ${f.name} (ID: ${f.id}) - Pais: ${f.parents ? f.parents.join(', ') : 'Raiz'}`));

      console.log('\n--- VÍDEOS ---');
      videos.forEach(v => console.log(`- ${v.name} (ID: ${v.id}) - Pais: ${v.parents ? v.parents.join(', ') : 'Raiz'}`));

      if (others.length > 0) {
         console.log('\n--- OUTROS ARQUIVOS ---');
         others.forEach(o => console.log(`- ${o.name} (ID: ${o.id}) - Tipo: ${o.mimeType}`));
      }
    }
  } catch (error) {
    console.error('Erro na API do Google Drive:', error);
  }
}

analyzeDrive();
