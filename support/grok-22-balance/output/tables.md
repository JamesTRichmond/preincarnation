# Simulation tables

Not a playtest. Starter iron and the spacing policy. Source c737e42eb188148291438dfb8a5993d6ce2b77fa.

## Standard policy

| tier | encounter | early | middle | late |
|---|---|---|---|---|
| ordinary | mb-crow | 0 / 0.783s | 0 / 0.733s | 0 / 0.667s |
| ordinary | mb-bob | 0 / 0.967s | 0 / 1.167s | 0 / 1.1s |
| ordinary | mb-fisher | 0 / 0.9s | 0 / 1.1s | 0 / 1.05s |
| ordinary | vg-crow | 0 / 0.783s | 0 / 0.733s | 0 / 0.667s |
| ordinary | vg-wraith | 0 / 1.033s | 0 / 1.217s | 0 / 1.167s |
| ordinary | vg-fisher | 0 / 0.9s | 0 / 1.1s | 0 / 1.05s |
| ordinary | br-bob | 0 / 0.967s | 0 / 1.167s | 0 / 1.1s |
| ordinary | br-fisher | 0 / 0.9s | 0 / 1.1s | 0 / 1.05s |
| ordinary | fe-bob | 0 / 0.967s | 0 / 1.167s | 0 / 1.1s |
| ordinary | wr-crow | 0 / 0.783s | 0 / 0.733s | 0 / 0.667s |
| ordinary | ow-bob | 0 / 0.967s | 0 / 1.167s | 0 / 1.1s |
| ordinary | ru-crow | 0 / 0.783s | 0 / 0.733s | 0 / 0.667s |
| ordinary | solo-wraiths | — | 0 / 4.667s | 0 / 4.35s |
| group | mb-crow-bob | 0 / 1.183s | 0 / 1.35s | 0 / 1.283s |
| group | vg-crow-fisher | 0 / 2.217s | 0 / 2.333s | 0 / 2.133s |
| group | br-fisher-bear | 0 / 3.65s | 0 / 4.067s | 0 / 3.8s |
| group | fe-bob-bear | 0 / 2.467s | 0 / 2.9s | 0 / 2.817s |
| group | solo-wraith-sentinel | — | 0 / 2.683s | 0 / 2.933s |
| miniboss | br-bear | 0 / 2.033s | 0 / 2.2s | 0 / 2.117s |
| miniboss | fe-bear | 0 / 2.033s | 0 / 2.2s | 0 / 2.117s |
| miniboss | sa-bear-1 | 0 / 2.033s | 0 / 2.2s | 0 / 2.117s |
| miniboss | sa-bear-2 | 0 / 2.033s | 0 / 2.2s | 0 / 2.117s |
| miniboss | ow-bear | 0 / 2.033s | 0 / 2.2s | 0 / 2.117s |
| miniboss | ch-bear | 0 / 2.033s | 0 / 2.2s | 0 / 2.117s |
| miniboss | wi-bear | 0 / 2.033s | 0 / 2.2s | 0 / 2.117s |
| miniboss | solo-bear | — | 0 / 2.2s | 0 / 2.117s |
| major | quarry-sentinel-first | 0 / 2.817s | — | — |
| major | quarry-sentinel-return | — | 0 / 2.983s | — |
| major | quarry-sentinel-late | — | — | 0 / 2.867s |
| major | soloverse-sentinel | — | — | 0 / 3.1s |

## Form sweep on mb-fisher, middle upgrade ranks, standard

| form | flaw | damage | ttk | observed fisher peak |
|---|---|---|---|---|
| wanderer | cannot_rest | 0 | 1.1 | 109.699 |
| wanderer | pride | 0 | 1.133 | 109.389 |
| smuggler | cannot_rest | 0 | 1.05 | 110.101 |
| smuggler | pride | 0 | 1.067 | 110.103 |
| officer | cannot_rest | 0 | 0.9 | 99.281 |
| officer | pride | 0 | 0.933 | 99.331 |
| embryo | cannot_rest | 0 | 0.617 | 99.221 |
| embryo | pride | 0 | 0.633 | 99.225 |

Cell format is damage taken / time to kill. Assisted rows took the same damage (zero) and did not sip.
