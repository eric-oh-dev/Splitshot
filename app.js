(function(){
  "use strict";

  // ---------- state ----------
  var uidCounter = 0;
  function uid(prefix){ uidCounter += 1; return prefix + uidCounter; }

  function exampleState(){
    return {
      isExample: false,
      people: [{ id: "p1", name: "Eric" }, { id: "p2", name: "Mark" }],
      items: [],
      currentFile: null,
      scanning: false
    };
  }

  var state = exampleState();

  // ---------- helpers ----------
  function money(n){
    n = Number(n) || 0;
    return "$" + n.toFixed(2);
  }
  function clamp2(n){ return Math.round((Number(n)||0) * 100) / 100; }

  // Colors are keyed by person id (not name) so they stay stable while a name is edited.
  function hueFor(id){
    var h = 0;
    for (var i = 0; i < id.length; i++){ h = (h * 31 + id.charCodeAt(i)) % 360; }
    return h;
  }
  function dotColor(id){ return "hsl(" + hueFor(id) + ", 58%, 42%)"; }

  function sameIds(a, b){
    if (a.length !== b.length) return false;
    var sa = a.slice().sort();
    var sb = b.slice().sort();
    for (var i = 0; i < sa.length; i++){ if (sa[i] !== sb[i]) return false; }
    return true;
  }

  // ---------- mutation ----------
  function setPersonName(index, name){
    state.people[index].name = name;
    state.isExample = false;
    render();
  }
  function addItem(partial){
    state.isExample = false;
    state.items.push({
      id: uid("i"),
      name: (partial && partial.name) || "",
      price: (partial && partial.price) || 0,
      assignedTo: (partial && partial.assignedTo) || []
    });
    render();
  }
  function removeItem(id){
    state.items = state.items.filter(function(it){ return it.id !== id; });
    render();
  }
  function assignItem(itemId, ids){
    var item = state.items.filter(function(it){ return it.id === itemId; })[0];
    if (!item) return;
    item.assignedTo = ids.slice();
    render();
  }

  function clearForFreshStart(){
    var keepNames = state.people;
    state = {
      isExample: false,
      people: [
        { id: "p1", name: (keepNames && keepNames[0] && keepNames[0].name) || "Eric" },
        { id: "p2", name: (keepNames && keepNames[1] && keepNames[1].name) || "Mark" }
      ],
      items: [],
      currentFile: null,
      scanning: false
    };
    render();
  }

  // ---------- totals ----------
  function computeTotals(){
    var perPerson = {};
    state.people.forEach(function(p){ perPerson[p.id] = { subtotal: 0 }; });

    var unassignedTotal = 0;
    var unassignedCount = 0;
    var subtotal = 0;

    state.items.forEach(function(it){
      var price = Number(it.price) || 0;
      subtotal += price;
      if (it.assignedTo.length === 0){
        unassignedTotal += price;
        unassignedCount += 1;
        return;
      }
      var share = price / it.assignedTo.length;
      it.assignedTo.forEach(function(pid){
        if (perPerson[pid]) perPerson[pid].subtotal += share;
      });
    });

    Object.keys(perPerson).forEach(function(pid){
      perPerson[pid].total = perPerson[pid].subtotal;
    });

    return {
      perPerson: perPerson,
      subtotal: subtotal,
      unassignedTotal: unassignedTotal,
      unassignedCount: unassignedCount,
      grandTotal: subtotal
    };
  }

  // ---------- render ----------
  function render(){
    document.getElementById("exampleBanner").hidden = !state.isExample;
    renderPeople();
    renderItems();
    renderSummary();
  }

  function renderPeople(){
    var p1 = state.people[0], p2 = state.people[1];
    document.getElementById("p1Dot").style.background = dotColor(p1.id);
    document.getElementById("p2Dot").style.background = dotColor(p2.id);
    var i1 = document.getElementById("person1Input");
    var i2 = document.getElementById("person2Input");
    if (i1.value !== p1.name) i1.value = p1.name;
    if (i2.value !== p2.name) i2.value = p2.name;
  }

  function renderItems(){
    var list = document.getElementById("itemsList");
    list.innerHTML = "";
    state.items.forEach(function(it){
      var row = document.createElement("div");
      row.className = "item-row" + (it.assignedTo.length === 0 ? " unassigned" : "");

      var top = document.createElement("div");
      top.className = "item-top";

      var nameInput = document.createElement("input");
      nameInput.className = "item-name";
      nameInput.value = it.name;
      nameInput.placeholder = "Item name";
      nameInput.addEventListener("input", function(){ it.name = nameInput.value; state.isExample = false; });

      var priceWrap = document.createElement("span");
      priceWrap.className = "item-price-wrap mono";
      priceWrap.textContent = "$";
      var priceInput = document.createElement("input");
      priceInput.className = "item-price";
      priceInput.type = "number";
      priceInput.step = "0.01";
      priceInput.min = "0";
      priceInput.value = it.price;
      priceInput.addEventListener("input", function(){
        it.price = Number(priceInput.value) || 0;
        state.isExample = false;
        renderSummary();
      });
      priceWrap.appendChild(priceInput);

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "item-remove";
      removeBtn.textContent = "×";
      removeBtn.setAttribute("aria-label", "Remove item");
      removeBtn.addEventListener("click", function(){ removeItem(it.id); });

      top.appendChild(nameInput);
      top.appendChild(priceWrap);
      top.appendChild(removeBtn);

      var p1 = state.people[0], p2 = state.people[1];
      var options = [
        { label: p1.name || "Person 1", ids: [p1.id] },
        { label: "Split", ids: [p1.id, p2.id] },
        { label: p2.name || "Person 2", ids: [p2.id] }
      ];
      var seg = document.createElement("div");
      seg.className = "split-seg";
      options.forEach(function(opt){
        var active = it.assignedTo.length > 0 && sameIds(it.assignedTo, opt.ids);
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = active ? "active" : "";
        btn.textContent = opt.label;
        if (active){
          btn.style.background = opt.ids.length === 1
            ? dotColor(opt.ids[0])
            : "linear-gradient(90deg," + dotColor(opt.ids[0]) + " 50%," + dotColor(opt.ids[1]) + " 50%)";
        }
        btn.addEventListener("click", function(){ assignItem(it.id, opt.ids); });
        seg.appendChild(btn);
      });

      row.appendChild(top);
      row.appendChild(seg);
      if (it.assignedTo.length === 0){
        var flag = document.createElement("span");
        flag.className = "item-flag";
        flag.textContent = "Unassigned — tap one above";
        row.appendChild(flag);
      }
      list.appendChild(row);
    });
  }

  function renderSummary(){
    var totals = computeTotals();
    var list = document.getElementById("summaryList");
    list.innerHTML = "";

    var empty = document.getElementById("emptySummary");
    empty.hidden = state.people.length > 0 && state.items.length > 0;

    var sorted = state.people.slice().sort(function(a,b){
      return totals.perPerson[b.id].total - totals.perPerson[a.id].total;
    });

    sorted.forEach(function(p){
      var row = totals.perPerson[p.id];
      var line = document.createElement("div");
      line.className = "summary-row";
      var nameSpan = document.createElement("div");
      nameSpan.className = "summary-name";
      var dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = dotColor(p.id);
      nameSpan.appendChild(dot);
      nameSpan.appendChild(document.createTextNode(p.name));
      var amt = document.createElement("div");
      amt.className = "summary-amount mono tabular";
      amt.textContent = money(row.total);
      line.appendChild(nameSpan);
      line.appendChild(amt);
      list.appendChild(line);
    });

    var unassignedNote = document.getElementById("unassignedNote");
    if (totals.unassignedCount > 0){
      unassignedNote.hidden = false;
      unassignedNote.textContent = totals.unassignedCount + " item" + (totals.unassignedCount > 1 ? "s" : "") +
        " (" + money(totals.unassignedTotal) + ") still need" + (totals.unassignedCount > 1 ? "" : "s") + " someone assigned.";
    } else {
      unassignedNote.hidden = true;
    }

    document.getElementById("tTotal").textContent = money(totals.grandTotal);
  }

  // ---------- receipt OCR (runs entirely in the browser, no server) ----------

  // Very small heuristic: a "line item" is a line of text ending in a price
  // (e.g. "Flat white  5.50"), and isn't one of the usual summary lines.
  // The cents/separator matching is loose on purpose: real phone-photo OCR
  // regularly misreads "." as a space or a colon, and "0" as "O" (e.g.
  // "4 OO" for "4.00", "3:79" for "3.79"), and being strict there means
  // silently dropping real items rather than showing a slightly-wrong price
  // the person can correct.
  var SKIP_WORDS = /\b(total|subtotal|sub[\s-]?total|tax|gst|vat|tip|gratuity|service charge|change|cash|eftpos|card|visa|mastercard|amex|balance|amount due|due|paid|payment|discount|rounding|order|table\s?\d*|receipt|invoice|thank you|welcome|qty|quantity|time|date|printed|trans(action)?)\b/i;
  var PRICE_RE = /(?:\$|nzd)?\s?(\d{1,4})[.,:\s]([0-9OoSs]{2})\s*$/i;
  // A colon is allowed as a decimal separator above (OCR sometimes reads "."
  // as ":"), but that also matches a clock time like "14:32" or "2:40 pm" —
  // guard against reading a receipt's date/time line as a price.
  var CLOCK_TIME_RE = /\b\d{1,2}[:.][0-5]\d(:[0-5]\d)?\s*(am|pm)?\b.{0,6}$/i;

  function parseReceiptText(text){
    var lines = String(text || "").split(/\r?\n/).map(function(l){ return l.trim(); }).filter(Boolean);
    var results = [];
    for (var i = 0; i < lines.length; i++){
      var line = lines[i];
      if (line.length < 3) continue;
      var m = line.match(PRICE_RE);
      if (!m) continue;
      if (m[0].indexOf(":") !== -1 && line.indexOf("$") === -1 && CLOCK_TIME_RE.test(line)) continue;
      var cents = m[2].replace(/[OoSs]/g, function(ch){ return ch.toLowerCase() === "s" ? "5" : "0"; });
      var price = parseFloat(m[1] + "." + cents);
      if (!isFinite(price) || price <= 0 || price > 2000) continue;
      var name = line.slice(0, m.index).trim();
      name = name.replace(/^[-*#.\s'"‘’“”>»•|]+/, "").replace(/[-_.\s]{2,}$/, "").trim();
      name = name.replace(/^\d+\s*[xX]\s*/, "");
      name = name.replace(/^\d{1,2}\s+(?=[A-Za-z])/, ""); // strip a stray leading digit OCR sometimes picks up from an adjacent column
      if (!name || !/[a-zA-Z]/.test(name)) continue;
      if (SKIP_WORDS.test(name)) continue;
      results.push({ name: name.slice(0, 60), price: clamp2(price) });
    }
    return results.slice(0, 40);
  }

  function applyScanResult(items){
    state.isExample = false;
    state.items = items.map(function(it){
      return { id: uid("i"), name: it.name, price: it.price, assignedTo: [] };
    });
  }

  function setScanStatus(text, mode){
    var el = document.getElementById("scanStatus");
    el.textContent = text;
    el.className = mode ? mode : "";
  }

  // Phone camera photos are commonly 8-48 megapixels and several MB. Feeding
  // that straight into Tesseract is slow and can exhaust memory on a phone
  // browser, which is the most likely reason a scan hangs or silently fails
  // on mobile. Shrink to a sane max dimension first — plenty of resolution
  // for receipt text, much lighter to process. Resolves a <canvas> (not a
  // blob) so it can optionally be rotated before OCR — see scanReceipt.
  function downscaleForOcr(file, maxDim){
    return new Promise(function(resolve){
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function(){
        URL.revokeObjectURL(url);
        var w = img.naturalWidth, h = img.naturalHeight;
        if (!w || !h){ resolve(null); return; }
        var scale = Math.min(1, maxDim / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * scale));
        var ch = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, cw, ch);
        resolve(canvas);
      };
      img.onerror = function(){ URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  function rotateCanvas(sourceCanvas, degrees){
    var srcW = sourceCanvas.width, srcH = sourceCanvas.height;
    var canvas = document.createElement("canvas");
    var swapDims = degrees === 90 || degrees === -90 || degrees === 270;
    canvas.width = swapDims ? srcH : srcW;
    canvas.height = swapDims ? srcW : srcH;
    var ctx = canvas.getContext("2d");
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(degrees * Math.PI / 180);
    ctx.drawImage(sourceCanvas, -srcW / 2, -srcH / 2);
    return canvas;
  }

  function canvasToBlob(canvas, quality){
    return new Promise(function(resolve){
      canvas.toBlob(function(blob){ resolve(blob); }, "image/jpeg", quality || 0.88);
    });
  }

  function withTimeout(promise, ms){
    return new Promise(function(resolve, reject){
      var timer = setTimeout(function(){ reject({ code: "timeout" }); }, ms);
      promise.then(function(v){ clearTimeout(timer); resolve(v); }, function(e){ clearTimeout(timer); reject(e); });
    });
  }

  // Runs OCR against one or more candidate images with a single worker
  // (loading the language model once) and keeps whichever result parses out
  // the most line items — this is how a sideways receipt photo gets read
  // correctly without knowing in advance which way it's rotated.
  //
  // Each image is tried under two page segmentation modes: the default
  // ("3", fully automatic) and "6" ("assume a single uniform block of
  // text"). Testing against a real receipt photo showed mode 6 can either
  // fix or actively hurt results depending on the device/engine, so rather
  // than gamble on one mode we run both and keep whichever actually found
  // more items — this can never do worse than the plain default did before.
  var PSM_MODES = ["3", "6"];

  function runOcrCandidates(blobs, timeoutMs){
    var work = Tesseract.createWorker("eng", 1, {
      logger: function(m){
        if (m && m.status === "recognizing text"){
          setScanStatus("Reading receipt… " + Math.round((m.progress || 0) * 100) + "%", "busy");
        } else if (m && m.status){
          setScanStatus("Warming up the reader…", "busy");
        }
      }
    }).then(function(worker){
      var results = [];
      var chain = Promise.resolve();
      blobs.forEach(function(blob){
        PSM_MODES.forEach(function(psm){
          chain = chain.then(function(){
            return worker.setParameters({ tessedit_pageseg_mode: psm }).then(function(){
              return worker.recognize(blob).then(function(result){ results.push(result); });
            });
          });
        });
      });
      return chain.then(function(){
        return worker.terminate().then(function(){ return results; });
      });
    });
    return withTimeout(work, timeoutMs).then(function(results){
      var best = { text: "", items: [], confidence: 0 };
      var bestScore = -1;
      results.forEach(function(result){
        var text = (result.data && result.data.text) || "";
        var items = parseReceiptText(text);
        var confidence = (result.data && result.data.confidence) || 0;
        var score = items.length * 1000 + confidence; // item count first, confidence as a tiebreaker
        if (score > bestScore){
          bestScore = score;
          best = { text: text, items: items, confidence: confidence };
        }
      });
      return best;
    });
  }

  function scanReceipt(file){
    var thumb = document.getElementById("scanThumb");
    var row = document.getElementById("scanPreviewRow");
    var rescan = document.getElementById("rescanBtn");
    row.hidden = false;
    thumb.src = URL.createObjectURL(file);
    rescan.hidden = true;
    state.scanning = true;
    setScanStatus("Warming up the reader…", "busy");

    if (typeof Tesseract === "undefined"){
      setScanStatus("Couldn't load the receipt reader (check your connection) — add items by hand below.", "err");
      state.scanning = false;
      return;
    }

    downscaleForOcr(file, 1800).then(function(canvas){
      if (!canvas){
        // Couldn't decode/resize it (unusual file) — fall back to the raw file.
        return runOcrCandidates([file], 30000 * PSM_MODES.length);
      }
      var candidates = [canvas];
      if (canvas.width > canvas.height){
        // Receipts are tall and narrow, so a landscape (wider-than-tall) photo
        // almost always means the phone was held sideways. We don't know
        // which way, so try both quarter-turns and keep whichever reads best.
        candidates = [rotateCanvas(canvas, 90), rotateCanvas(canvas, -90)];
      }
      return Promise.all(candidates.map(function(c){ return canvasToBlob(c); }))
        .then(function(blobs){ return runOcrCandidates(blobs, 30000 * PSM_MODES.length * blobs.length); });
    }).then(function(best){
      var items = best.items;
      applyScanResult(items);
      state.scanning = false;
      if (items.length === 0){
        setScanStatus("Couldn't pick out any items from that photo — add them by hand below.", "err");
      } else {
        setScanStatus("Read " + items.length + " item" + (items.length > 1 ? "s" : "") + " — double check names and prices, then tap to assign.");
      }
      rescan.hidden = false;
      render();
    }).catch(function(e){
      state.scanning = false;
      if (e && e.code === "timeout"){
        setScanStatus("That's taking too long on this device — try a smaller or clearer photo, or add items by hand.", "err");
      } else {
        setScanStatus("Couldn't read that photo clearly — try a clearer, well-lit shot, or add items by hand.", "err");
      }
      rescan.hidden = false;
    });
  }

  // ---------- wire up ----------
  document.getElementById("clearExampleBtn").addEventListener("click", clearForFreshStart);

  document.getElementById("scanZone").addEventListener("click", function(){
    document.getElementById("fileInput").click();
  });
  document.getElementById("fileInput").addEventListener("change", function(e){
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (state.isExample) clearForFreshStart();
    state.currentFile = file;
    scanReceipt(file);
  });
  document.getElementById("rescanBtn").addEventListener("click", function(){
    document.getElementById("fileInput").click();
  });

  document.getElementById("person1Input").addEventListener("input", function(e){
    setPersonName(0, e.target.value);
  });
  document.getElementById("person2Input").addEventListener("input", function(e){
    setPersonName(1, e.target.value);
  });

  document.getElementById("addItemBtn").addEventListener("click", function(){
    addItem({ name: "", price: 0, assignedTo: [] });
  });

  document.getElementById("resetBtn").addEventListener("click", function(){
    clearForFreshStart();
    document.getElementById("scanPreviewRow").hidden = true;
  });

  if ("serviceWorker" in navigator){
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("sw.js").catch(function(){});
    });
  }

  render();
})();
