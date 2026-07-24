/**
 * Turniejomat — widok kapitana (invite-only).
 * Wymaga window.firebase / httpsCallable oraz parametry URL: view=captain&id=&team=&token=
 */
(function (global) {
  'use strict';

  const ROSTER_MAX_FALLBACK = 15;
  const BIO_MAX_FALLBACK = 500;

  let formMeta = null;
  let players = [];
  let photoUrl = null;
  let busy = false;

  function qs(sel) {
    return document.querySelector(sel);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getParams() {
    const u = new URLSearchParams(window.location.search);
    return {
      key: String(u.get('id') || '').trim(),
      teamId: u.get('team'),
      token: String(u.get('token') || '').trim(),
    };
  }

  function callables() {
    const fn = firebase.app().functions('europe-west1');
    return {
      getCaptainForm: fn.httpsCallable('getCaptainForm'),
      submitCaptainRoster: fn.httpsCallable('submitCaptainRoster'),
      uploadCaptainTeamPhoto: fn.httpsCallable('uploadCaptainTeamPhoto'),
    };
  }

  function genLocalId() {
    return 'p_' + Math.random().toString(36).slice(2, 10);
  }

  function setCloseEnabled(on) {
    const btn = qs('#captain-close');
    if (!btn) return;
    btn.disabled = !on;
    btn.title = on ? 'Zamknij tę kartę / okno' : 'Dostępne po wysłaniu składu';
  }

  function tryClosePage() {
    window.close();
    setTimeout(function () {
      if (!window.closed) {
        setStatus('Możesz zamknąć tę kartę przeglądarki (przeglądarka blokuje auto-zamknięcie).', 'ok');
      }
    }, 200);
  }

  function setStatus(msg, kind) {
    const el = qs('#captain-status');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'captain-status' + (kind ? ' captain-status--' + kind : '');
  }

  function rosterMax() {
    return (formMeta && formMeta.rosterMax) || ROSTER_MAX_FALLBACK;
  }

  function bioMax() {
    return (formMeta && formMeta.bioMax) || BIO_MAX_FALLBACK;
  }

  function renderPlayers() {
    const list = qs('#captain-players');
    const counter = qs('#captain-roster-count');
    if (counter) counter.textContent = players.length + ' / ' + rosterMax();
    if (!list) return;
    if (!players.length) {
      list.innerHTML = '<p class="captain-empty">Dodaj zawodników (max ' + rosterMax() + ').</p>';
      refreshRoleSelects();
      return;
    }
    list.innerHTML = players
      .map(function (p, i) {
        return (
          '<div class="captain-player-row" data-idx="' +
          i +
          '">' +
          '<input type="number" class="captain-num" min="0" max="99" placeholder="#" value="' +
          (p.number != null ? esc(p.number) : '') +
          '" aria-label="Numer">' +
          '<input type="text" class="captain-name" placeholder="Imię i nazwisko" value="' +
          esc(p.name || '') +
          '" aria-label="Imię i nazwisko">' +
          '<button type="button" class="captain-remove" data-remove="' +
          i +
          '" aria-label="Usuń">&times;</button>' +
          '</div>'
        );
      })
      .join('');
    refreshRoleSelects();
  }

  function refreshRoleSelects() {
    const gk = qs('#captain-gk');
    const cap = qs('#captain-cap');
    const opts =
      '<option value="">— wybierz —</option>' +
      players
        .map(function (p) {
          return '<option value="' + esc(p.id) + '">' + esc(p.name || '(bez nazwiska)') + '</option>';
        })
        .join('');
    if (gk) {
      const cur = gk.value;
      gk.innerHTML = opts;
      if (cur && players.some(function (p) { return p.id === cur; })) gk.value = cur;
    }
    if (cap) {
      const cur = cap.value;
      cap.innerHTML = opts;
      if (cur && players.some(function (p) { return p.id === cur; })) cap.value = cur;
    }
  }

  function syncPlayersFromDom() {
    const rows = document.querySelectorAll('#captain-players .captain-player-row');
    rows.forEach(function (row) {
      const i = parseInt(row.getAttribute('data-idx'), 10);
      if (!players[i]) return;
      const nameEl = row.querySelector('.captain-name');
      const numEl = row.querySelector('.captain-num');
      players[i].name = nameEl ? nameEl.value : players[i].name;
      const n = numEl && numEl.value !== '' ? parseInt(numEl.value, 10) : null;
      if (n != null && !isNaN(n)) players[i].number = n;
      else delete players[i].number;
    });
  }

  function addPlayer() {
    syncPlayersFromDom();
    if (players.length >= rosterMax()) {
      setStatus('Limit ' + rosterMax() + ' zawodników.', 'warn');
      return;
    }
    players.push({ id: genLocalId(), name: '' });
    renderPlayers();
  }

  function removePlayer(idx) {
    syncPlayersFromDom();
    const removed = players[idx];
    players.splice(idx, 1);
    const gk = qs('#captain-gk');
    const cap = qs('#captain-cap');
    if (removed && gk && gk.value === removed.id) gk.value = '';
    if (removed && cap && cap.value === removed.id) cap.value = '';
    renderPlayers();
  }

  function fillFromPayload(payload, team) {
    const src = payload || team || {};
    qs('#captain-team-name').value = src.name || '';
    qs('#captain-team-note').value = src.teamNote || '';
    qs('#captain-bio').value = src.captainBio || '';
    photoUrl = src.photoUrl || null;
    updatePhotoPreview();
    players = Array.isArray(src.players)
      ? src.players.map(function (p) {
          return {
            id: p.id || genLocalId(),
            name: p.name || '',
            number: p.number != null ? p.number : undefined,
          };
        })
      : [];
    if (!players.length) players.push({ id: genLocalId(), name: '' });
    renderPlayers();
    const gk = qs('#captain-gk');
    const cap = qs('#captain-cap');
    if (gk) gk.value = src.gkId || '';
    if (cap) cap.value = src.capId || '';
  }

  function updatePhotoPreview() {
    const img = qs('#captain-photo-preview');
    const clearBtn = qs('#captain-photo-clear');
    if (!img) return;
    if (photoUrl) {
      img.src = photoUrl;
      img.style.display = 'block';
      if (clearBtn) clearBtn.style.display = '';
    } else {
      img.removeAttribute('src');
      img.style.display = 'none';
      if (clearBtn) clearBtn.style.display = 'none';
    }
  }

  function compressImageFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type || file.type.indexOf('image/') !== 0) {
        reject(new Error('Wybierz plik obrazu.'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = function () {
        reject(new Error('Nie udało się odczytać pliku.'));
      };
      reader.onload = function () {
        const img = new Image();
        img.onload = function () {
          const maxSide = 1280;
          let w = img.width;
          let h = img.height;
          if (w > maxSide || h > maxSide) {
            if (w >= h) {
              h = Math.round((h * maxSide) / w);
              w = maxSide;
            } else {
              w = Math.round((w * maxSide) / h);
              h = maxSide;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          let quality = 0.82;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          while (dataUrl.length > 520000 && quality > 0.45) {
            quality -= 0.08;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        };
        img.onerror = function () {
          reject(new Error('Nieprawidłowy obraz.'));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function onPhotoSelected(file) {
    const params = getParams();
    setStatus('Kompresja zdjęcia…');
    try {
      const dataUrl = await compressImageFile(file);
      setStatus('Wysyłanie zdjęcia…');
      const res = await callables().uploadCaptainTeamPhoto({
        key: params.key,
        teamId: params.teamId,
        token: params.token,
        dataUrl: dataUrl,
      });
      photoUrl = res.data && res.data.photoUrl;
      updatePhotoPreview();
      setStatus('Zdjęcie zapisane.', 'ok');
    } catch (err) {
      setStatus((err && err.message) || 'Błąd uploadu zdjęcia.', 'err');
    }
  }

  async function loadForm() {
    const params = getParams();
    const root = qs('#view-captain');
    if (!root) return;
    if (!params.key || params.teamId == null || params.teamId === '' || !params.token) {
      root.innerHTML =
        '<div class="captain-shell"><h1>Link niepełny</h1><p>Poproś organizatora o pełny link zaproszenia kapitana.</p></div>';
      return;
    }
    setStatus('Ładowanie…');
    try {
      const res = await callables().getCaptainForm({
        key: params.key,
        teamId: params.teamId,
        token: params.token,
      });
      formMeta = res.data;
      const title = qs('#captain-tour-title');
      if (title) {
        title.textContent = formMeta.tournamentName
          ? formMeta.tournamentName
          : 'Zgłoszenie składu';
      }
      const gkWrap = qs('#captain-gk-wrap');
      const capWrap = qs('#captain-cap-wrap');
      if (gkWrap) gkWrap.style.display = '';
      if (capWrap) capWrap.style.display = '';

      const sub = formMeta.submission || {};
      setCloseEnabled(false);
      if (sub.status === 'pending') {
        setStatus('Zgłoszenie czeka na akceptację sędziego. Możesz poprawić i wysłać ponownie.', 'warn');
        fillFromPayload(sub.payload, formMeta.team);
        setCloseEnabled(true);
      } else if (sub.status === 'rejected') {
        setStatus('Odrzucono: ' + (sub.rejectReason || 'popraw i wyślij ponownie.'), 'err');
        fillFromPayload(sub.payload || formMeta.team, formMeta.team);
      } else if (sub.status === 'accepted' && sub.payload) {
        setStatus('Ostatnia wersja zaakceptowana. Nowe wysłanie wymaga ponownej akceptacji.', 'ok');
        fillFromPayload(sub.payload, formMeta.team);
        setCloseEnabled(true);
      } else {
        setStatus('');
        fillFromPayload(null, formMeta.team);
      }
    } catch (err) {
      const msg = (err && err.message) || 'Nie udało się wczytać formularza.';
      root.innerHTML =
        '<div class="captain-shell"><h1>Brak dostępu</h1><p>' + esc(msg) + '</p></div>';
    }
  }

  async function submit() {
    if (busy) return;
    syncPlayersFromDom();
    const params = getParams();
    const name = (qs('#captain-team-name') && qs('#captain-team-name').value) || '';
    const teamNote = (qs('#captain-team-note') && qs('#captain-team-note').value) || '';
    const captainBio = (qs('#captain-bio') && qs('#captain-bio').value) || '';
    const gkId = (qs('#captain-gk') && qs('#captain-gk').value) || null;
    const capId = (qs('#captain-cap') && qs('#captain-cap').value) || null;
    if (!gkId) {
      setStatus('Wybierz bramkarza spośród zawodników.', 'err');
      return;
    }
    if (!capId) {
      setStatus('Wybierz kapitana spośród zawodników.', 'err');
      return;
    }
    busy = true;
    setStatus('Wysyłanie…');
    try {
      await callables().submitCaptainRoster({
        key: params.key,
        teamId: params.teamId,
        token: params.token,
        name: name,
        teamNote: teamNote,
        captainBio: captainBio,
        photoUrl: photoUrl,
        players: players,
        gkId: gkId,
        capId: capId,
      });
      setStatus('Wysłano do akceptacji sędziego. Dziękujemy!', 'ok');
      setCloseEnabled(true);
    } catch (err) {
      setStatus((err && err.message) || 'Nie udało się wysłać.', 'err');
    } finally {
      busy = false;
    }
  }

  function bind() {
    const addBtn = qs('#captain-add-player');
    if (addBtn) addBtn.addEventListener('click', addPlayer);
    const list = qs('#captain-players');
    if (list) {
      list.addEventListener('click', function (ev) {
        const btn = ev.target.closest('[data-remove]');
        if (!btn) return;
        removePlayer(parseInt(btn.getAttribute('data-remove'), 10));
      });
      list.addEventListener('input', function () {
        syncPlayersFromDom();
        refreshRoleSelects();
      });
    }
    const submitBtn = qs('#captain-submit');
    if (submitBtn) submitBtn.addEventListener('click', submit);
    const closeBtn = qs('#captain-close');
    if (closeBtn) closeBtn.addEventListener('click', tryClosePage);
    const photoInput = qs('#captain-photo-input');
    if (photoInput) {
      photoInput.addEventListener('change', function () {
        const f = photoInput.files && photoInput.files[0];
        if (f) onPhotoSelected(f);
        photoInput.value = '';
      });
    }
    const clearBtn = qs('#captain-photo-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        photoUrl = null;
        updatePhotoPreview();
      });
    }
    const note = qs('#captain-team-note');
    const bio = qs('#captain-bio');
    function bindCounter(el, counterId) {
      if (!el) return;
      const c = qs(counterId);
      const sync = function () {
        if (c) c.textContent = (el.value || '').length + ' / ' + bioMax();
      };
      el.addEventListener('input', sync);
      sync();
    }
    bindCounter(note, '#captain-note-count');
    bindCounter(bio, '#captain-bio-count');
  }

  global.CaptainView = {
    init: function () {
      bind();
      loadForm();
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
