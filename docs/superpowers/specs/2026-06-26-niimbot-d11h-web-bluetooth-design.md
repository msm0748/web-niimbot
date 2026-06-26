# NIIMBOT D11_H Web Bluetooth Text Label Printer Design

## Goal

Build a local-only Chrome web app for printing text labels to a NIIMBOT D11_H over Bluetooth. The first version supports only text labels, two label sizes, and a direct input-to-print workflow.

## Scope

- Run on `localhost` in Chrome.
- Connect to the printer with Web Bluetooth only.
- Support NIIMBOT D11_H as the target model.
- Support label sizes `12x22mm` and `12x30mm`.
- Default to `12x30mm`.
- Print plain text only.
- Center text horizontally and vertically.
- Automatically shrink font size so the text fits the selected label.
- Show a small status log for connection and print failures.

Out of scope:

- Accounts, cloud sync, deployment, or server-side printing.
- USB printing.
- QR codes, barcodes, images, icons, rich text, or batch printing.
- Persistent saved label templates.

## Architecture

The app will be a small Vite + TypeScript browser app. The UI, label rendering, and printer transport stay separated:

- `App`: label size selector, text input, connect button, print button, status log.
- `renderLabel`: draws text into an offscreen canvas at the selected physical size and target printer resolution.
- `NiimbotPrinter`: a narrow interface for connect, disconnect, and print bitmap.
- `WebBluetoothNiimbotPrinter`: the implementation that talks to the printer through Chrome Web Bluetooth.

The printer adapter will first try to reuse a permissively licensed browser NIIMBOT implementation or protocol code. If no suitable package fits, the app will keep the same adapter interface and implement the minimal D11-compatible BLE packet flow inside that adapter.

## Data Flow

1. User selects `12x22mm` or `12x30mm`.
2. User enters text.
3. User clicks connect.
4. Chrome opens the Bluetooth chooser and the user selects the D11_H.
5. User clicks print.
6. The app renders the text to a monochrome bitmap.
7. The printer adapter sends the bitmap to the D11_H over BLE.
8. The status log reports success or the specific failure.

## Error Handling

The UI will report:

- Web Bluetooth is unavailable.
- Bluetooth chooser was cancelled.
- No compatible printer was selected.
- Printer disconnected.
- Print command failed.
- Text is empty.

Errors remain visible in the status log so real-device debugging is possible.

## Testing

- Unit test label sizing and text fitting logic.
- Unit test bitmap conversion boundaries for both label sizes.
- Browser smoke test that the app loads and the main controls are present.
- Real-device validation is required for final D11_H protocol confirmation.

## Acceptance Criteria

- The app runs locally in Chrome.
- The user can connect to the D11_H through the browser Bluetooth picker.
- The user can select `12x22mm` or `12x30mm`.
- The user can type text and print it immediately.
- The printed text is centered and scaled to fit the label.
- Connection and print failures are visible in the app.
