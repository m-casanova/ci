function loadJSON(url) {
	return fetch(url)
		.then(response => {
			if (!response.ok) {
				throw new Error(`Errore nel caricamento del file: ${url}`);
			}
			return response.json();
		});
}

const dizFonti = {
	"ba":"http://atticonsiglio.consiglio.basilicata.it/AD_Elenco_Leggi?Codice=$$",
	"er":"https://demetra.regione.emilia-romagna.it/al/articolo?urn=er:assemblealegislativa:legge:$$",
	"fv":"https://lexview-int.regione.fvg.it/FontiNormative/xml/XmlLex.aspx?$$",
	"gu":"https://www.gazzettaufficiale.it/eli/$$",
	"lo":"http://www.consultazioniburl.servizirl.it/pdf/$$",
	"lb":"https://www.consultazioniburl.servizirl.it/ConsultazioneBurl/ApriAllegato?apriAllegato=&idBurl=$$",
	"pi":"http://arianna.cr.piemonte.it/iterlegcoordweb/dettaglioLegge.do?urnLegge=urn:nir:regione.piemonte:legge:$$",
	"pu":"https://bussolanormativa.consiglio.puglia.it/public/Leges/LeggeNavscroll.aspx?id=$$",
	"sa":"https://leggiregionali.regione.sardegna.it/legge-regionale?$$",
	"si":"https://w3.ars.sicilia.it/lex/$$",
	"ta":"https://bollettino.regione.taa.it/pdf/$$",
	"to":"https://raccoltanormativa.consiglio.regione.toscana.it/articolo?urndoc=urn:nir:regione.toscana:legge:$$"
}
const dizVar = {
	"AN": "Annessione da stato estero",
	"AP": "Cambio di appartenenza Provincia",
	"AQ": "Acquisizione di territorio",
	"AQES": "Acquisizione di territorio per estinzione",
	"AS": "Cessione a stato estero",
	"CD": "Cambio di denominazione",
	"CDAP": "Cambio di denominazione e appartenenza Provincia",
	"CE": "Cessione parziale di territorio",
	"CECS": "Cessione di territorio per costituzione di una nuova unità",
	"CS": "Costituzione",
	"CSCT": "Costituzione per cambio di tipologia",
	"CT": "Cambio di tipologia di statuto",
	"ES": "Estinzione",
	"ESCT": "Estinzione per cambio di tipologia",
	"PV": "Esistente al momento della costituzione del Regno d'Italia",
	"RN": "Rinumerazione del codice statistico",
	"VACST": "Cambio di tipologia di statuto"
}
const dizTipo = {"11":"Provincia","12":"Provincia autonoma","13":"Città metropolitana","14":"Libero consorzio di comuni","15":"Unità non amministrativa","21":"Compartimento","22":"Regione"}

let elementi = [];
let db_doc, db_var;

const fileCaricati = [
	loadJSON(baseUrl+'/assets/json/comuni.json'),
	loadJSON(baseUrl+'/assets/json/province.json'),
	loadJSON(baseUrl+'/assets/json/regioni.json'),
	loadJSON(baseUrl+'/assets/json/variaz.json'),
	loadJSON(baseUrl+'/assets/json/provv.json'),
	loadJSON(baseUrl+'/assets/json/indice.json')
];

Promise.all(fileCaricati)
	.then(([json1, json2, json3, json4, json5, json6]) => {
		elementi[1] = json1;
		elementi[2] = json2;
		elementi[3] = json3;
		db_var = json4;
		db_doc = json5;
		db_indice = json6;

		document.getElementById('spinner').style.display = 'none';
		document.getElementById('pagina').style.display = 'block';

		[1, 2, 3].forEach(impostaRicerca);

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
	})
	.catch(error => {
		console.error('Errore durante il caricamento dei dati:', error);
		alert('Si è verificato un errore nel caricamento dei dati.');
	});

