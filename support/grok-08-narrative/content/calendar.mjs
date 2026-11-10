export function effectiveDeathYear(person, flags = {}) {
  if (!person) return null;
  const overrides = person.deathOverrides || [];
  for (const o of overrides) {
    if (flags[o.ifFlag] === true) return o.deathYear;
  }
  return person.deathYear ?? null;
}

export function presentInEra(person, era, flags = {}) {
  if (!person || !era) return false;
  if (person.presence === "memory" || person.presence === "displaced") return false;
  if (person.birthYear > era.year) return false;
  const death = effectiveDeathYear(person, flags);
  if (death == null) return true;
  return death >= era.year;
}

export function ageInEra(person, era) {
  if (!era || person.birthYear == null) return null;
  return era.year - person.birthYear;
}
