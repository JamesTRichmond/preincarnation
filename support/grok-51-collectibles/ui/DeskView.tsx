import { laterOpen, type Action } from "../archive.ts";
import { DOCUMENTS, INVESTIGATIONS, getDocument } from "../documents.ts";
import type { Save } from "../types.ts";

export function DeskView({
  save,
  dispatch,
  docId,
  setDocId,
  when,
  setWhen,
}: {
  save: Save;
  dispatch: (action: Action) => void;
  docId: string;
  setDocId: (id: string) => void;
  when: "then" | "later";
  setWhen: (when: "then" | "later") => void;
}) {
  const doc = getDocument(docId);
  const owned = new Set(save.documents);
  const voices = save.discoveries.filter((item) => item.sourceId === docId || item.sourceId === doc?.investigationId);
  const papers = DOCUMENTS.slice().sort((a, b) => {
    const rank = (id: string, have: boolean) => {
      if (!have) return 2;
      return save.read.includes(id) ? 1 : 0;
    };
    return rank(a.id, owned.has(a.id)) - rank(b.id, owned.has(b.id));
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)_16rem]">
      <div className="order-2 min-w-0 lg:order-1">
        <h2 className="text-2xl">Papers</h2>
        <ul className="mt-2 flex max-h-80 flex-col gap-1 overflow-auto lg:max-h-none">
          {papers.map((item) => {
            const have = owned.has(item.id);
            const read = save.read.includes(item.id);
            return (
              <li key={item.id}>
                <button
                  className={`min-h-11 w-full rounded-card px-3 text-left text-sm ${
                    docId === item.id ? "bg-ink text-paper" : "bg-ink/5"
                  } ${have ? "" : "opacity-50"}`}
                  onClick={() => have && setDocId(item.id)}
                  disabled={!have}
                >
                  <span className="block font-semibold">{item.title}</span>
                  <span className="text-xs uppercase tracking-wide opacity-70">
                    {item.kind}
                    {have ? (read ? " · read" : " · unread") : " · not in the desk"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {doc && owned.has(doc.id) ? (
        <article className="order-1 rounded-card border border-ink/15 bg-paper px-4 py-5 sm:px-6 lg:order-2">
          <p className="text-xs font-semibold tracking-widest text-ink/60 uppercase">
            {doc.kind} · {doc.year} · {doc.from} to {doc.to}
          </p>
          <h2 className="mt-1 text-3xl">{doc.title}</h2>
          <p className="mt-4 whitespace-pre-wrap text-pretty text-lg leading-relaxed">{doc.body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!save.read.includes(doc.id) && (
              <button
                className="h-11 rounded-full bg-pine px-4 font-semibold text-paper"
                onClick={() => dispatch({ type: "read", docId: doc.id })}
              >
                Read it into the ledger
              </button>
            )}
            {doc.followUp && save.read.includes(doc.id) && !owned.has(doc.followUp.id) && (
              <button
                className="h-11 rounded-full bg-ember px-4 font-semibold text-paper"
                onClick={() => dispatch({ type: "followUp", docId: doc.id })}
              >
                {doc.followUp.label}
              </button>
            )}
            <button className="h-11 rounded-full bg-ink/5 px-4 text-sm font-semibold" onClick={() => setWhen("then")}>
              As written
            </button>
            <button className="h-11 rounded-full bg-ink/5 px-4 text-sm font-semibold" onClick={() => setWhen("later")}>
              {doc.later.year}
            </button>
          </div>
          <p className="mt-3 text-pretty">
            {when === "later" && laterOpen(save, doc.id)
              ? doc.later.text
              : when === "later"
                ? "The later reading stays shut until the hunt is walked or the case closes."
                : null}
          </p>
          <p className="mt-4 text-sm text-ink/70">Held for the investigation. It cannot be discarded.</p>
          {voices.length > 0 && (
            <div className="mt-4 border-t border-ink/15 pt-3">
              <h3 className="text-xl">What followed</h3>
              <ul className="mt-2 flex flex-col gap-3">
                {voices.map((voice) => (
                  <li key={voice.id}>
                    <p className="text-sm font-semibold">{voice.speaker}</p>
                    <p className="text-pretty">{voice.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ) : (
        <p className="order-1 lg:order-2">Choose a paper that is already on the desk.</p>
      )}
      <aside className="order-3">
        <h2 className="text-2xl">Cases</h2>
        <ul className="mt-2 flex flex-col gap-3">
          {INVESTIGATIONS.map((item) => {
            const done = save.completed.includes(item.id);
            return (
              <li key={item.id} className="rounded-card border border-ink/15 p-3">
                <h3 className="text-lg">{item.title}</h3>
                <p className="text-sm text-pretty">{item.question}</p>
                <ul className="mt-2 text-sm">
                  {item.evidence.map((id) => {
                    const evidence = getDocument(id);
                    const read = save.read.includes(id);
                    return (
                      <li key={id} className={read ? "text-pine" : "text-ink/70"}>
                        {read ? "Examined" : "Not yet"} · {evidence?.title}
                      </li>
                    );
                  })}
                </ul>
                {done && <p className="mt-2 text-pretty text-sm">{item.verdict.speaker}: {item.verdict.text}</p>}
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
