/* ==========================================================================
   MM INSTALACE | main.js
   GSAP + ScrollTrigger pro animace. Vše respektuje prefers-reduced-motion
   a web zůstává plně použitelný i bez JS (stavy .js / .reveal-fallback).
   ========================================================================== */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var CFG = window.MM_CONFIG || {};

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* soukromé okno */ } }

  /* ---------- GSAP: reveal, parallax, počítadla ---------- */
  if (hasGsap && !reduced) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: "power3.out" });

    ScrollTrigger.batch("[data-reveal]:not(.hero [data-reveal]):not(.page-hero [data-reveal])", {
      start: "top 90%", once: true,
      onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: .95, stagger: .09, overwrite: true, clearProps: "transform" }); }
    });

    var media = $(".hero__media");
    if (media) {
      gsap.fromTo(media, { scale: 1.14 }, { scale: 1, duration: 1.8, ease: "power2.out" });
      gsap.to(media, { yPercent: 9, ease: "none", scrollTrigger: { trigger: ".hero__card", start: "top top", end: "bottom top", scrub: true } });
    }
    $$("[data-parallax]").forEach(function (el) {
      gsap.fromTo(el, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });

    $$("[data-count]").forEach(function (el) {
      var to = parseFloat(el.getAttribute("data-count")), from = parseFloat(el.getAttribute("data-from") || "0");
      var o = { v: from };
      ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: function () {
        gsap.to(o, { v: to, duration: 2.2, ease: "power2.out", onUpdate: function () { el.textContent = Math.round(o.v); } });
      } });
      el.textContent = Math.round(from);
    });
    $$("[data-step]").forEach(function (el, i) {
      gsap.from(el.querySelector(".step__n"), { scale: .4, duration: .8, ease: "back.out(2)", scrollTrigger: { trigger: el, start: "top 88%", once: true }, delay: i * .05 });
    });
  } else {
    root.classList.add("reveal-fallback");
  }
  /* pojistka: kdyby se GSAP nenačetl, nic nezůstane skryté */
  setTimeout(function () { if (!window.gsap) root.classList.add("reveal-fallback"); }, 2500);

  /* ---------- navigace: schovat při scrollu dolů ---------- */
  var nav = $(".nav"), lastY = 0, ticking = false, menuOpen = false;
  window.addEventListener("scroll", function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY, d = y - lastY;
      if (nav && !menuOpen) {
        if (y < 140) nav.classList.remove("is-hidden");
        else if (d > 8) nav.classList.add("is-hidden");
        else if (d < -8) nav.classList.remove("is-hidden");
      }
      lastY = y; ticking = false;
    });
  }, { passive: true });

  /* ---------- mobilní menu ---------- */
  var burger = $(".nav__burger"), menu = $(".menu");
  function setMenu(open) {
    if (!menu || !burger) return;
    menuOpen = open;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Zavřít menu" : "Otevřít menu");
    root.style.overflow = open ? "hidden" : "";
    if (open) { nav.classList.remove("is-hidden"); menu.classList.add("is-open"); menu.removeAttribute("aria-hidden"); }
    if (hasGsap && !reduced) {
      if (open) {
        gsap.fromTo(menu, { clipPath: "circle(0px at calc(100% - 44px) calc(var(--nav-top) + 36px))" }, { clipPath: "circle(160% at calc(100% - 44px) calc(var(--nav-top) + 36px))", duration: .9, ease: "power3.inOut" });
        gsap.fromTo(".menu__links a, .menu__foot > *", { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .06, delay: .25 });
      } else {
        gsap.to(menu, { clipPath: "circle(0px at calc(100% - 44px) calc(var(--nav-top) + 36px))", duration: .6, ease: "power3.inOut", onComplete: function () { menu.classList.remove("is-open"); menu.setAttribute("aria-hidden", "true"); } });
      }
    } else {
      menu.style.clipPath = open ? "none" : "";
      if (!open) { menu.classList.remove("is-open"); menu.setAttribute("aria-hidden", "true"); }
    }
    if (open) { var f = $(".menu__links a", menu); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 400); } else { burger.focus({ preventScroll: true }); }
  }
  if (burger && menu) {
    menu.setAttribute("aria-hidden", "true");
    burger.addEventListener("click", function () { setMenu(!menuOpen); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && menuOpen) setMenu(false); });
    window.matchMedia("(min-width: 1100px)").addEventListener("change", function (e) { if (e.matches && menuOpen) setMenu(false); });
  }

  /* ---------- záložky (a11y: role=tab, šipky) ---------- */
  function initTabs(list, onSelect) {
    var tabs = $$('[role="tab"]', list);
    function select(tab, focus) {
      tabs.forEach(function (t) { var on = t === tab; t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1; });
      if (focus) tab.focus();
      onSelect(tab);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") n = tabs[0];
        if (e.key === "End") n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    return { select: select, tabs: tabs };
  }

  /* ---------- before / after ---------- */
  function initBA(el) {
    var range = $(".ba__range", el), pos = 50, drag = false;
    function set(p) {
      pos = Math.max(0, Math.min(100, p));
      el.style.setProperty("--pos", pos + "%");
      if (range) { range.value = Math.round(pos); range.setAttribute("aria-valuetext", Math.round(pos) + " % zobrazuje stav po"); }
    }
    function fromEvent(e) { var r = el.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); }
    el.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      drag = true; el.classList.add("is-drag"); el.setPointerCapture(e.pointerId); fromEvent(e);
    });
    el.addEventListener("pointermove", function (e) { if (drag) fromEvent(e); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (ev) { el.addEventListener(ev, function () { drag = false; el.classList.remove("is-drag"); }); });
    if (range) range.addEventListener("input", function () { set(parseFloat(range.value)); });
    el.baSet = set;
    set(50);
    if (hasGsap && !reduced) {
      var o = { p: 50 };
      ScrollTrigger.create({ trigger: el, start: "top 75%", once: true, onEnter: function () {
        gsap.timeline().to(o, { p: 24, duration: .9, ease: "power2.inOut", onUpdate: function () { set(o.p); } })
          .to(o, { p: 74, duration: 1.3, ease: "power2.inOut", onUpdate: function () { set(o.p); } })
          .to(o, { p: 50, duration: .9, ease: "power2.inOut", onUpdate: function () { set(o.p); } });
      } });
    }
  }
  $$(".ba").forEach(initBA);
  var baList = $("[data-ba-tabs]");
  if (baList) {
    initTabs(baList, function (tab) {
      var id = tab.getAttribute("aria-controls");
      $$(".ba-panel").forEach(function (p) { p.hidden = p.id !== id; });
      var ba = $("#" + id + " .ba"); if (ba && ba.baSet) ba.baSet(50);
    });
  }

  /* ---------- poptávka: záložky + fotka ---------- */
  var inq = $("[data-inq]");
  if (inq) {
    var svcInput = $('input[name="sluzba"]', inq), imgs = $$(".inq__bg img", inq);
    var t = $("[data-inq-title]", inq), x = $("[data-inq-text]", inq);
    initTabs($("[data-inq-tabs]", inq), function (tab) {
      var key = tab.getAttribute("data-key");
      if (svcInput) svcInput.value = tab.getAttribute("data-label");
      imgs.forEach(function (im) { im.classList.toggle("is-on", im.getAttribute("data-key") === key); });
      if (t) t.textContent = tab.getAttribute("data-title");
      if (x) x.textContent = tab.getAttribute("data-text");
    });
    /* odkazy ze služeb předvolí záložku */
    $$("[data-pick]").forEach(function (a) {
      a.addEventListener("click", function () {
        var tab = $('[data-inq-tabs] [data-key="' + a.getAttribute("data-pick") + '"]');
        if (tab) tab.click();
      });
    });
  }

  /* ---------- FAQ ---------- */
  $$(".faq__item").forEach(function (item) {
    var q = $(".faq__q", item);
    q.addEventListener("click", function () {
      var open = !item.classList.contains("is-open");
      $$(".faq__item.is-open").forEach(function (o) { if (o !== item) { o.classList.remove("is-open"); $(".faq__q", o).setAttribute("aria-expanded", "false"); } });
      item.classList.toggle("is-open", open);
      q.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---------- mapa až po kliknutí (soukromí) ---------- */
  var mapBtn = $("[data-map-load]");
  if (mapBtn) mapBtn.addEventListener("click", function () {
    var box = mapBtn.closest(".c-map");
    var f = doc.createElement("iframe");
    f.src = "https://www.google.com/maps?q=" + encodeURIComponent("Dvorecké náměstí 406/5, 147 00 Praha 4") + "&output=embed&hl=cs";
    f.title = "Mapa: MM INSTALACE, Dvorecké náměstí 406/5, Praha 4 Podolí";
    f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
    box.appendChild(f); var g = $(".c-map__gate", box); if (g) g.remove();
  });

  /* ---------- sticky lišta: schovat u formuláře a kontaktu ---------- */
  var sticky = $(".sticky");
  if (sticky && "IntersectionObserver" in window) {
    var vis = 0;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vis += e.isIntersecting ? 1 : -1; });
      sticky.classList.toggle("is-hidden", vis > 0);
    }, { threshold: .25 });
    $$("#poptavka, #kontakt, .footer").forEach(function (s) { io.observe(s); });
  }

  /* ---------- cookie lišta (jen nezbytné) ---------- */
  var ck = $(".cookie");
  if (ck) {
    if (!safeGet("mm-cookie-ok")) ck.hidden = false;
    var ok = $("[data-cookie-ok]", ck);
    if (ok) ok.addEventListener("click", function () { safeSet("mm-cookie-ok", "1"); ck.hidden = true; });
  }

  /* ---------- formulář: validace + odeslání ---------- */
  var form = $("#poptavka-form");
  if (form) {
    var status = $(".form__status", form), submit = $('button[type="submit"]', form);
    var msgs = {
      objekt: "Vyberte typ objektu.", adresa: "Napište adresu nebo lokalitu objektu.", jmeno: "Napište, jak vás máme oslovit.",
      telefon: "Zadejte telefon ve formátu +420 123 456 789.", email: "Zkontrolujte tvar e-mailu.", souhlas: "Pro odeslání je potřeba souhlas se zpracováním údajů."
    };
    function setErr(name, text) {
      var f = form.elements[name], wrap = f && f.closest(".field, .check");
      if (!wrap) return;
      wrap.classList.toggle("has-error", !!text);
      var er = $(".field__err", wrap) || $(".field__err", wrap.parentNode);
      if (er) er.textContent = text || "";
      if (f.setAttribute) f.setAttribute("aria-invalid", text ? "true" : "false");
    }
    function validate() {
      var bad = null, v = function (n) { return (form.elements[n].value || "").trim(); };
      function chk(name, ok) { setErr(name, ok ? "" : msgs[name]); if (!ok && !bad) bad = form.elements[name]; }
      chk("objekt", !!v("objekt")); chk("adresa", v("adresa").length > 2); chk("jmeno", v("jmeno").length > 1);
      chk("telefon", v("telefon").replace(/[^\d]/g, "").length >= 9);
      chk("email", !v("email") || /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v("email")));
      chk("souhlas", form.elements.souhlas.checked);
      if (bad) bad.focus();
      return !bad;
    }
    ["objekt", "adresa", "jmeno", "telefon", "email"].forEach(function (n) { form.elements[n].addEventListener("input", function () { setErr(n, ""); }); });
    function say(text, err, html) { status.hidden = false; status.classList.toggle("is-err", !!err); if (html) status.innerHTML = text; else status.textContent = text; }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements.botcheck && form.elements.botcheck.value) return;
      if (!validate()) return;
      var d = {
        "Služba": form.elements.sluzba.value, "Typ objektu": form.elements.objekt.value, "Adresa / lokalita": form.elements.adresa.value.trim(),
        "Plocha (m²)": form.elements.plocha.value.trim(), "Jméno": form.elements.jmeno.value.trim(), "Telefon": form.elements.telefon.value.trim(),
        "E-mail": form.elements.email.value.trim(), "Zpráva": form.elements.zprava.value.trim()
      };
      var phoneHtml = ' Případně volejte <a href="' + CFG.phoneHref + '">' + CFG.phoneDisplay + "</a>.";
      submit.disabled = true;
      var done = function () { say("Děkujeme, poptávku jsme přijali. Ozveme se vám co nejdřív." + phoneHtml, false, true); form.reset(); ["objekt", "adresa", "jmeno", "telefon", "email", "souhlas"].forEach(function (n) { setErr(n, ""); }); submit.disabled = false; };
      var fail = function () { say("Odeslání se nepodařilo." + phoneHtml, true, true); submit.disabled = false; };

      if (CFG.web3formsKey) {
        var body = Object.assign({ access_key: CFG.web3formsKey, subject: CFG.subject, from_name: "Web MM INSTALACE", botcheck: "" }, d);
        fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) })
          .then(function (r) { return r.json(); }).then(function (j) { j && j.success ? done() : fail(); }).catch(fail);
      } else if (CFG.formspreeEndpoint) {
        fetch(CFG.formspreeEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(d) })
          .then(function (r) { r.ok ? done() : fail(); }).catch(fail);
      } else {
        /* fallback bez služby: předvyplněný e-mail */
        var lines = Object.keys(d).filter(function (k) { return d[k]; }).map(function (k) { return k + ": " + d[k]; }).join("\n");
        window.location.href = "mailto:" + CFG.fallbackEmail + "?subject=" + encodeURIComponent(CFG.subject) + "&body=" + encodeURIComponent(lines);
        say("Otevřeli jsme vám e-mail s předvyplněnou poptávkou, stačí ho odeslat." + phoneHtml, false, true);
        submit.disabled = false;
      }
    });
  }
})();