function aggiorna(cat, eid) {
	if (cat < 1 || cat > 3) return;

	const mostra = document.getElementById(`risp${cat}`);
	if (!mostra) return;
	mostra.innerHTML = '';

	const cerca = db_indice[cat][eid];
	if (!cerca) return;

	const casellaInput = document.getElementById(`cerca${cat}`);
	if (casellaInput.value === "") casellaInput.value = cerca.n;

	const valori = cerca.s;

	const currentParams = getQueryParams();
	if (currentParams.id !== eid || currentParams.t !== cat.toString()) {
		window.history.pushState({ id: eid, t: cat }, "", `?id=${eid}&t=${cat}`);
	}
	document.title = `ComunItaliani | ${cerca.n}`;

	const variaz1 = {};
	for (const in1 of cerca.v) {
		if (db_var[in1]) {
			const filtrati = db_var[in1].a[cat].filter(({ i1, i2 }) => valori.includes(i1) || valori.includes(i2));
			if (filtrati.length > 0) {
				variaz1[in1] = { ...db_var[in1], a: { [cat]: filtrati } };
			}
		}
	}

	const variaz = Object.entries(variaz1);
	variaz.sort((a, b) => {
		if (a[1].d != b[1].d) return vData(a[1].d) - vData(b[1].d);
		if (db_doc[a[1].p].d1 && db_doc[b[1].p].d1) return db_doc[a[1].p].d1 - db_doc[b[1].p].d1;
		return false;
	});

	let ultimaData;
	let ultimoProvv;

	const frammento = document.createDocumentFragment();

	const testa = creaEl('h3',cerca.z==1?'z':null,cerca.n);
	frammento.appendChild(testa);
	const testa2 = creaEl('p','info',cerca.z==1?'Non esistente':'Esistente');
	frammento.appendChild(testa2);

	const htmlOutput = creaEl('div',cerca.z?'elencoz':'elenco');
	frammento.appendChild(htmlOutput);

	let htmlDiv = null;

	/* esame delle variazioni */
	variaz.forEach( w => {
		const { d, p, t, a } = w[1];

		if (d !== ultimaData) {
			htmlDiv = creaEl('div','el_data',creaEl('div','punto'));
			const dataP = creaEl('p','d', cData(d,1));
			htmlDiv.appendChild(dataP);
			htmlOutput.appendChild(htmlDiv);
			ultimaData = d;
		}

		if (p != ultimoProvv) {
			const provv = db_doc[p];
			const provP = creaEl('p','t');
			provP.innerHTML = '&#xE201; ';
			if (provv.u) {
				const pUrl = provv.u.split(/:(.+)/);
				const aUrl = document.createElement('a');
				aUrl.href = pUrl[0].length == 2 ? `${dizFonti[pUrl[0]].replace(/\$\$/,pUrl[1])}` : provv.u;
				if (provv.t1) {
					aUrl.textContent = provv.t1;
					if (provv.n1) aUrl.textContent += ` n. ${provv.n1}`;
				} else {
					aUrl.textContent = provv.e1;
				}
				provP.innerHTML += aUrl.outerHTML;
			} else {
				if (provv.t1) {
					provP.textContent += provv.t1;
					if (provv.n1) provP.textContent += ` n. ${provv.n1}`;
				} else {
					provP.textContent += provv.e1;
				}
			}
			if (provv.d1) provP.innerHTML += `, ${cData(provv.d1, 0)}`;
			if (provv.e2) {
				provP.innerHTML += ` (${provv.e2}`;
				if (provv.d2) provP.innerHTML += `, ${cData(provv.d2, 0)}`;
				provP.innerHTML += `)`;
			}
			htmlDiv.appendChild(provP);

			const infoP = creaEl('p','i',provv.ev);
			htmlDiv.appendChild(infoP);

			ultimoProvv = p;
		}

		for (const in2 in a) {
			a[in2].forEach(({ i1, i2, t1, t2 }) => {

				const n1 = elementi[cat][i1];
				const trCom = [{
					t: t1 || t,
					ct: n1.t,
					n: n1.n + (n1.n2 ? `/${n1.n2}` : ''),
					io: n1.io,
					c: n1.c,
					d: n1.d,
					w: ''
				}];

				if (i2 && i2 > 0) {
					const n2 = elementi[cat][i2];
					trCom.push({
						t: t2,
						ct: n2.t,
						n: n2.n + (n2.n2 ? `/${n2.n2}` : ''),
						io: n2.io,
						c: n2.c,
						d: n2.d,
						w: ''
					});

					if (n1.io != eid && n2.io == eid && t2) {
						[trCom[0], trCom[1]] = [trCom[1], trCom[0]];
					}
				}

				const elemP = creaEl('p','e');
				if (cat == 1) {
					trCom.forEach(tc => {
						const sups = Object.keys(elementi[2]).filter(key => elementi[2][key].c == tc.c.substring(0, 3)).map(key => elementi[2][key]);
						let sup;
						sups.forEach(sp => {
							sp.d.forEach(dd => {
								const data1 = vData(dd.a);
								const dataN = vData(d);
								const data2 = dd.z ? vData(dd.z) : null;

								const isValid = data2 ? (dataN >= data1 && dataN <= data2) : (dataN >= data1);

								if (isValid) {
									sup = sp;
								}
							});
						});
						if (sup) {
							const supLink = document.createElement('a');
							supLink.href = `?id=${sup.io}&t=2`;
							supLink.target = "_self";
							supLink.textContent = sup.n;
							tc.w = ', <i>' + supLink.outerHTML + '</i>';
						}
					});
					elemP.innerHTML = `<b>${trCom[0].n}</b>${trCom[0].w} [${trCom[0].c}] : ${dizVar[trCom[0].t]}`;
				} else {
					elemP.innerHTML = `<b>${trCom[0].n}</b> [${dizTipo[trCom[0].ct]} ${trCom[0].c}] : ${dizVar[trCom[0].t]}`;
				}
				htmlDiv.appendChild(elemP);

				const trComP = creaEl('p','e');
				if (trCom[1]) {
					if (eid != trCom[1].io) {
						trComP.innerHTML = `&#xE011; ${dizVar[trCom[1].t] || dizVar[trCom[0].t]} : <a href='?id=${trCom[1].io}&t=${cat}' target="_self">${trCom[1].n}</a>${trCom[1].w} [${trCom[1].c}]`;
					} else {
						trComP.innerHTML = `&#xE011; ${dizVar[trCom[1].t] || dizVar[trCom[0].t]} : <b>${trCom[1].n}</b>${trCom[1].w} [${trCom[1].c}]`;
					}
				} else if (i2 == -1) {
					trComP.innerHTML = `&#xE011; <span class="se">Stato estero</span>`;
				} else if (i2 == -2) {
					trComP.innerHTML = `&#xE011; <span class="nc">Da territorio non censito</span>`;
				}
				htmlDiv.appendChild(trComP);
			});
		}
	});

	if (!cerca.z || cerca.z != 1) {
		htmlDiv = creaEl('div','el_data',creaEl('div','punto'),creaEl('p','d','Esistente'));
		htmlOutput.appendChild(htmlDiv);
	}

	mostra.appendChild(frammento);
}

