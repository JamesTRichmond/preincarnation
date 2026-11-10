# PREINCARNATION — Optional Story Bible

This folder is an optional-story pack for an original action-adventure set only in Addison County, Vermont. It is not a game, not a quest compass, and not a runtime. Spoken scenes, flags, and consequences live in [content/](content/) and are assembled into machine-readable JSON in [data/](data/).

Rebuild and check:

```
node support/grok-08-narrative/tools/build.mjs
node support/grok-08-narrative/tools/validate.mjs
node support/grok-08-narrative/tools/validate.mjs --self-test
```

The validator fails on missing references, unreachable stages, contradictory prerequisites, unfinished dialogue, duplicate long lines, fetch-shaped errands, and compass language. It simulates the proposed seams in [data/integration_map.json](data/integration_map.json). Those seams are a contract for a future reader. They are not an existing runtime API, and nothing in this pack calls one.

## Not the playable game

The shipped game is a SNES-style Canvas 2D RPG at 320×240. You are one person. Death is a chapter. The Marble Vein is the only plot. Saves stay in `localStorage`. There are no accounts and no database. This folder is not imported by that game, and it must not be used to rewrite it.

The names and jobs here disagree with the script on the Green:

- The playable elder is Maeve Holloway. This archive says Maeve Harrow.
- The playable farm is Cal Perch, and the square is Mayor Voss. This archive's Cal Voss is a different man.
- The playable skins are Mortal Wanderer, Otter Creek Smuggler, Rutland Officer, and Embryonic God, with karma and Heavenly Crowns. This archive's six bodies (Rennet, Ada, Louis, Hannah, Chris, Rowan) are another telling, and its character creation changes lines only.
- The Marble Vein east of the pines is the only plot the canvas plays. These eight chains and fifty-six standalones are an optional archive. They are not a second campaign.

Counts that must hold: 6 eras, 8 chains, 56 standalone quests (64 quests total), chain stages not counted among the 64, at least 60 named people, and substantial second-life scenes for Maeve Harrow, Cal Voss, and Ansel Demerritt.

## The will and the wound

Ellis is one will. It does not remember itself as a soul collecting trophies. It wakes in a body whose morning already belonged to someone else, dies, and wakes again fourteen years later in another body, still inside this county.

The wound is one act with two sentences, both in Ivo Perch's hand, both from the year he died (1938). The certification says the gate remained shut and the lower works were preserved. The margin says the gate was opened late and both mercies were missed. Ivo is not a ghost at Ellis's shoulder. He is the previous wearing of the will.

The Voice speaks certification grammar: the record is the act, and a clean sentence is how a county stops hurting itself. The Other Voice speaks the body's account of the same wound: the hands were late, and the hands were the act. They are not two gods and not a morality meter. In the last flood-book scene they are in the room together. Signing one of them is a way of feeling clean. Writing both, or leaving the sentence unfinished on purpose, refuses that cleanliness.

The Surveyor is an inherited office, not an empire. It is a rented room off Court Street in Middlebury, a cabinet that leaks, a flood book, and the people who keep, sand, cite, or refuse it: Norma Seaver, Clark Seaver, Willa Seaver, and the Perches who will not take the desk (Helen, Gordon, Owen). A fair copy is an act of kindness that is also a solvent. Precedent is how Clark loves a town, by making water predictable, which repeats the wound at a smaller scale.

The Marble Vein is the limestone above Bristol. Unrealized lives are in that stone the way chalk is: names that were going to be worked and were not, including the lives Ellis's returns displace. The Vein is not a faction. Powder, wages, and rain argue with it.

## Era clock

Playable seasons, not a sandbox century:

| Era | Year | Body | Displaced life | What that life was going to do |
| --- | --- | --- | --- | --- |
| E0 | 1952 | Rennet Moss | Cress Moss | A morning with plans, a slate, a plate |
| E1 | 1966 | Ada Smollet | Adah Smollet | Teach; fix the school damper; refuse public thanks |
| E2 | 1980 | Louis Pell | Lou Pell | Leave the quarry life Lou had already planned to leave |
| E3 | 1994 | Hannah Greer | Nan Greer | Keep books at the landing, not inherit the office |
| E4 | 2008 | Chris Dobbs | Christian Dobbs | Stay a mechanic |
| E5 | 2022 | Rowan Keel | Maren Keel | The name on the certificate in the Waite drawer |

A person speaks in a season only if birth and death allow it. Memory (Ivo, June Harrow, Peter Voss) is quotation, not a body in the room. Displaced people do not stand beside their bodies and argue. The Quiet Household is where their absence is fed, written, or dried.

Most people die. Samuel Harrow dies in 1963. Harold Waite dies in 1962. Ansel Demerritt dies in 1978. Maeve dies in 1991. Bram Voss can die in the gap after a withheld pier, or live because the pier was jacketed. Ruth Demerritt, Pearl Lamb, Joel Waite, Carl Abbott, Kitty March, Cora Belden, and Alma Gray are among the few who can be met in every season. That is rarity, not the default.

## Character creation

Background, bond, ideal, and flaw change reactions. They are not combat classes, skills, or romance. The tuples are in [data/character_creation.json](data/character_creation.json).

Backgrounds: intervale, mill race, quarry cut, crossing, survey desk, roadside.

Bonds, which answer first when that house is spoken of: Harrow homestead, Voss crossing, Demerritt wheel, Waite house, Pellegrin cut, Lamb stand, or unbound.

Ideals: the record holds; the living first; names aloud; water has its level.

Flaws: spares a kind lie; signs unread; keeps a second copy; cannot leave a gate.

A variant line is a different sentence in the same scene, not a different quest. World-state variants (`when.flags`) are listed before temperament variants. The first match wins, so a fact the county already lived outranks a gloss about your flaw. Gated choices must always leave an ungated way through unless the node is an explicit partition (the second-life forks, and the flood book's last scene).

## What a later season already knows

Chain stages still unlock if the previous stage was finished or interrupted. The interruption is not rewritten into a choice. When the previous choice did happen, the next living person does not greet you blank.

- Maeve at the cider press already knows whether the stake was confessed or driven down.
- Asa already knows if June's tree was kept, or if the south block was sold.
- Cal's plaque draft already knows whether Bram fell or the pier was jacketed. Lena's dull year already knows the withheld testimony, or that the 1994 plaque was made true. The new span already knows whether 2008 was warned or protected.
- Faye already knows if one letter left the loft or the sack stayed bound.
- Pearl's definition card sits on top of the first order, messy or corrected. Ivy's meaning of last already knows if the word stayed a place or left on a truck.
- Gina's empty cut already knows if the names were a supper or a page in the book.
- Sim already knows if Queen was banded, or moved off the log for hay.
- Clark's blotter already knows whether the official page held both sentences, a fair copy, or a private card. His smaller gate already knows which ink you let dry.
- Esther's second question already knows if you ate Cress's plate or left it. Eden already knows if the cloth book went to the office, stayed in the house, or if you slept in the east-room bed.

If the earlier stage was only interrupted, none of those lines fire. The base scene plays, and the gap is a gap.

## How an optional quest is found

Discovery is a thing already wrong in the room: a towel under a wet page, a plate set, a sketch beside a book, a wrapper in an open till, chalk before rain, a turtle on a log the mower is about to take. Nobody issues a task, marks a map, or sends Ellis to fetch a count of objects. Steps are the playable choices inside that encounter.

Chains remember their own stage flags (`flags.stage.<id>.done` or `.interrupted`). A death mid-scene sets the interrupted flag so the next season can still be reached. The next season does not pretend the interruption was a choice. Standalone scenes do not require a chain unless their own text says a prior fact is in the room.

Rewards are knowledge, access, stance, record, or token. A token is a physical fact (a slate, a wrapper, a knife), not currency and not a craft ingredient.

## Death, and the fourteen-year step

If Ellis dies mid-scene, the surviving NPC finishes what their character would finish, not what would make the story tidy. Flags listed as carried survive the body. Flags listed as lost do not. An unresolved advance leaves a rumor, a blank line, a damp page, an uneaten plate. A resolved advance keeps the choice and does not reopen it as manners.

If a listed character is dead, that scene's alternate graph replaces the main one. The surrogate is a person who can actually be alive in that season. Alternates are meaner or plainer. They do not cosplay the dead.

## Second lives

These are not greeting swaps. By 1966 the first choice has already spent fourteen years.

**Maeve Harrow**, stage `st.orchard.e1`, The Row She Already Lived. If Ellis told her the stake was moved, she has grafted the south block under her own name and will put the knife in the right hand or not at all. If the stake was hidden, the county has been in her trees and she does not let the new face past the gate; she knows the office in a pocket when she sees it. If the first season never finished, she is living an unresolved row, and Ada is met inside that unfinished argument. June's failing tree comes out or stays and spoils the line. Nell is already watching the inheritance as taxes, not as myth.

**Cal Voss**, stage `st.bridge.e1`, Say the Name Before Business. If testimony was withheld, the pier stayed unjacketed and Bram fell off the repair. Cal demands the name Bram Voss before any other business, and Ida will not have the empty chair filled with a schoolteacher's sympathy. If testimony was given, the pier wears a jacket, Bram is alive and refuses to be a credential, and Cal lost a season of fares he would spend again. Ellis must name the dust line the jacket covered, or admit to having only a kitchen story. If 1952 never finished, the pencil is still in the crack and Cal has had fourteen years of almost. He charges a dollar for the toll and nothing for mystery.

**Ansel Demerritt**, quest `q.the_second_gate`, not a chain stage. If the downstream meadow was told, he has repinned the gate to pass more water, Eli left because the truth had a morning, and Ada is not allowed to touch the new pin or be forgiven. If the mill's counsel was kept, Eli is still on the wheel, Clarice has been writing night as day, and Ada can keep the left hand in a pocket or break the counsel fourteen years late, which does not rewrite 1953. If neither happened, Ansel does not know this face. He offers posted hours or the road to the bridge. Old hands look at the left side of the gate. Strangers do not.

## The eight chains

Chain stages are not among the 64 quests. Each chain is one quest with at least four stages.

### The Bridge That Was Promised

Vermont shore only: Chimney Point and the abutment. 1952 is Bram's pencil ticks in the concrete. Testify, and the pier can be jacketed. Withhold, and the landing keeps its season. 1966 is the second life above. 1994 is the plaque: the painter, the comfort version, or a blank. 2008 is the summer before the closure, powder on the thumb, warning against traffic or protecting the season. 2022 asks what the promise was. A sentence cannot be laundered by new steel. A span lets the county feel finished. Neither replaces Ellis's ending.

### The Orchard Inheritance

New Haven intervale. 1952: the iron stake in the south block is not a flood relic. Tell Maeve, or drive it deeper and leave the county line looking honest. 1966 is her second life. 1980 is cider and a buyer: Nell inherits trees or a sale, and Maeve is too tired to pretend those are the same will. 1994 is two maps in the attic, a kind one and a harsh one. Hannah's filing chooses which enemies the intervale gets. 2022: Asa can graft and asks whether skill is a reason to keep putting new lives on the row. Stop, or continue as Tuesday work with a limit against ceremony.

### The Choir of Unsent Letters

Cornwall, the Keene loft above the grange, not a campus and not a church program. 1952: a sack of letters nobody sent. Deliver one by hand, or bind the sack. 1966: the loft against the post-corner rule about the dead. 1994: one tired voice can sing the names or burn them as a mercy. 2022: the letters become a public holding or stay a private choir. Ben and Owen can rot a sack or force it into the open. A letter answered as Ellis's will is not the body's answer. The ending may sing only what this chain did not burn.

### The Last Creemee Stand

Lamb's, the Route 17 pullout in Addison, alive because of bridge traffic. 1966: Doris will not start a legend. Maple-walnut in June was said like a debt. The book keeps the name as spoken or corrects it into something the county can digest. 1994: Pearl and Randy fight over whether creemee is a place or a product that can leave on a truck. 2008: the compressor, Christian's hands in a new body, and whether the last summer is spent warning people or keeping the till full. 2022: Ivy decides what last means. A window opened once a year is a rite. A book carried home is an ending. A word that left the county is not called back by nostalgia.

### The Quarry Workers' Names

Bristol overhang. 1952: chalked names before rain. Speak them at Elena's supper, or copy them into the survey book where they can be misused and blamed. 1966: an unrealized name near the powder. Scrub it because safety outranks the lesson, or leave it and move the briefing. 1980: an envelope for a week Lou did not work. Refuse it, or take it so the book matches a life already gone and say the lie out loud. 2022: the cut is closed. Gina brings no chalk. Three names in the mouth, or an admission that the mouth is not enough and the loss stands. The monument is not allowed to have always been the workers.

### The Animal That Remembers

Queen, a snapping turtle notched by Ivo when he lifted her out of the lower sluice. She knows mill-gate grease and a two-note whistle. She is an animal, not a magistrate. 1952, Dead Creek: the mower is coming. Move her, and she may not find the log again. Stand the mower off, lose the cutting, do not whistle. 1966: a fair wants her in a tank. Hada can be the one who says no. 1980: notch or band. A band is a story the next stranger can read. 2022: Sim, who does not hunt, forces the scale. County fact, plain enough to proofread, or family fact that shrinks every winter in a kitchen. The ending may mention her only at that scale. It may not make her the Vein's priest. Cal's dog Bramble recognizes a stance and dies in the oath year anyway. The March cow and Cora Belden's mare Invoice are their own standalone scenes, not Queen's symbols.

### The Flood Book

1952, the towel: keep both sentences in the official book, fair-copy the margin out, or lift it onto a private card and leave the book looking settled. Helen can still be cornered in the doorway; a card lets her leave unread, and she calls that a lie she will live with. 1966: one blotter, two inks, a hearing in an hour. The margin dries or the certification dries. Gravity is not policy. 1980: Clark's smaller gate. Ruth counts the hour the race would pay. Refuse the precedent, or cite the page and her objection in the same paragraph. 2008, Salisbury outlet shed: a labeled spare, or one book that can still be lost to a wet cellar. Clark calls Norma's kindness a solvent. Willa separates acceptance from agreement. 2022: Owen puts the book on the table and will not let Ellis feel clean. The Voice and the Other Voice speak. If the margin was kept, both accounts can be written and neither signed as sole, or the certification can be signed. If a fair copy already cleaned the page, Willa can force the smear back or Ellis can sign the adult book and join Norma. If neither mercy was made official, the sentence can be left unfinished on purpose, which is not the same as dying before the choice, or the late hands can be signed in the margin. Owen goes back to the feed store. Feed is the blessing he chose.

### The Quiet Household

The Waite house in Orwell. Plates, a stopped clock, a cloth book, an east-room bed. They are not worshiping Ellis. They are refusing to let the displaced be recorded only by the office, which would record them wrong.

1952: Esther's plate for Cress. Eat, and she stops setting it tomorrow. Leave it, and she sets it until she dies. Harold will not let the clock be recruited. Neither kindness is a homecoming. 1966: one thing Adah wanted that Ada will not do. The true want is the school damper and no thanks in front of the children. A pretty want (the teacher who saved the county's handwriting) is caught by Clara, and the line stays blank. 1994: Miriam's book of names. Carry it to the survey office and the names become measurements. Leave it and Joel inherits strange housekeeping, which is the inheritance she can forgive. 2008: the east-room bed made for Christian. Sleep in it and the sheets say someone used the room. Strip it and the room becomes a room by laundry, without a hymn. Sit the night up and Eden allows it and will not admire it. 2022: Eden can say six names once at the ditch below the pasture — Cress, Adah, Lou, Nan, Christian, Maren — and dry the plates, or keep spending groceries with a money-rule and no sermon. Rowan is not asked to perform Maren's life.

