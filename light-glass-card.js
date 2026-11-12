/* Light Glass Card v1.0.0
 * Glassmorphism Lovelace light control. No external dependencies.
 */
class LightGlassCard extends HTMLElement {
  static getStubConfig() {
    return { type: "custom:light-glass-card", entity: "light.lampe_balkon_links", name: "Lampe Balkon links", card_width: "auto" };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error("Light Glass Card: Bitte eine light-Entität angeben.");
    this.config = { name: "Licht", card_width: "auto", show_status: true, show_brightness: true, ...config };
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
    const name = c.name || entity.attributes?.friendly_name || "Licht";
    const status = on ? "Ein" : "Aus";
    const width = c.card_width === "auto" ? "100%" : `${Math.max(240, Math.min(1200, Number(c.card_width) || 420))}px`;
    const showDimmer = dimmable && c.show_brightness !== false;

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;width:100%;color:#f7f3ee}
        ha-card{width:${width};max-width:100%;margin:0;box-sizing:border-box;overflow:visible;border:0;border-radius:0;background:transparent;box-shadow:none}
        .stack{display:flex;flex-direction:column;gap:12px}
        .glass{position:relative;overflow:hidden;box-sizing:border-box;border-radius:999px;border:1px solid rgba(255,255,255,.48);
          background:${on ? "linear-gradient(108deg,rgba(37,35,34,.82) 0%,rgba(61,49,40,.78) 52%,rgba(133,75,20,.78) 100%)" : "linear-gradient(108deg,rgba(34,33,32,.84) 0%,rgba(57,50,43,.78) 62%,rgba(79,57,35,.72) 100%)"};
          box-shadow:0 9px 25px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.38),inset 0 -1px 0 rgba(255,255,255,.10);
          -webkit-backdrop-filter:blur(22px) saturate(125%);backdrop-filter:blur(22px) saturate(125%)}
        .glass:before{content:"";position:absolute;inset:5px;border-radius:inherit;border:1px solid rgba(255,255,255,.14);pointer-events:none}
        .glass:after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(128deg,rgba(255,255,255,.14),transparent 28%,transparent 68%,${on ? "rgba(255,157,48,.15)" : "rgba(255,255,255,.035)"});pointer-events:none}
        .main{min-height:88px;padding:13px 17px;display:flex;align-items:center;gap:17px}
        .bulb{width:54px;height:54px;flex:none;display:grid;place-items:center;color:${on ? "#ffc078" : "#d9d2ca"};filter:${on ? "drop-shadow(0 0 9px rgba(255,174,87,.78))" : "none"};position:relative;z-index:1}
        .bulb ha-icon{--mdc-icon-size:38px}
        .divider{width:1px;height:46px;flex:none;background:rgba(255,255,255,.24);position:relative;z-index:1}
        .name{font-size:clamp(17px,2.7vw,24px);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;position:relative;z-index:1}
        .status{font-size:clamp(16px,2.6vw,23px);font-weight:550;color:${on ? "#ffc078" : "#aaa19a"};white-space:nowrap;position:relative;z-index:1}
        .spacer{flex:1;min-width:0}
        button{font:inherit}
        .power{width:58px;height:58px;flex:none;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:#fff8ef;background:rgba(255,255,255,.035);border:3px solid rgba(255,255,255,.82);box-shadow:inset 0 1px 3px rgba(255,255,255,.15),${on ? "0 0 16px rgba(255,170,75,.38)" : "0 2px 8px rgba(0,0,0,.22)"};position:relative;z-index:1;transition:transform .15s,background .2s,box-shadow .2s}
        .power:active{transform:scale(.94)}.power ha-icon{--mdc-icon-size:29px}
        .dimmer{padding:13px 18px 12px;display:flex;align-items:center;gap:15px;min-height:60px;border-radius:999px}
        .sun{width:25px;flex:none;color:#e8ded2;position:relative;z-index:1}.sun ha-icon{--mdc-icon-size:24px}
        .min{color:#bdb5ae;font-size:14px;white-space:nowrap;position:relative;z-index:1}
        .value{color:${on ? "#ffbd78" : "#c6b9aa"};font-size:19px;font-weight:650;min-width:54px;text-align:right;font-variant-numeric:tabular-nums;position:relative;z-index:1}
        input[type=range]{position:relative;z-index:1;display:block;flex:1;min-width:45px;width:100%;height:8px;margin:0;border-radius:30px;appearance:none;outline:none;cursor:pointer;background:linear-gradient(to right,#ffb36f 0%,#ffb36f ${percent}%,rgba(255,255,255,.23) ${percent}%,rgba(255,255,255,.23) 100%)}
        input[type=range]::-webkit-slider-thumb{appearance:none;width:22px;height:22px;border-radius:50%;background:#ffb36f;border:4px solid #fff5e9;box-shadow:0 1px 8px rgba(0,0,0,.38)}
        input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#ffb36f;border:4px solid #fff5e9;box-shadow:0 1px 8px rgba(0,0,0,.38)}
        .offhint{font-size:10px;color:rgba(240,230,218,.65);position:absolute;left:50%;bottom:-17px;transform:translateX(-50%);white-space:nowrap}
        @media(max-width:430px){.stack{gap:9px}.main{min-height:72px;padding:10px 12px;gap:10px}.bulb{width:40px;height:44px}.bulb ha-icon{--mdc-icon-size:32px}.divider{height:38px}.power{width:48px;height:48px;border-width:2px}.power ha-icon{--mdc-icon-size:25px}.dimmer{padding:11px 13px;gap:9px;min-height:54px}.value{font-size:16px;min-width:45px}.min{font-size:12px}}
        @media(prefers-reduced-motion:reduce){*{transition:none!important}}
      </style>
      <ha-card><div class="stack">
        <div class="glass main">
          <div class="bulb"><ha-icon icon="mdi:lightbulb"></ha-icon></div>
          <div class="divider"></div>
          <div class="name">${this._esc(name)}</div>
          ${c.show_status === false ? "" : `<div class="status">${status}</div>`}
          <div class="spacer"></div>
          <button class="power" type="button" aria-label="Licht ${on ? "ausschalten" : "einschalten"}" title="${on ? "Ausschalten" : "Einschalten"}"><ha-icon icon="mdi:power"></ha-icon></button>
        </div>
        ${showDimmer ? `<div class="glass dimmer">
          <div class="sun"><ha-icon icon="mdi:brightness-6"></ha-icon></div>
          <span class="min">0 %</span>
          <input class="brightness" type="range" min="1" max="100" step="1" value="${Math.max(1,Math.min(100,percent || 1))}" aria-label="Helligkeit einstellen">
          <span class="value">${percent} %</span>
          ${!on ? `<span class="offhint">Helligkeit für das nächste Einschalten wählen</span>` : ""}
        </div>` : ""}
      </div></ha-card>`;

    this.shadowRoot.querySelector(".power")?.addEventListener("click", () => {
      if (!this._hass) return;
      if (on) {
        this._hass.callService("light", "turn_off", { entity_id: c.entity });
      } else {
        const data = { entity_id: c.entity };
        if (this._pendingBrightness != null) data.brightness_pct = this._pendingBrightness;
        this._hass.callService("light", "turn_on", data);
        this._pendingBrightness = null;
      }
    });

    const slider = this.shadowRoot.querySelector(".brightness");
    if (slider) {
      slider.addEventListener("input", event => {
        const value = Number(event.target.value);
        this._pendingBrightness = value;
        const valueNode = this.shadowRoot.querySelector(".value");
        if (valueNode) valueNode.textContent = `${value} %`;
        event.target.style.background = `linear-gradient(to right,#ffb36f 0%,#ffb36f ${value}%,rgba(255,255,255,.23) ${value}%,rgba(255,255,255,.23) 100%)`;
      });
      slider.addEventListener("change", event => {
        if (!this._hass) return;
        const value = Math.max(1, Math.min(100, Number(event.target.value)));
        if (on) {
          this._pendingBrightness = null;
          this._hass.callService("light", "turn_on", { entity_id: c.entity, brightness_pct: value });
        }
        // While off, keep the selected value locally; the next power-on applies it.
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
      { name: "name", selector: { text: {} } },
      { name: "card_width", selector: { select: { options: [{ label: "Automatisch", value: "auto" }, { label: "320 px", value: "320" }, { label: "400 px", value: "400" }, { label: "480 px", value: "480" }, { label: "560 px", value: "560" }], mode: "dropdown" } } },
      { name: "show_status", selector: { boolean: {} } },
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
