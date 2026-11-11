/* Light Glass Card v1.0.0
 * Independent Lovelace card for Home Assistant. No external dependencies.
 */
class LightGlassCard extends HTMLElement {
  static getStubConfig() {
    return { type: "custom:light-glass-card", entity: "light.lampe_balkon_links", name: "Balkon links", card_width: "auto", min_height: 210 };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error("Light Glass Card: Bitte eine light-Entität angeben.");
    this.config = {
      name: "Licht",
      card_width: "auto",
      min_height: 210,
      show_brightness: true,
      show_status: true,
      ...config
    };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._lastSignature = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot || !this.config) return;
    const state = hass?.states?.[this.config.entity];
    const signature = state
      ? `${state.state}|${state.attributes?.brightness ?? ""}|${state.attributes?.supported_color_modes?.join(",") ?? ""}`
      : "missing";
    if (signature !== this._lastSignature) {
      this._lastSignature = signature;
      this._render();
    }
  }

  getCardSize() { return 3; }

  _esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }

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
      this.shadowRoot.innerHTML = `<ha-card><div class="missing">Licht-Entität nicht gefunden: ${this._esc(c.entity)}</div></ha-card>`;
      return;
    }

    const on = entity.state === "on";
    const dimmable = this._isDimmable(entity);
    const brightness = entity.attributes?.brightness;
    const percent = brightness == null ? (on ? 100 : 0) : Math.round((Number(brightness) / 255) * 100);
    const displayPercent = on ? percent : 0;
    const name = c.name || entity.attributes?.friendly_name || "Licht";
    const status = on ? "Eingeschaltet" : "Ausgeschaltet";
    const width = c.card_width === "auto" ? "100%" : `${Math.max(240, Math.min(1200, Number(c.card_width) || 420))}px`;

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;width:100%;color:#f3f8fc}
        ha-card{width:${width};max-width:100%;margin:0;box-sizing:border-box;overflow:hidden;border-radius:28px;
          background:radial-gradient(ellipse at 50% 34%,rgba(73,126,157,.22),transparent 58%),linear-gradient(145deg,#102838 0%,#142f42 48%,#0b1d2b 100%);
          border:1px solid rgba(160,207,232,.48);box-shadow:0 14px 36px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.18);
          -webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}
        .wrap{min-height:${Math.max(150,Number(c.min_height)||210)}px;box-sizing:border-box;padding:22px 24px 20px;position:relative;
          background:radial-gradient(ellipse at 50% 34%,rgba(91,148,180,.12),transparent 58%)}
        .wrap:before{content:"";position:absolute;inset:7px;border:1px solid rgba(174,220,244,.18);border-radius:22px;pointer-events:none}
        .top{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:58px;position:relative;z-index:1}
        .heading{display:flex;align-items:center;gap:13px;min-width:0}
        .iconbox{width:48px;height:48px;flex:none;border-radius:15px;display:grid;place-items:center;
          background:linear-gradient(145deg,rgba(255,177,104,.25),rgba(255,142,67,.10));color:#ffb36f;
          border:1px solid rgba(255,190,135,.18)}
        .iconbox ha-icon{--mdc-icon-size:29px}
        .copy{display:flex;flex-direction:column;min-width:0}
        .name{font-size:clamp(20px,3vw,27px);font-weight:650;line-height:1.12;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sub{font-size:11px;color:#b8cbd7;margin-top:4px;letter-spacing:.2px}
        .pill{flex:none;display:flex;align-items:center;gap:8px;padding:9px 15px;border:1px solid rgba(255,173,91,.7);border-radius:30px;
          background:linear-gradient(145deg,rgba(255,164,76,.30),rgba(255,124,42,.13));color:#ffe2c4;font-size:13px;font-weight:650;box-shadow:0 0 18px rgba(255,143,60,.14)}
        .pill.off{border-color:rgba(190,210,222,.25);background:rgba(177,211,230,.09);color:#c0d2de;box-shadow:none}
        .main{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:24px 4px 18px;position:relative;z-index:1}
        .reading{min-width:0}
        .percent{font-size:clamp(42px,7vw,58px);line-height:1;font-weight:350;letter-spacing:-1.7px;color:${on ? "#ffc080" : "#a9bbc7"};font-variant-numeric:tabular-nums;text-shadow:${on ? "0 0 18px rgba(255,173,112,.18)" : "none"}}
        .reading-label{font-size:13px;color:#b8cbd7;margin-top:8px}
        .power{width:78px;height:78px;flex:none;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:${on ? "#ffc16b" : "#a8bbc7"};
          background:${on ? "radial-gradient(circle at 35% 25%,rgba(255,193,107,.30),rgba(255,142,67,.12))" : "linear-gradient(145deg,rgba(179,214,234,.14),rgba(104,147,172,.08))"};
          border:1px solid ${on ? "rgba(255,177,104,.62)" : "rgba(190,223,241,.22)"};box-shadow:${on ? "0 0 24px rgba(255,157,91,.18),inset 0 1px 0 #ffffff22" : "inset 0 1px 0 #ffffff16"};transition:transform .15s,box-shadow .2s}
        .power:active{transform:scale(.94)}.power ha-icon{--mdc-icon-size:34px}
        .slider-block{position:relative;z-index:1;padding:2px 3px 5px}
        .slider-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:13px;color:#dce9f0;font-size:13px;font-weight:600}
        .slider-value{color:#ffc080;font-variant-numeric:tabular-nums}
        input[type=range]{display:block;width:100%;height:8px;margin:0;border-radius:20px;appearance:none;outline:none;cursor:pointer;
          background:linear-gradient(to right,#ffad70 0%,#ffad70 ${displayPercent}%,rgba(190,220,237,.25) ${displayPercent}%,rgba(190,220,237,.25) 100%)}
        input[type=range]::-webkit-slider-thumb{appearance:none;width:20px;height:20px;border-radius:50%;background:#ffb16d;border:3px solid #f5f9fb;box-shadow:0 1px 7px #0007}
        input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#ffb16d;border:3px solid #f5f9fb;box-shadow:0 1px 7px #0007}
        .limits{display:flex;justify-content:space-between;color:#c2d2dc;font-size:11px;margin-top:9px}
        .disabled{opacity:.42;cursor:not-allowed}
        .missing{padding:18px;color:var(--error-color)}
        @media(max-width:520px){.wrap{padding:18px 16px 16px}.main{padding:20px 2px 16px}.power{width:68px;height:68px}.pill{padding:8px 11px;font-size:12px}.iconbox{width:42px;height:42px}.iconbox ha-icon{--mdc-icon-size:25px}}
        @media(max-width:360px){.wrap{padding:16px 12px}.name{font-size:18px}.percent{font-size:40px}.power{width:60px;height:60px}}
        @media(prefers-reduced-motion:reduce){*{transition:none!important}}
      </style>
      <ha-card>
        <div class="wrap">
          <div class="top">
            <div class="heading">
              <div class="iconbox"><ha-icon icon="mdi:lightbulb"></ha-icon></div>
              <div class="copy"><div class="name">${this._esc(name)}</div><div class="sub">${this._esc(c.entity)}</div></div>
            </div>
            ${c.show_status === false ? "" : `<div class="pill ${on ? "" : "off"}">${status}</div>`}
          </div>
          <div class="main">
            <div class="reading"><div class="percent">${displayPercent} %</div><div class="reading-label">Aktuelle Helligkeit</div></div>
            <button class="power" type="button" aria-label="Licht ${on ? "ausschalten" : "einschalten"}" title="${on ? "Ausschalten" : "Einschalten"}"><ha-icon icon="mdi:power"></ha-icon></button>
          </div>
          ${dimmable && c.show_brightness !== false ? `
            <div class="slider-block">
              <div class="slider-head"><span>Helligkeit</span><span class="slider-value">${displayPercent} %</span></div>
              <input class="brightness ${on ? "" : "disabled"}" type="range" min="1" max="100" step="1" value="${Math.max(1,percent)}" ${on ? "" : "disabled"} aria-label="Helligkeit">
              <div class="limits"><span>1 %</span><span>100 %</span></div>
            </div>` : ""}
        </div>
      </ha-card>`;

    this.shadowRoot.querySelector(".power")?.addEventListener("click", () => {
      if (!this._hass) return;
      this._hass.callService("light", on ? "turn_off" : "turn_on", { entity_id: c.entity });
    });

    const slider = this.shadowRoot.querySelector(".brightness");
    if (slider) {
      slider.addEventListener("input", event => {
        const value = Number(event.target.value);
        const percentNode = this.shadowRoot.querySelector(".slider-value");
        const bigValue = this.shadowRoot.querySelector(".percent");
        if (percentNode) percentNode.textContent = `${value} %`;
        if (bigValue) bigValue.textContent = `${value} %`;
        event.target.style.background = `linear-gradient(to right,#ffad70 0%,#ffad70 ${value}%,rgba(190,220,237,.25) ${value}%,rgba(190,220,237,.25) 100%)`;
      });
      slider.addEventListener("change", event => {
        if (!this._hass) return;
        const value = Math.max(1, Math.min(100, Number(event.target.value)));
        this._hass.callService("light", "turn_on", { entity_id: c.entity, brightness_pct: value });
      });
    }
  }

  static getConfigElement() { return document.createElement("light-glass-card-editor"); }
}

class LightGlassCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    if (!this._rendered) {
      this._rendered = true;
      this._renderEditor();
    }
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
      { name: "card_width", selector: { select: { options: [{label:"Automatisch",value:"auto"},{label:"320 px",value:"320"},{label:"400 px",value:"400"},{label:"480 px",value:"480"},{label:"560 px",value:"560"}], mode:"dropdown" } } },
      { name: "min_height", selector: { number: { min: 150, max: 500, step: 10, mode: "box" } } },
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

  set hass(hass) {
    this._hass = hass;
    const form = this.shadowRoot?.querySelector("ha-form");
    if (form) form.hass = hass;
  }
}

if (!customElements.get("light-glass-card")) customElements.define("light-glass-card", LightGlassCard);
if (!customElements.get("light-glass-card-editor")) customElements.define("light-glass-card-editor", LightGlassCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === "light-glass-card")) {
  window.customCards.push({ type: "light-glass-card", name: "Light Glass Card", description: "Dunkle Glass-Karte für Ein/Aus und Helligkeit von Home-Assistant-Lichtern." });
}
