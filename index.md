---
layout: default
title: "ComunItaliani"
use_js: true
---

<div class="tabs">
	<div class="tab active" data-tab="info">Info</div>
	<div class="tab" data-tab="t1">Comuni</div>
	<div class="tab" data-tab="t2">Province</div>
	<div class="tab" data-tab="t3">Regioni</div>
</div>
<div class="tab-content">
	<div id="info" class="active">
		<h2>Evoluzione del territorio italiano</h2>
		<p>Sono qui raccolti i dati relativi all'evoluzione del territorio italiano dal 1861.</p>
		<p>I dati sono stati estratti da <a href="https://situas.istat.it/">SITUAS</a> (sito ISTAT), <a href="https://www.istat.it/note-legali/">rilasciati con licenza Creative Commons Attribuzione 4.0 Internazionale</a>. I dati possono essere stati modificati e integrati con altre fonti, pertanto i dati presentati possono non corrispondere a quelli forniti da ISTAT.</p>
		<p>Il carattere utilizzato per questa pagina è <a href="https://github.com/m-casanova/Pass-A38">Pass A38</a>.</p>
	</div>
	<div id="t1">
		<h2>Cerca un comune</h2>
		<p><input type="text" id="cerca1" placeholder="&#xE140; Cerca..."></p>
		<div class="sugg" id="sugg1"></div>
		<div class="risp" id="risp1"></div>
	</div>
	<div id="t2">
		<h2>Cerca una provincia</h2>
		<p><input type="text" id="cerca2" placeholder="&#xE140; Cerca..."></p>
		<div class="sugg" id="sugg2"></div>
		<div class="risp" id="risp2"></div>
	</div>
	<div id="t3">
		<h2>Cerca una regione</h2>
		<p><input type="text" id="cerca3" placeholder="&#xE140; Cerca..."></p>
		<div class="sugg" id="sugg3"></div>
		<div class="risp" id="risp3"></div>
	</div>
</div>
