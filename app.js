/* Shared episode SEED + render helpers for index.html and reportages.html.
   Fetches episodes.json when served; falls back to SEED for file://. */

const SEED = {
  episodes: [
    {
      id: "20260719-abidjan",
      title: "À Abidjan, dans la roue de Yasmine Diawara",
      show: "Si loin si proche",
      showKey: "recit",
      place: "Côte d'Ivoire · Abidjan",
      date: "Juil. 2026",
      sort: "20260719",
      url: "https://www.rfi.fr/fr/podcasts/si-loin-si-proche/20260719-%C3%A0-abidjan-dans-la-roue-de-yasmine-diawara",
      image:
        "https://s.rfi.fr/media/display/2e38176c-8200-11f1-a05f-005056a97e36/w:1024/p:16x9/photodeune-siloinsiproche-abidjan-roue-yasmie-diawara.jpg",
      blurb: "Une journée dans les pas d'une femme qui fait bouger sa ville.",
    },
    {
      id: "20260704-hackathon",
      title: "L'histoire d'un hackathon intergénérationnel",
      show: "L'Atelier des médias",
      showKey: "medias",
      place: "Côte d'Ivoire",
      date: "Juil. 2026",
      sort: "20260704",
      url: "https://www.rfi.fr/fr/podcasts/atelier-des-m%C3%A9dias/20260704-c-est-l-histoire-d-un-hackathon-interg%C3%A9n%C3%A9rationnel-en-c%C3%B4te-d-ivoire",
      image:
        "https://s.rfi.fr/media/display/ae8d2c7a-772b-11f1-9c73-005056bfb2b6/w:1024/p:16x9/CFI-Hackathon-Abdjan-Projet-Kouman.jpg",
      blurb: "Quand les générations codent ensemble l'avenir de l'information.",
    },
    {
      id: "20260615-cameroun-malnutrition",
      title: "Lutter contre la malnutrition infantile en zone de crise",
      show: "Priorité Santé",
      showKey: "sante",
      place: "Cameroun · Extrême-Nord",
      date: "Juin 2026",
      sort: "20260615",
      url: "https://www.rfi.fr/fr/podcasts/priorit%C3%A9-sant%C3%A9/20260615-extr%C3%AAme-nord-cameroun-lutter-contre-la-malnutrition-infantile-en-zone-de-crise",
      image:
        "https://s.rfi.fr/media/display/5a377fc2-6592-11f1-a46a-005056a97e36/w:1024/p:16x9/cameroun-malnutrition-infantile-reportage.jpg",
      blurb: "Grand format au chevet des enfants, des mères et des soignants.",
      featured: true,
    },
    {
      id: "20260606-echos",
      title: "Échos des montagnes, portrait d'une radio communautaire",
      show: "L'Atelier des médias",
      showKey: "medias",
      place: "Cameroun",
      date: "Juin 2026",
      sort: "20260606",
      url: "https://www.rfi.fr/fr/podcasts/atelier-des-m%C3%A9dias/20260606-portrait-d-une-radio-communautaire-au-cameroun-%C3%A9chos-des-montagnes",
      image:
        "https://s.rfi.fr/media/display/dcaf7d42-612d-11f1-89be-005056bf30b7/w:640/p:16x9/cameroun-radio-echos-des-montagnes.jpg",
      blurb: "La voix d'une vallée, portée par ceux qui la font vivre.",
    },
    {
      id: "20260429-soigner",
      title: "Soigner dans les airs",
      show: "Priorité Santé",
      showKey: "sante",
      place: "Médecine aéronautique",
      date: "Avr. 2026",
      sort: "20260429",
      url: "https://www.rfi.fr/fr/podcasts/priorit%C3%A9-sant%C3%A9/20260429-soigner-dans-les-airs-un-reportage-long-format-sur-la-m%C3%A9decine-a%C3%A9ronautique-en-conditions-extr%C3%AAmes",
      image:
        "https://s.rfi.fr/media/display/b072cd96-431a-11f1-98a7-005056bf30b7/w:640/p:16x9/arm%C3%A9e-de-l-air-m%C3%A9decine-a%C3%A9ronautique-ok-publication.jpg",
      blurb: "À bord des évacuations sanitaires d'urgence, où chaque minute compte.",
    },
    {
      id: "20260422-guinee",
      title: "Le développement de la petite enfance en Guinée",
      show: "Priorité Santé",
      showKey: "sante",
      place: "Guinée · Kindia",
      date: "Avr. 2026",
      sort: "20260422",
      url: "https://www.rfi.fr/fr/podcasts/priorit%C3%A9-sant%C3%A9/20260422-comment-am%C3%A9liorer-le-d%C3%A9veloppement-de-la-petite-enfance-en-guin%C3%A9e",
      image:
        "https://s.rfi.fr/media/display/f39bffcc-5cd7-11f0-8d92-005056bfb2b6/w:640/p:16x9/Guin%C3%A9e-reportage-enfance-Komoya-atelier-culinaire.jpg",
      blurb: "Les 1000 premiers jours d'un enfant, et les femmes qui veillent.",
    },
    {
      id: "20260415-tchad-soudan",
      title: "Le quotidien des exilés soudanais dans les camps de réfugiés",
      show: "8 milliards de voisins",
      showKey: "voisins",
      place: "Tchad · frontière du Soudan",
      date: "Avr. 2026",
      sort: "20260415",
      url: "https://www.rfi.fr/fr/podcasts/8-milliards-de-voisins/20260415-le-quotidien-des-exil%C3%A9s-soudanais-dans-les-camps-de-r%C3%A9fugi%C3%A9s-au-tchad",
      image: "",
      blurb: "Reconstruire une vie, jour après jour, quand on a tout laissé.",
    },
    {
      id: "20260329-boundou",
      title: "« Ici c'est protégé ! »",
      show: "Si loin si proche",
      showKey: "recit",
      place: "Sénégal · Réserve du Boundou",
      date: "Mars 2026",
      sort: "20260329",
      url: "https://www.rfi.fr/fr/podcasts/si-loin-si-proche/20260329-dans-la-r%C3%A9serve-naturelle-communautaire-du-boundou-ici-c-est-prot%C3%A9g%C3%A9",
      image: "",
      blurb: "Quand une communauté se fait gardienne de son propre territoire.",
    },
    {
      id: "20260125-cameleon-02",
      title: "Sur la piste du Caméléon #02",
      show: "Si loin si proche",
      showKey: "recit",
      place: "Sénégal Oriental · Kédougou",
      date: "Janv. 2026",
      sort: "20260125",
      url: "https://www.rfi.fr/fr/podcasts/si-loin-si-proche/20260125-s%C3%A9n%C3%A9gal-oriental-sur-la-piste-du-cam%C3%A9l%C3%A9on-02",
      image: "",
      blurb: "Deuxième étape d'un itinéraire classé au patrimoine de l'UNESCO.",
    },
    {
      id: "20260118-cameleon-01",
      title: "Sur la piste du Caméléon #01",
      show: "Si loin si proche",
      showKey: "recit",
      place: "Sénégal Oriental · Kédougou",
      date: "Janv. 2026",
      sort: "20260118",
      url: "https://www.rfi.fr/fr/podcasts/si-loin-si-proche/20260118-s%C3%A9n%C3%A9gal-oriental-sur-la-piste-du-cam%C3%A9l%C3%A9on-01",
      image: "",
      blurb: "En itinérance à la rencontre des cultures Bassari, Bedik et Coniagui.",
    },
    {
      id: "20251120-maroc-vih",
      title: "La prise en charge des femmes atteintes du VIH",
      show: "Priorité Santé",
      showKey: "sante",
      place: "Maroc",
      date: "Nov. 2025",
      sort: "20251120",
      url: "https://www.rfi.fr/fr/podcasts/priorit%C3%A9-sant%C3%A9/20251120-prise-en-charge-des-femmes-atteintes-de-vih-au-maroc",
      image: "",
      blurb: "L'accompagnement, bien au-delà du diagnostic.",
    },
    {
      id: "20250902-tchad-tabou",
      title: "Comment briser le tabou du viol au Tchad ?",
      show: "8 milliards de voisins",
      showKey: "voisins",
      place: "Tchad",
      date: "Sept. 2025",
      sort: "20250902",
      url: "https://www.rfi.fr/fr/podcasts/8-milliards-de-voisins/20250902-reportage-comment-briser-le-tabou-du-viol-au-tchad",
      image: "",
      blurb: "Des voix qui se lèvent contre le silence.",
    },
    {
      id: "20250820-tchad-sages-femmes",
      title: "Les sages-femmes humanitaires, héroïnes de la santé maternelle",
      show: "Priorité Santé",
      showKey: "sante",
      place: "Tchad",
      date: "Août 2025",
      sort: "20250820",
      url: "https://www.rfi.fr/fr/podcasts/priorit%C3%A9-sant%C3%A9/20250820-au-tchad-les-sages-femmes-humanitaires-h%C3%A9ro%C3%AFnes-de-la-sant%C3%A9-maternelle-en-zone-d-urgence",
      image: "",
      blurb: "Celles qui font naître la vie là où l'urgence est permanente.",
    },
    {
      id: "20210129-burkina",
      title: "Paroles de militantes",
      show: "8 milliards de voisins",
      showKey: "voisins",
      place: "Burkina Faso",
      date: "2021",
      sort: "20210129",
      url: "https://www.rfi.fr/fr/podcasts/7-milliards-de-voisins/20210129-reportage-paroles-de-militantes-au-burkina-faso",
      image: "",
      blurb: "Ces femmes qui prennent des risques pour changer leur société.",
    },
  ],
};

