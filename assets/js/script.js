function loadJSON(url) {
	return fetch(url)
		.then(response => {
			if (!response.ok) {
				throw new Error(`Errore nel caricamento del file: ${url}`);
			}
			return response.json();
		});
}

const dizFonti = {"gu":"https://www.gazzettaufficiale.it/eli/"}
const dizVar = {"AN":"Annessione da stato estero","AP":"Cambio appartenenza Provincia","AQ":"Acquisizione territorio","AQES":"Acquisizione per estinzione","AS":"Cessione a stato estero","CD":"Cambio denominazione","CDAP":"Cambio nome e appartenenza Provincia","CE":"Cessione territorio","CECS":"Cessione territorio per costituzione nuova unità","CS":"Costituzione","CSCT":"Costituzione per cambio tipologia","CT":"Cambio tipologia di statuto","ES":"Estinzione","ESCT":"Estinzione per cambio tipologia","PV":"Prima validità","RN":"Rinumerazione del codice statistico","VACST":"Cambio tipologia di statuto"}
const dizTipo = {"11":"Provincia","12":"Provincia autonoma","13":"Città metropolitana","14":"Libero consorzio di comuni","15":"Unità non amministrativa","21":"Compartimento","22":"Regione"}

let elementi = [];
let db_doc, db_var;

const fileCaricati = [
	loadJSON(baseUrl+'/assets/json/comuni.json'),
	loadJSON(baseUrl+'/assets/json/province.json'),
	loadJSON(baseUrl+'/assets/json/regioni.json'),
	loadJSON(baseUrl+'/assets/json/variaz.json'),
	loadJSON(baseUrl+'/assets/json/provv.json')
];

