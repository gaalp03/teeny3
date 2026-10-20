'use strict';
// Támadások. kind: melee (közelharc), shot (lövedék), beam (sugár), slam (földre csapás),
// multi (több találat), self (saját magára ható).
(function (TT) {
  const MOVES = {};

  function M(id, name, kind, power, charge, fx, color, extra) {
    const m = Object.assign({ id, name, kind, power, charge, fx, color, eff: [], hits: 1 }, extra || {});
    if (m.windup == null) {
      let w = 0.24 + power * 0.0085;
      if (kind === 'beam') w += 0.08;
      if (kind === 'slam') w += 0.14;
      if (kind === 'self') w = 0.3;
      if (m.super) w = 0.95;
      m.windup = Math.min(1.1, w);
    }
    MOVES[id] = m;
    return m;
  }
  const E = (s, p, d, extra) => Object.assign({ s, p, d }, extra || {});

  // ---------- Titánok ----------
  M('bo_staff', 'Bot-csapás', 'melee', 12, 2, 'staff', '#ffd23f');
  M('birdarang', 'Madárrang', 'shot', 23, 4.5, 'bird', '#ffd23f', { eff: [E('stun', 0.4, 0.9)] });
  M('flying_kick', 'Repülő rúgás', 'melee', 40, 8, 'kick', '#ff6b35', { crit: 0.2 });
  M('titans_go', 'Titánok, rajta!', 'multi', 72, 0, 'punch', '#ffd23f', { super: true, hits: 4, melee: true });

  M('azarath', 'Azarath!', 'shot', 11, 2.4, 'magic', '#8e5cff');
  M('dark_shield', 'Sötét pajzs', 'self', 0, 8, 'shield', '#6b3fa0', { shield: 0.16 });
  M('metrion', 'Metrion Zinthos', 'beam', 38, 8.5, 'magic', '#8e5cff', { eff: [E('weak', 0.4, 4)] });
  M('demon_rage', 'Démoni harag', 'beam', 76, 0, 'magic', '#b31b1b', { super: true, eff: [E('stun', 1, 1.4)] });

  M('cheetah', 'Gepárd-roham', 'melee', 9, 1.9, 'claw', '#f2b705');
  M('goat_butt', 'Kecske-öklelés', 'melee', 22, 4.4, 'punch', '#6fcf5e', { eff: [E('stun', 0.2, 0.8)] });
  M('gorilla_slam', 'Gorilla-csapás', 'slam', 37, 8, 'rock', '#6fcf5e');
  M('trex', 'T-Rex taposás', 'slam', 74, 0, 'rock', '#6fcf5e', { super: true, eff: [E('stun', 1, 1.1)] });

  M('booyah_punch', 'Booyah-ütés', 'melee', 11, 2.4, 'punch', '#3fa7ff');
  M('sonic_cannon', 'Hangágyú', 'beam', 24, 5, 'sonic', '#5fd3ff');
  M('cyber_repair', 'Kiber-javítás', 'self', 0, 10, 'heal', '#6ee06e', { heal: 0.2 });
  M('mega_cannon', 'Mega Ágyú', 'beam', 82, 0, 'sonic', '#5fd3ff', { super: true });

  M('starbolt', 'Csillagnyíl', 'shot', 10, 2.1, 'star', '#7bff6b');
  M('eye_beams', 'Szemsugár', 'beam', 22, 4.6, 'laser', '#7bff6b', { eff: [E('burn', 0.4, 3)] });
  M('tamaran_punch', 'Tamarani ütés', 'melee', 36, 7.8, 'punch', '#7bff6b');
  M('star_storm', 'Csillagzápor', 'multi', 74, 0, 'star', '#7bff6b', { super: true, hits: 6, eff: [E('burn', 0.6, 3)] });

  // ---------- Változatok ----------
  M('shuriken', 'Shuriken', 'multi', 12, 2.4, 'shuriken', '#d0d6e0', { hits: 3 });
  M('smoke_bomb', 'Füstbomba', 'shot', 8, 5, 'smoke', '#9aa5b1', { eff: [E('slow', 0.9, 3.5)] });
  M('shadow_cut', 'Árnyék-vágás', 'melee', 40, 8, 'slash', '#d62828', { crit: 0.25 });
  M('thousand_blades', 'Ezer penge', 'multi', 76, 0, 'slash', '#d62828', { super: true, hits: 5, melee: true });

  M('ultra_staff', 'Ultra-bot', 'melee', 13, 2.2, 'staff', '#ffc93c');
  M('golden_rang', 'Arany madárrang', 'shot', 26, 4.5, 'bird', '#ffc93c', { eff: [E('stun', 0.35, 1)] });
  M('ultra_kick', 'Ultra rúgás', 'melee', 42, 7.5, 'kick', '#ffc93c');
  M('golden_leader', 'Arany vezér', 'multi', 86, 0, 'punch', '#ffc93c', { super: true, hits: 5, melee: true, eff: [E('atkUp', 1, 6, { self: true })] });

  M('riff', 'Gitár-riff', 'shot', 11, 2.3, 'note', '#ff4fa3');
  M('power_chord', 'Erő-akkord', 'beam', 24, 5, 'sonic', '#ff4fa3', { eff: [E('stun', 0.25, 0.9)] });
  M('stage_dive', 'Színpadi ugrás', 'slam', 38, 8, 'rock', '#ff4fa3');
  M('night_shine', 'Az éjszaka ragyog', 'beam', 76, 0, 'note', '#ff4fa3', { super: true, eff: [E('weak', 1, 5)] });

  M('rage_bolt', 'Düh-villám', 'shot', 13, 2.3, 'magic', '#ff3b3b', { eff: [E('burn', 0.2, 3)] });
  M('four_eyes', 'Négy szem', 'self', 0, 6, 'buff', '#ff3b3b', { eff: [E('atkUp', 1, 6, { self: true })] });
  M('rage_wave', 'Harag-hullám', 'beam', 42, 8, 'magic', '#ff3b3b');
  M('trigon_daughter', 'Trigon lánya', 'beam', 86, 0, 'magic', '#ff3b3b', { super: true, eff: [E('burn', 1, 4)] });

  M('light_bolt', 'Fény-lövés', 'shot', 10, 2.2, 'magic', '#fff3b0');
  M('healing_light', 'Gyógyító fény', 'self', 0, 9.5, 'heal', '#fff3b0', { heal: 0.22 });
  M('purify', 'Tisztító sugár', 'beam', 30, 6.5, 'magic', '#fff3b0', { eff: [E('weak', 0.3, 4)] });
  M('white_wings', 'Fehér szárnyak', 'beam', 58, 0, 'magic', '#ffffff', { super: true, eff: [E('regen', 1, 6, { self: true })] });

  M('chest_pound', 'Mellkas-dobolás', 'self', 0, 5.5, 'buff', '#ff8c42', { eff: [E('atkUp', 1, 6, { self: true })] });
  M('banana', 'Banánhajítás', 'shot', 20, 4, 'banana', '#ffe066', { eff: [E('slow', 0.4, 3)] });
  M('gorilla_smash', 'Gorilla-zúzás', 'slam', 42, 8.5, 'rock', '#6fcf5e');
  M('king_smash', 'Királyi zúzás', 'slam', 86, 0, 'rock', '#6fcf5e', { super: true, eff: [E('stun', 1, 1.3)] });

  M('lasso', 'Lasszó', 'shot', 9, 2, 'lasso', '#c58940', { eff: [E('slow', 0.3, 2.5)] });
  M('horse_kick', 'Ló-rúgás', 'melee', 24, 4.6, 'kick', '#c58940');
  M('stampede', 'Bölény-csorda', 'slam', 36, 7.6, 'rock', '#8b5a2b');
  M('wild_west', 'Vadnyugati roham', 'multi', 74, 0, 'punch', '#c58940', { super: true, hits: 4, melee: true });

  M('rocket_fist', 'Rakéta-ököl', 'shot', 14, 2.6, 'rocket', '#3fa7ff');
  M('missile_rain', 'Rakétazápor', 'multi', 27, 5.2, 'rocket', '#ff6b35', { hits: 3, eff: [E('burn', 0.3, 3)] });
  M('mega_beam', 'Mega-sugár', 'beam', 45, 9, 'sonic', '#5fd3ff');
  M('booyah_bomb', 'Booyah-bomba', 'slam', 90, 0, 'fire', '#ff6b35', { super: true, eff: [E('burn', 1, 4)] });

  M('plasma', 'Plazma-tüzelés', 'shot', 13, 2.2, 'orb', '#9bffef');
  M('nano_repair', 'Nano-javítás', 'self', 0, 10, 'heal', '#9bffef', { heal: 0.14, eff: [E('regen', 1, 5, { self: true })] });
  M('laser_grid', 'Lézerháló', 'beam', 40, 7.5, 'laser', '#9bffef', { eff: [E('stun', 0.3, 1)] });
  M('time_cannon', 'Időágyú', 'beam', 92, 0, 'sonic', '#ffc93c', { super: true, eff: [E('slow', 1, 5)] });

  M('war_punch', 'Harci ütés', 'melee', 13, 2.3, 'punch', '#7bff6b');
  M('star_shield', 'Csillagpajzs', 'self', 0, 8, 'shield', '#7bff6b', { shield: 0.17 });
  M('star_nova', 'Szupernova', 'beam', 44, 8.5, 'star', '#7bff6b', { eff: [E('burn', 0.5, 3)] });
  M('tamaran_warrior', 'Tamarani harcos', 'multi', 86, 0, 'punch', '#7bff6b', { super: true, hits: 4, melee: true });

  M('pillow', 'Párnadobás', 'shot', 10, 2.2, 'pillow', '#ffd6ec', { eff: [E('slow', 0.25, 2.5)] });
  M('lullaby', 'Altatódal', 'shot', 16, 5, 'note', '#ff9ecd', { eff: [E('stun', 0.5, 1.2)] });
  M('dream_beam', 'Álomsugár', 'beam', 32, 7, 'magic', '#ff9ecd');
  M('starry_dream', 'Csillagos álom', 'beam', 62, 0, 'star', '#ff9ecd', { super: true, eff: [E('stun', 1, 2)] });

  // ---------- Titánok Kelet ----------
  M('water_whip', 'Vízostor', 'melee', 11, 2.3, 'wave', '#4fc3f7');
  M('tidal', 'Szökőár', 'beam', 24, 5, 'wave', '#4fc3f7', { eff: [E('slow', 0.4, 3)] });
  M('fish_swarm', 'Halraj', 'multi', 35, 8, 'fish', '#ffb347', { hits: 3 });
  M('atlantis_wave', 'Atlantiszi hullám', 'beam', 76, 0, 'wave', '#4fc3f7', { super: true, eff: [E('slow', 1, 5)] });

  M('quick_arrow', 'Gyors nyíl', 'multi', 10, 2, 'arrow', '#ffd23f', { hits: 2 });
  M('fire_arrow', 'Tűznyíl', 'shot', 22, 4.6, 'arrow', '#ff6b35', { eff: [E('burn', 0.6, 3)] });
  M('arrow_storm', 'Nyílvihar', 'multi', 38, 8, 'arrow', '#ffd23f', { hits: 4 });
  M('arrow_rain', 'Nyílzápor', 'multi', 76, 0, 'arrow', '#ff6b35', { super: true, hits: 6 });

  M('sting', 'Fullánk', 'shot', 10, 2, 'orb', '#ffd23f');
  M('mini_size', 'Mini-méret', 'self', 0, 6, 'buff', '#ffd23f', { eff: [E('defUp', 1, 6, { self: true })] });
  M('buzz_blast', 'Zümmögő robbanás', 'beam', 34, 7.5, 'laser', '#ffd23f', { eff: [E('stun', 0.3, 1)] });
  M('bee_swarm', 'Darázsraj', 'multi', 74, 0, 'orb', '#ffd23f', { super: true, hits: 6 });

  M('touch', 'Érintés!', 'multi', 8, 1.6, 'punch', '#ffffff', { hits: 2, melee: true });
  M('tornado', 'Tornádó', 'slam', 24, 4.2, 'wind', '#d0f0ff', { eff: [E('slow', 0.5, 3)] });
  M('double_dash', 'Dupla roham', 'melee', 40, 7, 'punch', '#ff4f4f');
  M('mas_menos', 'Más-Menos-Más!', 'multi', 82, 0, 'punch', '#ff4f4f', { super: true, hits: 8, melee: true });

  M('quick_jab', 'Villámütés', 'multi', 10, 1.8, 'punch', '#ffd23f', { hits: 3, melee: true });
  M('speed_force', 'Hangsebesség', 'self', 0, 6, 'buff', '#ffd23f', { eff: [E('haste', 1, 5, { self: true })] });
  M('lightning_dash', 'Villám-roham', 'melee', 42, 7.5, 'lightning', '#ffd23f', { eff: [E('stun', 0.3, 0.9)] });
  M('supersonic', 'Szuperszonikus', 'multi', 86, 0, 'lightning', '#ffd23f', { super: true, hits: 8, melee: true });

  M('rock_toss', 'Kődobás', 'shot', 13, 2.5, 'rock', '#c8a165');
  M('rock_wall', 'Kőfal', 'self', 0, 8.5, 'shield', '#c8a165', { shield: 0.18 });
  M('earthquake', 'Földrengés', 'slam', 44, 8.5, 'rock', '#c8a165', { eff: [E('stun', 0.35, 1)] });
  M('landslide', 'Hegyomlás', 'slam', 90, 0, 'rock', '#c8a165', { super: true });

  // ---------- Gonoszok ----------
  M('spider_legs', 'Pókláb', 'melee', 9, 2, 'claw', '#b0b8c4');
  M('gadget_bomb', 'Kütyü-bomba', 'shot', 21, 4.4, 'bomb', '#ff6b35', { eff: [E('burn', 0.3, 3)] });
  M('mega_laser', 'Mega lézer', 'beam', 34, 8, 'laser', '#ff4f4f');
  M('gadget_armada', 'Kütyü-armada', 'multi', 72, 0, 'rocket', '#b0b8c4', { super: true, hits: 5 });

  M('mammoth_punch', 'Mamut-ütés', 'melee', 12, 2.6, 'punch', '#e85d04');
  M('mammoth_charge', 'Roham', 'melee', 24, 5, 'punch', '#e85d04', { eff: [E('stun', 0.25, 0.9)] });
  M('ground_pound', 'Talajcsapás', 'slam', 40, 8.5, 'rock', '#8b5a2b');
  M('avalanche', 'Mamut-lavina', 'slam', 84, 0, 'rock', '#8b5a2b', { super: true, eff: [E('stun', 1, 1.2)] });

  M('hex_bolt', 'Rontás', 'shot', 11, 2.2, 'hex', '#ff4fa3', { eff: [E('weak', 0.25, 3)] });
  M('bad_luck', 'Balszerencse', 'shot', 18, 4.5, 'hex', '#ff4fa3', { eff: [E('mark', 0.8, 4)] });
  M('hex_wave', 'Rontás-hullám', 'beam', 36, 7.8, 'hex', '#ff4fa3');
  M('jinx_storm', 'Pech-vihar', 'multi', 76, 0, 'hex', '#ff4fa3', { super: true, hits: 5, eff: [E('weak', 1, 5)] });

  M('eye_ray', 'Szem-sugár', 'beam', 10, 2.2, 'laser', '#ff4f4f');
  M('eye_bubble', 'Szem-buborék', 'self', 0, 8, 'shield', '#ff9e9e', { shield: 0.15 });
  M('xray', 'Röntgen', 'shot', 34, 8, 'orb', '#ff4f4f', { eff: [E('mark', 0.7, 4)] });
  M('giant_eye', 'Óriás szem', 'beam', 74, 0, 'laser', '#ff4f4f', { super: true, eff: [E('stun', 1, 1.2)] });

  M('clone_punch', 'Klón-ütés', 'multi', 10, 2, 'punch', '#ff4f4f', { hits: 2, melee: true });
  M('clone_pile', 'Klónkupac', 'slam', 24, 4.6, 'punch', '#ff4f4f');
  M('billy_army', 'Billy-sereg', 'multi', 38, 8, 'punch', '#ff4f4f', { hits: 4, melee: true });
  M('million_billy', 'Milliónyi Billy', 'multi', 76, 0, 'punch', '#ff4f4f', { super: true, hits: 8, melee: true });

  M('remote_zap', 'Távirányító', 'shot', 10, 2.2, 'orb', '#ffd23f', { eff: [E('stun', 0.15, 0.7)] });
  M('rewind', 'Visszatekerés', 'self', 0, 10, 'heal', '#9bffef', { heal: 0.18 });
  M('channel_surf', 'Csatornaváltás', 'beam', 36, 8, 'laser', '#c06bff', { eff: [E('weak', 0.5, 4)] });
  M('superfan', 'Szuperfan sugár', 'beam', 76, 0, 'laser', '#c06bff', { super: true, eff: [E('slow', 1, 5)] });

  M('wand_zap', 'Varázspálca', 'shot', 11, 2.3, 'magic', '#ffd23f');
  M('rabbit', 'Nyúl a kalapból', 'shot', 20, 4.4, 'rabbit', '#ffffff', { eff: [E('weak', 0.35, 4)] });
  M('card_storm', 'Kártyavihar', 'multi', 36, 8, 'card', '#ff4f4f', { hits: 4 });
  M('mumbo_jumbo', 'Mumbo Jumbo!', 'beam', 70, 0, 'magic', '#ffd23f', { super: true, eff: [E('stun', 1, 1.5)] });

  M('flash', 'Vaku', 'shot', 10, 2.2, 'orb', '#fff6a0', { eff: [E('slow', 0.2, 2.5)] });
  M('light_beam', 'Fénysugár', 'beam', 24, 5, 'laser', '#fff6a0');
  M('solar_flare', 'Napkitörés', 'beam', 38, 8, 'fire', '#ffb300', { eff: [E('burn', 0.3, 3)] });
  M('light_burst', 'Fényrobbanás', 'beam', 76, 0, 'laser', '#fff6a0', { super: true, eff: [E('stun', 1, 1)] });

  M('scratch', 'Karmolás', 'melee', 9, 1.8, 'claw', '#ff9ecd');
  M('tantrum', 'Hiszti', 'self', 0, 5.5, 'buff', '#ff4fa3', { eff: [E('atkUp', 1, 6, { self: true })] });
  M('moth_rush', 'Molyroham', 'multi', 38, 8, 'moth', '#d4c1a1', { hits: 4 });
  M('princess_tantrum', 'Hercegnő-hiszti', 'multi', 72, 0, 'claw', '#ff4fa3', { super: true, hits: 6, melee: true });

  M('slab_punch', 'Betonütés', 'melee', 14, 2.8, 'punch', '#9aa5b1');
  M('brick_rain', 'Téglazápor', 'multi', 26, 5.2, 'brick', '#b5523b', { hits: 3 });
  M('rubble', 'Romhalmaz', 'slam', 46, 9.5, 'rock', '#9aa5b1', { eff: [E('stun', 0.35, 1)] });
  M('concrete_crush', 'Betonzúzás', 'slam', 92, 0, 'rock', '#9aa5b1', { super: true });

  M('goo', 'Trutyi', 'shot', 12, 2.5, 'blob', '#c45ab3', { eff: [E('slow', 0.3, 3)] });
  M('absorb', 'Elnyelés', 'self', 0, 10, 'heal', '#c45ab3', { heal: 0.12 });
  M('sludge', 'Iszapár', 'beam', 38, 9.5, 'blob', '#7bd65b', { eff: [E('poison', 0.4, 4)] });
  M('goo_sea', 'Trutyi-tenger', 'slam', 88, 0, 'blob', '#c45ab3', { super: true, eff: [E('poison', 1, 5)] });

  M('nibble', 'Rágcsálás', 'melee', 9, 2.2, 'claw', '#f0e6ff');
  M('cute_look', 'Cuki pillantás', 'shot', 8, 4, 'heart', '#ff9ecd', { eff: [E('weak', 1, 4)] });
  M('silk_spit', 'Selyemköpés', 'shot', 34, 7.6, 'blob', '#f0e6ff', { eff: [E('slow', 0.5, 3)] });
  M('giant_silkie', 'Óriás Silkie', 'slam', 74, 0, 'rock', '#f0e6ff', { super: true, eff: [E('stun', 1, 1.2)] });

  M('blood_bolt', 'Vérvillám', 'shot', 13, 2.4, 'magic', '#d62828');
  M('mind_control', 'Elmeirányítás', 'shot', 16, 5, 'hex', '#c06bff', { eff: [E('stun', 0.45, 1.1)] });
  M('chant', 'Kántálás', 'self', 0, 7, 'buff', '#d62828', { eff: [E('atkUp', 1, 5, { self: true }), E('regen', 1, 5, { self: true })] });
  M('hive_judgement', 'A H.I.V.E. ítélete', 'beam', 86, 0, 'magic', '#d62828', { super: true, eff: [E('weak', 1, 5)] });

  M('staff_strike', 'Bot-ütés', 'melee', 14, 2.2, 'staff', '#c97b30');
  M('smoke_grenade', 'Füstgránát', 'shot', 18, 4.4, 'smoke', '#6c757d', { eff: [E('slow', 0.5, 3.5)] });
  M('master_combo', 'Mester-kombó', 'multi', 46, 8, 'punch', '#c97b30', { hits: 3, melee: true });
  M('true_evil', 'Az igazi gonosz', 'multi', 94, 0, 'slash', '#c97b30', { super: true, hits: 5, melee: true, eff: [E('stun', 1, 1)] });

  M('fire_eyes', 'Tűzszem', 'beam', 14, 2.4, 'fire', '#ff6b35', { eff: [E('burn', 0.3, 3)] });
  M('demon_hand', 'Démonkéz', 'slam', 28, 5, 'fire', '#c1121f', { eff: [E('stun', 0.3, 1)] });
  M('hellfire', 'Pokoltűz', 'beam', 48, 9, 'fire', '#ff6b35', { eff: [E('burn', 0.6, 4)] });
  M('four_eyes_wrath', 'Négy szem haragja', 'beam', 100, 0, 'fire', '#ff3b3b', { super: true, eff: [E('burn', 1, 5)] });

  M('pie', 'Pite', 'shot', 12, 2.3, 'pie', '#e0a060', { eff: [E('slow', 0.3, 3)] });
  M('hypnosis', 'Hipnózis', 'shot', 16, 5, 'hex', '#c06bff', { eff: [E('stun', 0.5, 1.1)] });
  M('wooden_spoon', 'Fakanál', 'melee', 40, 8, 'staff', '#c58940');
  M('mothers_love', 'Mami szeretete', 'beam', 78, 0, 'heart', '#ff9ecd', { super: true, eff: [E('weak', 1, 5)] });

  M('dark_star', 'Sötét csillag', 'shot', 13, 2.2, 'star', '#c06bff');
  M('jealousy', 'Féltékenység', 'self', 0, 6, 'buff', '#c06bff', { eff: [E('atkUp', 1, 6, { self: true })] });
  M('black_nova', 'Fekete nova', 'beam', 44, 8, 'star', '#8e3fd6', { eff: [E('burn', 0.4, 3)] });
  M('queen_tamaran', 'Tamaran királynője', 'multi', 86, 0, 'star', '#c06bff', { super: true, hits: 6 });

  // ---------- Azarath Ravenje ----------
  M('soul_bird', 'Lélekmadár', 'shot', 13, 2.3, 'magic', '#c06bff', { eff: [E('mark', 0.25, 4)] });
  M('azarath_veil', 'Azarath fátyla', 'self', 0, 8.5, 'shield', '#ffd23f', { shield: 0.16, eff: [E('regen', 1, 5, { self: true })] });
  M('azarath_storm', 'Azarath vihara', 'multi', 42, 8.4, 'magic', '#ffd23f', { hits: 3, eff: [E('weak', 0.4, 4)] });
  M('metrion_zinthos', 'Metrion Zinthos!', 'beam', 104, 0, 'magic', '#ffe066', { super: true, eff: [E('stun', 1, 1.3), E('burn', 1, 4)] });

  // ---------- Vendégek: Mad Mod, Killer Moth, Larry ----------
  M('mod_cane', 'Sétapálca', 'melee', 12, 2.3, 'staff', '#d62828');
  M('hypno_spiral', 'Hipnospirál', 'beam', 20, 4.6, 'hex', '#f4f4f8', { eff: [E('stun', 0.35, 1)] });
  M('swinging_sixties', 'Hatvanas lendület', 'multi', 38, 8, 'sonic', '#3f6fd8', { hits: 3, eff: [E('weak', 0.3, 4)] });
  M('mod_tv', 'Mod-televízió', 'beam', 80, 0, 'hex', '#d62828', { super: true, eff: [E('stun', 1, 1.3)] });

  M('moth_dust', 'Molypor', 'shot', 11, 2.2, 'smoke', '#c9b6e4', { eff: [E('poison', 0.3, 3)] });
  M('wing_gust', 'Szárnycsapás', 'beam', 18, 4.4, 'wind', '#9b7fd6', { eff: [E('slow', 0.5, 3)] });
  M('moth_dive', 'Zuhanórepülés', 'melee', 38, 8, 'kick', '#7a4fb8');
  M('moth_swarm', 'Molyraj', 'multi', 84, 0, 'claw', '#c9b6e4', { super: true, hits: 6, eff: [E('poison', 1, 4)] });

  M('tiny_jab', 'Pici bökés', 'melee', 11, 2, 'punch', '#2f9e44');
  M('larry_laugh', 'Larry-kacaj', 'shot', 18, 4.5, 'magic', '#ffd23f', { eff: [E('weak', 0.5, 4)] });
  M('mirror_kick', 'Tükörrúgás', 'melee', 38, 8, 'kick', '#d62828', { eff: [E('mark', 0.4, 4)] });
  M('fifth_dimension', 'Ötödik dimenzió', 'beam', 92, 0, 'magic', '#ff9ecd', { super: true, eff: [E('stun', 1, 1.2), E('weak', 1, 4)] });

  // ---------- Teeny Titans 3: a Menta-banda ----------
  M('tape_shot', 'Ragasztószalag', 'shot', 10, 2.3, 'tape', '#c8a165', { eff: [E('slow', 0.2, 2.5)] });
  M('barcode_scan', 'Vonalkód-szkenner', 'beam', 20, 4.5, 'laser', '#ff4f4f', { eff: [E('mark', 0.6, 4)] });
  M('stamp', 'Bélyegző', 'slam', 36, 8.5, 'stamp', '#7fe0b5');
  M('warehouse_lock', 'Raktárzár', 'slam', 72, 0, 'box', '#7fe0b5', { super: true, eff: [E('stun', 1, 1.2)] });

  M('box_punch', 'Doboz-ütés', 'melee', 12, 2.5, 'punch', '#c8a165');
  M('packing_peanuts', 'Hungarocell-zápor', 'multi', 24, 5, 'peanut', '#fffbe6', { hits: 3 });
  M('box_trap', 'Dobozcsapda', 'shot', 30, 8, 'box', '#c8a165', { eff: [E('stun', 0.5, 1.4)] });
  M('big_unboxing', 'Nagy Kicsomagolás', 'slam', 82, 0, 'box', '#c8a165', { super: true });

  M('wrap', 'Fóliázás', 'shot', 12, 2.2, 'bubble', '#b8f0ff', { eff: [E('slow', 0.3, 3)] });
  M('bubble_pop', 'Buborékpukkasztás', 'multi', 24, 4.8, 'bubble', '#b8f0ff', { hits: 4 });
  M('vacuum_pack', 'Vákuumcsomag', 'beam', 42, 8, 'wind', '#b8f0ff', { eff: [E('stun', 0.3, 1.1)] });
  M('factory_sealed', 'Gyárilag bontatlan', 'beam', 84, 0, 'bubble', '#b8f0ff', { super: true, eff: [E('stun', 1, 1.5)] });

  M('price_tag', 'Árcédula', 'shot', 14, 2.2, 'card', '#7fe0b5', { eff: [E('mark', 0.4, 4)] });
  M('appraisal', 'Értékbecslés', 'self', 0, 8, 'buff', '#7fe0b5', { shield: 0.1, eff: [E('atkUp', 1, 6, { self: true })] });
  M('mint_box', 'Bontatlan doboz', 'shot', 40, 8.5, 'box', '#7fe0b5', { eff: [E('stun', 0.5, 1.5)] });
  M('collectors_edition', 'Gyűjtői Kiadás', 'beam', 100, 0, 'coin', '#7fe0b5', { super: true, eff: [E('stun', 1, 1.5), E('weak', 1, 5)] });

  // ---------- Arany Silkie (mellékküldetés jutalma) ----------
  M('golden_nibble', 'Arany rágcsálás', 'melee', 12, 2.0, 'claw', '#ffd23f');
  M('golden_cocoon', 'Arany gubó', 'self', 0, 9, 'shield', '#ffd23f', { shield: 0.16, eff: [E('regen', 1, 5, { self: true })] });
  M('golden_giant', 'Arany óriás', 'slam', 90, 0, 'rock', '#ffd23f', { super: true, eff: [E('stun', 1, 1.3)] });

  // ---------- Testvériség és új változatok ----------
  M('x_shuriken', 'X-shuriken', 'multi', 13, 2.2, 'shuriken', '#d62828', { hits: 3 });
  M('teleport_strike', 'Teleport-csapás', 'melee', 26, 4.5, 'slash', '#d62828', { crit: 0.3 });
  M('x_trap', 'X-csapda', 'shot', 36, 8, 'orb', '#d62828', { eff: [E('stun', 0.4, 1.1)] });
  M('red_x_plosion', 'Red X-plózió', 'multi', 88, 0, 'slash', '#d62828', { super: true, hits: 6, melee: true });

  M('brain_wave', 'Agyhullám', 'beam', 12, 2.4, 'hex', '#ff9ecd', { eff: [E('weak', 0.3, 3)] });
  M('mind_blast', 'Elmeroham', 'shot', 22, 4.8, 'magic', '#ff9ecd', { eff: [E('stun', 0.3, 1)] });
  M('robot_slam', 'Robotcsapás', 'slam', 40, 8.5, 'rock', '#9aa5b1');
  M('genius_plan', 'Zseniális terv', 'beam', 88, 0, 'hex', '#ff9ecd', { super: true, eff: [E('stun', 1, 1.3)] });

  M('gorilla_punch', 'Gorilla-ütés', 'melee', 12, 2.5, 'punch', '#5a4a3a');
  M('beret_toss', 'Svájcisapka-dobás', 'shot', 20, 4.5, 'card', '#d62828', { eff: [E('weak', 0.3, 3)] });
  M('jungle_rage', 'Dzsungeldüh', 'slam', 40, 8.5, 'rock', '#5a4a3a');
  M('french_fury', 'Francia düh', 'multi', 82, 0, 'punch', '#d62828', { super: true, hits: 4, melee: true });

  M('stretch_whip', 'Nyúló ostor', 'melee', 12, 2.2, 'wave', '#c1121f');
  M('shape_shift', 'Alakváltás', 'self', 0, 7, 'buff', '#c1121f', { eff: [E('atkUp', 1, 5, { self: true }), E('defUp', 1, 5, { self: true })] });
  M('elastic_slam', 'Gumicsapás', 'slam', 40, 8, 'wave', '#c1121f');
  M('rubber_chaos', 'Gumi-káosz', 'multi', 84, 0, 'wave', '#c1121f', { super: true, hits: 5, melee: true });

  M('shadow_hop', 'Árnyékugrás', 'melee', 11, 2.2, 'slash', '#5a3a8a');
  M('dark_cape', 'Sötét köpeny', 'shot', 20, 4.6, 'smoke', '#3a2a5a', { eff: [E('slow', 0.5, 3)] });
  M('nightmare', 'Lidércnyomás', 'beam', 36, 8, 'hex', '#8e5cff', { eff: [E('stun', 0.3, 1)] });
  M('shadow_trap', 'Árnyékcsapda', 'beam', 76, 0, 'hex', '#8e5cff', { super: true, eff: [E('stun', 1, 1.3)] });

  M('lightning_bolt', 'Villámcsapás', 'beam', 12, 2.2, 'lightning', '#ffd23f');
  M('thunder_clap', 'Mennydörgés', 'slam', 24, 4.5, 'sonic', '#3f6fd8', { eff: [E('stun', 0.3, 0.9)] });
  M('storm_front', 'Viharfront', 'multi', 36, 8, 'lightning', '#ffd23f', { hits: 4 });
  M('sky_rumble', 'Égzengés', 'beam', 86, 0, 'lightning', '#ffd23f', { super: true, eff: [E('stun', 1, 1.1)] });

  M('hot_pudding', 'Forró puding', 'shot', 12, 2.3, 'blob', '#c06bff', { eff: [E('burn', 0.3, 3)] });
  M('taste_test', 'Kóstoló', 'self', 0, 9.5, 'heal', '#ffd23f', { heal: 0.14 });
  M('pudding_wave', 'Pudingcunami', 'beam', 34, 8, 'blob', '#c06bff', { eff: [E('slow', 0.5, 3)] });
  M('tamaran_feast', 'Tamarani lakoma', 'beam', 74, 0, 'heart', '#ff9ecd', { super: true, eff: [E('weak', 1, 5)] });

  M('cutlass', 'Kardvágás', 'melee', 11, 2.2, 'slash', '#c0c0c0');
  M('cannonball', 'Ágyúgolyó', 'shot', 24, 5, 'bomb', '#2a2a36', { eff: [E('burn', 0.3, 3)] });
  M('plank_kick', 'Pallórúgás', 'melee', 38, 8, 'kick', '#8b5a2b');
  M('boarding', 'Fedélzeti roham', 'multi', 78, 0, 'slash', '#c0c0c0', { super: true, hits: 4, melee: true });

  // ---------- Szezonális figurák ----------
  M('bat_swarm', 'Denevérraj', 'multi', 12, 2.3, 'moth', '#3a2a5a', { hits: 3 });
  M('blood_moon', 'Vérhold', 'self', 0, 7, 'buff', '#c1121f', { eff: [E('atkUp', 1, 5, { self: true }), E('regen', 1, 5, { self: true })] });
  M('night_bite', 'Éjféli harapás', 'melee', 40, 8, 'claw', '#c1121f', { eff: [E('weak', 0.4, 4)] });
  M('dracula_robin', 'Drakula-Robin', 'multi', 86, 0, 'slash', '#c1121f', { super: true, hits: 5, melee: true });
  M('antler_charge', 'Agancsroham', 'melee', 12, 2.2, 'punch', '#8b5a2b');
  M('snowball', 'Hógolyó', 'shot', 22, 4.5, 'orb', '#ffffff', { eff: [E('slow', 0.4, 3)] });
  M('sleigh_dash', 'Szánkóroham', 'melee', 40, 7.8, 'kick', '#d62828');
  M('sleigh_ride', 'Rénszarvas-roham', 'multi', 84, 0, 'punch', '#d62828', { super: true, hits: 6, melee: true });

  // ---------- Radikális sorozat (legendás) ----------
  M('rad_birdarangs', 'Radikális madárrangok', 'multi', 12, 2.3, 'bird', '#ff2e86', { hits: 3 });
  M('staff_jump', 'Botugrás', 'slam', 26, 5, 'staff', '#ff2e86', { eff: [E('stun', 0.3, 0.9)] });
  M('eagle_strike', 'Sas-csapás', 'multi', 86, 0, 'bird', '#ff2e86', { super: true, hits: 5, eff: [E('mark', 1, 5)] });
  M('dark_crystals', 'Sötét kristályok', 'multi', 12, 2.4, 'magic', '#b04cff', { hits: 3 });
  M('chain_root', 'Árnyláncok', 'beam', 30, 6, 'magic', '#7a2cff', { eff: [E('slow', 0.8, 4), E('stun', 0.3, 1)] });
  M('minion_swarm', 'Démoncsatlósok', 'multi', 88, 0, 'magic', '#b04cff', { super: true, hits: 6, eff: [E('weak', 1, 5)] });
  M('multi_blast', 'Csillagsorozat', 'multi', 13, 2.4, 'star', '#ff2e86', { hits: 4 });
  M('healing_guitar', 'Gyógyító gitárszóló', 'self', 0, 9, 'note', '#ff9ecd', { heal: 0.18, eff: [E('regen', 1, 4, { self: true })] });
  M('radical_nova', 'Radikális nóva', 'beam', 90, 0, 'star', '#ff2e86', { super: true, eff: [E('burn', 1, 4)] });
  M('rad_claws', 'Punk karmok', 'melee', 13, 2.2, 'claw', '#7bd65b');
  M('ice_guitar', 'Jeges gitár', 'beam', 28, 5.5, 'sonic', '#7fd3ff', { eff: [E('slow', 0.7, 4)] });
  M('rad_eagle', 'Rocksas', 'multi', 86, 0, 'bird', '#7bd65b', { super: true, hits: 5, melee: true });
  M('electric_sword', 'Villámkard', 'melee', 14, 2.4, 'lightning', '#ff4fd8');
  M('battery_drain', 'Elemszívás', 'beam', 26, 5.5, 'lightning', '#ffe066', { eff: [E('weak', 0.6, 4)] });
  M('rad_shield', 'Neonpajzs', 'self', 0, 8, 'shield', '#ff4fd8', { shield: 0.2 });
  M('overcharge', 'Túltöltés', 'beam', 92, 0, 'lightning', '#ff4fd8', { super: true, eff: [E('stun', 1, 1.2)] });
  M('beatbox', 'Beatbox', 'shot', 11, 2.2, 'note', '#5fe0c8');
  M('rad_burp', 'Radikális böfi', 'beam', 26, 5.5, 'blob', '#5fe0c8', { eff: [E('poison', 0.5, 4)] });
  M('beatbox_bomb', 'Beatbox-bomba', 'slam', 86, 0, 'note', '#5fe0c8', { super: true, eff: [E('stun', 1, 1.3)] });

  // ---------- Különleges TT2-változatok ----------
  M('cat_scratch', 'Macskakarom', 'melee', 12, 1.9, 'claw', '#7bd65b');
  M('waffle_toss', 'Gofridobás', 'shot', 27, 4.5, 'pie', '#e8b04b', { eff: [E('slow', 0.35, 3)] });
  M('nine_lives', 'Kilenc élet', 'multi', 78, 0, 'claw', '#7bd65b', { super: true, hits: 6, melee: true, eff: [E('regen', 1, 5, { self: true })] });
  M('martian_beam', 'Marsi sugár', 'beam', 27, 5.5, 'laser', '#4fd36b', { eff: [E('weak', 0.4, 4)] });
  M('martian_morph', 'Marsi átváltozás', 'slam', 80, 0, 'rock', '#4fd36b', { super: true, eff: [E('stun', 1, 1.2)] });
  M('bubble_trap', 'Buborékcsapda', 'shot', 20, 4.6, 'bubble', '#7fd3ff', { eff: [E('stun', 0.3, 1)] });
  M('whale_drop', 'Bálnazuhanás', 'slam', 82, 0, 'wave', '#4fc3f7', { super: true, eff: [E('slow', 1, 4)] });
  M('super_dash', 'Szuperroham', 'melee', 38, 7.8, 'kick', '#b04cff');
  M('dark_bolt', 'Sötét csillaglövés', 'shot', 13, 2.3, 'star', '#b04cff', { eff: [E('burn', 0.25, 3)] });
  M('terrible_glare', 'Rettenetes tekintet', 'beam', 92, 0, 'laser', '#b04cff', { super: true, eff: [E('burn', 1, 4), E('weak', 1, 4)] });
  M('robo_drain', 'Robot-elemszívás', 'beam', 26, 5.5, 'lightning', '#ff3b3b', { eff: [E('slow', 0.5, 3)] });
  M('poison_pellet', 'Mérgező golyó', 'shot', 20, 4.4, 'smoke', '#7bd65b', { eff: [E('poison', 0.6, 4)] });
  M('wing_rangs', 'Szárnyas rangok', 'multi', 13, 2.4, 'shuriken', '#3fa7ff', { hits: 3 });
  M('night_flight', 'Éjszakai repülés', 'multi', 90, 0, 'kick', '#3fa7ff', { super: true, hits: 5, melee: true, eff: [E('mark', 1, 5)] });

  // ---------- DC vendégek (Teeny Titans 2) ----------
  M('bat_mine', 'Denevér-akna', 'slam', 26, 5.2, 'bomb', '#ff3b3b', { eff: [E('stun', 0.3, 0.9)] });
  M('counter_strike', 'Ellencsapás', 'melee', 13, 2.3, 'punch', '#ff3b3b');
  M('batarang_volley', 'Batarang-sorozat', 'multi', 14, 2.6, 'shuriken', '#ff3b3b', { hits: 3 });
  M('future_knight', 'A jövő lovagja', 'multi', 90, 0, 'punch', '#ff3b3b', { super: true, hits: 6, melee: true, eff: [E('mark', 1, 5)] });
  M('charged_rang', 'Feltöltött batarang', 'shot', 22, 4.5, 'bird', '#ffd23f', { eff: [E('stun', 0.3, 1)] });
  M('grapple_kick', 'Csáklya-rúgás', 'melee', 36, 7.6, 'kick', '#8e44ad');
  M('bat_storm', 'Denevérvihar', 'multi', 82, 0, 'bird', '#ffd23f', { super: true, hits: 5 });
  M('super_punch', 'Szuperütés', 'melee', 15, 2.4, 'punch', '#3f6fd8');
  M('heat_vision', 'Hősugár', 'beam', 30, 6, 'laser', '#ff3b3b', { eff: [E('burn', 0.6, 3)] });
  M('super_breath', 'Fagyos lehelet', 'beam', 24, 5.5, 'wind', '#9be7ff', { eff: [E('slow', 0.8, 4)] });
  M('man_of_steel', 'Az acélember', 'beam', 94, 0, 'laser', '#ff3b3b', { super: true, eff: [E('burn', 1, 4)] });
  M('lasso_truth', 'Az igazság lasszója', 'shot', 22, 4.6, 'lasso', '#ffd23f', { eff: [E('stun', 0.45, 1.1)] });
  M('bracelet_block', 'Karperec-hárítás', 'self', 0, 7.5, 'shield', '#c0c0c0', { shield: 0.22 });
  M('amazon_combo', 'Amazon-kombó', 'multi', 13, 2.4, 'punch', '#d62828', { hits: 3, melee: true });
  M('themyscira_fury', 'Themyscira dühe', 'multi', 90, 0, 'slash', '#ffd23f', { super: true, hits: 6, melee: true, eff: [E('atkUp', 1, 5, { self: true })] });
  M('chatter_teeth', 'Vacogó műfogsor', 'shot', 13, 2.4, 'bomb', '#f4f4f8', { eff: [E('weak', 0.3, 3)] });
  M('joker_hammer', 'Óriáskalapács', 'slam', 38, 8, 'rock', '#7a3fb0', { eff: [E('stun', 0.4, 1)] });
  M('joker_laugh', 'Gonosz kacaj', 'shot', 18, 4.4, 'hex', '#4fd36b', { eff: [E('weak', 0.6, 4)] });
  M('punchline', 'A poén', 'multi', 88, 0, 'hex', '#4fd36b', { super: true, hits: 5, eff: [E('poison', 1, 4)] });
  M('mallet', 'Kalapácsütés', 'melee', 14, 2.3, 'punch', '#d62828');
  M('harley_bomb', 'Harley-bomba', 'shot', 24, 5, 'bomb', '#1d1d2b', { eff: [E('burn', 0.4, 3)] });
  M('harley_kiss', 'Puszi', 'shot', 18, 4.2, 'heart', '#ff4f81', { eff: [E('stun', 0.4, 1)] });
  M('mallet_mayhem', 'Kalapács-káosz', 'slam', 84, 0, 'rock', '#d62828', { super: true, eff: [E('stun', 1, 1.2)] });

  // ---------- DC gonoszok (Teeny Titans 2) ----------
  M('multi_gun', 'Multifegyver', 'multi', 13, 2.4, 'laser', '#4fd36b', { hits: 3 });
  M('krypto_beam', 'Kriptonit-sugár', 'beam', 30, 6.2, 'laser', '#4fd36b', { eff: [E('weak', 0.6, 4)] });
  M('rocket_boots', 'Rakétacsizma', 'melee', 36, 7.8, 'rocket', '#9aa5b1');
  M('lexbot_army', 'Lexbot-sereg', 'multi', 92, 0, 'rocket', '#4fd36b', { super: true, hits: 5, eff: [E('mark', 1, 5)] });
  M('apokolips_punch', 'Apokolipsz-ütés', 'melee', 15, 2.5, 'punch', '#6b6b7a');
  M('omega_beams', 'Omega-sugár', 'beam', 34, 6.8, 'laser', '#ff3b3b', { eff: [E('burn', 0.6, 3)] });
  M('dark_glare', 'Zord tekintet', 'shot', 18, 4.6, 'hex', '#ff3b3b', { eff: [E('slow', 0.6, 3)] });
  M('anti_life', 'Életellenes egyenlet', 'beam', 96, 0, 'laser', '#ff3b3b', { super: true, eff: [E('stun', 1, 1.3)] });
  M('question_cane', 'Kérdőjel-bot', 'melee', 15, 2.2, 'staff', '#4fd36b');
  M('riddle_hack', 'Rejtvény-hack', 'shot', 24, 4.4, 'card', '#4fd36b', { eff: [E('stun', 0.35, 1)] });
  M('lucky_guess', 'Szerencsés tipp', 'self', 0, 6.5, 'buff', '#4fd36b', { eff: [E('atkUp', 1, 6, { self: true })] });
  M('riddle_me_this', 'Fejtsd meg!', 'multi', 84, 0, 'card', '#4fd36b', { super: true, hits: 5, eff: [E('weak', 1, 5)] });
  M('umbrella_gun', 'Esernyő-puska', 'shot', 12, 2.3, 'bomb', '#1d1d2b');
  M('fish_toss', 'Halhajítás', 'shot', 22, 4.6, 'fish', '#7fd3ff', { eff: [E('slow', 0.5, 3)] });
  M('freeze_umbrella', 'Fagyasztó esernyő', 'beam', 30, 7, 'wind', '#9be7ff', { eff: [E('slow', 0.8, 4)] });
  M('penguin_army', 'Pingvin-sereg', 'multi', 84, 0, 'fish', '#1d1d2b', { super: true, hits: 5, eff: [E('slow', 1, 4)] });
  M('vine_lash', 'Indacsapás', 'melee', 13, 2.3, 'slash', '#4fd36b');
  M('spore_cloud', 'Spórafelhő', 'shot', 18, 4.4, 'smoke', '#7bd65b', { eff: [E('poison', 0.45, 4)] });
  M('ivy_kiss', 'Mérgező csók', 'shot', 22, 5, 'heart', '#4fd36b', { eff: [E('stun', 0.4, 1)] });
  M('jungle_rage', 'Dzsungel haragja', 'slam', 84, 0, 'rock', '#4fd36b', { super: true, eff: [E('poison', 1, 5)] });
  M('venom_punch', 'Venom-ütés', 'melee', 17, 2.4, 'punch', '#7bd65b');
  M('back_breaker', 'Gerinctörő', 'slam', 38, 8, 'rock', '#6b6b7a', { eff: [E('stun', 0.45, 1.1)] });
  M('venom_boost', 'Venom-adag', 'self', 0, 7, 'buff', '#7bd65b', { eff: [E('atkUp', 1, 6, { self: true })] });
  M('venom_rampage', 'Venom-tombolás', 'multi', 88, 0, 'punch', '#7bd65b', { super: true, hits: 4, melee: true, eff: [E('atkUp', 1, 5, { self: true })] });

  // ---------- DC hősök (Teeny Titans 2) ----------
  M('speed_punches', 'Villámököl-sorozat', 'multi', 16, 2.2, 'punch', '#ffd23f', { hits: 3, melee: true });
  M('lightning_dash', 'Villámroham', 'melee', 40, 7.2, 'lightning', '#ffd23f', { eff: [E('stun', 0.3, 0.9)] });
  M('speed_vortex', 'Forgószél', 'shot', 24, 4.4, 'wind', '#ffe066', { eff: [E('slow', 0.6, 3)] });
  M('speed_force', 'Sebességerő', 'multi', 90, 0, 'lightning', '#ffd23f', { super: true, hits: 6, melee: true, eff: [E('haste', 1, 5, { self: true })] });
  M('trident_strike', 'Szigonydöfés', 'melee', 15, 2.4, 'slash', '#ffc93c');
  M('tidal_wave', 'Szökőár', 'slam', 36, 8, 'wave', '#4fc3f7', { eff: [E('slow', 0.6, 4)] });
  M('bubble_guard', 'Buborékpajzs', 'self', 0, 8, 'shield', '#7fd3ff', { shield: 0.14 });
  M('king_of_seas', 'A tenger királya', 'slam', 92, 0, 'wave', '#4fc3f7', { super: true, eff: [E('stun', 1, 1.2)] });
  M('kara_punch', 'Kryptoni ütés', 'melee', 14, 2.3, 'punch', '#3f6fd8');
  M('freeze_breath', 'Jeges lehelet', 'beam', 24, 5.5, 'wind', '#9be7ff', { eff: [E('slow', 0.8, 4)] });
  M('laser_eyes', 'Lézerszem', 'beam', 28, 6, 'laser', '#ff3b3b', { eff: [E('burn', 0.6, 3)] });
  M('krypton_comet', 'Kryptoni üstökös', 'multi', 86, 0, 'punch', '#3f6fd8', { super: true, hits: 5, melee: true, eff: [E('mark', 1, 5)] });
  M('thunder_punch', 'Mennydörgő ütés', 'melee', 15, 2.4, 'punch', '#ffd23f');
  M('magic_lightning', 'Varázsvillám', 'beam', 28, 6, 'lightning', '#ffe066', { eff: [E('stun', 0.3, 1)] });
  M('bulletproof', 'Golyóálló', 'self', 0, 8, 'shield', '#d62828', { shield: 0.14 });
  M('shazam_bolt', 'SHAZAM!', 'beam', 88, 0, 'lightning', '#ffd23f', { super: true, eff: [E('stun', 1, 1.2)] });
  M('mind_blast', 'Elmecsapás', 'shot', 20, 4.4, 'hex', '#4fd36b', { eff: [E('weak', 0.6, 4)] });
  M('phase_punch', 'Fázisütés', 'melee', 15, 2.4, 'punch', '#3fa34d');
  M('shape_shift', 'Alakváltás', 'self', 0, 6.5, 'buff', '#4fd36b', { eff: [E('atkUp', 1, 6, { self: true })] });
  M('martian_vision', 'Marsi látás', 'beam', 86, 0, 'laser', '#ff9a3c', { super: true, eff: [E('burn', 1, 4)] });
  M('mace_swing', 'Buzogánycsapás', 'melee', 17, 2.1, 'punch', '#c0c0c0');
  M('electric_mace', 'Villámbuzogány', 'melee', 41, 7.4, 'lightning', '#ffe066', { eff: [E('stun', 0.35, 1)] });
  M('feather_storm', 'Tollvihar', 'multi', 16, 2.6, 'bird', '#c97b30', { hits: 3 });
  M('nth_metal', 'N-fém csapás', 'multi', 86, 0, 'punch', '#ffe066', { super: true, hits: 5, melee: true, eff: [E('stun', 1, 1)] });

  // ---------- Liga-Titánok: a Titánok Igazság Ligája-jelmezben (Teeny Titans 2) ----------
  M('wr_strike', 'Azarath-csapás', 'melee', 15, 2.4, 'magic', '#8e5cff');
  M('wr_lasso', 'Sötét lasszó', 'shot', 22, 4.6, 'lasso', '#ffd23f', { eff: [E('stun', 0.45, 1.1)] });
  M('wr_bracelets', 'Varázskarperec', 'self', 0, 8, 'shield', '#c0c0c0', { shield: 0.14 });
  M('wr_amazon_magic', 'Amazon-mágia', 'beam', 90, 0, 'magic', '#d62828', { super: true, eff: [E('stun', 1, 1.2)] });
  M('sf_bolts', 'Villámnyilak', 'multi', 17, 2.2, 'star', '#ffd23f', { hits: 3 });
  M('sf_vortex', 'Csillagörvény', 'shot', 25, 4.4, 'wind', '#7bff6b', { eff: [E('slow', 0.6, 3)] });
  M('sf_dash', 'Csillagroham', 'melee', 42, 7.2, 'lightning', '#ffd23f', { eff: [E('stun', 0.3, 0.9)] });
  M('sf_supernova', 'Szupernóva', 'multi', 86, 0, 'star', '#ffd23f', { super: true, hits: 6, eff: [E('burn', 0.8, 3)] });
  M('br_rangs', 'Bat-madárrang', 'multi', 14, 2.5, 'shuriken', '#3fa7ff', { hits: 3 });
  M('br_smoke', 'Füstbomba', 'shot', 18, 4.4, 'smoke', '#9aa5b1', { eff: [E('slow', 0.7, 3)] });
  M('br_kick', 'Denevér-rúgás', 'melee', 38, 7.6, 'kick', '#1d1d2b');
  M('br_detective', 'A világ legjobb detektívje', 'multi', 86, 0, 'punch', '#3fa7ff', { super: true, hits: 5, melee: true, eff: [E('mark', 1, 5)] });
  M('gc_fist', 'Fényököl', 'melee', 15, 2.4, 'punch', '#4fd36b');
  M('gc_beam', 'Gyűrűsugár', 'beam', 30, 6.2, 'laser', '#4fd36b', { eff: [E('weak', 0.5, 4)] });
  M('gc_shield', 'Fénypajzs', 'self', 0, 8, 'shield', '#4fd36b', { shield: 0.14 });
  M('gc_oath', 'A Lámpás esküje', 'beam', 92, 0, 'laser', '#4fd36b', { super: true, eff: [E('stun', 1, 1.2)] });
  M('bw_claw', 'Vadkarom', 'melee', 15, 2.4, 'claw', '#c97b30');
  M('bw_roar', 'Dzsungelüvöltés', 'shot', 18, 4.4, 'sonic', '#ffd23f', { eff: [E('weak', 0.6, 4)] });
  M('bw_slam', 'Orrszarvú-öklelés', 'slam', 36, 8, 'rock', '#c97b30', { eff: [E('stun', 0.4, 1)] });
  M('bw_chimera', 'Kiméra-roham', 'multi', 86, 0, 'claw', '#d62828', { super: true, hits: 4, melee: true, eff: [E('atkUp', 1, 5, { self: true })] });
  M('ss_punch', 'Szuper-pacsi', 'melee', 16, 2.3, 'punch', '#d62828');
  M('ss_burp', 'Meglepetés-böfi', 'shot', 18, 4.4, 'blob', '#ff9ecd', { eff: [E('slow', 0.6, 3)] });
  M('ss_fly', 'Szuperrepülés', 'melee', 34, 7.4, 'kick', '#3f6fd8');
  M('ss_hero', 'Szuperlárva', 'multi', 82, 0, 'punch', '#3f6fd8', { super: true, hits: 4, melee: true, eff: [E('regen', 1, 5, { self: true })] });

  // ---------- DC különcök (Teeny Titans 2) ----------
  M('cw_whip', 'Ostorcsapás', 'melee', 17, 2.2, 'slash', '#6b3fa0');
  M('cw_kiss', 'Macskapuszi', 'shot', 23, 4.4, 'heart', '#ff4f81', { eff: [E('stun', 0.4, 1)] });
  M('cw_pounce', 'Macskaugrás', 'melee', 38, 7.2, 'claw', '#6b3fa0', { crit: 0.2 });
  M('cw_heist', 'Nagy rablás', 'multi', 84, 0, 'claw', '#6b3fa0', { super: true, hits: 5, melee: true, eff: [E('mark', 1, 5)] });
  M('ch_swipe', 'Karomsuhintás', 'melee', 18, 2.1, 'claw', '#f2b705');
  M('ch_hairball', 'Szőrgombóc', 'shot', 22, 4.4, 'blob', '#c97b30', { eff: [E('slow', 0.7, 3)] });
  M('ch_airstrike', 'Légiroham', 'melee', 43, 7.2, 'claw', '#f2b705', { eff: [E('stun', 0.3, 0.9)] });
  M('ch_frenzy', 'Vadászösztön', 'multi', 84, 0, 'claw', '#f2b705', { super: true, hits: 6, melee: true, eff: [E('haste', 1, 5, { self: true })] });
  M('si_axe', 'Sárga bárd', 'melee', 15, 2.4, 'slash', '#ffd23f');
  M('si_fear', 'Félelemhullám', 'shot', 20, 4.6, 'hex', '#ffd23f', { eff: [E('weak', 0.6, 4)] });
  M('si_beam', 'Sárga sugár', 'beam', 30, 6.2, 'laser', '#ffd23f', { eff: [E('burn', 0.5, 3)] });
  M('si_yellow', 'A félelem gyűrűje', 'beam', 92, 0, 'laser', '#ffd23f', { super: true, eff: [E('stun', 1, 1.2)] });
  M('gr_smash', 'Gorillacsapás', 'melee', 18, 2.5, 'punch', '#6b6b7a');
  M('gr_mind', 'Elmeirányítás', 'shot', 20, 4.6, 'hex', '#ffe066', { eff: [E('stun', 0.4, 1)] });
  M('gr_darwin', 'Evolúció', 'self', 0, 7, 'buff', '#ffe066', { eff: [E('atkUp', 1, 6, { self: true })] });
  M('gr_ape_army', 'Gorillasereg', 'multi', 90, 0, 'punch', '#6b6b7a', { super: true, hits: 5, melee: true, eff: [E('stun', 1, 1)] });
  M('bz_punch', 'Fordított ütés', 'melee', 15, 2.4, 'punch', '#3f6fd8');
  M('bz_ice', 'Fagyos lehelet', 'beam', 24, 5.5, 'wind', '#9be7ff', { eff: [E('slow', 0.8, 4)] });
  M('bz_fire', 'Tűzszem', 'beam', 28, 6, 'laser', '#ff6b35', { eff: [E('burn', 0.6, 3)] });
  M('bz_backwards', 'Fordított világ', 'multi', 84, 0, 'punch', '#3f6fd8', { super: true, hits: 5, melee: true, eff: [E('weak', 1, 5)] });
  M('sw_vine', 'Mocsárinda', 'melee', 14, 2.3, 'slash', '#6f8a3a');
  M('sw_mud', 'Sárdobás', 'shot', 18, 4.4, 'blob', '#6f8a3a', { eff: [E('slow', 0.7, 3)] });
  M('sw_regrow', 'Újranövés', 'self', 0, 9, 'heal', '#7bd65b', { heal: 0.12 });
  M('sw_green', 'A Zöld haragja', 'slam', 84, 0, 'rock', '#6f8a3a', { super: true, eff: [E('poison', 1, 5)] });

  // ---------- A Liga újoncai (Teeny Titans 2) ----------
  M('js_fist', 'Fényököl', 'melee', 15, 2.4, 'punch', '#4fd36b');
  M('js_construct', 'Óriáskalapács-konstrukció', 'slam', 36, 8, 'rock', '#4fd36b', { eff: [E('stun', 0.4, 1)] });
  M('js_shield', 'Fényfal', 'self', 0, 8.5, 'shield', '#4fd36b', { shield: 0.1 });
  M('js_willpower', 'Akaraterő', 'beam', 92, 0, 'laser', '#4fd36b', { super: true, eff: [E('stun', 1, 1.2)] });
  M('jc_gun', 'Fénygéppuska', 'multi', 15, 2.4, 'laser', '#4fd36b', { hits: 3 });
  M('jc_beam', 'Gyűrűsugár', 'beam', 28, 6, 'laser', '#4fd36b', { eff: [E('weak', 0.5, 4)] });
  M('jc_dive', 'Zuhanórepülés', 'melee', 38, 7.4, 'kick', '#4fd36b');
  M('jc_light', 'Bátorság fénye', 'beam', 86, 0, 'laser', '#4fd36b', { super: true, eff: [E('stun', 1, 1.1)] });
  M('kb_blade', 'Szkarabeusz-penge', 'melee', 15, 2.3, 'slash', '#2a6fd8');
  M('kb_cannon', 'Plazmaágyú', 'beam', 28, 6, 'laser', '#3fa7ff', { eff: [E('burn', 0.5, 3)] });
  M('kb_shield', 'Páncélpajzs', 'self', 0, 8, 'shield', '#2a6fd8', { shield: 0.14 });
  M('kb_scarab', 'A szkarabeusz ereje', 'multi', 86, 0, 'laser', '#3fa7ff', { super: true, hits: 5, eff: [E('mark', 1, 5)] });
  M('bg_punch', 'Aranyököl', 'melee', 18, 2.4, 'punch', '#ffd23f');
  M('bg_blast', 'Jövőbeli sugár', 'shot', 27, 4.5, 'laser', '#ffd23f', { eff: [E('stun', 0.3, 0.9)] });
  M('bg_kiss', 'Macsó puszi', 'self', 0, 6.5, 'heart', '#ff4f81', { eff: [E('atkUp', 1, 6, { self: true })] });
  M('bg_future', 'Időutazó csapás', 'multi', 86, 0, 'punch', '#ffd23f', { super: true, hits: 5, melee: true, eff: [E('haste', 1, 4, { self: true })] });
  M('bl_zap', 'Szikra', 'shot', 15, 2.2, 'lightning', '#7fd3ff');
  M('bl_bolt', 'Villámcsapás', 'beam', 34, 6.2, 'lightning', '#7fd3ff', { eff: [E('stun', 0.35, 1)] });
  M('bl_storm', 'Elektromos vihar', 'multi', 16, 2.8, 'lightning', '#7fd3ff', { hits: 3 });
  M('bl_thunder', 'Fekete villám', 'beam', 92, 0, 'lightning', '#7fd3ff', { super: true, eff: [E('stun', 1, 1.2)] });
  M('vx_chicken', 'Csirke-szellem', 'shot', 18, 4.2, 'peanut', '#ffd23f', { eff: [E('slow', 0.6, 3)] });
  M('vx_elephant', 'Elefánt-erő', 'slam', 38, 8, 'rock', '#9aa5b1', { eff: [E('stun', 0.4, 1)] });
  M('vx_turtle', 'Teknőspáncél', 'self', 0, 8, 'shield', '#3fa34d', { shield: 0.14 });
  M('vx_tantu', 'Tantu-totem', 'multi', 86, 0, 'claw', '#ff9a3c', { super: true, hits: 5, melee: true, eff: [E('atkUp', 1, 5, { self: true })] });

  // ---------- Vicces változatok (Teeny Titans 2) ----------
  M('bm_towel', 'Törölközőcsapás', 'melee', 17, 2.4, 'slash', '#f4f4f8');
  M('bm_soap', 'Szappancsúszda', 'shot', 20, 4.4, 'bubble', '#9be7ff', { eff: [E('slow', 0.6, 3)] });
  M('bm_ducky', 'Gumikacsa-bomba', 'slam', 40, 8, 'bomb', '#ffd23f', { eff: [E('stun', 0.4, 1)] });
  M('bm_bubblebath', 'Habfürdő', 'multi', 84, 0, 'bubble', '#9be7ff', { super: true, hits: 5, eff: [E('slow', 1, 4)] });
  M('sc_gift', 'Meglepetés-ajándék', 'shot', 26, 4.6, 'box', '#d62828', { eff: [E('stun', 0.4, 1)] });
  M('sc_snow', 'Hóvihar', 'beam', 26, 5.8, 'wind', '#f4f4f8', { eff: [E('slow', 0.8, 4)] });
  M('sc_cookie', 'Mézeskalács', 'self', 0, 9, 'heal', '#c97b30', { heal: 0.12 });
  M('sc_sleigh', 'Szánrohanás', 'multi', 90, 0, 'star', '#ffd23f', { super: true, hits: 5, eff: [E('stun', 1, 1)] });
  M('gw_bat', 'Ütő-csapás', 'melee', 16, 2.4, 'punch', '#c97b30');
  M('gw_cherry', 'Cseresznyebomba', 'shot', 22, 4.4, 'pie', '#d62828', { eff: [E('burn', 0.5, 3)] });
  M('gw_freedom', 'Szabadság!', 'self', 0, 6.5, 'buff', '#2a3fb0', { eff: [E('atkUp', 1, 6, { self: true })] });
  M('gw_independence', 'Függetlenség napja', 'multi', 86, 0, 'star', '#d62828', { super: true, hits: 5, melee: true, eff: [E('mark', 1, 5)] });
  M('sp_nibble', 'Királyi rágcsálás', 'melee', 15, 2.3, 'claw', '#ff9ecd');
  M('sp_tiara', 'Tiaravillanás', 'shot', 20, 4.2, 'heart', '#ffd23f', { eff: [E('stun', 0.4, 1)] });
  M('sp_royal', 'Királyi védelem', 'self', 0, 8, 'shield', '#c06bff', { shield: 0.12 });
  M('sp_party', 'Hercegnő-buli', 'multi', 82, 0, 'heart', '#ff9ecd', { super: true, hits: 4, eff: [E('regen', 1, 5, { self: true })] });
  M('ta_knit', 'Kötőtű-csapás', 'melee', 15, 2.5, 'slash', '#d62828');
  M('ta_hug', 'Puha ölelés', 'shot', 20, 4.6, 'hex', '#ff9ecd', { eff: [E('slow', 0.7, 3)] });
  M('ta_glare', 'Ünnepi szemsugár', 'beam', 30, 6.4, 'laser', '#ff3b3b', { eff: [E('burn', 0.6, 3)] });
  M('ta_holiday', 'Démoni ünnep', 'beam', 92, 0, 'laser', '#d62828', { super: true, eff: [E('stun', 1, 1.2)] });
  M('chd_roll', 'Fejgurulás', 'melee', 16, 2.1, 'punch', '#3fa7ff');
  M('chd_booyah', 'BOOYAH-hullám', 'shot', 22, 4.4, 'sonic', '#5fd3ff', { eff: [E('stun', 0.35, 1)] });
  M('chd_beam', 'Fejlézer', 'beam', 26, 5.4, 'laser', '#ff3b3b', { eff: [E('burn', 0.4, 3)] });
  M('chd_rocket', 'Rakétafej', 'multi', 82, 0, 'rocket', '#3fa7ff', { super: true, hits: 4, eff: [E('mark', 1, 4)] });

  // ---------- Titán-barátok (Teeny Titans 2) ----------
  M('nd_kick', 'Apa-rúgás', 'melee', 24, 2.3, 'kick', '#3fa7ff');
  M('nd_bottle', 'Cumisüveg-dobás', 'shot', 30, 4.4, 'bomb', '#f4f4f8', { eff: [E('stun', 0.35, 1)] });
  M('nd_lullaby', 'Altatódal', 'self', 0, 8, 'heal', '#9be7ff', { heal: 0.16 });
  M('nd_family', 'Családi csapás', 'multi', 86, 0, 'kick', '#3fa7ff', { super: true, hits: 5, melee: true, eff: [E('atkUp', 1, 5, { self: true })] });
  M('ra_arrow', 'Vörös nyíl', 'shot', 18, 2.2, 'arrow', '#d62828');
  M('ra_poison', 'Mérgező nyíl', 'shot', 26, 4.5, 'arrow', '#7bd65b', { eff: [E('poison', 0.6, 4)] });
  M('ra_volley', 'Nyílzápor', 'multi', 19, 2.8, 'arrow', '#d62828', { hits: 3 });
  M('ra_bullseye', 'Telitalálat', 'multi', 86, 0, 'arrow', '#d62828', { super: true, hits: 5, eff: [E('mark', 1, 5)] });
  M('rw_sword', 'Kardvágás', 'melee', 18, 2.3, 'slash', '#c0c0c0');
  M('rw_foresight', 'Előrelátás', 'self', 0, 7, 'buff', '#ff9a3c', { eff: [E('atkUp', 1, 6, { self: true })] });
  M('rw_strike', 'Pengevihar', 'melee', 42, 7.4, 'slash', '#ff9a3c', { crit: 0.25 });
  M('rw_ravager', 'A Pusztító', 'multi', 86, 0, 'slash', '#ff9a3c', { super: true, hits: 5, melee: true, eff: [E('mark', 1, 5)] });
  M('hh_spike', 'Tüskés buzogány', 'melee', 16, 2.4, 'punch', '#6b6b7a');
  M('hh_soul', 'Lélekcsapás', 'shot', 22, 4.6, 'hex', '#d62828', { eff: [E('weak', 0.6, 4)] });
  M('hh_portal', 'Portáltámadás', 'beam', 30, 6.4, 'magic', '#d62828', { eff: [E('stun', 0.35, 1)] });
  M('hh_doom', 'A csuklya árnyéka', 'beam', 92, 0, 'magic', '#d62828', { super: true, eff: [E('weak', 1, 5)] });
  M('jb_sting', 'Igazság-fullánk', 'melee', 18, 2.2, 'lightning', '#ffd23f');
  M('jb_blast', 'Méh-sugár', 'beam', 30, 5.6, 'lightning', '#ffd23f', { eff: [E('stun', 0.3, 1)] });
  M('jb_shrink', 'Zsugorodás', 'self', 0, 7.5, 'shield', '#ffd23f', { shield: 0.12 });
  M('jb_swarm', 'Liga-raj', 'multi', 84, 0, 'lightning', '#ffd23f', { super: true, hits: 6, eff: [E('stun', 1, 0.8)] });
  M('ll_kick', 'Lady-rúgás', 'melee', 15, 2.3, 'kick', '#f4f4f8');
  M('ll_spell', 'Titkos varázs', 'shot', 22, 4.6, 'magic', '#8e5cff', { eff: [E('slow', 0.6, 3)] });
  M('ll_disguise', 'Álruha', 'self', 0, 7.5, 'shield', '#ffd23f', { shield: 0.12 });
  M('ll_legend', 'Legasus legendája', 'beam', 86, 0, 'magic', '#8e5cff', { super: true, eff: [E('stun', 1, 1.2)] });

  // Leírás generálása
  for (const m of Object.values(MOVES)) {
    const parts = [];
    if (m.power > 0) parts.push(`${m.power} sebzés` + (m.hits > 1 ? ` (${m.hits} találat)` : ''));
    if (m.heal) parts.push(`${Math.round(m.heal * 100)}% gyógyítás`);
    if (m.shield) parts.push(`${Math.round(m.shield * 100)}% pajzs`);
    for (const e of m.eff) {
      const st = TT.STATUS[e.s];
      parts.push((e.p < 1 ? `${Math.round(e.p * 100)}% eséllyel ` : '') + st.name + (e.self ? ' (magára)' : ''));
    }
    m.desc = parts.join(', ');
  }

  TT.MOVES = MOVES;
})(window.TT);