const PLAY =
  '<span class="play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>';

const esc = (s) =>
  (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function heroCard(ep, i) {
  const img = ep.image
    ? '<img src="' +
      esc(ep.image) +
      '" alt="' +
      esc(ep.title || "") +
      '" loading="lazy" onerror="this.remove()">'
    : '<div class="fb"></div>';
  return (
    '<a class="hcard" href="' +
    esc(ep.url) +
    '" target="_blank" rel="noopener">' +
    img +
    '<span class="ov"></span><span class="tag">' +
    esc(ep.show) +
    '</span><span class="num">' +
    String(i + 1).padStart(2, "0") +
    "</span>" +
    '<div class="cbody"><div class="loc">' +
    esc(ep.place || "") +
    "</div><h3>" +
    esc(ep.title) +
    "</h3>" +
    '<div class="foot"><span class="play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>Écouter<span class="date">' +
    esc(ep.date) +
    "</span></div></div></a>"
  );
}

function renderHero(el, data) {
  const target = el || document.getElementById("hscroll");
  if (!target) return;
  const eps = (data.episodes || [])
    .slice()
    .sort((a, b) => (a.id < b.id ? 1 : -1))
    .slice(0, 6);
  const list = eps.length ? eps : SEED.episodes.slice(0, 6);
  target.innerHTML = list.map(heroCard).join("");
}

function cover(ep) {
  if (ep.image) {
    return (
      '<div class="cover"><span class="tag">' +
      esc(ep.show) +
      "</span>" +
      '<img src="' +
      esc(ep.image) +
      '" alt="' +
      esc(ep.title) +
      '" loading="lazy" onerror="this.remove()">' +
      "<span class=\"pin play\"><svg viewBox='0 0 24 24' fill='currentColor'><path d='M8 5v14l11-7z'/></svg></span></div>"
    );
  }
  return (
    '<div class="cover"><span class="tag">' +
    esc(ep.show) +
    "</span>" +
    '<div class="fb"><span>' +
    esc(ep.title) +
    "</span></div>" +
    "<span class=\"pin play\"><svg viewBox='0 0 24 24' fill='currentColor'><path d='M8 5v14l11-7z'/></svg></span></div>"
  );
}

function card(ep) {
  return (
    '<a class="ep" data-show="' +
    esc(ep.showKey) +
    '" href="' +
    esc(ep.url) +
    '" target="_blank" rel="noopener">' +
    cover(ep) +
    '<div class="body">' +
    '<div class="loc"><span>' +
    esc(ep.place || ep.show) +
    '</span><span class="d">' +
    esc(ep.date) +
    "</span></div>" +
    "<h4>" +
    esc(ep.title) +
    "</h4>" +
    (ep.blurb ? "<p>" + esc(ep.blurb) + "</p>" : "") +
    '<span class="listen">' +
    PLAY +
    'Écouter<span class="ar">→</span></span>' +
    "</div></a>"
  );
}

function head(ep) {
  return (
    '<a class="card" href="' +
    esc(ep.url) +
    '" target="_blank" rel="noopener">' +
    '<div class="ph">' +
    (ep.image
      ? '<img src="' + esc(ep.image) + '" alt="' + esc(ep.title) + '" onerror="this.remove()">'
      : "") +
    "</div>" +
    '<div class="txt"><span class="flag"><span class="dot"></span>Dernier reportage</span>' +
    '<div class="tags"><span class="s">' +
    esc(ep.show) +
    '</span><span class="p">' +
    esc(ep.place || "") +
    '</span><span class="p">' +
    esc(ep.date) +
    "</span></div>" +
    "<h2>" +
    esc(ep.title) +
    "</h2>" +
    (ep.blurb ? "<p>" + esc(ep.blurb) + "</p>" : "") +
    '<span class="go">' +
    PLAY +
    "Écouter sur RFI</span></div></a>"
  );
}

function renderCollection(data) {
  const latestEl = document.getElementById("latest");
  const box = document.getElementById("eps");
  if (!latestEl || !box) return;

  const eps = (data.episodes || [])
    .slice()
    .sort((a, b) => (a.sort < b.sort ? 1 : a.sort > b.sort ? -1 : 0));
  const list = eps.length ? eps : SEED.episodes;
  latestEl.innerHTML = head(list[0]);
  box.innerHTML = list.map(card).join("");
  const count = document.getElementById("count");
  function refresh(f) {
    const cards = [].slice.call(box.querySelectorAll(".ep"));
    let n = 0;
    cards.forEach((c) => {
      const ok = f === "all" || c.getAttribute("data-show") === f;
      c.style.display = ok ? "" : "none";
      if (ok) n++;
    });
    count.textContent = n + (n > 1 ? " épisodes" : " épisode");
  }
  const filters = document.getElementById("filters");
  if (filters && !filters.dataset.bound) {
    filters.dataset.bound = "1";
    filters.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      document.querySelectorAll("#filters button").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      refresh(b.getAttribute("data-filter"));
    });
  }
  const active = filters && filters.querySelector("button.active");
  refresh(active ? active.getAttribute("data-filter") : "all");
  const note = document.getElementById("note");
  if (note) {
    note.innerHTML =
      'Mise à jour automatique depuis RFI. Catalogue complet → <a href="https://www.rfi.fr/fr/auteur/rapha%C3%ABlle-constant/" target="_blank" rel="noopener">sa page RFI</a>.';
  }
  const updated = document.getElementById("updated");
  if (updated && data.updated) updated.textContent = "Mis à jour le " + data.updated;
}

function boot() {
  const heroEl = document.getElementById("hscroll");
  if (heroEl) {
    renderHero(heroEl, SEED);
    fetch("episodes.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.episodes && d.episodes.length) renderHero(heroEl, d);
      })
      .catch(() => {});
  }

  if (document.getElementById("latest")) {
    renderCollection(SEED);
    fetch("episodes.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.episodes && d.episodes.length) renderCollection(d);
      })
      .catch(() => {});
  }
}

boot();
