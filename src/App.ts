export class App {
  constructor(private readonly root: HTMLElement) {}

  render(): void {
    this.root.innerHTML = `
      <section class="app-shell">
        <h1>NIIMBOT D11_H</h1>
        <p class="subtitle">Local text label printer</p>
      </section>
    `;
  }
}
