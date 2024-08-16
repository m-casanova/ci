# ComunItaliani

Piccolo test con dati estratti dal [sito SITUAS di ISTAT](https://situas.istat.it/).

I dati della sezione _Storia unità territoriali_ sono riportati nei file JSON utilizzati (cartella `assets/json`).

I dati sono [rilasciati da ISTAT](https://www.istat.it/note-legali/) con licenza CC BY 4.0 International.

## Struttura dei dati

Le descrizioni che iniziano con un asterisco __*__ sono per dati non tratti da ISTAT, ma aggiunti per comodità.

### Enti (_regioni.json_, _province.json_, _comuni.json_)

I nomi dei campi sono stati armonizzati tra i diversi enti:

* `.id` : __*__ identificativo progressivo utilizzato per distinguere i casi con stesso codice Istat
* `.c ` : codice istat
* `.io` : codice originale, utile per raggruppare gli elementi relativi allo stesso ente, ma con codice Istat diverso
* `.n ` : nome dell'ente
* `.t ` : tipo di ente (solo per province e regioni)
* `.n2` : eventuale nome in altra lingua (ottenuto da dati ISTAT tramite separazione per presenza di `/` nel nome)
* `.d ` : array relativo ai periodi di validità dell'ente
  * `.a` : data di inizio
  * `.z` : data di fine

Le descrizioni per i valori di `.t` sono definite in _dizTipo_, contenuto nel file _script.js_.


### Provvedimenti (_provv.json_)

Dati relativi ai provvedimenti:

* `.ip` : identificativo numerico del provvedimento
* `.ev` : descrizione dell'evento
* `.e1` : descrizione del provvedimento
* `.d1` : data del provvedimento
* `.e2` : descrizione della pubblicazione
* `.d2` : data della pubblicazione

### Variazioni (_variaz.json_)

Dati relativi agli eventi:

* `.a ` : __*__ tipo di ente (`1` per _comuni_, `2` per _province_, `3` per _regioni_)
* `.d ` : data dell'evento
* `.p ` : identificativo del provvedimento (corrisponde a `.ip` in _provv.json_)
* `.i1` : primo ente coinvolto nell'evento (corrisponde a `.id` nel file degli enti relativo al valore di `.a `)
* `.t1` : codice del tipo di evento per il primo ente coinvolto nell'evento
* `.i2` : eventuale secondo ente coinvolto nell'evento (corrisponde a `.id` nel file degli enti relativo al valore di `.a `)
* `.t2` : eventuale codice del tipo di evento per il secondo ente coinvolto nell'evento

Le descrizioni per i valori di `.t1` e di `.t2` sono definiti in _dizVar_, definito nel file _script.js_.
