// ═══════════════════════════════════════════════════════════════════
// MOBILE DATE/TIME TESTER — minimal version, no preset list.
// Type a date and time, tap GO, and the board renders as of that
// moment and keeps ticking forward live from there.
// "↺ REAL TIME" resets back to the actual current time.
// ═══════════════════════════════════════════════════════════════════
(function(){
  var RealDate = Date;
  var REAL_START = Date.now();
  var FAKE_START = null; // null = real time

  window.Date = function(...args) {
    if (args.length === 0) {
      var base = (FAKE_START !== null) ? FAKE_START : REAL_START;
      return new RealDate(base + (RealDate.now() - REAL_START));
    }
    return new (RealDate.bind.apply(RealDate, [null].concat(args)))();
  };
  window.Date.prototype = RealDate.prototype;
  window.Date.now = function() {
    var base = (FAKE_START !== null) ? FAKE_START : REAL_START;
    return base + (RealDate.now() - REAL_START);
  };

  function render() {
    if (typeof updateUI === 'function') updateUI();
    if (typeof updateClock === 'function') updateClock();
  }
  function resetReal() {
    FAKE_START = null;
    render();
  }

  var panel = document.createElement('div');
  panel.id = 'mobileDateTester';
  panel.style.cssText = 'position:fixed;top:0;right:0;width:280px;display:flex;flex-direction:column;'
    + 'background:rgba(26,26,26,0.85);color:#fff;z-index:999999;font-family:sans-serif;font-size:11px;'
    + 'box-shadow:-2px 0 10px rgba(0,0,0,0.5);border-radius:0 0 0 8px;padding:10px;';

  var title = document.createElement('div');
  title.textContent = '📅 DATE TESTER';
  title.style.cssText = 'font-weight:bold;font-size:13px;margin-bottom:8px;color:#ffd700;text-shadow:0 1px 3px #000;';
  panel.appendChild(title);

  function makeTextInput(placeholder, width) {
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = placeholder;
    inp.style.cssText = 'flex:' + width + ';min-width:0;padding:8px 6px;background:rgba(45,45,45,0.6);color:#fff;'
      + 'border:1px solid #444;border-radius:4px;font-size:18px;text-align:center;';
    return inp;
  }

  var now0 = new RealDate(REAL_START);

  var dateRow = document.createElement('div');
  dateRow.style.cssText = 'display:flex;gap:3px;margin-bottom:4px;';
  var dateInput = makeTextInput('MM/DD/YYYY', 1);
  dateInput.value = (now0.getMonth() + 1) + '/' + now0.getDate() + '/' + now0.getFullYear();
  dateRow.appendChild(dateInput);
  panel.appendChild(dateRow);

  var timeRow = document.createElement('div');
  timeRow.style.cssText = 'display:flex;gap:3px;align-items:center;margin-bottom:6px;';
  var timeInput = makeTextInput('H:MM:SS', 1);
  var h24 = now0.getHours();
  var ampmNow = h24 >= 12 ? 'PM' : 'AM';
  var h12Now = h24 % 12; if (h12Now === 0) h12Now = 12;
  timeInput.value = h12Now + ':' + String(now0.getMinutes()).padStart(2,'0') + ':' + String(now0.getSeconds()).padStart(2,'0');
  timeRow.appendChild(timeInput);

  var amBtn = document.createElement('button');
  amBtn.textContent = 'AM';
  var pmBtn = document.createElement('button');
  pmBtn.textContent = 'PM';
  function styleAmPm() {
    amBtn.style.cssText = 'flex:1;padding:8px 0;border:1px solid #444;border-radius:4px;cursor:pointer;font-weight:bold;font-size:15px;'
      + (amBtn.dataset.active === '1' ? 'background:rgba(74,111,165,0.7);color:#fff;' : 'background:rgba(45,45,45,0.6);color:#999;');
    pmBtn.style.cssText = 'flex:1;padding:8px 0;border:1px solid #444;border-radius:4px;cursor:pointer;font-weight:bold;font-size:15px;'
      + (pmBtn.dataset.active === '1' ? 'background:rgba(74,111,165,0.7);color:#fff;' : 'background:rgba(45,45,45,0.6);color:#999;');
  }
  amBtn.dataset.active = (ampmNow === 'AM') ? '1' : '0';
  pmBtn.dataset.active = (ampmNow === 'PM') ? '1' : '0';
  amBtn.onclick = function() { amBtn.dataset.active = '1'; pmBtn.dataset.active = '0'; styleAmPm(); };
  pmBtn.onclick = function() { pmBtn.dataset.active = '1'; amBtn.dataset.active = '0'; styleAmPm(); };
  styleAmPm();
  timeRow.appendChild(amBtn);
  timeRow.appendChild(pmBtn);
  panel.appendChild(timeRow);

  var goBtn = document.createElement('button');
  goBtn.textContent = '▶ GO TO DATE/TIME';
  goBtn.style.cssText = 'width:100%;padding:8px;margin-bottom:6px;background:rgba(74,111,165,0.8);color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;';
  function jumpToCustom() {
    var dateParts = dateInput.value.split('/');
    if (dateParts.length !== 3) { alert('Date must be MM/DD/YYYY'); return; }
    var mo = parseInt(dateParts[0], 10), da = parseInt(dateParts[1], 10), yr = parseInt(dateParts[2], 10);

    var timeParts = timeInput.value.split(':');
    if (timeParts.length < 2) { alert('Time must be H:MM or H:MM:SS'); return; }
    var hr = parseInt(timeParts[0], 10), mi = parseInt(timeParts[1], 10), se = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
    if (isNaN(mo) || isNaN(da) || isNaN(yr) || isNaN(hr) || isNaN(mi) || isNaN(se) || hr < 1 || hr > 12) {
      alert('Check the date/time — could not read it.'); return;
    }
    var isPM = pmBtn.dataset.active === '1';
    var hr24 = (hr % 12) + (isPM ? 12 : 0);

    FAKE_START = new RealDate(yr, mo - 1, da, hr24, mi, se).getTime();
    render();
  }
  goBtn.onclick = jumpToCustom;
  panel.appendChild(goBtn);

  // Day-stepper — shifts whatever's currently active (typed date/time, or
  // real time if nothing's been set yet) by exactly 24 hours, keeping the
  // same time of day, and updates the date box to match so repeated
  // taps keep walking forward/backward correctly.
  function shiftDay(deltaDays) {
    var base = (FAKE_START !== null) ? FAKE_START : REAL_START;
    var shifted = new RealDate(base);
    shifted.setDate(shifted.getDate() + deltaDays); // calendar-day math, DST-safe
    FAKE_START = shifted.getTime();
    dateInput.value = (shifted.getMonth() + 1) + '/' + shifted.getDate() + '/' + shifted.getFullYear();
    render();
  }
  var stepRow = document.createElement('div');
  stepRow.style.cssText = 'display:flex;gap:4px;margin-bottom:6px;';
  var prevDayBtn = document.createElement('button');
  prevDayBtn.textContent = '◀ −1 DAY';
  prevDayBtn.style.cssText = 'flex:1;padding:8px 0;background:rgba(45,90,61,0.8);color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;';
  prevDayBtn.onclick = function() { shiftDay(-1); };
  var nextDayBtn = document.createElement('button');
  nextDayBtn.textContent = '+1 DAY ▶';
  nextDayBtn.style.cssText = 'flex:1;padding:8px 0;background:rgba(45,90,61,0.8);color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;';
  nextDayBtn.onclick = function() { shiftDay(1); };
  stepRow.appendChild(prevDayBtn);
  stepRow.appendChild(nextDayBtn);
  panel.appendChild(stepRow);

  var resetBtn = document.createElement('button');
  resetBtn.textContent = '↺ REAL TIME';
  resetBtn.style.cssText = 'width:100%;padding:8px;background:rgba(192,57,43,0.8);color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;';
  resetBtn.onclick = resetReal;
  panel.appendChild(resetBtn);

  document.body.appendChild(panel);
  render();
})();
