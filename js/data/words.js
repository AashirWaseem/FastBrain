/* Word list for the Verbal CWM decision task, plus a misspelling generator. */
(function (FB) {
  'use strict';
  const RAW = `
  absence academy accident account achieve acquire address advance adventure advice afford against agency agenda
  airport alcohol allergy already amateur ambition analysis ancient animal another anxiety apology apparent appetite
  approach arrange article artist athlete attempt attitude auction average balance balloon bargain barrier battery
  because bedroom believe benefit bicycle biology biscuit blanket borrow bottle boundary bracelet breakfast brother
  budget building business cabinet calendar campaign capable capital captain careful carpet cartoon castle catalog
  ceiling central century certain challenge champion channel chapter charity chicken children chocolate citizen
  climate clothing collapse colleague collect college comfort command comment commerce committee common
  company compare complete computer concept concert confirm conflict connect consider constant contain content
  contest context control convince cottage council counter country courage cousin creature criminal crystal culture
  curious current curtain customer daughter decision declare decrease deliver demand dentist deposit describe
  desert deserve design despite develop diamond dictionary different digital dinner direction disaster discount
  discover disease distance doctor dolphin dynamic economy edition educate effective efficient eighteen election
  element elephant embarrass emergency emotion emperor employee encourage energy engine enormous entrance envelope
  environment episode equipment escape especially evening evidence exactly example excellent exercise exhibit
  existence expensive experience explain explore express extreme factory familiar fashion feature festival
  fiction finally finance firework foreign forest fortune forward fountain freedom friendly frighten furniture
  further gallery garbage garden general generous genius gesture giraffe glimpse government graduate grammar grateful
  guarantee guitar habit hamster handsome happiness harmony harvest headline health height helmet heritage
  history holiday honest horizon hospital however hundred hunger husband identity illness imagine immediate
  improve incident include income increase indicate industry infant initial injury innocent insect inside instance
  instead intense interest internet interview invasion island jacket january journey justice
  kangaroo keyboard kitchen knowledge laboratory landscape language laptop laughter launch lawyer leather lecture
  legend lemonade library lightning limited liquid literature lobster location luggage machine
  magazine magnet maintain majority manager marriage material maximum meadow measure medicine medium member memory
  message method midnight mineral minister minute miracle mirror mission mistake mixture modern moment monster morning
  mountain movement museum musician mystery narrow national natural necessary nervous network newspaper
  nothing novelist nowhere nuclear number nursery obvious occasion October office opinion orange orchestra ordinary
  organic original outcome outside oxygen package painter pancake parallel parent partner passenger passion patient
  pattern payment peaceful penguin pension people pepper perfect perform perhaps permit person physical picture
  pillow pioneer planet plastic pleasant pocket poetry police popular portrait position possible potato poverty
  practice precious prefer pregnant premium present pressure prevent primary princess priority prison private problem
  process produce product profit program project promise property protect protest provide public pumpkin purchase
  purpose puzzle quality quarter question quickly rabbit radical railway rainbow rapid rather reaction reality reason
  receipt receive recent recipe record recover reduce reflect refuse region regular relative release religion remember
  remove repeat replace request rescue research reserve resident resource respect response restaurant result return
  reveal revenue revolution reward rhythm ribbon rocket romantic routine sailor salmon sandwich satellite sausage scandal
  scholar science scissors season secret section security seminar senior sentence separate sequence serious service
  session shadow shelter shoulder signal silence silver similar simple sister skeleton society soldier solution someone
  special spirit sponsor spring squirrel stadium station statue stomach storage strategy strength stretch student
  subject success suggest summer support surface surprise survey survive swallow symbol sympathy system talent
  teacher technique telephone temple tension terrible therapy thousand through thunder ticket tomato tomorrow
  tongue tonight tortoise totally tourist traffic tragedy training transport travel treasure triangle tropical trouble
  trousers tunnel turtle umbrella uncle uniform universe unknown unusual upstairs useful usually vacation valley
  valuable vegetable vehicle version victory village violin visitor vitamin volcano volume volunteer wardrobe warning
  weather wedding weekend welcome western whisper whistle window winner winter wisdom witness woman wonderful wooden
  worried writer yellow yesterday younger zebra
  abundant accurate adequate aggregate allocate ambiguous analogy apparatus arbitrary articulate authentic benevolent
  candid capricious catalyst coherent coincide commodity compelling comprehensive concise consensus contemplate
  correlate credible criterion cumulative deficient deliberate diffusion diligent discrete diverse effective elaborate
  eloquent empirical endeavor enigma ephemeral equivalent evaluate explicit facilitate feasible fluctuate formidable
  frugal generate gregarious hierarchy hypothesis illuminate imminent implicit impulsive incentive inevitable ingenious
  inherent integrity intricate intriguingly intuitive justify legitimate lucrative magnitude manifest meticulous
  migrate mitigate momentum negligible notorious obsolete optimism paradigm paradox perceive persistent pragmatic
  precedent preliminary prevalent profound prominent proportion prudent rational reluctant resilient rigorous scrutiny
  significant simultaneous skeptical spontaneous subsequent substantial subtle superficial synopsis tangible tedious
  tentative thorough transition transparent turbulent ubiquitous undermine unprecedented utilize vague versatile
  viable vigilant volatile whimsical cosmopolitan otherwise grocery`;

  const WORDS = Array.from(new Set(RAW.split(/\s+/).filter(Boolean).map(w => w.toLowerCase())));
  const SET = new Set(WORDS);

  // Non-words are scrambles: the first letter stays, the rest are shuffled
  // (e.g. "correlate" → "ceoralrte"), matching how BrainScale builds them.
  function misspell(word) {
    const first = word[0], rest = word.slice(1).split('');
    for (let attempt = 0; attempt < 40; attempt++) {
      const res = first + FB.shuffle(rest).join('');
      // reject shuffles that barely moved anything, so the answer is clear
      let moved = 0;
      for (let i = 1; i < word.length; i++) if (res[i] !== word[i]) moved++;
      if (res !== word && !SET.has(res) && moved >= Math.min(4, word.length - 2)) return res;
    }
    return first + rest.reverse().join('');
  }

  FB.words = {
    list: WORDS,
    // returns {text, correct}
    next() {
      const w = FB.pick(WORDS);
      if (Math.random() < 0.5) return { text: w, correct: true };
      return { text: misspell(w), correct: false };
    }
  };
})(window.FB);
