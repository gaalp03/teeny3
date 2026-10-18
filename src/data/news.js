'use strict';
// Újdonságok: frissítés után egyszer elmondják a Titánok, és a főmenüből is elérhető.
(function (TT) {
  TT.NEWS_VERSION = 1;
  TT.NEWS = [
    { who: 'robin', text: 'Újdonságok Jump Cityben, Titánok! Figyeljetek, mert sok minden változott!' },
    { who: 'beastboy', text: 'A Képregényboltban Figura-memória van! Párosítsd a figurákat minél kevesebb lépésből, érméért.' },
    { who: 'cyborg', text: 'A Csatakupolában Heti kihívás vár: hétfőnként új szabály, a végén prémium figura. BOOYAH!' },
    { who: 'raven', text: 'Harc közben koppints a felső névpanelre, vagy nyomd meg a C-t: megmutatja a figura erősségeit és állapotait.' },
    { who: 'starfire', text: 'Minden nap 3 napi küldetés (bal felső sarok, vagy Q), a menüben pedig ott a Profil és a rekordjaid!' },
    { who: 'robin', text: 'A térképen a kék épületnevekre koppintva gyorsan utazhatsz. És vigyázz: néha esik, sőt villámlik is!' },
    { who: 'cyborg', text: 'Új figurák: Mad Mod a Pizzéria előtti téren vár, Larry a keleti parton bujkál, Killer Moth a dobozokban.' },
    { who: 'raven', text: 'És ha legyőzted Red X-et és a Testvériség Kupát… beszélj velem a parkban. Valami sötét közeleg.' },
  ];

  TT.showNews = function (cb) {
    TT.settings.newsSeen = TT.NEWS_VERSION;
    TT.store.writeSettings();
    TT.ui.say(TT.NEWS, cb);
  };

  // régebbi mentéssel érkezőknek egyszer, a városba lépéskor
  TT.newsPending = () => !!(TT.save && TT.save.flags.tutorial) && (TT.settings.newsSeen || 0) < TT.NEWS_VERSION;
})(window.TT);
