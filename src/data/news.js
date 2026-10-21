'use strict';
// Újdonságok: frissítés után egyszer elmondják a Titánok, és a főmenüből is elérhető.
// v: melyik verzióban jelent meg (a régebbi mentéssel érkezők csak az újakat hallják).
(function (TT) {
  TT.NEWS_VERSION = 50;
  const INTRO = { who: 'robin', text: 'Újdonságok Jump Cityben, Titánok! Figyeljetek, mert sok minden változott!' };
  TT.NEWS = [
    { v: 50, who: 'raven', text: 'A Blokk-edzés eddig szigorúbb volt, mint az igazi harc. Most pontosan ugyanakkor zöld a kör, mint harcban, és megmondom, ha korán vagy későn nyomtad. Ja, és lift-zene szól. Nem én választottam.' },
    { v: 49, who: 'robin', text: 'Ha visszatérsz, köszöntjük Jump Cityt. Joker ellen Gotham, Lex és Bizarro ellen Metropolis jár a fejünkben, és ezt hangosan is kimondjuk. A Toronyban a vitrinnél pedig elmesélem, mennyire büszke vagyok a gyűjteményünkre!' },
    { v: 48, who: 'cyborg', text: 'Az ütéseknek most súlya van! Aki kap egyet, hátracsúszik a talapzaton, kritikus találatnál és a szuper utolsó csapásánál pedig egy pillanatra megáll az idő. Érzed? Ez a BOOYAH ereje!' },
    { v: 47, who: 'beastboy', text: 'Yo, dude! Sokkal több dumánk van: beszélgetés közben százféleképpen szólunk be, harc előtt jobban felhergeljük magunkat, és ha kipattan egy doboz a boltban, bekiabálunk. Put up dem dukes!' },
    { v: 46, who: 'starfire', text: 'Ó, de jó! Mostantól beszélgetés közben is hallod a hangunkat, mint a TT2-ben: Robin elmélázik, Cyborg BOOYAH-zik, Beast Boy nevet, én pedig örülök. Raven… Raven sóhajt.' },
    { v: 45, who: 'cyborg', text: 'Még többet dumálunk! Ha állsz a városban, beszólunk. Harc előtt felvezetjük a meccset, és Robin örül, ha edzed vagy megveszed a napi ajánlatot. BOOYAH!' },
    { v: 44, who: 'beastboy', text: 'Most már a gonoszok is beszélnek! Hood, Bizarro, Slade, Mr. Chibi, Pingvin és még sokan mások a saját TT2-hangjukon szólalnak meg harc közben. Bizarro kacagása a kedvencem, dude.' },
    { v: 43, who: 'raven', text: 'Két új harci aréna a TT2-ből: Wonder Woman ligája Oán, a Zöld Lámpások bolygóján vár, apám pedig mostantól Apokolipsz tűztengere fölött harcol. Kellemes kirándulást.' },
    { v: 42, who: 'robin', text: 'Harc előtt most már a TT2 felvezető zenéje szól, és csak a „Rajta!”-nál indul a harci dal. A stáblista végére pedig odatettük a kedvencünket: Night Begins to Shine!' },
    { v: 41, who: 'cyborg', text: 'Új zenék a TT2-ből! Hoodnak saját témája van, Joker Gotham, Lex Metropolis zenéjére harcol, Slade a Legion of Doom dallamára, a Gyűjteményben pedig táncolós zene szól. BOOYAH!' },
    { v: 40, who: 'beastboy', text: 'Megnyílt egy kapu a multiverzumba! Átjött rajta egy kék Jinx, egy sötét Silkie és Bwana Beast a méhmalacával. Ez a legfurcsább dolog, amit láttam, dude.' },
    { v: 39, who: 'raven', text: 'A Testvériség Kupa után éjjelente egy csuklyás alak vadászik a parkban. Csuklyás Hood, Rose Wilsonnal és a Másik Mae-Eye-jal. Csak sötétben harcol.' },
    { v: 38, who: 'robin', text: 'Az utolsó TT2-kincsek is megérkeztek: Clark Kent, a Csodaikrek, Sticky Joe, Mr. Chibi, Ős-Silkie és a Másik Mae-Eye. Ezzel 129 figura vár rád!' },
    { v: 37, who: 'raven', text: 'Új sorozat: a Titán-barátok. Apuka Nightwing, Red Arrow, Rose Wilson, Csuklyás Hood, Igazság Bumblebee… és Lady Legasus. Aki egyáltalán nem én vagyok.' },
    { v: 36, who: 'beastboy', text: 'Ez a legviccesebb sorozat, dude: Fürdő-Batman gumikacsával, a Mikulás, George Washington, Hercegnő Silkie, Trigon kötött pulóverben… és Cyborg feje. Csak a feje!' },
    { v: 35, who: 'robin', text: 'A Gyűjteményben a „Rend” gombbal sorozatonként is rendezheted a figurákat. Így rögtön látod, melyik hiányzik még egy sorozatból!' },
    { v: 34, who: 'cyborg', text: 'Liga-toborzás! Két Zöld Lámpás (John Stewart és Jessica Cruz), Kék Bogár, Booster Gold, Black Lightning és Vixen. Már 111 figura van — BOOYAH!' },
    { v: 33, who: 'raven', text: 'A Gonosz Kupa után Bizarro napozik a strandon, Grodd gorillával és Gepárdnővel. Azt mondja, nem akar harcolni. Ez nála azt jelenti, hogy nagyon is akar.' },
    { v: 32, who: 'beastboy', text: 'Furcsa egy banda érkezett: Macskanő, Gepárdnő, Sinestro, Grodd gorilla, Bizarro és a Mocsárlény! Már 105 figura van, dude. A Sorozat-dobozzal könnyebb őket összeszedni.' },
    { v: 31, who: 'kid_geza', text: 'Új a boltban: a Sorozat-doboz! Kiválasztod a sorozatot, és garantáltan olyan figurát kapsz belőle, ami még nincs meg. A Kelet Kupa után nyílik meg.' },
    { v: 30, who: 'starfire', text: 'Jelmezbál! Új sorozat: a Liga-Titánok. Raven Wonder Woman-nek, én Flash-nek, Robin Batmannek, Cyborg Zöld Lámpásnak öltözött, Silkie pedig szuperhős lett. És Bwana Beast is velünk tart!' },
    { v: 29, who: 'robin', text: 'A Menta Kupa után Lex Luthor beköltözik Mr. Mint trezorához, Rébusszal és Pingvinnel. Ha legyőzöd őket, Rébusz figurája a tiéd!' },
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