Promise.all(fileCaricati)
	.then(([json1, json2, json3, json4, json5]) => {
		elementi[1] = json1;
		elementi[2] = json2;
		elementi[3] = json3;
		db_var = json4;
		db_doc = json5;

		document.getElementById('spinner').style.display = 'none';
		document.getElementById('pagina').style.display = 'block';

		[1, 2, 3].forEach(impostaRicerca);

		function aggiorna(cat, eid) {
			if (cat < 1 || cat > 3) return;

			const mostra = document.getElementById(`risp${cat}`);
			if (!mostra) return;

			const cerca = elementi[cat].find(a => a.io == eid);
			if (!cerca) return;

			const casellaInput = document.getElementById(`cerca${cat}`);
			if (casellaInput.value === "") {
    				casellaInput.value = cerca.n;
			}

			const valori = new Set(elementi[cat].filter(a => a.io == eid).map(a => a.id));
			window.history.pushState({}, 'ComunItaliani', `?id=${eid}&t=${cat}`);

			const variaz = db_var.filter(a => a.a == cat && (valori.has(a.i1) || valori.has(a.i2)));

			variaz.sort((a, b) => {
				const [dayA, monthA, yearA] = a.d.split('/').map(Number);
				const [dayB, monthB, yearB] = b.d.split('/').map(Number);
				const dateA = new Date(yearA, monthA - 1, dayA);
				const dateB = new Date(yearB, monthB - 1, dayB);

				if (dateA - dateB !== 0) {
					return dateA - dateB;
				}

				if (a.p !== b.p) {
					return a.p - b.p;
				}

				const n1 = elementi[cat].find(q => q.id === a.i1);
				const n2 = elementi[cat].find(q => q.id === b.i1);

				if (n1.io == eid) {
					if (n2.io == eid) {
						if (b.t1.localeCompare(a.t1) !== 0) {
							return b.t1.localeCompare(a.t1);
						}
					} else if (b.t2) {
						if (b.t2.localeCompare(a.t1) !== 0) {
							return b.t2.localeCompare(a.t1);
						}
					}
				} else if (a.t2) {
					if (n2.io == eid) {
						if (b.t1.localeCompare(a.t2) !== 0) {
							return b.t1.localeCompare(a.t2);
						}
					} else if (b.t2) {
						if (b.t2.localeCompare(a.t2) !== 0) {
							return b.t2.localeCompare(a.t2);
						}
					}
				}
				return a.c - b.c;
			});


			let ultimaData = '';
			let ultimoProv = '';
			let htmlOutput = '';

			variaz.forEach(a => {
				const n1 = elementi[cat].find(q => q.id === a.i1);
				const trCom = [{
					t: a.t1,
					ct: n1.t,
					n: n1.n + (n1.n2 ? `/${n1.n2}` : ''),
					io: n1.io,
					c: n1.c,
					d: n1.d,
					w: ''
				}];

				if (a.i2 > 0) {
					const n2 = elementi[cat].find(q => q.id === a.i2);
					trCom.push({
						t: a.t2,
						ct: n2.t,
						n: n2.n + (n2.n2 ? `/${n2.n2}` : ''),
						io: n2.io,
						c: n2.c,
						d: n2.d,
						w: ''
					});

					// Scambio degli elementi
					if (n2.io == eid && a.t2) {
						[trCom[0], trCom[1]] = [trCom[1], trCom[0]];
					}
				}

				// Aggiunta della data se è cambiata
				if (a.d !== ultimaData) {
					htmlOutput += `<p class='d'>${a.d}</p>`;
					ultimaData = a.d;
				}

				// Aggiunta del provvedimento se è cambiato
				if (a.p !== ultimoProv) {
					const provv = db_doc.filter(q => q.ip === a.p).map(ss => {
						let sx = `<p class='p'>${ss.ev}<br/>&#xE201; `;
						if (ss.u) {
							let pUrl = ss.u.split(/:(.+)/);
							if (pUrl[0].length == 2) {
								sx += `<a href='${dizFonti[pUrl[0]]}${pUrl[1]}'>${ss.e1}</a>`;
							} else {
								sx += `<a href='${ss.u}'>${ss.e1}</a>`;
							}
						} else {
							sx += `${ss.e1}`;
						}
						if (ss.d1) sx += ` ${ss.d1}`;
						if (ss.e2) sx += ` in ${ss.e2}`;
						if (ss.d2) sx += `, ${ss.d2}</p>`;
						return sx;
					}).join('');
					htmlOutput += provv;
					ultimoProv = a.p;
				}

				// Aggiunta dei dati supplementari per la provincia dei comuni
				if (cat == 1) {
					trCom.forEach(tc => {
						const sups = elementi[2].filter(r => r.c == tc.c.substring(0, 3));
						let sup;
						sups.forEach(sp => {
							sp.d.forEach(dd => {
								const data1 = new Date(dd.a.split('/').reverse().join('-'));
								const dataN = new Date(a.d.split('/').reverse().join('-'));
								const data2 = dd.z ? new Date(dd.z.split('/').reverse().join('-')) : null;
								
								const isValid = data2 ? (dataN >= data1 && dataN < data2) : (dataN >= data1);

								if (isValid) {
									sup = sp;
								}
							});
						});
						if (sup) tc.w = ` (<a href="?id=${sup.io}&t=2" target="_self">${sup.n}</a>)`;
					});
				}

				// Creazione degli elementi HTML
				if (cat == 1) {
					htmlOutput += `<p class='e'><b>${trCom[0].n}</b>${trCom[0].w} [${trCom[0].c}] : ${dizVar[trCom[0].t]}</p>`;
				} else {
					htmlOutput += `<p class='e'><b>${trCom[0].n}</b> [${dizTipo[trCom[0].ct]} ${trCom[0].c}] : ${dizVar[trCom[0].t]}</p>`;
				}
				if (trCom[1]) {
					trCom[1].n = eid != trCom[1].io 
						? `<a href='?id=${trCom[1].io}&t=${cat}' target="_self">${trCom[1].n}</a>` 
						: `<b>${trCom[1].n}</b>`;
					htmlOutput += `<p class='e'>&#xE011; ${dizVar[trCom[1].t] || dizVar[trCom[0].t]} : ${trCom[1].n}${trCom[1].w} [${trCom[1].c}]</p>`;
				} else if (a.i2 == -1) {
					htmlOutput += `<p class='e'>&#xE011; <span class="se">Stato estero</span></p>`;
				} else if (a.i2 == -2) {
					htmlOutput += `<p class='e'>&#xE011; Da territorio non censito</p>`;
				}
			});

			// Aggiornamento del contenuto in un'unica operazione
			mostra.innerHTML = htmlOutput;
		}

		function getQueryParams() {
			const params = new URLSearchParams(window.location.search);
			return {
				id: params.get('id'),
				t: params.get('t')
			};
		}

		const queryParams = getQueryParams();
		const id = queryParams.id;
		const t = queryParams.t;

		if (t) {
			const tabToActivate = `t${t}`;
			const tabElement = document.querySelector(`.tab[data-tab="${tabToActivate}"]`);
			const contentElement = document.getElementById(tabToActivate);

			if (tabElement && contentElement) {
				document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
				document.querySelectorAll('.tab-content > div').forEach(content => content.classList.remove('active'));
				tabElement.classList.add('active');
				contentElement.classList.add('active');
			}
			if (id) {
				aggiorna(t, id);
			}
		}

		document.querySelectorAll('.tab').forEach(tab => {
			tab.addEventListener('click', function() {
				document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
				document.querySelectorAll('.tab-content > div').forEach(content => content.classList.remove('active'));
				this.classList.add('active');
				document.getElementById(this.dataset.tab).classList.add('active');
			});
		});

		function normalizeText(text) {
			return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
		}

		function impostaRicerca(category) {
			const input = document.getElementById('cerca' + category);
			const suggestionsBox = document.getElementById('sugg' + category);

			input.addEventListener('input', function() {
				const query = normalizeText(this.value.trim());
				suggestionsBox.innerHTML = '';

				if (query.length < 2) {
					suggestionsBox.style.display = 'none';
					return;
				}

				let exactMatches = [];
				let startsWithMatches = [];
				let containsMatches = [];

				elementi[category].forEach(item => {
					const normalizedN = normalizeText(item.n);
					const normalizedN2 = normalizeText(item.n2 || '');

					if (normalizedN === query || normalizedN2 === query) {
						exactMatches.push(item);
					} else if (normalizedN.startsWith(query) || normalizedN2.startsWith(query)) {
						startsWithMatches.push(item);
					} else if (normalizedN.includes(query) || normalizedN2.includes(query)) {
						containsMatches.push(item);
					}
				});

				let filteredSuggestions = [...exactMatches, ...startsWithMatches, ...containsMatches].slice(0, 5);

				if (filteredSuggestions.length > 0) {
					const suggestionsHtml = filteredSuggestions.map(item => {
						const description = category === 1 ? 'Comune' : dizTipo[item.t];
						return `<div data-id="${item.io}">${item.n}<br/><span>${item.c} ${description}</span></div>`;
					}).join('');
					suggestionsBox.innerHTML = suggestionsHtml;
					suggestionsBox.style.display = 'block';

					// Assegna l'evento click a ciascun suggerimento dopo la creazione del DOM
					suggestionsBox.querySelectorAll('div').forEach(div => {
						div.addEventListener('click', function() {
							input.value = div.innerHTML.replace(/<br><span>.*?<\/span>/g, '');
							suggestionsBox.style.display = 'none';
							aggiorna(category, div.dataset.id);
						});
					});
				} else {
					suggestionsBox.style.display = 'none';
				}
			});

			input.addEventListener('keydown', function(e) {
				const active = suggestionsBox.querySelector('.active');
				let newActive;

				if (e.key === 'ArrowDown') {
					newActive = active ? active.nextElementSibling : suggestionsBox.firstElementChild;
				} else if (e.key === 'ArrowUp') {
					newActive = active ? active.previousElementSibling : suggestionsBox.lastElementChild;
				} else if (e.key === 'Enter' && active) {
					input.value = active.innerHTML.replace(/<br><span>.*?<\/span>/g, '');
					suggestionsBox.style.display = 'none';
					aggiorna(category, active.dataset.id);
				} else if (e.key === 'Enter' && suggestionsBox.childElementCount === 1) {
					const singleSuggestion = suggestionsBox.firstElementChild;
					input.value = singleSuggestion.innerHTML.replace(/<br><span>.*?<\/span>/g, '');
					suggestionsBox.style.display = 'none';
					aggiorna(category, singleSuggestion.dataset.id);
				}

				if (newActive) {
					if (active) active.classList.remove('active');
					newActive.classList.add('active');
				}
			});
		}


	})
	.catch(error => {
		console.error('Errore durante il caricamento dei dati:', error);
		alert('Si è verificato un errore nel caricamento dei dati.');
	});
