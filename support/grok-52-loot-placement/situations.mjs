import { countySituations } from "./county.mjs";
import { countyB } from "./county-b.mjs";
import { countyC } from "./county-c.mjs";
import { countyD } from "./county-d.mjs";
import { fragmentSituations } from "./fragment.mjs";

export const situations = [...fragmentSituations, ...countySituations, ...countyB, ...countyC, ...countyD];
