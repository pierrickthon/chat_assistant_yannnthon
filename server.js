const http = require('http');
const fs = require('fs');
const path = require('path');

const RULES = [
  [/loyer|r[ée]vis/i, "Le loyer peut être révisé une fois par an, à la date prévue au bail, selon l'indice IRL. Pensez à envoyer le calcul au locataire."],
  [/d[ée]p[ôo]t|caution/i, "Le dépôt de garantie est rendu sous 1 mois si l'état des lieux est identique, 2 mois s'il y a des différences."],
  [/quittance/i, "La quittance est gratuite et à envoyer sur demande du locataire. Elle prouve que le loyer a été payé."],
  [/retard|impay/i, "En cas d'impayé : un rappel amiable d'abord, puis une lettre recommandée si rien ne bouge."],
  [/bonjour|salut|coucou/i, "Bonjour ! Posez-moi une question sur le loyer, la caution, les quittances ou un impayé."]
];

function answer(message) {
  for (const [re, text] of RULES) if (re.test(message)) return text;
  return "Je n'ai pas la réponse à celle-là. Essayez : loyer, caution, quittance ou impayé.";
}

function createServer() {
  return http.createServer((req, res) => {
    const send = (code, obj) => {
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(obj));
    };
    if (req.method === 'POST' && req.url === '/api/chat') {
      let body = '';
      req.on('data', c => (body += c));
      req.on('end', () => {
        const scenario = process.env.CAPWEB_SCENARIO;
        if (scenario === '500') return send(500, { error: 'Erreur serveur' });
        let msg;
        try { msg = JSON.parse(body).message; } catch { return send(400, { error: 'Requête invalide' }); }
        if (typeof msg !== 'string' || !msg.trim()) return send(400, { error: 'Message vide' });
        const delay = scenario === 'slow' ? 6000 : 0;
        setTimeout(() => send(200, { reply: answer(msg) }), delay);
      });
      return;
    }
    fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, data) => {
      if (err) { res.writeHead(500); return res.end('Erreur'); }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  });
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => console.log('Chat prêt sur http://localhost:' + port));
}
module.exports = { answer, createServer };
