/* ==========================================================================
   MOTOR DEL JUEGO — ruta, XP, vidas, rachas, insignias, liga, retos
   ========================================================================== */
(function (w) {
  'use strict';

  var C = w.CONFIG;

  /* ------------------------------------------------------------------
     RUTA: secuencia de nodos (lecciones + jefes) ordenada por nivel
     ------------------------------------------------------------------ */
  var _path = null;

  function buildPath() {
    if (_path) return _path;
    var nodes = [];
    C.LEVELS.forEach(function (lv) {
      w.LESSONS.filter(function (l) { return l.level === lv.n; })
        .forEach(function (l) {
          nodes.push({ kind: 'lesson', id: l.id, level: lv.n, data: l });
        });
      var boss = C.BOSSES.filter(function (b) { return b.level === lv.n; })[0];
      if (boss) nodes.push({ kind: 'boss', id: boss.id, level: lv.n, data: boss });
    });
    _path = nodes;
    return nodes;
  }

  function nodeIndex(id) {
    var p = buildPath();
    for (var i = 0; i < p.length; i++) if (p[i].id === id) return i;
    return -1;
  }

  /** Índice desde el que arranca la ruta personalizada según el diagnóstico. */
  function recommendedStart() {
    var s = w.Store.state;
    var goal = s.profile.goal;
    var know = s.profile.knowledge;
    var id = 'n1-01';
    if (goal === 'idea') id = know === 'lots' ? 'n2-01' : 'n1-04';
    else if (goal === 'business') id = know === 'none' ? 'n3-03' : 'n4-01';
    var i = nodeIndex(id);
    return i < 0 ? 0 : i;
  }

  function isDone(id) {
    var s = w.Store.state;
    return !!(s.lessons[id] && s.lessons[id].done) || !!(s.missions[id] && s.missions[id].done);
  }

  /** Estado de cada nodo: done | active | unlocked | locked */
  function pathState() {
    var s = w.Store.state;
    var p = buildPath();
    var start = s.startIndex == null ? 0 : s.startIndex;
    var firstPending = -1;
    var out = p.map(function (n, i) {
      var done = isDone(n.id);
      var st = 'locked';
      if (done) st = 'done';
      else if (i <= start) st = 'unlocked';
      return { node: n, index: i, state: st, optional: i < start && !done };
    });

    // Desbloquea secuencialmente a partir del último completado
    for (var i = 0; i < out.length; i++) {
      if (out[i].state === 'done') {
        if (out[i + 1] && out[i + 1].state === 'locked') out[i + 1].state = 'unlocked';
      }
    }
    // El nodo "activo" es el primero pendiente a partir del punto de entrada
    // recomendado por el diagnóstico. Lo anterior queda desbloqueado pero opcional.
    for (var j = start; j < out.length; j++) {
      if (out[j].state === 'unlocked') { firstPending = j; break; }
    }
    if (firstPending < 0) {
      for (var k = 0; k < out.length; k++) {
        if (out[k].state === 'unlocked') { firstPending = k; break; }
      }
    }
    if (firstPending >= 0) out[firstPending].state = 'active';
    return out;
  }

  function activeNode() {
    var ps = pathState();
    for (var i = 0; i < ps.length; i++) if (ps[i].state === 'active') return ps[i];
    return ps[ps.length - 1];
  }

  function levelProgress(levelN) {
    var ps = pathState().filter(function (x) { return x.node.level === levelN; });
    var done = ps.filter(function (x) { return x.state === 'done'; }).length;
    return { done: done, total: ps.length, pct: ps.length ? (done / ps.length) * 100 : 0 };
  }

  function overallProgress() {
    var ps = pathState();
    var done = ps.filter(function (x) { return x.state === 'done'; }).length;
    return { done: done, total: ps.length, pct: ps.length ? (done / ps.length) * 100 : 0 };
  }

  function lessonById(id) {
    for (var i = 0; i < w.LESSONS.length; i++) if (w.LESSONS[i].id === id) return w.LESSONS[i];
    return null;
  }
  function bossById(id) {
    for (var i = 0; i < C.BOSSES.length; i++) if (C.BOSSES[i].id === id) return C.BOSSES[i];
    return null;
  }
  function levelInfo(n) {
    for (var i = 0; i < C.LEVELS.length; i++) if (C.LEVELS[i].n === n) return C.LEVELS[i];
    return C.LEVELS[0];
  }

  /* ------------------------------------------------------------------
     ECONOMÍA
     ------------------------------------------------------------------ */

  function xpMultiplier() {
    var s = w.Store.state;
    if (s.boostUntil && Date.now() < s.boostUntil) return 2;
    return 1;
  }

  function addXP(n, silent) {
    var mult = xpMultiplier();
    var gain = Math.round(n * mult);
    var before = w.Store.state.xp;
    var rankBefore = C.rankFor(before);
    w.Store.set(function (s) {
      s.xp += gain;
      s.xpToday += gain;
      s.league.xp += gain;
      s.stats.answers = s.stats.answers || 0;
    }, 'xp');
    var rankAfter = C.rankFor(w.Store.state.xp);
    if (!silent) w.Sound.xp();
    if (rankAfter.level > rankBefore.level) {
      setTimeout(function () { showRankUp(rankAfter); }, 500);
    }
    checkBadges();
    return gain;
  }

  function addCoins(n) {
    w.Store.set(function (s) { s.coins = Math.max(0, s.coins + n); }, 'coins');
    if (n > 0) w.Sound.coin();
  }

  function loseHeart() {
    var s = w.Store.state;
    if (s.hearts <= 0) return 0;
    w.Store.set(function (st) {
      if (st.hearts === 5) st.heartsTs = Date.now();
      st.hearts = Math.max(0, st.hearts - 1);
    }, 'hearts');
    w.Sound.heartLost();
    w.Sound.buzz([30, 40, 30]);
    return w.Store.state.hearts;
  }

  function refillHearts() {
    w.Store.set(function (s) { s.hearts = 5; s.heartsTs = Date.now(); }, 'hearts');
  }

  function heartsETA() {
    var s = w.Store.state;
    if (s.hearts >= 5) return null;
    var REGEN = 30 * 60 * 1000;
    var next = (s.heartsTs || Date.now()) + REGEN - Date.now();
    if (next < 0) next = 0;
    var m = Math.floor(next / 60000), sec = Math.floor((next % 60000) / 1000);
    return m + ':' + String(sec).padStart(2, '0');
  }

  /* ------------------------------------------------------------------
     RACHA
     ------------------------------------------------------------------ */

  function touchDay() {
    var t = w.Store.today();
    var s = w.Store.state;
    if (s.lastDay === t) return { changed: false, streak: s.streak };
    var gap = s.lastDay ? w.Store.daysBetween(s.lastDay, t) : 999;
    var newStreak = (gap === 1) ? s.streak + 1 : 1;
    var comeback = s.lastDay && gap > 1 && s.bestStreak >= 3;
    w.Store.set(function (st) {
      st.lastDay = t;
      st.streak = newStreak;
      st.bestStreak = Math.max(st.bestStreak, newStreak);
      if (st.stats.days.indexOf(t) < 0) st.stats.days.push(t);
      if (st.stats.days.length > 400) st.stats.days = st.stats.days.slice(-400);
    }, 'streak');
    if (comeback) award('comeback');
    bumpWeekly('days', 1);
    checkBadges();
    return { changed: true, streak: newStreak };
  }

  /* ------------------------------------------------------------------
     COMPLETAR CONTENIDO
     ------------------------------------------------------------------ */

  function completeLesson(id, result) {
    var lesson = lessonById(id);
    if (!lesson) return;
    var perfect = result.errors === 0;
    var prev = w.Store.state.lessons[id];
    var first = !prev || !prev.done;

    w.Store.set(function (s) {
      s.lessons[id] = {
        done: true,
        score: Math.max((prev && prev.score) || 0, result.score),
        perfect: perfect || !!(prev && prev.perfect),
        at: Date.now(),
        attempts: ((prev && prev.attempts) || 0) + 1
      };
      if (first) s.stats.lessons++;
      s.stats.minutes += lesson.min || 5;
    }, 'lesson');

    bumpWeekly('lessons', 1);
    if (perfect) bumpWeekly('perfect', 1);
    checkBadges();
    return { first: first, perfect: perfect };
  }

  function completeMission(id, answers, evaluation, dossierKey) {
    var prev = w.Store.state.missions[id];
    var first = !prev || !prev.done;
    w.Store.set(function (s) {
      s.missions[id] = {
        done: true,
        answers: answers,
        score: evaluation.score,
        at: Date.now()
      };
      if (first) s.stats.missions++;
      if (dossierKey) {
        s.dossier[dossierKey] = {
          answers: answers,
          score: evaluation.score,
          at: Date.now(),
          from: id
        };
      }
    }, 'mission');
    bumpWeekly('missions', 1);
    checkBadges();
    return first;
  }

  /* ------------------------------------------------------------------
     INSIGNIAS
     ------------------------------------------------------------------ */

  function has(id) { return w.Store.state.badges.indexOf(id) >= 0; }

  function award(id) {
    if (has(id)) return false;
    var badge = null;
    for (var i = 0; i < C.BADGES.length; i++) if (C.BADGES[i].id === id) badge = C.BADGES[i];
    if (!badge) return false;
    w.Store.set(function (s) { s.badges.push(id); }, 'badge');
    setTimeout(function () { showBadge(badge); }, 400);
    return true;
  }

  function checkBadges() {
    var s = w.Store.state;
    if (s.stats.lessons >= 1) award('first-step');
    if (s.streak >= 3) award('streak-3');
    if (s.streak >= 7) award('streak-7');
    if (s.streak >= 30) award('streak-30');
    if (s.xp >= 1000) award('xp-1000');
    if (s.xp >= 5000) award('xp-5000');

    var perfects = 0, k;
    for (k in s.lessons) if (s.lessons[k].perfect) perfects++;
    if (perfects >= 1) award('perfect');
    if (perfects >= 5) award('perfect-5');

    C.LEVELS.forEach(function (lv) {
      var p = levelProgress(lv.n);
      if (p.total > 0 && p.done === p.total) award('lv' + lv.n);
    });

    var bosses = C.BOSSES.filter(function (b) { return isDone(b.id); }).length;
    if (bosses >= 1) award('first-boss');
    if (bosses >= C.BOSSES.length) award('all-bosses');

    var filled = 0;
    for (k in s.dossier) if (s.dossier[k]) filled++;
    if (filled >= 6) award('dossier-half');
    if (filled >= C.DOSSIER.length) award('dossier-full');

    if ((s.chatCount || 0) >= 10) award('mentor-10');

    var h = new Date().getHours();
    if (h >= 23 || h < 3) award('night');
    if (h >= 4 && h < 7) award('early');
  }

  /* ------------------------------------------------------------------
     LIGA
     ------------------------------------------------------------------ */

  function leagueTier() {
    var xp = w.Store.state.xp;
    var t = 0;
    for (var i = 0; i < C.LEAGUES.length; i++) if (xp >= C.LEAGUES[i].min) t = i;
    return t;
  }

  function leagueBoard() {
    var s = w.Store.state;
    if (!s.league.bots || !s.league.bots.length) {
      var seed = 0, wk = s.league.week || '';
      for (var i = 0; i < wk.length; i++) seed = (seed * 31 + wk.charCodeAt(i)) | 0;
      var rnd = w.UI.mulberry(seed + leagueTier() * 977);
      var names = w.UI.shuffle(C.BOT_NAMES, seed).slice(0, 9);
      var base = 60 + leagueTier() * 130;
      var bots = names.map(function (n, i) {
        return { name: n, xp: Math.round(base * (0.35 + rnd() * 1.9) + i * 7), bot: true };
      });
      w.Store.set(function (st) { st.league.bots = bots; }, 'league');
    }
    // Los bots avanzan con el paso de los días
    var dayOfWeek = (new Date().getDay() + 6) % 7;
    var board = w.Store.state.league.bots.map(function (b, i) {
      var drift = Math.round(b.xp * (dayOfWeek / 7) * 0.85) + i;
      return { name: b.name, xp: b.xp + drift, me: false };
    });
    board.push({ name: w.Store.state.profile.name || 'Tú', xp: w.Store.state.league.xp, me: true });
    board.sort(function (a, b) { return b.xp - a.xp; });
    return board;
  }

  /* ------------------------------------------------------------------
     RETOS SEMANALES
     ------------------------------------------------------------------ */

  function bumpWeekly(metric, n) {
    w.Store.set(function (s) {
      C.WEEKLY.forEach(function (ch) {
        if (ch.metric !== metric) return;
        s.weekly.progress[ch.id] = Math.min(ch.goal, (s.weekly.progress[ch.id] || 0) + n);
      });
    }, 'weekly');
  }

  function weeklyList() {
    var s = w.Store.state;
    return C.WEEKLY.map(function (ch) {
      var p = s.weekly.progress[ch.id] || 0;
      return {
        ch: ch, progress: p,
        pct: (p / ch.goal) * 100,
        complete: p >= ch.goal,
        claimed: s.weekly.claimed.indexOf(ch.id) >= 0
      };
    });
  }

  function claimWeekly(id) {
    var item = weeklyList().filter(function (x) { return x.ch.id === id; })[0];
    if (!item || !item.complete || item.claimed) return false;
    w.Store.set(function (s) { s.weekly.claimed.push(id); }, 'weekly');
    addXP(item.ch.xp);
    addCoins(item.ch.coins);
    return true;
  }

  /* ------------------------------------------------------------------
     MISIÓN DIARIA
     ------------------------------------------------------------------ */

  function dailyMission() {
    var act = activeNode();
    if (!act) return null;
    var n = act.node;
    if (n.kind === 'boss') {
      return { kind: 'boss', id: n.id, icon: n.data.icon, title: n.data.title, sub: n.data.subtitle };
    }
    return { kind: 'lesson', id: n.id, icon: n.data.icon, title: n.data.title,
             sub: levelInfo(n.level).title + ' · ' + n.data.min + ' min' };
  }

  /* ------------------------------------------------------------------
     MODALES DE RECOMPENSA
     ------------------------------------------------------------------ */

  function showBadge(badge) {
    w.UI.queueModal(function () { pintarInsignia(badge); });
  }

  function pintarInsignia(badge) {
    var el = w.UI.el;
    w.Sound.levelUp();
    w.FX.celebrate();
    w.UI.modal([
      el('div', { class: 'tiny c-brand', text: 'Insignia desbloqueada' }),
      el('div', { style: { position: 'relative', display: 'grid', placeItems: 'center', padding: '10px 0' } }, [
        el('div', { class: 'rays' }),
        el('div', { class: 'badge__disc', style: { width: '104px', height: '104px', fontSize: '48px' }, text: badge.icon })
      ]),
      el('h3', { class: 'h2', text: badge.name }),
      el('p', { class: 'p', text: badge.desc }),
      w.UI.btn('¡Genial!', { variant: 'gold', onClick: w.UI.closeModal })
    ]);
  }

  function showRankUp(rank) {
    w.UI.queueModal(function () { pintarRango(rank); });
  }

  function pintarRango(rank) {
    var el = w.UI.el;
    w.Sound.levelUp();
    w.FX.celebrate();
    w.UI.modal([
      el('div', { class: 'tiny c-brand', text: 'Subiste de rango' }),
      el('div', { style: { position: 'relative', display: 'grid', placeItems: 'center', padding: '6px 0' } }, [
        el('div', { class: 'rays' }),
        el('div', { class: 'mascot mascot--lg is-party', html: w.Mascot.svg('party') })
      ]),
      el('h3', { class: 'h1', text: rank.icon + ' ' + rank.name }),
      el('p', { class: 'p', text: 'Nivel ' + rank.level + ' · ' + w.UI.num(w.Store.state.xp) + ' XP acumulados' }),
      w.UI.btn('Seguir', { variant: 'brand', onClick: w.UI.closeModal })
    ]);
  }

  /* ------------------------------------------------------------------ */

  w.Engine = {
    buildPath: buildPath, pathState: pathState, activeNode: activeNode,
    nodeIndex: nodeIndex, recommendedStart: recommendedStart,
    levelProgress: levelProgress, overallProgress: overallProgress,
    lessonById: lessonById, bossById: bossById, levelInfo: levelInfo, isDone: isDone,
    addXP: addXP, addCoins: addCoins, loseHeart: loseHeart, refillHearts: refillHearts,
    heartsETA: heartsETA, xpMultiplier: xpMultiplier,
    touchDay: touchDay, completeLesson: completeLesson, completeMission: completeMission,
    award: award, checkBadges: checkBadges, hasBadge: has,
    leagueTier: leagueTier, leagueBoard: leagueBoard,
    weeklyList: weeklyList, claimWeekly: claimWeekly, bumpWeekly: bumpWeekly,
    dailyMission: dailyMission, showBadge: showBadge, showRankUp: showRankUp
  };
})(window);