The standalone "A Renter for the East Room" is a different 2022 question: whether Ben Keene, who needs a winter that is not a damp Cornwall attic, sleeps in that room. Plates and tenancy can diverge. The stopped clock (1980, Joel and the key) and Cress's slate (1966, Constance Daly) are also their own scenes. They share a house. They do not share a verdict.

## What the standalones are for

Fifty-six single encounters. Each is a disagreement already in progress: a wrong stake at Dead Creek, a heronry against a pullout, Sadie Burnham's ten kind feet, the Abbott grave the town line would move, a wet wage book at the mill, Ivo's boots, a night wheel and Henry March's milk, a Morgan mare promised to a girl and listed against a feed bill, a Goshen post one foot inside Alma Gray's dooryard, unsent letters to a living son, a meal cooked for Christian that Chris may eat, refuse, or cook wrong. Creation traits bend a line. They do not start a class quest.

The catalog below is the index. The scenes themselves are the dialogue graphs, with every branch ended, every dead-NPC substitute written, and a validation case the checker actually walks.

## Integration map

Marked in data as `PROPOSED_CONTRACT_NOT_AN_EXISTING_RUNTIME`.

A future game, if one is ever written, would:

1. Load people, flags, and quests.
2. Inject `flags.era.<id>` for the season being played. That injection is not a reward.
3. Offer a scene only when its prerequisites pass and the player has already walked into its discovery.
4. Run a graph whose nodes have exactly one of: choices, a next node, or an end. Ends set a branch, a status (`completed`, `interrupted`, `failed`), and flags. Mutex groups clear their siblings when one is set true.
5. Let background, bond, ideal, and flaw select variant lines and gated choices.
6. On Ellis's death or on a season advance, apply that scene's death transition. If a character in the scene is dead, play that NPC's alternate graph.

Non-goals, on purpose: no romance meter, no party, no crafting economy, no procedural lines, no compass, no invented save or engine object.

## Authoring files

