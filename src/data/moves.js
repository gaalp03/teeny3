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
  M('bo_staff', 'Bot-csapás', 'melee', 10, 2.2, 'staff', '#ffd23f');
  M('birdarang', 'Madárrang', 'shot', 20, 4.5, 'bird', '#ffd23f', { eff: [E('stun', 0.25, 0.9)] });
  M('flying_kick', 'Repülő rúgás', 'melee', 36, 8, 'kick', '#ff6b35');
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
  M('absorb', 'Elnyelés', 'self', 0, 10, 'heal', '#c45ab3', { heal: 0.18 });
  M('sludge', 'Iszapár', 'beam', 42, 8.5, 'blob', '#7bd65b', { eff: [E('poison', 0.5, 4)] });
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
  M('taste_test', 'Kóstoló', 'self', 0, 9.5, 'heal', '#ffd23f', { heal: 0.2 });
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
  M('cat_scratch', 'Macskakarom', 'melee', 10, 1.9, 'claw', '#7bd65b');
  M('waffle_toss', 'Gofridobás', 'shot', 22, 4.5, 'pie', '#e8b04b', { eff: [E('slow', 0.35, 3)] });
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
