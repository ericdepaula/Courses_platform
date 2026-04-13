const urls = [
  'https://search.ononoki.org',
  'https://searx.tiekoetter.com',
  'https://searx.work',
  'https://searxng.online'
];

async function test() {
  for (let u of urls) {
    try {
      const qs = u + '/search?q=medicina&format=json&categories=images';
      console.log('Testando: ' + qs);
      const r = await fetch(qs);
      const idx = await r.text();
      try {
        const j = JSON.parse(idx);
        console.log(u + ' -> SUCESSO. Tem ' + j.results?.length + ' imgs. Ex: ' + j.results[0]?.img_src);
        return;
      } catch(e) {
        console.log(u + ' -> Não é json, comecou com: ' + idx.substring(0, 30));
      }
    } catch(e) {
      console.log(u + ' -> Erro: ' + e.message);
    }
  }
}
test()