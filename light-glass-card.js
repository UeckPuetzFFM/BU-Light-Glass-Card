/* Light Glass Card v1.0.1
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
    const width = c.card_width === "auto" ? "100%" : `${Math.max(280, Math.min(1200, Number(c.card_width) || 560))}px`;
    const showDimmer = dimmable && c.show_brightness !== false;

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;width:100%;color:#f7f3ee}
        ha-card{width:${width};max-width:100%;margin:0;box-sizing:border-box;overflow:visible;border:0;border-radius:0;background:transparent;box-shadow:none}
        .stack{display:flex;flex-direction:column;gap:12px}
        .glass{position:relative;overflow:hidden;box-sizing:border-box;border-radius:999px;border:1px solid rgba(238,232,224,.72);
          background:${on ? "linear-gradient(108deg,rgba(35,33,32,.90) 0%,rgba(49,42,37,.88) 48%,rgba(111,62,24,.86) 100%)" : "linear-gradient(108deg,rgba(34,32,31,.92) 0%,rgba(48,42,38,.88) 58%,rgba(78,51,30,.82) 100%)"};
          box-shadow:0 8px 24px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.48),inset 0 -1px 0 rgba(255,255,255,.14);
          -webkit-backdrop-filter:blur(24px) saturate(135%);backdrop-filter:blur(24px) saturate(135%)}
        .glass:before{content:"";position:absolute;inset:5px;border-radius:inherit;border:1px solid rgba(255,255,255,.19);pointer-events:none}
        .glass:after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(128deg,rgba(255,255,255,.17) 0%,rgba(255,255,255,.045) 24%,transparent 43%,transparent 70%,${on ? "rgba(255,153,45,.18)" : "rgba(255,174,98,.075)"} 100%);pointer-events:none}
        .main{height:112px;padding:14px 22px;display:flex;align-items:center;gap:22px}
        .bulb{width:58px;height:58px;flex:none;display:grid;place-items:center;color:#ffb36c;filter:drop-shadow(0 0 8px rgba(255,169,82,.62));position:relative;z-index:1}
        .bulb ha-icon{--mdc-icon-size:43px}
        .divider{width:1px;height:58px;flex:none;background:rgba(255,255,255,.43);position:relative;z-index:1}
        .name{font-size:clamp(18px,2.6vw,28px);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:0 1 auto;position:relative;z-index:1}
        .status{font-size:clamp(17px,2.5vw,27px);font-weight:550;color:${on ? "#ffb36c" : "#aaa19a"};white-space:nowrap;position:relative;z-index:1;margin-left:4px}
        .spacer{flex:1;min-width:8px}
        button{font:inherit}
        .power{width:66px;height:66px;flex:none;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:#fff8ef;background:rgba(255,255,255,.035);border:2px solid rgba(255,255,255,.84);box-shadow:inset 0 1px 4px rgba(255,255,255,.18),${on ? "0 0 17px rgba(255,170,75,.42)" : "0 2px 8px rgba(0,0,0,.22)"};position:relative;z-index:1;transition:transform .15s,background .2s,box-shadow .2s}
        .power:active{transform:scale(.94)}.power ha-icon{--mdc-icon-size:32px}
        .dimmer{height:78px;padding:10px 25px;display:flex;align-items:center;gap:20px;border-radius:999px}
        .sun{width:30px;flex:none;color:#e8ded2;position:relative;z-index:1}.sun ha-icon{--mdc-icon-size:31px}
        .min{color:#bdb5ae;font-size:19px;white-space:nowrap;position:relative;z-index:1}
        .value{color:#ffb36c;font-size:23px;font-weight:650;min-width:72px;text-align:right;font-variant-numeric:tabular-nums;position:relative;z-index:1}
        input[type=range]{position:relative;z-index:1;display:block;flex:1;min-width:45px;width:100%;height:12px;margin:0;border-radius:30px;appearance:none;outline:none;cursor:pointer;background:linear-gradient(to right,#ffad63 0%,#ffad63 ${percent}%,rgba(255,255,255,.24) ${percent}%,rgba(255,255,255,.24) 100%);box-shadow:inset 0 1px 2px rgba(0,0,0,.20)}
        input[type=range]::-webkit-slider-thumb{appearance:none;width:30px;height:30px;border-radius:50%;background:#ffad63;border:5px solid #fff5e9;box-shadow:0 2px 9px rgba(0,0,0,.42),0 0 10px rgba(255,172,96,.28)}
        input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#ffad63;border:5px solid #fff5e9;box-shadow:0 2px 9px rgba(0,0,0,.42)}
        @media(max-width:520px){.stack{gap:9px}.main{height:86px;padding:10px 13px;gap:11px}.bulb{width:42px;height:48px}.bulb ha-icon{--mdc-icon-size:34px}.divider{height:42px}.name{font-size:clamp(15px,4vw,20px)}.status{font-size:clamp(14px,3.8vw,18px);margin-left:0}.power{width:50px;height:50px;border-width:2px}.power ha-icon{--mdc-icon-size:25px}.dimmer{height:62px;padding:8px 13px;gap:10px}.sun{width:23px}.sun ha-icon{--mdc-icon-size:24px}.min{font-size:14px}.value{font-size:17px;min-width:52px}input[type=range]{height:9px}input[type=range]::-webkit-slider-thumb{width:24px;height:24px;border-width:4px}input[type=range]::-moz-range-thumb{width:14px;height:14px;border-width:4px}}
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
          <input class="brightness" type="range" min="0" max="100" step="1" value="${Math.max(0,Math.min(100,percent))}" aria-label="Helligkeit einstellen">
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
        if (this._pendingBrightness != null) data.brightness_pct = Math.max(1, this._pendingBrightness);
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
        const value = Math.max(0, Math.min(100, Number(event.target.value)));
        if (on) {
          this._pendingBrightness = null;
          this._hass.callService("light", "turn_on", { entity_id: c.entity, brightness_pct: Math.max(1, value) });
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
