# web-niimbot

Local Chrome web app for printing plain text labels to a NIIMBOT D11_H over Bluetooth.

## Requirements

- Chrome with Web Bluetooth support
- NIIMBOT D11_H powered on and near the computer
- `localhost` development server

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173` in Chrome.

## Print

1. Select `12 x 22 mm` or `12 x 30 mm`. The default is `12 x 22 mm`.
2. Type the label text.
3. Click `Connect`.
4. Select the NIIMBOT printer in Chrome's Bluetooth picker.
5. Click `Print`.

## Verify

```bash
npm run build
npm test
npm run smoke
```

Real D11_H output must be validated with the printer because Web Bluetooth cannot be exercised in automated tests.
