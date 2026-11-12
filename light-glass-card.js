/* Light Glass Card v1.1.0
 * Glassmorphism Lovelace light control. No external dependencies.
 */
class LightGlassCard extends HTMLElement {
  static getStubConfig() {
    return { type: "custom:light-glass-card", entity: "light.lampe_balkon_links", group_name: "Balkon", name: "Lampe Links", card_width: "auto" };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error("Light Glass Card: Bitte eine light-Entität angeben.");
    this.config = { group_name: "Balkon", name: "Lampe Links", card_width: "auto", show_brightness: true, ...config };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._lastSignature = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot || !this.config) return;
    const entity = hass?.states?.[this.config.entity];
    const signature = entity ? `${entity.state}|${entity.attributes?.brightness ?? ""}|${entity.attributes?.supported_color_modes?.join(",") ?? ""}` : "missing";
    if (signature !== this._lastSignature) { this._lastSignature = signature; this._render(); }
  }

  getCardSize() { return 2; }
  _esc(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
  _isDimmable(entity) {
    const modes = entity?.attributes?.supported_color_modes;
    if (Array.isArray(modes)) return modes.some(mode => mode !== "onoff");
    return entity?.attributes?.brightness !== undefined;
  }

  _render() {
    if (!this.shadowRoot || !this.config) return;
    const c = this.config;
    const entity = this._hass?.states?.[c.entity];
    if (!entity) {
      this.shadowRoot.innerHTML = `<style>:host{display:block}.missing{padding:16px;color:var(--error-color)}</style><ha-card><div class="missing">Licht-Entität nicht gefunden: ${this._esc(c.entity)}</div></ha-card>`;
      return;
    }
    const on = entity.state === "on";
    const dimmable = this._isDimmable(entity);
    const actualBrightness = entity.attributes?.brightness;
    const actualPercent = actualBrightness == null ? (on ? 100 : 0) : Math.round(Number(actualBrightness) / 255 * 100);
    const percent = this._pendingBrightness ?? actualPercent;
    const groupName = c.group_name || "Licht";
    const name = c.name || entity.attributes?.friendly_name || "Lampe";
    const width = c.card_width === "auto" ? "100%" : `${Math.max(260, Math.min(1200, Number(c.card_width) || 420))}px`;
    const showDimmer = dimmable && c.show_brightness !== false && on;

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;width:100%;color:#f5f3f1}
        ha-card{width:${width};max-width:100%;box-sizing:border-box;margin:0;padding:0;border-radius:34px;
          background:linear-gradient(145deg,rgba(43,42,42,.94),rgba(23,23,24,.96));
          border:1px solid rgba(255,255,255,.16);
          box-shadow:0 10px 28px rgba(0,0,0,.30),inset 0 1px 2px rgba(255,255,255,.13),inset 0 -2px 5px rgba(0,0,0,.42);
          overflow:hidden;-webkit-backdrop-filter:blur(22px) saturate(120%);backdrop-filter:blur(22px) saturate(120%)}
        .shell{padding:18px 16px 17px;position:relative}
        .shell:before{content:"";position:absolute;inset:5px;border-radius:29px;border:1px solid rgba(255,255,255,.075);pointer-events:none}
        .heading{font-size:clamp(20px,3vw,27px);font-weight:750;line-height:1.2;margin:3px 8px 25px;letter-spacing:-.35px;color:#faf9f8}
        .device{height:100px;display:flex;align-items:center;gap:17px;padding:8px 17px 8px 8px;border-radius:999px;
          background:linear-gradient(180deg,rgba(210,205,199,.28) 0%,rgba(110,106,103,.25) 15%,rgba(54,52,52,.83) 55%,rgba(36,35,35,.92) 100%);
          border:1px solid rgba(239,235,230,.58);
          box-shadow:inset 0 2px 3px rgba(255,255,255,.36),inset 0 -3px 6px rgba(0,0,0,.55),0 2px 7px rgba(0,0,0,.25);
          position:relative;overflow:hidden}
        .device:before{content:"";position:absolute;inset:4px;border-radius:inherit;border:1px solid rgba(255,255,255,.10);pointer-events:none}
        .icon-button{width:82px;height:82px;flex:none;border-radius:50%;display:grid;place-items:center;cursor:pointer;
          color:${on ? "#ffbd82" : "#f4f3f1"};
          background:linear-gradient(145deg,rgba(225,222,218,.43),rgba(83,81,80,.42) 48%,rgba(36,35,35,.78));
          border:1px solid rgba(255,255,255,.42);
          box-shadow:inset 0 2px 5px rgba(255,255,255,.40),inset 0 -4px 7px rgba(0,0,0,.42),0 2px 5px rgba(0,0,0,.25);
          position:relative;z-index:1;transition:transform .15s,filter .2s}
        .icon-button:active{transform:scale(.95)}
        .icon-button ha-icon{--mdc-icon-size:35px;filter:${on ? "drop-shadow(0 0 7px rgba(255,170,98,.72))" : "none"}}
        .labels{display:flex;flex-direction:column;justify-content:center;gap:7px;min-width:0;position:relative;z-index:1}
        .lamp-name{font-size:clamp(19px,2.7vw,26px);font-weight:750;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}
        .status{font-size:clamp(16px,2.3vw,21px);font-weight:500;color:${on ? "#ffbd82" : "#c7c4c3"};line-height:1.1}
        .dimmer{margin-top:12px;padding:12px 17px;min-height:58px;display:flex;align-items:center;gap:14px;border-radius:999px;
          background:linear-gradient(180deg,rgba(185,180,175,.23),rgba(54,52,52,.72));
          border:1px solid rgba(238,232,225,.40);box-shadow:inset 0 1px 3px rgba(255,255,255,.23),inset 0 -2px 5px rgba(0,0,0,.35)}
        .sun{flex:none;color:#eee9e3}.sun ha-icon{--mdc-icon-size:24px}
        .range{flex:1;min-width:40px;height:9px;margin:0;appearance:none;border-radius:99px;outline:none;cursor:pointer;
          background:linear-gradient(to right,#ffb779 0%,#ffb779 ${percent}%,rgba(255,255,255,.23) ${percent}%,rgba(255,255,255,.23) 100%)}
        .range::-webkit-slider-thumb{appearance:none;width:23px;height:23px;border-radius:50%;background:#ffb779;border:4px solid #f8f2ec;box-shadow:0 2px 7px rgba(0,0,0,.42)}
        .range::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:#ffb779;border:4px solid #f8f2ec;box-shadow:0 2px 7px rgba(0,0,0,.42)}
        .percent{min-width:45px;text-align:right;color:#f6c092;font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}
        @media(max-width:480px){.shell{padding:14px 12px}.heading{margin:2px 7px 18px;font-size:21px}.device{height:82px;gap:12px;padding:6px 13px 6px 6px}.icon-button{width:68px;height:68px}.icon-button ha-icon{--mdc-icon-size:30px}.lamp-name{font-size:19px}.status{font-size:16px}.dimmer{min-height:52px;padding:9px 13px;gap:10px}}
      </style>
      <ha-card><div class="shell">
        <div class="heading">${this._esc(groupName)}</div>
        <div class="device">
          <button class="icon-button" type="button" aria-label="${on ? "Lampe ausschalten" : "Lampe einschalten"}" title="${on ? "Ausschalten" : "Einschalten"}">
            <ha-icon icon="${on ? "mdi:lightbulb" : "mdi:lightbulb-off"}"></ha-icon>
          </button>
          <div class="labels">
            <div class="lamp-name">${this._esc(name)}</div>
            <div class="status">${on ? "Ein" : "Aus"}</div>
          </div>
        </div>
        ${showDimmer ? `<div class="dimmer">
          <div class="sun"><ha-icon icon="mdi:brightness-6"></ha-icon></div>
          <input class="range" type="range" min="1" max="100" step="1" value="${Math.max(1,Math.min(100,percent))}" aria-label="Helligkeit einstellen">
          <span class="percent">${percent} %</span>
        </div>` : ""}
      </div></ha-card>`;

    this.shadowRoot.querySelector(".icon-button")?.addEventListener("click", () => {
      if (!this._hass) return;
      if (on) this._hass.callService("light", "turn_off", { entity_id: c.entity });
      else {
        const data = { entity_id: c.entity };
        if (this._pendingBrightness != null) data.brightness_pct = Math.max(1, this._pendingBrightness);
        this._hass.callService("light", "turn_on", data);
        this._pendingBrightness = null;
      }
    });
    const slider = this.shadowRoot.querySelector(".range");
    if (slider) {
      slider.addEventListener("input", event => {
        const value = Number(event.target.value);
        this._pendingBrightness = value;
        const node = this.shadowRoot.querySelector(".percent");
        if (node) node.textContent = `${value} %`;
        event.target.style.background = `linear-gradient(to right,#ffb779 0%,#ffb779 ${value}%,rgba(255,255,255,.23) ${value}%,rgba(255,255,255,.23) 100%)`;
      });
      slider.addEventListener("change", event => {
        if (!this._hass) return;
        const value = Math.max(1, Math.min(100, Number(event.target.value)));
        this._pendingBrightness = null;
        this._hass.callService("light", "turn_on", { entity_id: c.entity, brightness_pct: value });
      });
    }
  }

  static getConfigElement() { return document.createElement("light-glass-card-editor"); }
}

class LightGlassCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    if (!this._rendered) { this._rendered = true; this._renderEditor(); }
  }
  _renderEditor() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<style>:host{display:block}ha-form{display:block}</style><ha-form></ha-form>`;
    const form = this.shadowRoot.querySelector("ha-form");
    form.hass = this._hass;
    form.data = { ...this._config };
    form.schema = [
      { name: "entity", required: true, selector: { entity: { domain: "light" } } },
      { name: "group_name", selector: { text: {} } },
      { name: "name", selector: { text: {} } },
      { name: "card_width", selector: { select: { options: [{ label: "Automatisch", value: "auto" }, { label: "320 px", value: "320" }, { label: "400 px", value: "400" }, { label: "480 px", value: "480" }, { label: "560 px", value: "560" }], mode: "dropdown" } } },
      { name: "show_brightness", selector: { boolean: {} } }
    ];
    form.addEventListener("value-changed", event => {
      event.stopPropagation();
      const next = { ...this._config, ...event.detail.value };
      Object.keys(next).forEach(key => { if (next[key] === "" || next[key] === undefined) delete next[key]; });
      this._config = next;
      this.dispatchEvent(new CustomEvent("config-changed", { bubbles: true, composed: true, detail: { config: next } }));
    });
  }
  set hass(hass) { this._hass = hass; const form = this.shadowRoot?.querySelector("ha-form"); if (form) form.hass = hass; }
}

if (!customElements.get("light-glass-card")) customElements.define("light-glass-card", LightGlassCard);
if (!customElements.get("light-glass-card-editor")) customElements.define("light-glass-card-editor", LightGlassCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === "light-glass-card")) window.customCards.push({ type: "light-glass-card", name: "Light Glass Card", description: "Glass-Karte für Ein/Aus und Helligkeit von Home-Assistant-Lichtern." });