function impostaRicerca(category) {
	const input = document.getElementById('cerca' + category);
	const suggestionsBox = document.getElementById('sugg' + category);
	const dbh = dbf(function() {
		const query = normalizeText(this.value.trim());
		suggestionsBox.innerHTML = '';

		if (query.length < 2) {
			suggestionsBox.style.display = 'none';
			return;
		}

		const risultati = cercaSugg(category, query);
		if (risultati.length > 0) {
			const suggestionsHtml = risultati.map(item => {
				const description = category === 1 ? 'Comune' : dizTipo[item.t];
				return `<div data-id="${item.io}">${item.n}<br/><span class="info"><span class="f${(db_indice[category][item.io].z == 1)?0:1}">◼</span> ${item.c} ${description}</span></div>`;
			}).join('');
			suggestionsBox.innerHTML = suggestionsHtml;
			suggestionsBox.style.display = 'block';

			suggestionsBox.querySelectorAll('div').forEach(div => {
				div.addEventListener('click', function() {
					input.value = div.innerHTML.replace(/<br>.*?$/g, '');
					suggestionsBox.style.display = 'none';
					aggiorna(category, div.dataset.id);
				});
			});
		} else {
			suggestionsBox.style.display = 'none';
		}
	}, 200);

	input.addEventListener('input', dbh);

	input.addEventListener('keydown', function(e) {
		const active = suggestionsBox.querySelector('.active');
		let newActive;

		if (e.key === 'ArrowDown') {
			newActive = active ? active.nextElementSibling : suggestionsBox.firstElementChild;
		} else if (e.key === 'ArrowUp') {
			newActive = active ? active.previousElementSibling : suggestionsBox.lastElementChild;
		} else if (e.key === 'Enter' && active) {
			input.value = active.innerHTML.replace(/<br>.*?$/g, '');
			suggestionsBox.style.display = 'none';
			aggiorna(category, active.dataset.id);
		} else if (e.key === 'Enter' && suggestionsBox.childElementCount === 1) {
			const singleSuggestion = suggestionsBox.firstElementChild;
			input.value = singleSuggestion.innerHTML.replace(/<br>.*^$/, '');
			suggestionsBox.style.display = 'none';
			aggiorna(category, singleSuggestion.dataset.id);
		}

		if (newActive) {
			if (active) active.classList.remove('active');
			newActive.classList.add('active');
		}
	});
}

