'use strict';
// Újdonságok: frissítés után egyszer elmondják a Titánok, és a főmenüből is elérhető.
// v: melyik verzióban jelent meg (a régebbi mentéssel érkezők csak az újakat hallják).
(function (TT) {
  TT.NEWS_VERSION = 3;
  const INTRO = { who: 'robin', text: 'Újdonságok Jump Cityben, Titánok! Figyeljetek, mert sok minden változott!' };
  TT.NEWS = [
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