| File | Holds |
| --- | --- |
| content/world.mjs | Eras, Addison towns, locations, creatures, creation, flags |
| content/people.mjs | Named people, years, voice, lines |
| content/lineages.mjs | Houses |
| content/chain_*.mjs | The eight chains |
| content/second_gate.mjs | Ansel's second life |
| content/standalones_*.mjs | The 56 encounters |
| content/questkit.mjs, fork.mjs, duo.mjs | Structuring only. Spoken lines are authored per scene |
| data/*.json | Built pack |
| tools/validate.mjs | The checker |

Do not treat the kit functions as a dialogue engine. They stamp shape. The sentences are written.

## People

Ninety-nine named people. Years are birth–death. A blank death is still living in 2022. Presence `memory` is dead before 1952. Presence `displaced` is the life the return pushed out. Presence `body` is the life Ellis is wearing.


### Harrow

The homestead, the south-block orchard, the sugarhouse, and the argument about silt.

- **Samuel Harrow** (p.samuel_harrow, 1899–1963, living). Homestead patriarch, fence-walker. Knew Ivo as the man who moved water onto Harrow ground. In 1952 he watches Rennet's hands and does not say the name.
- **Lottie Harrow** (p.lottie_harrow, 1902–1974, living). Homestead reckoner. Wants the silt written down so the county cannot take the trees by smiling. Trusts records more than men who return.
- **Maeve Harrow** (p.maeve_harrow, 1924–1991, living). Homestead keeper. Saw Ivo at the gate as a girl. In 1952 she tests Rennet. In 1966 her life has already been rebuilt or ruined by what was said about the stake, and Ada is met inside that life, not at its door.
- **June Harrow** (p.june_harrow, 1927–1949, memory). Maeve's younger sister, dead before the playable seasons. Ivo wrote toward the Harrow girls as if they were the future of the intervale. June did not live to meet Rennet. Her tree remains.
- **Nell Harrow** (p.nell_harrow, 1946–2019, living). Maeve's daughter, later orchard keeper. Too young in 1952 to be a partner. From 1966 she watches Ellis change the terms of her inheritance. She is not a reincarnation believer. She is an accountant of consequences.
- **Asa Harrow** (p.asa_harrow, 1971–, living). Nell's son, last Harrow on the intervale. Inherits a story about a person who wears different faces and always ends up at the third row. In 2022 he asks Rowan to stop.

### Voss

The Vermont landing log, the abutment, and the name of anyone the ice or the pier took.

- **Peter Voss** (p.peter_voss, 1899–1948, memory). Cal's father, landing man. Ivo and Peter argued about the gate while Peter still lived. Ellis inherits the argument's echo, not Peter's friendship.
- **Ida Voss** (p.ida_voss, 1906–1975, living). Landing kitchen, keeper of who eats. Will feed Rennet and later Ada. Judges them by whether they leave the log worse.
- **Bram Voss** (p.bram_voss, 1928–1979, living). Pier-watcher, Cal's older brother. In 1952 he shows Rennet the ticks because he thinks a rodman might still be honest. He does not plan to become a ghost in somebody else's second life.
- **Cal Voss** (p.cal_voss, 1931–2004, living). Crossing keeper at Chimney Point. The crossing's living conscience. In the second life he is not the young man who asked for a delay. He is the man the delay made, or the man the testimony made. Both are heavier.
- **Lena Voss** (p.lena_voss, 1956–, living). Cal's daughter, later keeper of the log. Grows up around the question of whether Ellis is a recurring problem. By 1994 she treats the recurrence as a management issue.
- **Noah Voss** (p.noah_voss, 1988–, living). Lena's son, landing hand. Knows Ellis only as a story his mother refuses to tell cleanly. In 2022 he wants a job, not a myth, and still asks the right question.
- **Irene Voss** (p.irene_voss, 1940–2017, living). Cousin from the New York shore who only appears on the Vermont landing. Does not know Ellis. She knows the landing has been keeping her uncle's death as local property.

### Demerritt

The millwright's office, which is a wheel, a pin, and a wage book. Not a company.

- **Harris Demerritt** (p.harris_demerritt, 1886–1953, living). Retired millwright, Ansel's father. He remembers Ivo's hands on the wheel. Rennet's hands upset him more than Rennet's face.
- **Ansel Demerritt** (p.ansel_demerritt, 1910–1978, living). Millwright of the lower gate. The millwright. In 1952 he asks Rennet to keep counsel or to betray the wheel to the meadow. In 1966 he is not the same employer: either he has rebuilt the gate and barred Ellis from it, or he is protecting a dying lie and calling Ada by Ivo's name.
- **Clarice Demerritt** (p.clarice_demerritt, 1915–1988, living). Wage-book keeper. Knows the night crew's hours are the moral fact. She wants Ellis to choose which ink survives.
- **Eli Demerritt** (p.eli_demerritt, 1936–1968, living). Ansel's son, wheel hand. Ellis's choice in 1952 decides whether Eli's life stays on the wheel. Ellis does not get to call that destiny. It is a schedule.
- **Ruth Demerritt** (p.ruth_demerritt, 1948–, living). Niece, apprentice, then millwright. Child in 1952. By 1980 she is the millwright Ellis must deal with, and she has opinions about Ivo that she will not dress up as fate.
- **Tessa Demerritt** (p.tessa_demerritt, 1976–, living). Ruth's daughter, records clerk in Middlebury. Sees Ellis as a recurring signature problem in the land records.

### Perch

The surname Ellis keeps underneath, Ivo's book, and cousins who refuse the office.

- **Ivo Perch** (p.ivo_perch, 1895–1938, memory). County surveyor, Ellis's body in the wound year. Not an ancestor standing beside Ellis. The prior wearing of the will. The wound is his act and Ellis's.
- **Helen Perch** (p.helen_perch, 1898–1961, living). Ivo's sister. A margin names her as the person who told Ivo to keep the gate shut. She meets Rennet and recognizes nothing and everything.
- **Gordon Perch** (p.gordon_perch, 1921–1989, living). Helen's son, town skeptic. Treats each new body that knows Ivo's margin as a con. He is sometimes right about the harm and wrong about the mechanism.
- **Mina Perch** (p.mina_perch, 1947–2005, living). Gordon's daughter, would-be archivist. Wants the flood book in an archive where it can be studied. Ellis may be the study's obstruction.
- **Owen Perch** (p.owen_perch, 1973–, living). Mina's son, refuser of the office. The living Perch who will not be surveyor. In 2022 he brings Ellis the unfinished sentence and does not want it finished for the family's sake.

### Pellegrin

Chalk, powder, and the supper hall. Stone names.

- **Marco Pellegrin** (p.marco_pellegrin, 1908–1969, living). Lead cutter. Lets Rennet read the overhang if Rennet will say whether names belong to supper or to the tax man.
- **Elena Pellegrin** (p.elena_pellegrin, 1912–1984, living). Shack keeper and grace-sayer. Tests Ellis in public, at a table, where flinching is data.
- **Vito Pellegrin** (p.vito_pellegrin, 1934–1998, living). Powder man. The key in a dead body's coat is a safety problem and a confession.
- **Gina Pellegrin** (p.gina_pellegrin, 1958–, living). Name-chalker, later keeper of the closed cut. In 1980 she offers Louis's body a wage for Lou's unworked week. In 2022 she stops chalking and asks if speech is enough.
- **Leo Pellegrin** (p.leo_pellegrin, 1982–, living). Last cutter, who leaves. Leaves the county's stone before 2022. His absence is the point of Gina's last scene. He can be met in 2008.

### Boucher

Pay envelopes, including the ones that should not exist.

- **Henri Boucher** (p.henri_boucher, 1894–1957, living). Paymaster. Suspects the survey office of turning wages into folklore.
- **Céline Boucher** (p.celine_boucher, 1922–2006, living). Widow who keeps the extra envelopes. Asks Ellis to pick a category and live in it.
- **Marc Boucher** (p.marc_boucher, 1949–2012, living). Envelope writer. A peer in the middle eras. He wants the drill log and the chalk to agree because disagreement ruins his hand.
- **Paulette Boucher** (p.paulette_boucher, 1977–, living). Refuser of blank envelopes. In the monument year she is the one who says the state does not get a soft list.

### Lamb

Lamb's Creemee, the order book, and the machine Christian Dobbs could fix in his sleep.

- **Doris Lamb** (p.doris_lamb, 1926–1990, living). Founder of Lamb's Creemee. In 1966 she hears a flavor order that belongs to a dead surveyor and a displaced life. She does not want a legend. She wants a spelling.
- **Hugh Lamb** (p.hugh_lamb, 1924–1983, living). Machine keeper. The 1938 coin wrapper is his secret and his fear.
- **Pearl Lamb** (p.pearl_lamb, 1950–, living). Keeper of the stand after Doris. The middle and late chain. She sees Christian's hands show up in Chris and does not make a joke of it.
- **Randy Lamb** (p.randy_lamb, 1973–2015, living). Pearl's son, expansionist. Wants Ellis to define the word in a way that travels.
- **Ivy Lamb** (p.ivy_lamb, 1996–, living). Pearl's granddaughter, last decision at the pullout. In 2008 she is a child with one real line. In 2022 she holds what 'last' means.

### Waite

The Quiet Household. Plates for lives displaced by Ellis's returns.

- **Esther Waite** (p.esther_waite, 1900–1970, living). First keeper of the plates. She is not worshiping Ellis. She is refusing to let the displaced go unrecorded by a house, because the office will record them wrong.
- **Harold Waite** (p.harold_waite, 1896–1962, living). Clock keeper. Stops the clock at the minute before the waking. He does not explain more than once.
- **Miriam Waite** (p.miriam_waite, 1928–2009, living). Daughter, long keeper of the household. The household's spine across five seasons. She never welcomes Ellis. She deals with the fact of the displacement.
- **Clara Waite** (p.clara_waite, 1931–1988, living). Miriam's sister, dissenter. Catches the pretty lie about Adah. She wants the plates stopped, not because she is cruel, but because she thinks memory is becoming a diet.
- **Joel Waite** (p.joel_waite, 1952–, living). Miriam's son, later keeper. Peer and victim of the practice. He decides the clock. He inherits the book.
- **Eden Waite** (p.eden_waite, 1980–, living). Joel's child, keeper in 2022. Asks the last household question. She is not Ellis's disciple.

### Keene

The grange loft, the unsent letters, and the post corner's rule.

- **Albert Keene** (p.albert_keene, 1911–1981, living). Grange master. A practical antagonist, not an enemy. Feed versus letters.
- **Sylvia Keene** (p.sylvia_keene, 1916–1996, living). Choir keeper of unsent letters. Hands Ellis the sack's dilemma. Later she hides one letter from the sack, about Bram.
- **Walter Keene** (p.walter_keene, 1940–2010, living). Post corner keeper. The dead-letter rule meets a person who is, awkwardly, the dead.
- **Faye Keene** (p.faye_keene, 1964–, living). Last choir voice. Will sing a burial and will refuse to sing a sack if the sack is only Ellis's guilt.
- **Ben Keene** (p.ben_keene, 1990–, living). Archive helper who cannot sing. In 2022 he holds the letters' last custody question.

### Rouleau

The falls crew, the night kitchen, and the count of who is on the slick rock.

- **Osier Rouleau** (p.osier_rouleau, 1918–1977, living). Falls hand. Wants every coat to be the old story so he knows the procedure. Ellis may refuse him that comfort.
- **Marie Rouleau** (p.marie_rouleau, 1921–1999, living). Night-kitchen keeper. Makes Ellis choose a table during the wage fight.
- **Denis Rouleau** (p.denis_rouleau, 1946–2017, living). Night-wheel sympathizer, later falls watcher. A worker's view of the gate across the middle years.
- **Aimée Rouleau** (p.aimee_rouleau, 1974–, living). Denis's daughter, town clerk's assistant in Vergennes. Helps and hinders the record without becoming a quest dispenser.

### Pike

The marsh, the wrong stake, and the log Queen suns on.

- **Earl Pike** (p.earl_pike, 1913–1986, living). Marsh-edge farmer. A practical threat to Queen's log. Not malicious.
- **Hada Pike** (p.hada_pike, 1917–1992, living). Queen's first human witness in the playable years. Shows Ellis the log. Is hurt, later, when Queen comes to a new body and not to her.
- **Vernon Pike** (p.vernon_pike, 1942–2008, living). Marsh hunter who wants the boundary. Wants the boundary to favor a blind. At the end he wants Queen unmanaged.
- **Lula Pike** (p.lula_pike, 1962–, living). Local biologist, state permit holder. The animal chain's adult authority in the middle and late seasons.
- **Sim Pike** (p.sim_pike, 1994–, living). Vernon's grandchild, does not hunt. Asks whether Queen's story is county or family. The last animal question.

### Seaver

Deputies of the inherited office. Fair copies. Kind errors.

- **Norma Seaver** (p.norma_seaver, 1919–2003, living). Deputy surveyor. The office's human face. She will offer Ellis a clean oath and a clean book.
- **Clark Seaver** (p.clark_seaver, 1945–2016, living). Norma's son, surveyor with insurance friends. Asks for signatures that repeat the wound at a smaller scale.
- **Willa Seaver** (p.willa_seaver, 1970–, living). Copyist who keeps the contradiction. Offers the contradictory oath. In 2022 she has a private copy and a stranger who wants the clean story.
- **Ned Seaver** (p.ned_seaver, 1992–, living). Willa's cousin, refuses the desk. Stands in the Goshen dooryard and at the copy desk as a no.

### Yorston

The ferry bell and the kitchen that faces New York without leaving Vermont.

- **Gail Yorston** (p.gail_yorston, 1925–1994, living). Larabee kitchen. A landing that is not Cal's. Proof the county has more than one shore.
- **Tom Yorston** (p.tom_yorston, 1923–1988, living). Bell ringer. Offers Ellis a practice that is cousin to the Quiet Household and not the same.
- **Pat Yorston** (p.pat_yorston, 1951–2010, living). Child of the landing kitchen, later keeper. Middle-era Shoreham voice.
- **Rose Yorston** (p.rose_yorston, 1979–, living). Bell ringer after Pat. A late witness at Shoreham, not a convert.

### Abbott

A fence, a grave, and a refusal to be redrawn.

- **Frank Abbott** (p.frank_abbott, 1907–1968, living). Whiting line farmer. Alive only in the first two seasons. Talks about the line as if it were a neighbor.
- **Bea Abbott** (p.bea_abbott, 1910–1985, living). Frank's wife, grave defender. The 1980 grave quest is hers. She will not be managed.
- **Carl Abbott** (p.carl_abbott, 1948–, living). Son, cows and right-of-way. Middle and late conflict with the Harrows. Not a villain. A user of grass.
- **Nina Abbott** (p.nina_abbott, 1975–, living). Carl's daughter, grave question's heir. Late voice on the line.

### March

Downstream milk, a cow, and a recipe that became a creemee.

- **Henry March** (p.henry_march, 1912–1974, living). Waltham dairyman, downstream. The person Ansel's counsel harms. Downstream is not an abstraction. It is Henry's morning.
- **Dolores March** (p.dolores_march, 1916–1982, living). Henry's wife, source of the maple-walnut method. Her pot becomes a county flavor if Ellis is careless. She is alive to refuse mystique.
- **Kitty March** (p.kitty_march, 1944–, living). Dolores's daughter, recipe's heir. The 1980 recipe-wage argument.

### Moss

Rennet's public life and Cress, the life that stopped the morning Ellis woke.

- **Rennet Moss** (p.rennet_moss, 1930–1952, body). Public body of Ellis in 1952, hired rodman. The first playable wearing. Neighbors keep saying Rennet. Ellis answers.
- **Cress Moss** (p.cress_moss, 1930–1952, displaced). The displaced continuation of Rennet's life. The person the Quiet Household sets a plate for in 1952. Not a villain and not a costume.

### Smollet

Ada's teaching life and Adah, spelled the way the mother spelled it.

- **Ada Smollet** (p.ada_smollet, 1942–1966, body). Public body of Ellis in 1966, schoolteacher. Second playable life. Maeve, Cal, and Ansel meet this face inside their changed lives.
- **Adah Smollet** (p.adah_smollet, 1942–1966, displaced). Displaced continuation of Ada, spelled as her mother spelled it. The second plate. Clara knows the difference between Adah's want and a pretty one.

### Pell

Louis's body, raised on quarry soup, and Lou, who had planned to leave.

- **Louis Pell** (p.louis_pell, 1956–1980, body). Public body of Ellis in 1980, quarry cook's son. Third wearing. The cut recognizes the body and does not recognize the will.
- **Lou Pell** (p.lou_pell, 1956–1980, displaced). Displaced continuation of Louis. The life that was about to get out. Ellis's presence keeps the body at the stone.

### Greer

Hannah's bookkeeping and Nan, who wanted the landing and not the office.

- **Hannah Greer** (p.hannah_greer, 1970–1994, body). Public body of Ellis in 1994, landing bookkeeper. Fourth wearing. The oath is offered to this mouth.
- **Nan Greer** (p.nan_greer, 1970–1994, displaced). Displaced continuation of Hannah. The east-room bed in 1994 is made for her.

### Dobbs

Chris's public hands and Christian, who was going to stay a mechanic.

- **Chris Dobbs** (p.chris_dobbs, 1984–2008, body). Public body of Ellis in 2008, mechanic of whatever leaks. Fifth wearing. Pearl sees Christian in the wrench hold.
- **Christian Dobbs** (p.christian_dobbs, 1984–2008, displaced). Displaced continuation of Chris. The household cooks his meal. The stand misses his hands without having a theology.

### Keel

Rowan's body and Maren Keel, the name on the certificate the household kept.

- **Rowan Keel** (p.rowan_keel, 1998–, body). Public body of Ellis in 2022. Sixth wearing. The household knew this one was coming and still set a plate.
- **Maren Keel** (p.maren_keel, 1998–2022, displaced). Displaced continuation of Rowan, name on the certificate the household kept. The last plate. Eden may release the name rather than keep it.

### Unaffiliated

People who are fully in the story and not in a principal house.

- **Arthur Iles** (p.arthur_iles, 1908–1971, living). Weybridge veterinarian. Makes Ellis choose a barn. Does not thank Ellis for the philosophy.
- **Evan Dunn** (p.evan_dunn, 1926–1990, living). Hired man using a dead cutter's name. A living misuse of the quarry's dead. Ellis can strip him and also strip his wages.
- **Agnes Holt** (p.agnes_holt, 1918–1976, living). Tenant in the Marble Works buildings. Competes with the wheel for an hour of water and an hour of quiet.
- **Pauline Ester** (p.pauline_ester, 1933–2011, living). Geologist who works the cut, not a campus office. The scientific hand on the Marble Vein's stone. Ellis must not turn her into a villain or a priest.
- **Redmond Mahey** (p.redmond_mahey, 1920–1984, living). Shoreham smith. Can unmake the powder key. He does not do quests. He does a burn.
- **Rita Cole** (p.rita_cole, 1955–, living). Lincoln road crew. The slide quest. She demands an order of clearing.
- **Nan Pettis** (p.nan_pettis, 1944–2001, living). Person living in the grange during a storm. Not a delivery objective. A person in a room Albert wants for feed.
- **Louisa Garrett** (p.louisa_garrett, 1940–2018, living). Health inspector who loved a flavor. Can close Lamb's. Her sister's love of maple-walnut is a fact, not a lever she enjoys pulling.
- **Allan Briggs** (p.allan_briggs, 1959–, living). State road crew, right-of-way. The bench. He will move it unless spoken to as a person with a manual.
- **Sadie Burnham** (p.sadie_burnham, 1924–2000, living). Leicester widow with ten extra feet. Norma's kindness sits in Sadie's garden.
- **Constance Daly** (p.constance_daly, 1910–1978, living). Orwell schoolteacher. Wants Cress's slate for a class. She can be refused without being humiliated as a type.
- **Kit Downing** (p.kit_downing, 1938–2004, living). Scion seller, June's old friend. Sells June's scion at the exchange. A philosophy, not a theft with a cackling tone.
- **Cora Belden** (p.cora_belden, 1944–, living). Weybridge horse keeper, neighbor to the Morgan farm country. Asks for a witness, not a buyer. No economy minigame. A sentence about a mare.
- **Alma Gray** (p.alma_gray, 1948–, living). Goshen dooryard keeper. The corner post is one foot inside her life.

## Quest catalog

Chains first. Stage identifiers are not separate quests. Standalones follow. Discovery is quoted from the scene.


### The Bridge That Was Promised

`q.chain.bridge`. Across seventy years the Vermont landing of the Lake Champlain Bridge asks what was promised: a pier that would be told on, a brother who would be named, a plaque that would not comfort itself, a warning before the closure, and a sentence that outlives the steel.

Ending: If the promise is named as a sentence, the new span cannot launder the wound. If it is named as a span, the county gets to feel finished. Neither replaces Ellis's ending. Both tell that ending whether the shore was honest.

- **The Pier and the Pencil** `st.bridge.e0` — E0, Vermont abutment, Addison. At low water the chalk dusts off the Vermont abutment if you drag a thumb. Bram is already there with the pencil behind his ear. No one posts a notice.
- **Say the Name Before Business** `st.bridge.e1` — E1, Vermont abutment, Addison. The 1966 toll shed is the same shed. Cal does not hail you. He waits to see whether the new face walks to the crack without being shown.
- **The Plaque With the Wrong Names** `st.bridge.e3` — E3, Chimney Point landing, Addison. The plaque draft is tacked inside the toll shed that no longer takes tolls. You see it because you duck in out of the lake wind, not because a sign tells you to care.
- **The Summer Before the Closure** `st.bridge.e4` — E4, Vermont abutment, Addison. Noah has a hand on the rail and is not performing awe. Lena has the old log open to a page that is not today's. The concrete under the jacket, where the jacket has cracked, powders if you touch it.
- **What the Promise Was** `st.bridge.e5` — E5, Chimney Point landing, Addison. You are Rowan, standing on the Vermont approach of the replacement span. Traffic works. Noah has the old log and the new plaque side by side on the hood of a truck. Nobody is lost. That is the problem.

### The Orchard Inheritance

`q.chain.orchard`. The south-block orchard is the silt Ivo sent onto Harrow ground. Maeve's second life is the fourteen years that choice built. Nell inherits trees or a fight. Asa asks whether grafting itself should end.

Ending: A stopped row lets the ending of the county be about a place that is finished. A continued row lets the ending admit that skill keeps the wound horticultural. Neither is absolution.

- **The Stake in the South Block** `st.orchard.e0` — E0, South-block orchard, New Haven. After a rain the south block shows a cleaner line of trunks than the silt would have planted. The stake is cold under your hand before Maeve speaks.
- **The Row She Already Lived** `st.orchard.e1` — E1, South-block orchard, New Haven. The south block in 1966 is either labeled in Maeve's hand on the end posts, or it is posted with a county notice she has torn and nailed back up, angry, more than once. You see the posts before you see her.
- **Cider and the Buyer** `st.orchard.e2` — E2, South-block orchard, New Haven. The cider smell reaches the road before the offer does. Kit Downing's car is pointed at the south block as if the block were already a lot.
- **Two Maps in the Attic** `st.orchard.e3` — E3, Harrow homestead, New Haven. The attic smell is cedar and old apples. Nell has the maps open on the floor because the table is too honest. You climbed because the hatch was already up.
- **Stop Grafting** `st.orchard.e5` — E5, South-block orchard, New Haven. The knife is on the ladder, not offered. Asa is already in the third row. He does not call you over. The work is audible.

### The Choir of Unsent Letters

`q.chain.letters`. A sack of letters people paid not to send moves from Sylvia's loft through law, a single tired voice, and a boy who cannot sing. The choir is either the singing or the keeping.

Ending: If the letters go public, the ending of the county has strangers holding unsent fear. If they stay kept, the ending has a family cupboard and no performance. Ash, if chosen earlier, means the ending cannot quote them.

- **The Sack Above the Feed** `st.letters.e0` — E0, Keene loft, Cornwall. The grange loft smells like paper and grain. Sylvia has the sack on the choir chair, not hidden. You climbed because the hatch was open and someone was humming without words.
- **Feed, Law, and Paper** `st.letters.e1` — E1, Keene loft, Cornwall. A bucket is already under the east eave. Walter's rule-card is tucked in the sack's string, which means he has been here and not taken it. Yet.
- **One Voice, Tired** `st.letters.e3` — E3, Keene loft, Cornwall. One chair is set. The others are stacked. Faye is humming a name and stops when the hatch opens, not as a performance, as a person caught working.
- **The Keeping or the Singing** `st.letters.e5` — E5, Keene loft, Cornwall. Damp has cockled the top envelope. Ben has a pencil behind his ear and no tune. The petition is a photocopy on the stair, weighted with a stone.

### The Last Creemee Stand

`q.chain.creemee`. Lamb's on Route 17 begins as a spelling in an order book, becomes a fight over whether creemee is a place, survives or spends its last summer before the bridge closure, and ends with Ivy deciding what last means.

Ending: A rite keeps the pullout as a dated kindness. A book in a kitchen keeps the names without the gravel. A word that left the county cannot be called back by nostalgia. The ending may mention the stand only in the mode this chain earned.

- **The Order as Spoken** `st.creemee.e1` — E1, Lamb's Creemee, Addison. The machine is new enough to still smell like the crate it came in. Doris has the book open to a blank line and is not performing nostalgia. A customer has just walked off without repeating the name.
- **Place or Product** `st.creemee.e3` — E3, Lamb's Creemee, Addison. Randy has a blank card and a truck brochure on the same napkin holder. Pearl has not let him write. The window is open. You are in the way of a cone and a definition.
- **The Wrench and the Summer** `st.creemee.e4` — E4, Lamb's Creemee, Addison. The compressor knocks. Pearl says nothing religious. She says the intake is dirty and then she goes still, because the way the brush is held is a dead plan walking around.
- **What Last Means** `st.creemee.e5` — E5, Lamb's Creemee, Addison. The boards are off one window or they aren't, depending on nothing mystical: on whether she brought a screwdriver. She has the book under her arm. Traffic on the new bridge is a rumor from here, not a view you need.

### The Quarry Workers' Names

`q.chain.quarry`. Chalk under a Bristol overhang, an unrealized name near powder, a wage for a week Lou did not work, and a closed cut where Gina brings no chalk.

Ending: The ending may speak three names, cite a book, or admit the rain. It may not pretend the monument was always the workers.

- **Before the Rain** `st.quarry.e0` — E0, The overhang cut, Bristol. You are under the overhang because the first drops hit the road below. The chalk is fresh. Marco does not offer you a tour.
- **The Name That Never Worked** `st.quarry.e1` — E1, The overhang cut, Bristol. The name is lower than the others, in a hand that isn't Marco's. Vito has a wet rag and has not used it. That restraint is the scene.
- **The Envelope for a Week Not Worked** `st.quarry.e2` — E2, The overhang cut, Bristol. Envelope day. The pot is salted. Gina does not hand you the envelope. She sets it on the rock where Lou would have refused it.
- **No Chalk** `st.quarry.e5` — E5, The overhang cut, Bristol. The overhang is darker without fresh chalk. Gina's hands are empty on purpose. You notice the emptiness before she explains it.

### The Animal That Remembers

`q.chain.animal`. Queen, a snapping turtle notched by Ivo, forces choices about hay, hurt, numbers, and whether her story is county or family. She is never a judge.

Ending: The ending may mention Queen only at the scale chosen: a plain public note or a shrinking kitchen story. It may not make her the Vein's priest.

- **The Log and the Mower** `st.animal.e0` — E0, Dead Creek log, Panton. The log is warm. Queen is on it, ugly and specific. Hada does not call you over with wonder. She says the mower is coming at noon.
- **She Walks Past the Boot** `st.animal.e1` — E1, Dead Creek log, Panton. Hada is already at the log with her boot turned out, the way you stand when you expect an animal to come to you. Queen is on the bank, pointed wrong.
- **Notch or Number** `st.animal.e2` — E2, Dead Creek log, Panton. Lula has the pamphlet folded too many times. Vernon has a blind in mind. Queen is half in the water, not performing arrival.
- **County Fact or Family Fact** `st.animal.e5` — E5, Dead Creek log, Panton. Sim is at the log or at the wrong pond, not at a sign. There is no brochure yet. That is what they are refusing in advance.

### The Flood Book

`q.chain.floodbook`. The flood book's two sentences are kept, cleaned, or carded, then wetted down to one surviving ink, offered or refused as precedent for a smaller gate, stored or not as a spare, and finally signed or left unfinished while both voices speak.

Ending: A single signature lets an ending feel clean. Both or neither keeps the wound as one event with two true sentences. A spare in Salisbury and a citation in 1980 change what a stranger can quote. The ending should not add a third mercy the book was denied.

- **The Page That Hurts** `st.flood.e0` — E0, County survey room, Middlebury. You are in the Court Street room because the door is propped with a brick and the page is already drying on a towel. Nobody sent a rodman. Norma is ashamed of the towel. Gordon is ashamed of you. The two sentences are visible without a request.
- **Which Ink Dries** `st.flood.e1` — E1, County survey room, Middlebury. The smell of wet paper is in the stair before anyone speaks. Clark has the blotter in his hand and has not used it. The hearing is an hour off, which is why he is sweating and why Norma has not yet performed calm. You walked in because the brick was in the door again.
- **A Smaller Gate** `st.flood.e2` — E2, County survey room, Middlebury. Clark has the book open to the dry sentence and a culvert sketch beside it, unasked. Ruth is in the room because she followed the sketch, not because anyone called a meeting. The brick is in the door. The sketch is the discovery.
- **The Outlet Copy** `st.flood.e4` — E4, Outlet shed, Salisbury. The shed smells like dry cedar and lake outlet, not like a shrine. Willa has the flood book in a waxed cloth on a crate. Clark drove because the Court Street cellar is ankle-wet. Nobody posted a notice. The crate is the whole invitation.
- **Both Accounts** `st.flood.e5` — E5, County survey room, Middlebury. Owen has the book on the feed-store side of his life, wrapped in a clean cloth he resents. He puts it on the survey table as a refusal, not an inheritance.

### The Quiet Household

`q.chain.household`. The Waite house in Orwell keeps plates, a stopped clock, a cloth book, and an east-room bed for lives displaced when Ellis wakes in a body. Across five seasons the house decides whether to feed that fact, write it truly, surrender it to the office, use the bed, and finally dry the plates or keep spending groceries.

Ending: A dried rack means the returns no longer get a kitchen. A continued setting means the cost stays edible and local. A book in the office means the names can be cited; a book in the drawer means they stay housekeeping. The bed's use, laundry, or refusal is a 2008 fact Eden can remember without turning it into a vigil. None of these are a romance and none of them crown Ellis. They change what a final account is allowed to do with Orwell.

- **The Plate That Is Not a Trick** `st.house.e0` — E0, The Quiet Household, Orwell. Rennet's feet take the Orwell road without a summons. The Waite door is unlatched because Esther cooks with it open, not because anyone is expected. A plate is served. The hall clock is stopped. No one at the table calls it a welcome.
- **One Inconvenient Want** `st.house.e1` — E1, The Quiet Household, Orwell. The second plate is already a problem when Ada reaches the Orwell house. Esther has the book open to a blank line and Clara has the pen uncapped, as if they argued about the pen before the door. Nobody sent for a teacher. The damper in the school's story is not yet a sentence.
- **Measurements or Housekeeping** `st.house.e3` — E3, The Quiet Household, Orwell. The book is on the kitchen table in Orwell because Miriam took it out of the drawer before Hannah arrived. Joel has not sat down. The office is not in the room. The choice is visible as cloth, names, and two pairs of hands that disagree about what a record is for.
- **The Bed Made for Someone Else** `st.house.e4` — E4, East room, Orwell. The east-room lamp is already lit when Chris comes up from the kitchen. The bed is made with hospital corners that predate the visit. Eden is sitting on the trunk so the bed cannot be casually used. Miriam is in the chair because standing is expensive. Nobody offered a tour.
- **Say Them Once and Dry the Plates** `st.house.e5` — E5, The Quiet Household, Orwell. Eden has the plates in the rack, not on the table, and Joel has said out loud that keeping them was obedience. The drawer is open to Maren Keel's certificate. The pasture below the house runs to a ditch that counts as water in a dry week. No one is invited to a ceremony. The rack is simply not empty yet.

### Standalone encounters

- **The Second Gate** `q.the_second_gate` — E1, Lower gate at the pulp mill, Weybridge. The race at the Weybridge pulp mill sounds different if you knew it in 1952. Nobody sends you. The pin is still on the left, and a younger woman is counting boards without looking up. Outcomes: Ellis is barred from the pin. The rebuilt gate stands as Ansel's work, not a reunion. / Ansel allows the knowledge of the meadow and still forbids Ellis's hands on the pin. / Ada keeps the mill's counsel. The lie gets another fourteen years of handwriting. / The counsel breaks in 1966, too late to be the original mercy and early enough to mark the book.
- **Frost on the Cistern** `q.frost_cistern` — E0, Homestead cistern, New Haven. The frost on the homestead cistern between the New Haven house and the orchard has drawn a ring that is older than this morning. Lottie has the cup ready and Maeve is already impatient with anything that sounds like weather dressed up as feeling. Outcomes: The New Haven cistern is sealed with the 1927 silt under the lid. Lottie Harrow has her number. Maeve Harrow has been met and has refused to turn the frost into a poem. / Ellis drank the cistern at New Haven and named the taste in front of Lottie Harrow and Maeve Harrow. The frost ring is no longer an unnamed mark. Maeve still got no poem. / A spoon of 1927 silt leaves the New Haven cistern toward the survey record. Lottie Harrow counted it. Maeve Harrow allowed the sample and refused the poem.
- **Wrong Boots** `q.wrong_boots` — E0, Harrow homestead, New Haven. The boot room still smells of wet wool and orchard mud. One pair is not Samuel's and not this year's hire. The left peg is loose in a way Rennet's hand knows before the eye does, and Samuel has already seen that. Outcomes: Rennet Moss wears Ivo Perch's last boots out of the Harrow boot room peg. Samuel Harrow watched the hands and let the wearing stand without sending the boots anywhere else. / Samuel Harrow wraps Ivo Perch's boots in the New Haven boot room and the return to Helen Perch is decided there. No delivery is played. The peg is empty by a sentence, not an errand. / Ivo Perch's last boots are burned in the Harrow kitchen stove. Samuel Harrow witnessed it from the boot room door. Nothing of the leather is left to wear or to return.
- **Downstream Milk** `q.neighbor_milk` — E0, March meadow, Waltham. The cans in Henry March's meadow shed are warm in a way a March morning in Waltham should not allow. He has his hand on the cooler latch. Dolores is in the doorway with the cow still in her sentence, refusing to let the milk become the whole animal. Outcomes: Ellis told Henry March that the night wheel changed the hours of his Waltham milk. The cooler is spared a false blame. The downstream telling is now a fact, and the mill's counsel is not. / Henry March is left blaming his cooler for the warm milk in Waltham. The night wheel is not said. The mill's counsel holds, and Dolores's distinction does not become the accusation.
- **The Shut Road** `q.lambing_shut_road` — E0, Hill barns, Weybridge. The town road is a trench of mud. Arthur's bag is already in his fist and his other hand has the tremor he trusts more than speeches. Two barns sit on the Weybridge hill, and only one of them can be the trip. Outcomes: Arthur Iles goes to the upper Weybridge barn because it holds more animals. The lower ewe is left. He refused to glue the two barns into one moral object, and Ellis only pointed. / Arthur Iles goes to the lower Weybridge barn for the ewe they cannot replace. The upper barn's greater number waits. The two barns stay two decisions, and only one was walked.
- **The Hired Man's Name** `q.hired_man_name` — E0, Harrow homestead, New Haven. The hire sheet in the New Haven yard does not say Evan Dunn. It says a cutter who is already dead in Bristol, and the man answering to it is alive, ashamed, and practical about the weather window on the hay. Outcomes: The dead Bristol cutter's name is stripped off Evan Dunn in the New Haven yard, and Samuel Harrow is told there why the hay will be late. The telling is not a later errand. / Evan Dunn keeps the dead Bristol cutter's name so the New Haven hay is not late. Samuel Harrow is not given the reason. A dead man's wage-name remains on a living back.
- **The Untolled Night** `q.untolled_night` — E0, Chimney Point landing, Addison. The log on the Addison shore is short a crossing that the bowls in Ida's kitchen already know about. Cal has the book open on the Vermont landing. The far shore is not the work. The abutment and the page are. Outcomes: The untolled crossing is written into the Chimney Point log. Ida Voss's feeding remains kind, and Cal Voss gets an honest book. The Vermont landing has been met. The pier is untouched. / The crossing stays out of the Chimney Point log. Ida Voss's feeding is the kindness that replaced the line. Cal Voss accepts a book that is short, and he has been met on the Vermont shore. / Cal Voss closes the Chimney Point landing for the night. The log is not completed and not lied in. Ida keeps the feeding she already did. The pier is not judged.
- **Ice Judgment** `q.ice_judgment` — E1, Chimney Point landing, Addison. The talk on the Addison shore is about ice, not about a reunion. Cal is older in the face and in the patience. The 1929 bridge's Vermont side is the only ground in play. The channel is a rumor with a dead man already in it. Outcomes: Ellis told the Vermont shore at Chimney Point that the ice toward the channel is unsafe. Cal Voss let the warning stand without a reunion. Peter Voss's old confidence is the contrast, not the script. / Ellis refused to judge the ice at Chimney Point. Cal Voss did not turn the refusal into a reunion. The Vermont shore keeps the rumor of a crossing, and no warning was added.
- **The Ferry Bell** `q.ferry_bell` — E0, Larabee's Point, Shoreham. The rope is in Tom's hand on the Shoreham landing. The bell is not a church and not a marker. Gail is on the dock with a kitchen behind her and a reason she has already chosen not to hush him. Outcomes: Tom Yorston stops ringing the Larabee's Point bell for the dead. Gail Yorston lets the quiet happen even though she thinks it turns the lake into scenery. Peter Voss is not named in the air. / Ellis rang the Larabee bell once with Tom Yorston and said Peter Voss on the dock. Gail allowed the sound. The practice was joined for a named dead man, not turned into a study. / The bell leaves the Larabee's Point landing for Gail Yorston's kitchen by a decision finished on the dock. Tom Yorston accepts the move. The dead are not rung over open water anymore.
- **The Unowned Crate** `q.apple_crate` — E2, Chimney Point landing, Addison. The slats smell like a cold orchard and the paper on them is trying to be a county fact. Lena has the log open and her patience limited to objects. The south block's stake is being used as a seller's manners. She will not haunt the page. Outcomes: The false bill on the Harrow apple crate is destroyed at Chimney Point. Lena Voss logs a crate and refuses a haunting. The county stake is not allowed to act like a seller of the south block. / Lena Voss honors the bill and logs the Harrow apples as a sale at Chimney Point. The county stake's claim on the south block is accepted as paper, not decorated into a ghost story. / The bill is set aside for Nell Harrow without anyone leaving Chimney Point. Lena logs the crate and the hold. The sale is neither honored nor destroyed.
- **The Night Wheel** `q.night_wheel` — E0, Lower gate at the pulp mill, Weybridge. The lower gate at the pulp mill is already set for a dark run. Ansel talks to the wheel as a witness. Eli is young and awake past his own morning. The left-hand pin is the fact under their hands, not a relic Ellis gets to preach. Outcomes: The night wheel is told to the downstream meadow. Eli Demerritt leaves the Weybridge gate because the truth was said. Ansel is met. Clarice is left to write the night instead of a neat lie. / Ellis keeps the Demerritt counsel. The Weybridge night wheel is not told to Henry March. Eli stays. Ansel has been met at the left pin, and Clarice must still face her book.
- **Flour and Marble** `q.flour_and_marble` — E0, Marble Works race, Middlebury. The third step above the race is dark at the edges and damp in the middle of a dry evening. Agnes talks about rent, dust, and a cough. She is not a figure for marble. She is a tenant who can point at a board. Outcomes: The night hour of the Marble Works race is given to Agnes Holt's floor. The third step is surveyed instead of the proud wheel. Her boy's cough is treated as the reason, not the poetry. / The race hour stays with the wheel. Agnes Holt's damp third step in the Marble Works is seen and not given the night. The proud machine keeps the water. Ansel never speaks.
- **The Eel Passage** `q.eel_passage` — E2, Lower gate at the pulp mill, Weybridge. The gate is pinned the way Ruth pinned it. Eels are a generation in the creek, not a symbol of anyone's grandfather. She talks like a person who inherited a machine and a lawsuit and will not inherit a silence. Outcomes: Ruth Demerritt cuts an eel passage at the Weybridge gate and spends her head of water. She says the loss aloud. The act is not accepted as Ellis's penance for an older pin. / Ruth keeps the head of water at the Weybridge mill. The eel passage is not cut. She names the creek's lost generation herself and does not hand the guilt to Ellis.
- **Strike Soup** `q.strike_soup` — E1, Rouleau night kitchen, Vergennes. The night kitchen on South Water Street is loud with spoons and quiet about the office above. Marie ladles as an argument. Denis watches who will leave before the soup turns honest. The body in the doorway is Ada's, and the hours are the real wage. Outcomes: Ellis eats in Marie Rouleau's Vergennes kitchen and stays for the bitter part Denis required. The night hours are counted with the crew. The office does not get this bowl. / From Marie's kitchen doorway Ellis chooses the upstairs office table. Denis forbids a later return for conscience. The night hours being written out are the side Ada is counted on.
- **Clark's Signature** `q.clark_promotion` — E3, County survey room, Middlebury. The survey room off Court Street has one signature line and a culvert estimate, not a theology. Clark is smooth and specific. The clean certification is a tool he can spend on Leicester if Hannah's hand agrees. Outcomes: Hannah Greer's living hand re-signs the clean certification. Clark Seaver's Leicester culvert becomes fundable. The Middlebury office gets the smaller gate it asked for, without a flood-book sermon. / Ellis refuses Clark Seaver's re-signature. The Leicester culvert is not fundable by Hannah's hand. Clark keeps the blank and is prepared to call the refusal fear. The flood book stays unpreached.
- **The Dust Counts** `q.marble_dust` — E2, The overhang cut, Bristol. Louis Pell is at the overhang because this body comes from the Bristol cut, and Vito Pellegrin stops him under the face with a folded sheet. The counts are not a speech about powder. They are the week's dust, unposted, and Gina Pellegrin is already watching who will be allowed to see them. Outcomes: Ellis has the dust counts posted at the Bristol cut, where the wives can read them. Vito Pellegrin treats the sheet as exposure, not poetry, and Norma Seaver's delay does not cover the nail. / The dust counts are handed only to the workers at the Bristol cut. They are not posted, so they can be lost on purpose, and the wives do not get a look at the week's numbers. / Norma Seaver's delay is obeyed. The dust counts stay unposted and are not handed to the workers, so neither the wives nor the cutters have the week's numbers from the Bristol cut.
- **The Powder Key** `q.powder_key` — E1, Powder shack, Bristol. Ada Smollet is at the powder shack because the coat from Helen Perch's estate still has a key in it, and Vito Pellegrin will not talk about that key anywhere but here. Redmond Mahey is already on the hill with forge tongs, not waiting in Shoreham for a later errand. Outcomes: Ada uses the powder-shack key in daylight at the Bristol door, with Vito Pellegrin and Redmond Mahey present. The key is no longer an unused secret from Helen Perch's estate. / The powder key is returned unused to Vito Pellegrin at the shack. It does not open the lock, and Redmond Mahey does not spoil it. The coat from Helen's estate is empty of that bit. / Redmond Mahey spoils the powder key with his tongs at the Bristol shack, not back in Shoreham. Vito Pellegrin watches the bit die as a working key, and the door stays on Vito's own lock.
- **The Face That Folds** `q.college_cores` — E2, The overhang cut, Bristol. Louis Pell comes up under the overhang and finds Pauline Ester already set up at the named face, bit still packed until someone answers her. The chalk is Gina Pellegrin's habit even when Gina is not the one holding the drill, and Pauline is asking the cut, not a lecture hall. Outcomes: Pauline Ester moves her bit to a Bristol face that shows the fold without chalked names above it. Ellis explains the difference in plain stone language, and the name-face is not cored. / Coring is refused outright. Pauline Ester packs her bit and drills neither the chalked face nor another face at the Bristol cut. She accepts the no without being made a villain. / Ellis allows Pauline Ester to core the name-face at the Bristol cut. The chalked names stay above the hole, and she treats the stone as stone without mocking the names.
- **The Extra Envelopes** `q.widow_envelopes` — E1, Pellegrin porch, Starksboro. Ada Smollet is asked onto the Starksboro porch where the envelopes come when the Bristol shack is closed. Céline Boucher has two piles on the rail and will not blur them for company. Marc is there with the pen that makes wages look owed. Outcomes: The extra envelopes on the Starksboro porch are kept as memorial for men the flood took before hiring. Marc does not beautify the unworked week into a wage, and the piles stay unmixed. / Ellis stops the extra envelopes as fraud. Marc Boucher does not write the unworked week into a beautiful debt, and Céline does not keep a memorial that behaves like pay on the Starksboro porch.
- **The Notch Slide** `q.notch_slide` — E3, Notch slide, Lincoln. Hannah Greer comes up into the Lincoln notch because the road is shut with mud and rock, not because a page sent her. Rita Cole is on the loader with one dry window of work, and the school-bus road and the quarry lane are both waiting on a sentence. Outcomes: Rita Cole clears the school-bus road first at the Lincoln slide. The quarry lane toward the cut waits, and the flood book is not what decided that one opening of the loader. / Rita Cole clears the quarry lane first. The Lincoln school-bus road stays blocked through the loader window, and Ellis owns that order in speech rather than in the flood book.
- **Grace with a Wrong Name** `q.supper_flinch` — E0, Quarry supper hall, Bristol. Rennet Moss is at the long tables because the cut feeds its people in this hall above Bristol, and Elena Pellegrin has already decided the grace will contain a test. Marco Pellegrin is seated where he can see a flinch without needing the monument out in the village to explain it. Outcomes: Ellis flinches at the grace and then says the truth of the name he knows: the unwaged chalk name, not the paid cutters left off the Bristol monument. Marco Pellegrin sees the flinch become speech. / Ellis holds still through Elena's grace while knowing the unwaged name. The stillness is not ignorance. It costs the hall a spoken distinction and leaves Elena free to use the test again.
- **The Grange in a Storm** `q.grange_in_a_storm` — E1, Keene loft, Cornwall. Ada Smollet comes into the Cornwall grange because the storm has already put Nan Pettis in the loft and Albert Keene at the foot of the stair. Nobody sent a sack or a letter to be sorted. The feed and the fire fear are in the room with a living person. Outcomes: Nan Pettis stays the night in the Cornwall loft. The feed comes second and is not moved up over her, and she is not handled as a letter or a sack of grain. / Nan Pettis is turned out at the Cornwall stair before the feed is moved up. The act is done in her hearing, not as a delivery to some other shelter, and Albert takes the loft for grain.
- **The Dead-Letter Rule** `q.postmistress_rule` — E2, Post corner, Cornwall. Louis Pell is at the Cornwall post corner for ordinary business and finds a letter under Walter Keene's hand addressed to Ivo Perch. The rule is taped to the wood. The continuity Ellis feels is not a license Walter has agreed to honor. Outcomes: Walter Keene bends the dead-letter rule so the letter to Ivo Perch can be claimed at the Cornwall counter. Ellis does not carry it away. The exception stays on the wood. / The dead-letter rule holds. The letter addressed to Ivo Perch stays in Walter Keene's dead drawer at the Cornwall counter, and Ellis does not carry it anywhere.
- **One Voice at the Burial** `q.one_voice_left` — E3, Larabee's Point, Shoreham. Hannah Greer comes to Larabee's Point because Gail Yorston asked, this week, while she can still be selfish about her own service. Faye Keene is the one voice on the dock. There is no choir waiting in the reeds to multiply her. Outcomes: Faye Keene sings Gail Yorston's unsent line once at Larabee's Point: the landing fed you, and the cold was never polite. She remains one voice and is not turned into a choir. / An ordinary hymn is chosen while Gail Yorston can still be selfish. Her unsent line stays unsent, and Faye Keene sings as one voice at Larabee's Point rather than as a choir.
- **Ink in the Cold** `q.ink_in_the_cold` — E0, Notch turn, Ripton. Rennet Moss is stopped at the notch turn on the Ripton road, not at a campus and not in the survey room, because Norma Seaver will only hand the card where the wind can take it. Two sentences are already arguing for the ink. Outcomes: At the Ripton pull-off, Ellis writes the certification that the gate remained shut. The margin is heard and not inked. Norma's card leaves with the record's sentence. / Ellis writes the margin on Norma's card at the Ripton pull-off: opened, late. The certification is refused. The hands' account is the ink that dries. / Ellis writes neither the certification nor the margin. The card at the Ripton pull-off carries a real weather sentence: cold wind at the pull-off, and the card still in the hand.
- **The Cooler and the Sister** `q.health_and_sister` — E3, Lamb's Creemee, Addison. Hannah Greer is at Lamb's because the cooler is already wrong on a day the Lake Champlain Bridge is feeding the pullout traffic. Louisa Garrett is the inspector in the doorway. Pearl Lamb is behind the machine, and the sister is not a lever sitting on the counter. Outcomes: Louisa Garrett closes Lamb's Creemee the day of the inspection. The sister is not used as a bargain. Pearl hears the closing as a book, not as a story about maple-walnut. / Lamb's stays open on a spoken promise: the cooler will be right before tomorrow's cream. No part is fetched, and Louisa's sister is not used to purchase the delay.
- **The Boarded Window** `q.offseason_glass` — E5, Lamb's Creemee, Addison. Rowan Keel comes to the Addison pullout because the boards are up or about to be, and Ivy Lamb is the one who can see the lot, the bridge traffic, and her own kitchen from the same gravel. Nothing past that gravel needs a decision she cannot see. Outcomes: Ivy opens the boarded service window for one night as a rite, not a business. The order book stays in her kitchen, and the Addison pullout does not become a revival story. / The service window stays shut. Ivy keeps the stand closed and the order book in her kitchen, and she refuses to treat the boards as a problem Rowan is required to solve.
- **The Recipe's Wage** `q.recipe_wage` — E2, Lamb's Creemee, Addison. Louis Pell is at the Addison pullout because the maple-walnut card is on the counter unsigned, and Kitty March has come up from Waltham to stand in the gravel with Pearl. The machine is not the argument. The sentence on the card is. Outcomes: The maple-walnut card publicly names Dolores March, and Pearl acknowledges the season's cream in speech. Kitty does not take the machine. The recipe stays attributed to the Waltham woman who made it. / Pearl keeps the maple-walnut recipe as stand property. The card is labeled as Lamb's, not as Dolores March's, and Kitty leaves without the machine and without the public sentence she wanted.
- **The Clear-Zone Bench** `q.memorial_bench` — E4, Route 7 pullout bench, Ferrisburgh. Chris Dobbs stops at the Ferrisburgh pullout because the bench is already in the clear zone and Allan Briggs is already measuring it without a funeral voice. Pearl Lamb is there because the name on the slats is Hugh, and the road does not care who is grieving. Outcomes: The memorial bench is moved out of the clear zone but kept on the Ferrisburgh pullout, still findable as Hugh Lamb's. Allan gets a place rather than a speech, and Pearl witnesses the distance. / The bench stays in the clear zone because Ellis refuses the move and accepts Allan's crash argument. Hugh Lamb's memorial remains where it is, with the risk spoken and witnessed.
- **The Coin Wrapper** `q.till_wrapper` — E2, Lamb's Creemee, Addison. Hugh Lamb sets the coin wrapper on the counter at the Addison pullout and tells Louis Pell the pencil says 1938 and Ivo. Pearl Lamb watches the till and does not reach. Nobody sent anyone. The drawer is open because Hugh opened it. Outcomes: Louis Pell opens the 1938 wrapper at Lamb's Creemee and reads Ivo Perch's amount aloud, so the confession is spoken while Hugh Lamb is still alive to hear the number. / The 1938 wrapper stays shut in Hugh Lamb's till, and Pearl Lamb hears Louis Pell leave the rattle for a dying man rather than confess Ivo Perch's amount.
- **Lula's Name on the Permit** `q.banding_name` — E3, Dead Creek log, Panton. Lula Pike meets Hannah Greer at the Dead Creek log with the permit unfolded. Queen is hauled out on the sunning log, notched the way Ivo Perch notched her as a juvenile. Lula asks for one witness before the paragraph goes out under her name. Outcomes: Lula Pike withdraws her name from the banding permit at Dead Creek, and Hannah Greer stands as the witness so the act is not a private flinch. / Lula Pike's name stays on the banding permit, including the paragraph she did not write, and Hannah Greer remains the witness to that ambition.
- **The Wrong Stake** `q.wrong_stake_marsh` — E1, Dead Creek log, Panton. Earl Pike shows Ada Smollet the iron stake and the blind it excuses. Hada Pike stands off the boards. The flood book in Middlebury still reads as if this line were settled, and correcting the iron may cost that belief. Outcomes: Ada Smollet pulls Ivo Perch's stake and resets the refuge line at Dead Creek, accepting the name of meddler and the risk to belief in the flood book. / Ada Smollet leaves Ivo Perch's stake wrong, so the hunting blind stays on the refuge side and she remains a person who knew the line.
- **The Heronry** `q.heronry` — E4, Dead Creek log, Panton. Lula Pike walks Chris Dobbs off the log road into cottonwoods at Dead Creek and shows the nests without letting the road crew see her do it. She asks for a third way, or for someone to stand still while she hates both silences. Outcomes: Lula Pike reveals the heronry to the road men, the pullout loses the cottonwoods, and the nests are saved at the cost of the secret. / The heronry stays concealed, Lula Pike keeps the secret, and the planned pullout is left to take the cottonwoods at Dead Creek. / Chris Dobbs tells the road men the 1929 bridge will not carry the traffic, so the pullout fails without the heronry being revealed.
- **The Cow at the Old Gate** `q.cow_at_the_gate` — E0, March meadow, Waltham. The March cow is at the grease-dark patch by the river meadow, nosing salt a gate left in the ground. Henry March is already talking about the knife. Dolores March is talking about reading an animal without a poem and without holiness. Outcomes: Rennet Moss says in the Waltham meadow that the March cow is kept, and Henry March accepts a lesson he wanted ended with a knife. / The butcher is spoken in the meadow, beside the March cow, and Henry March will kill her before she teaches the herd the grease-salt.
- **Bramble in the Log** `q.landing_dog` — E3, Chimney Point landing, Addison. Bramble meets Hannah Greer at the Vermont rail and goes still in a way Cal Voss has only known from stories of his father, Peter Voss. Lena Voss has the landing log open. Nobody asked the dog to remember a posture, and nobody offers a welcome. Outcomes: Cal Voss rages at Bramble's recognition of Peter Voss's stance, and Lena Voss keeps the Chimney Point log to crossings only. / Cal Voss laughs at the unwanted recognition, Lena Voss laughs first, and Bramble is not entered in the landing log as a witness. / Cal Voss writes Bramble into the landing log as a witness to the stance, knowing he has become the book, and Lena Voss reads the line aloud.
- **Ten Feet of Kindness** `q.deputy_kindness` — E2, Burnham garden, Leicester. Norma Seaver walks Louis Pell along the Leicester garden and shows the extra ten feet without a performance. Sadie Burnham has string ready and has not planted. The neighbor's silence is already the loudest fact on the line. Outcomes: Louis Pell corrects the ten feet before Sadie Burnham plants and stays to say the change was a survey correction, not her greed. / The kind wrong survey stays, Sadie Burnham keeps the ten feet, and the neighbor's silence remains the price of Norma Seaver's mercy.
- **The Line and the Grave** `q.whiting_grave` — E2, Abbott plot, Whiting. Bea Abbott meets Louis Pell at the family plot with the proposed line in a roll she will not spread on the grave. Carl Abbott has a shovel he has not used. Frank Abbott is dead and is not a voice in the yard, only the body the paper would redraw. Outcomes: The town line moves on paper, Frank Abbott becomes an Orwell man in the clerk's mouth, and Carl Abbott will dig the new mark before hay. / The line stays, Frank Abbott's grave remains in Whiting on the page and in the ground, and Carl Abbott puts the shovel down before hay.
- **Two Oaths** `q.pencil_oath` — E3, County survey room, Middlebury. Two cards sit on the table off Court Street. Norma Seaver's card is one clean sentence. Willa Seaver's card holds the certification and the late opening together. Hannah Greer is expected to swear before anyone calls the office hers. Outcomes: Hannah Greer swears Norma Seaver's clean oath, accepts the surveyor's office, and leaves the contradiction in the chest rather than on the page. / Hannah Greer swears the oath that includes both sentences, accepts the office, and makes the contradiction a public record instead of a private chest. / Hannah Greer refuses both oaths and does not accept the surveyor's office, so the chair stays unsworn rather than neatly inherited.
- **The Margin Names Helen** `q.marginalia_living` — E0, County survey room, Middlebury. The flood book is open on the Court Street table. Helen Perch has come to the office. The pencil names her. Gordon Perch stands between Rennet Moss and the sentence as if the sentence were a trick with a procedure. Outcomes: Rennet Moss confronts Helen Perch with the margin, she admits she told Ivo to keep the gate shut, and Gordon Perch calls the knowing a spent confidence. / The margin naming Helen Perch is left unread to her, Gordon Perch does not treat the spare as proof of a soul, and the book stays shut on that line. / Gordon Perch, not the pencil, tells the room that Helen told Ivo to keep the gate shut, and Helen Perch is not made to read her own name.
- **The Wet Wage Book** `q.wet_wage_book` — E2, Lower gate at the pulp mill, Weybridge. Clarice Demerritt has the wet wage book open on the lower-gate table, night on one side and day on the other. Ruth Demerritt is counting boards and will not look away. Louis Pell is asked to put a hand on a page, not to dry the spine and call the loss even. Outcomes: Louis Pell saves the night crew's ink in the wet wage book, the day side smears, and Ruth Demerritt speaks the lost count rather than inherit silence. / The day crew's numbers are saved, the night side of the wage book smears, and Ruth Demerritt keeps the night hours in her mouth instead of in ink.
- **A Copy for a Stranger** `q.fair_copy_for_a_stranger` — E5, County survey room, Middlebury. The private copy sits in the rented survey room, both sentences visible, the shut gate and the late opening. Willa Seaver has not decided whether a student should hold it. Ned Seaver wants the paper out of the talk. The student is not given a name or a chair in the record. Outcomes: Rowan Keel gives the student Willa Seaver's contradictory copy, accepting that the two sentences may become content rather than let Norma win from the grave. / The contradictory copy stays in the survey room, the student does not get it, and Norma Seaver's clean story keeps its advantage from the grave.
- **The Slate** `q.school_slate` — E1, The Quiet Household, Orwell. On the Orwell house step, Constance Daly waits with a teacher's certainty and Miriam Waite holds the slate against her skirt. Joel's writing is on top. Under it, where the cloth rubbed, Cress Moss's hand still shows. Ada is not invited in as if the house were glad. Outcomes: The slate goes to the Orwell school as a penmanship lesson, Constance Daly will say Cress Moss's name once, and Miriam Waite allows the loss without calling it kindness. / The slate stays at the Waite house, Constance Daly returns it and thinks the household is hoarding a lesson, and Miriam Waite does not offer thanks.
- **The Stopped Minute** `q.stopped_clock` — E2, The Quiet Household, Orwell. The hall clock at the Waite house in Orwell stands at the old minute. Joel Waite has the key. Miriam Waite stands where she can see both the clock and Louis Pell's hands, and she has already forbidden help. Harold Waite is dead and is not a voice in the hall. Outcomes: Joel Waite winds the hall clock past Harold's stopped minute while Louis Pell only witnesses, and Miriam Waite does not pretend her hand was required. / Joel Waite leaves Harold's clock stopped on purpose, Louis Pell witnesses without helping, and the house keeps the minute before Rennet woke.
- **Christian's Meal** `q.meal_for_christian` — E4, The Quiet Household, Orwell. You are in the Orwell kitchen because the plate is already on the table, not because anyone called you in from the road. Miriam Waite is failing and still standing at the stove. Joel Waite watches Chris's hands find the fork. The meal is hamburger, canned peas, and the heel of the store bread. Outcomes: Ellis eats Christian Dobbs's meal. The body is comforted and the plate goes into the wash with the others. / Ellis leaves Christian's plate. The food stays leftovers, and the hands do not get the comfort they expected. / Ellis cooks the meal wrong on purpose. The body is not comforted, and the household sees that the failure was chosen.
- **Today's Coat** `q.coat_at_basin` — E0, Falls basin, Vergennes. You are on the basin rock because the falls are loud and the coat is already caught in the eddy. Osier has his old book open to a year he trusts. Marie is on the same rock with flour still on her cuff, and she is not letting him write the year down yet. Outcomes: Ellis treats the coat as this week's loss and shouts for the day shift without leaving the basin. Osier closes the 1938 page. / Ellis forces the coat into the 1938 story. Osier gets his procedure, and the person missing it this week is left out of the book.
- **The Sugarhouse Acres** `q.sugarhouse_acres` — E2, Harrow sugarhouse, New Haven. The ledger is already open on the bench above the arch, and the county map is folded beside it with a pencil holding the crease. You are in the sugarhouse because the boil is going and Nell Harrow has both numbers in front of her. Nobody has to walk to a clerk for the argument to be real. Outcomes: Nell corrects the sugarhouse acres to the county map. The homestead will pay the harder, true bill. / Nell leaves the ledger acres wrong. The tax stays kind, the map stays false, and she will not call that mercy.
- **June's Wood** `q.scion_sale` — E1, Saturday exchange yard, Middlebury. The sticks are already on a crate behind the feed store, mud on the twine, a paper tag in Kit's hand. You are in the Saturday yard because that is where the wood is. Ada's shoes are in the same mud. Nothing has to be carried anywhere for the sale to be real. Outcomes: Ellis exposes the sale in the yard. Kit's buyers step back, and June's scion wood does not travel from this Saturday. / Ellis speaks the orchard stake truth in the yard as the price of stopping Kit's sale. The wood does not travel, and the stake is no longer hidden. / Ellis lets June's scion wood travel. Kit sells it cheap so it can become a tree off the Harrow row.
- **The Cows' Path** `q.intervale_cows` — E4, South-block orchard, New Haven. The cows are already on the intervale grass, and the fence that should have stopped them is lying where the high water left it. You are at the south block because Asa Harrow and Carl Abbott are both looking at the same hoof prints. The path is the argument. The paper that would describe it is not required for the grass to be decided. Outcomes: The intervale path stays with Asa. Carl turns the cows back, and the use since the flood is ended without a speech. / The path stays with Carl's cows. Asa accepts the use without calling it a gift, and the fence is not made into a legend.
- **Peter's Other Shore** `q.cousin_at_the_landing` — E4, Chimney Point landing, Addison. Irene is already on the Vermont side of Chimney Point with her coat buttoned and no bag packed for a crossing. Lena has the landing log on the rail. Cal is four years dead and not in this talk. The question is a sentence about Peter, and the lake stays where it is. Outcomes: Peter stays the landing's dead. Irene's request is refused in a full sentence, and nobody crosses the lake to soften it. / Lena releases Peter's name in a sentence from the Vermont landing. The other shore may say him, and no one makes a trip of it.
- **One Foot of Dooryard** `q.goshen_post` — E5, Gray corner post, Goshen. The post is already in the dooryard, and the chair is already beside it because that is the only level ground. You are in Goshen because Alma lives here and Ned walked up with the measurement. There is no crowd. There is one foot, one chair, and two ways to be wrong. Outcomes: The Goshen post is moved one foot. Alma's dooryard is true and smaller, and she does not forgive it out loud. / The post stays one foot inside Alma's flat. The map remains kind and false, and the chair stays usable.
- **Fourteen Winters of Mail** `q.fourteen_winters` — E5, County survey room, Middlebury. The box is already on the desk in the rented room off Court Street, tape dull, fourteen winters of envelopes inside. Owen set it down and did not offer a key, because it was never locked. You are here because he is here. The mail is not somewhere else. Outcomes: Owen opens one letter, to Louis Pell, and reads two sentences of it aloud. The rest of the fourteen winters stay sealed. / Owen opens every letter and says the addressees aloud, Rennet Moss and Ada Smollet first, then the bodies after them. / The box is burned sealed in the survey office stove. No letter is read, and Owen refuses to call the ash a cleaning.
- **The Slick Rock** `q.slick_rock` — E0, Falls basin, Vergennes. You are already at the basin lip where the count sheet is weighted with a stone. The stranger is on the slick rock in plain sight, not hidden and not a rumor. Osier Rouleau has the tally in his hand and the climb in his legs, and he is waiting for a shout rather than a lesson. Outcomes: Ellis shouts the stranger down. Osier climbs the slick rock, pulls the stranger onto the gravel, and drops the coat-count. / Ellis shouts for the coat-count. Osier finishes the tally and does not climb, and the stranger is left on the slick rock.
- **Invoice the Mare** `q.morgan_fence` — E2, Neighbor fence to the Morgan farm, Weybridge. Invoice is already in the paddock on Cora's side of the neighbor fence, and the feed bill is already in Cora's coat pocket. The girl is not in the scene. You are at the rail because Cora asked for a witness. The college farm's office is not where this is decided. Outcomes: Invoice goes to the 4-H girl. Cora keeps the feed bill angry, and Ellis is the witness who gets the blame and no share. / Invoice is sold against the feed bill at the fence. Cora will tell the girl herself, and Ellis keeps only the blame.
- **A Renter for the East Room** `q.quiet_question` — E5, East room, Orwell. Ben is already in the east-room doorway with his coat on and no speech prepared. The bed is made because the house makes it, not because tonight is a rite. You are in Orwell because Eden asked the practical question out loud: a renter, or an empty room with a name in the drawer. Outcomes: Eden rents the east room to Ben Keene. A living neighbor takes the bed, and the household practice loses the room without being mocked. / Eden keeps the east room. Ben is refused a winter there, and the refusal is named as a memorial rather than as concern.
- **Thursday or Wednesday** `q.drill_log` — E3, The overhang cut, Bristol. The log and the chalked note are already on the stone at the cut, and the jar for disagreements is already beside them. You are under the overhang because Gina and Marc are under it. Vito is not coming up to pick a column. The two days are the whole problem. Outcomes: The chalk is treated as true. The man was buried Wednesday, and the Thursday drilling stays in the jar as a lie they are keeping. / The drill log is treated as true. Thursday stands, and the Wednesday chalk is kept in the jar as disagreement rather than erased.
- **The Letter Sylvia Hid** `q.unsent_son` — E1, Keene loft, Cornwall. The envelope is already on the loft stove's cool edge, addressed to Bram and kept out of the sack on purpose. Cal is in the room because Sylvia finally could not keep the address to herself. You are above the Cornwall grange. Nobody has to carry the letter to a landing for the choice to count. Outcomes: Sylvia puts the sealed letter in Cal's hand to hold for Bram, living or not. The loft does not invent which of those he is. / Sylvia reads two sentences of the letter aloud in the loft, where Bram cannot answer. The letter is not carried to a stone or a landing. / The letter stays unopened in the loft. Cal knows it exists and is not given the sentences or the envelope.