function dbf(func, delay) {
	let timeoutId;
	return function (...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func.apply(this, args), delay);
	};
}

function cercaSugg(category, query) {
	let exactMatches = [];
	let startsWithMatches = [];
	let containsMatches = [];

	for (const [key,item] of Object.entries(elementi[category])) {
		const normalizedN = normalizeText(item.n);
		const normalizedN2 = normalizeText(item.n2 || '');

		if (normalizedN === query || normalizedN2 === query) {
			exactMatches.push(item);
		} else if (normalizedN.startsWith(query) || normalizedN2.startsWith(query)) {
			startsWithMatches.push(item);
		} else if (normalizedN.includes(query) || normalizedN2.includes(query)) {
			containsMatches.push(item);
		}
	};
	return [...exactMatches, ...startsWithMatches, ...containsMatches].slice(0, 5);
}

function normalizeText(text) {
	return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getQueryParams() {
	const params = new URLSearchParams(window.location.search);
	return {
		id: params.get('id'),
		t: params.get('t')
	};
}

function vData(data) {
	return new Date(data.split('/').reverse().join('-'));
}

function cData(data,n) {
	const mesi = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno","luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
	const mesi2 = ["gen.", "feb.", "mar.", "apr.", "mag.", "giu.","lug.", "ago.", "set.", "ott.", "nov.", "dic."];
	const [giorno, mese, anno] = data.split("/");
	const mese2 = n==1?mesi[parseInt(mese) - 1]:mesi2[parseInt(mese) - 1];
	const giorno2 = (parseInt(giorno)>1)?parseInt(giorno):parseInt(giorno)+'º';
	if (n == 1) return `${anno} (${giorno2} ${mese2})`;
	return `${giorno2} ${mese2} ${anno}`;
}

function creaEl(t, c, ...f) {
	const el = document.createElement(t);
	if (c) el.className = c;
	f.forEach(node => el.appendChild(typeof node === 'string' ? document.createTextNode(node) : node));
	return el;
}
