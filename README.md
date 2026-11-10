# Rotulê — etiquetas adesivas para a despensa

PWA que cria etiquetas (temperos, mantimentos, casa) em várias formas e imprime
por **Bluetooth do navegador (Web Bluetooth)** em impressoras térmicas ESC/POS de 58 mm,
como a POS-5820.

## Publicar no GitHub Pages
1. Envie **todo o conteúdo desta pasta** para a raiz de um repositório (mantenha a pasta `icons/`).
2. Em *Settings → Pages*, escolha *Deploy from a branch* → `main` → `/ (root)`.
3. Abra `https://SEU-USUARIO.github.io/NOME-DO-REPO/` no **Chrome do Android**.
4. Menu ⋮ → *Instalar app*.

Web Bluetooth só funciona em HTTPS (o GitHub Pages já é) e no Chrome/Edge (Android ou computador).
iPhone/Safari não suporta.

## Usar
- **Criar**: escolha forma, estilo, enfeite e letra; toque nos modelos prontos (vários de uma vez) ou digite um texto.
- **Fila**: veja a folha exata que será impressa, ajuste as quantidades e toque em *Imprimir fila*.
- **Ajustes**: conectar à impressora, avanço de papel, tamanho do pacote e pausa.

## Se a impressão falhar
- Impressora não aparece na lista: ela pode ser só Bluetooth clássico (sem BLE). Use *Compartilhar* / *Baixar PNG* e imprima com um app como o RawBT.
- Saiu cortada ou com lixo: Ajustes → pacote de 20 bytes e pausa maior.
- Papel com espaço (gap) entre etiquetas: ligue *form feed* nos Ajustes.
- Etiquetas **Sólido** gastam mais energia e papel térmico; use *Contorno* para economizar.

## Arquivos
`index.html`, `style.css`, `app.js`, `sw.js` (offline), `manifest.webmanifest`, `icons/`, `fonts/`.

## Fontes
As letras “Bruxo” (Cinzel Decorative) e “Medieval” (MedievalSharp) são livres (SIL Open Font License) e estão embutidas em `fonts/`.
Não uso a fonte oficial de Harry Potter porque ela tem licença própria; essas duas dão um visual parecido.

Para atualizar depois de mudar algo, aumente o número em `CACHE` no `sw.js` (`rotule-v1` → `rotule-v2`).
