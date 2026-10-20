'use strict';
// Újdonságok: frissítés után egyszer elmondják a Titánok, és a főmenüből is elérhető.
// v: melyik verzióban jelent meg (a régebbi mentéssel érkezők csak az újakat hallják).
(function (TT) {
  TT.NEWS_VERSION = 28;
  const INTRO = { who: 'robin', text: 'Újdonságok Jump Cityben, Titánok! Figyeljetek, mert sok minden változott!' };
  TT.NEWS = [
    { v: 28, who: 'cyborg', text: 'Megjött az erősítés: Flash, Aquaman, Supergirl, Shazam, Marsbéli Vadász és Sólyomlány! Mind ott vannak a dobozokban, eredeti TT2-es kinézettel. BOOYAH!' },
    { v: 27, who: 'raven', text: 'Rossz hír: új gonoszok kerültek a dobozokba a TT2-ből. Lex Luthor, Darkseid, Rébusz, Pingvin, Méregcsók és Bane. Jó hír: a tieid lehetnek. Gyűjtsd össze mind a hatot!' },
    { v: 26, who: 'beastboy', text: 'A dobozbontás most sokkal menőbb: villanás, és a figura ritkaságának színében ragyog az egész képernyő. Az arany fény legendást jelent, dude!' },
    { v: 25, who: 'starfire', text: 'Nézd, milyen szépek lettünk! A városban és a beszélgetésekben is az igazi TT2-es figuráink látszanak, és ugrálva lépkedünk, mint a játékfigurák!' },
    { v: 24, who: 'cyborg', text: 'Turbó mód, BOOYAH! Harc közben sokkal több a képkocka, eltűnt az idegesítő hibahang, a víz is szebb lett a városban. A tökéletes blokk ablaka szélesebb, és ha túl korán blokkolsz, szólok: nyomd, amikor a kör zöld!' },
    { v: 23, who: 'raven', text: 'A Gonosz, a Menta és a Testvériség Kupa ellenfelei, meg a város erősebb edzői kevésbé ügyesek. Control Freak sem olyan rémes már. Ha mégis elakadsz: jobb figurák a dobozokból, és figyelj a típusokra.' },
    { v: 22, who: 'robin', text: 'Ha kikapsz, adok egy tippet: megmondom, milyen típusú az ellenfél csapata, és melyik figurádat érdemes ellenük bevetni. Egy jó vezér tanul a vereségből!' },
    { v: 21, who: 'robin', text: 'Nem tudod, kit vigyél harcba? A Gyűjteményben a „Legerősebb csapat” gomb kiválasztja a legjobb hármast — a csapatbónuszt és a kombókat is figyelembe veszi.' },
    { v: 20, who: 'starfire', text: 'A trutyis Plasmus és az én szakács-énem nem gyógyul már olyan sokat harc közben, és a Regeneráció is gyengébb lett. Így sokkal igazságosabb!' },
    { v: 19, who: 'beastboy', text: 'Javítás: a Különleges és a DC figurák eddig rossz erővel harcoltak — Batgirl, Kalóz Aqualad és macska-énem túl gyenge volt. Most rendben vannak, és Robin támadásai is erősebbek lettek!' },
    { v: 18, who: 'robin', text: 'Az AUTO harc okosabb lett: rendesen védekezik, gyakran tökéletes blokkal, és időben lecseréli a sérült Titánt. Tipp: a gyakorláshoz továbbra is jobb, ha te irányítasz!' },
    { v: 17, who: 'cyborg', text: 'A BLOKK gomb most szól, ha jön a támadás: sárgán villog, és amikor zölden világít, akkor nyomd — az a tökéletes blokk! BOOYAH!' },
    { v: 16, who: 'robin', text: 'Könnyű nehézségen a blokk is megbocsátóbb: sokkal tovább tart a zöld, tökéletes blokk ablak, így könnyebb visszaverni a támadásokat.' },
    { v: 15, who: 'cyborg', text: 'Ha akadozik a játék, a Beállításokban kapcsold be a Takarékos módot: kisebb belső felbontás, simább játék gyenge gépen is. Ha lassú, a játék magától is lejjebb veszi a felbontást.' },
    { v: 14, who: 'raven', text: 'Az ellenfelek nyugodtabbak lettek: ritkábban védekeznek, és nem lőnek el azonnal minden támadást. Ha még mindig nehéz, a Beállításokban állíts Könnyű nehézségre.' },
    { v: 13, who: 'starfire', text: 'Még többet beszélünk! A címképernyőn bekiabálunk, gyógyuláskor megköszönjük, a teljesített napi küldetésnek örülünk, és köszöntjük az éjszakát meg a reggelt is!' },
    { v: 12, who: 'cyborg', text: 'Végre nálam is szól minden: ha eltalálnak, kiesek vagy nyerek. A harc elején a csapatod első Titánja kiáltja a „Rajta!”-t, a boltban pedig köszönünk. BOOYAH!' },
    { v: 11, who: 'raven', text: 'A Gonosz Kupa után Wonder Woman vár a Csatakupola mellett az Igazság Ligájával. Éjjelente pedig Joker kószál a téren a pizzéria előtt… vigyázz vele.' },
    { v: 10, who: 'robin', text: 'Vendégek érkeztek a TT2-ből: Superman, Wonder Woman, Batman Beyond és Batgirl — és sajnos Joker meg Harley Quinn is. Mind a legendás és epikus dobozokban!' },
    { v: 9, who: 'cyborg', text: 'Új harci terepek a TT2-ből: a Torony teteje, a H.I.V.E. bázis, a Csatakupolában az Igazság Csarnoka, a strandon Themyscira, a Trezorban pedig egy titkos barlang. Mint a régi szép időkben!' },
    { v: 8, who: 'raven', text: 'Gyűjtsd össze a teljes Retró, Radikális vagy Különleges sorozatot: mindegyik egy teljesítményt és sok érmét ér. A Gyűjteményben látod, hol tartasz.' },
    { v: 7, who: 'beastboy', text: 'Hat különleges változat a dobozokban: Nightwing, Rettenetes Starfire, Robot Brother Blood, Kalóz Aqualad, Marsi Beast Boy… és én, macskaként! Miaú, dude!' },
    { v: 6, who: 'robin', text: 'Új legendás sorozat a dobozokban: a Radikális Titánok! Punk Robin, Raven, Starfire, Beast Boy, Cyborg — és Radikális Silkie beatboxszal.' },
    { v: 5, who: 'cyborg', text: 'A támadások is az eredeti TT2-es képességhangokkal szólnak: bot-csapás, madárrang, gorillaütés, lézerszem és még sok más. BOOYAH!' },
    { v: 4, who: 'starfire', text: 'Ha a saját TT2-es fájljaidat használod, harc közben a Titánok az eredeti hangjukon szólalnak meg, az új figurák nevét pedig a doboznyitáskor a bemondó mondja be!' },
    { v: 3, who: 'robin', text: 'Új epikus sorozat a dobozokban: a Retró Titánok! Retró Robin, Raven, Starfire, Beast Boy és Cyborg, egyenesen a 80-as évekből.' },
    { v: 3, who: 'cyborg', text: 'A Gyűjteményben a figurát ujjal körbe tudod forgatni, és ha rábökösz, táncol egyet. BOOYAH!' },
    { v: 2, who: 'controlfreak', text: 'Csatornaváltás! A Képregényboltban mostantól az én Titán-kvízem megy: 8 kérdés a figurákról, a gyors válasz több pontot ér!' },
    { v: 2, who: 'beastboy', text: 'A kvízben „Ki ez a figura?” kérdések is vannak: csak az árnyékát látod. Dude, ez kemény!' },
    { v: 1, who: 'beastboy', text: 'A Képregényboltban Figura-memória van! Párosítsd a figurákat minél kevesebb lépésből, érméért.' },
    { v: 1, who: 'cyborg', text: 'A Csatakupolában Heti kihívás vár: hétfőnként új szabály, a végén prémium figura. BOOYAH!' },
    { v: 1, who: 'raven', text: 'Harc közben koppints a felső névpanelre, vagy nyomd meg a C-t: megmutatja a figura erősségeit és állapotait.' },
    { v: 1, who: 'starfire', text: 'Minden nap 3 napi küldetés (bal felső sarok, vagy Q), a menüben pedig ott a Profil és a rekordjaid!' },
    { v: 1, who: 'robin', text: 'A térképen a kék épületnevekre koppintva gyorsan utazhatsz. És vigyázz: néha esik, sőt villámlik is!' },
    { v: 1, who: 'cyborg', text: 'Új figurák: Mad Mod a Pizzéria előtti téren vár, Larry a keleti parton bujkál, Killer Moth a dobozokban.' },
    { v: 1, who: 'raven', text: 'És ha legyőzted Red X-et és a Testvériség Kupát… beszélj velem a parkban. Valami sötét közeleg.' },
  ];

  // a még nem hallott újdonságok, vagy ha nincs ilyen, az összes
  TT.showNews = function (cb) {
    const seen = TT.settings.newsSeen || 0;
    const fresh = TT.NEWS.filter((n) => n.v > seen);
    TT.settings.newsSeen = TT.NEWS_VERSION;
    TT.store.writeSettings();
    TT.ui.say([INTRO].concat(fresh.length ? fresh : TT.NEWS), cb);
  };

  // régebbi mentéssel érkezőknek egyszer, a városba lépéskor
  TT.newsPending = () => !!(TT.save && TT.save.flags.tutorial) && (TT.settings.newsSeen || 0) < TT.NEWS_VERSION;
})(window.TT);
