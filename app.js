const $=id=>document.getElementById(id);
const species=['Cão','Gato','Bovino','Equino'];
const pages=['inicio','doses','toxicos','carencia','receita'];
const names=['Início','Doses','Tóxicos','Carência','Receita'];
const titles=['Painel de consulta','Calculadora de doses','Guia de tóxicos','Carência em bovinos','Rascunho de receita'];
const descriptions=['Selecione uma ferramenta para começar.','Calcule a quantidade em mg a partir do peso e da dose prescrita.','Consulte a ficha de exposição a chocolate.','Confira os prazos para carne e leite de cada apresentação.','Organize a orientação prescrita e imprima uma cópia.'];
const paths=['<path d="m3 10 9-7 9 7v10H3z M9 20v-7h6v7"/>','<path d="m5 16 9-9 4 4-9 9H5z M12 5l8 8 M16 5l3 3 M17 6l3-3 M3 22l3-3 M8 13l2 2"/>','<path d="M9 3h6 M10 3v7L4 19q-1 2 2 2h12q3 0 2-2l-6-9V3 M7 16h10"/>','<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5 3 3 5-6"/>','<path d="M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6"/>'];
const icon=i=>'<svg aria-hidden="true" class="ico" viewBox="0 0 24 24">'+paths[i]+'</svg>';
let animal=0, deferred, note='', page='inicio';
const weights=[12,4,450,400], rates=['0.1','','',''];
const selected=n=>' aria-pressed="'+n+'" class="'+(n?'active':'')+'"';
const fmt=n=>n.toLocaleString('pt-BR',{maximumSignificantDigits:8});
function modal(html){$('detail').innerHTML=html;$('dialog').showModal()}
document.querySelector('.close').onclick=()=>$('dialog').close();
$('dialog').onclick=e=>{if(e.target===$('dialog'))$('dialog').close()};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e});
$('install').onclick=async()=>{if(deferred){await deferred.prompt();deferred=null}else modal('<h2>Instalar AtlasVet</h2><p>No iPhone, abra o site no Safari, toque em Compartilhar e em Adicionar à Tela de Início.</p><p>No Android ou computador, procure Instalar aplicativo ou Adicionar à tela inicial no menu do navegador.</p>')};
function go(p){location.hash=p}
const antibioticReferences = [
  { name: 'Amoxicilina', group: 'Aminopenicilina', minRate: 10, maxRate: 20, interval: '8–12', routes: ['VO', 'IM', 'SC'], pages: '51–52',
    note: 'Avaliar histórico de alergia a penicilinas. O guia descreve vômito e diarreia entre os possíveis efeitos da administração oral.' },
  { name: 'Amoxicilina + clavulanato de potássio', group: 'Aminopenicilina associada a inibidor de beta-lactamase', minRate: 15, maxRate: 20, interval: '8–12', routes: ['VO', 'IM', 'SC'], pages: '52',
    note: 'A faixa em mg/kg considera a soma dos dois princípios ativos. Conferir a proporção e a via autorizada da apresentação prescrita.' },
  { name: 'Cefaclor', group: 'Cefalosporina', minRate: 10, maxRate: 20, interval: '8', routes: ['VO'], pages: '96–97',
    note: 'Avaliar alergia prévia a beta-lactâmicos. O guia desaconselha a via oral em choque, septicemia ou peritonite.',
    dogNote: 'O guia limita a dose a 1.000 mg por administração em cães grandes.' },
  { name: 'Cefadroxila', group: 'Cefalosporina', minRate: 10, maxRate: 20, interval: '12', routes: ['VO'], pages: '97',
    note: 'Avaliar alergia prévia a beta-lactâmicos. O guia desaconselha a via oral em choque, septicemia ou peritonite.' },
  { name: 'Ampicilina', group: 'Aminopenicilina', minRate: 10, maxRate: 30, interval: '6–12', routes: ['VO', 'IV', 'IM', 'SC'], pages: '53–54',
    note: 'Confirmar o sal e a formulação adequados à via prescrita. A forma oral e as apresentações injetáveis são distintas.' },
  { name: 'Ampicilina + sulbactam', group: 'Aminopenicilina com inibidor de beta-lactamase', minRate: 15, maxRate: 30, interval: '8', routes: ['IV'], pages: '54',
    note: 'O cálculo considera a soma de ampicilina e sulbactam. Confirmar a composição da apresentação intravenosa.' },
  { name: 'Cefalexina', group: 'Cefalosporina', minRate: 20, maxRate: 30, interval: '12', routes: ['VO'], pages: '98',
    note: 'Avaliar histórico de alergia a beta-lactâmicos. O guia desaconselha a via oral em choque, septicemia ou peritonite.' },
  { name: 'Cefazolina sódica', group: 'Cefalosporina', minRate: 20, maxRate: 25, interval: '8', routes: ['IV', 'IM', 'SC'], pages: '99–100',
    note: 'Conferir a via e o diluente da apresentação. Formulações intramusculares com lidocaína não devem ser usadas por via intravenosa.' }
].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
const routeLabels = { VO: 'Oral', IV: 'Intravenosa', IM: 'Intramuscular', SC: 'Subcutânea' };
const selectedRoutes = ['VO', 'VO'];
const dipyrone = {
  name: 'Dipirona',
  oralRate: 25,
  ivExample: 25,
  maxMg: 875,
  label: 'https://guardiaodocuidado.com.br/wp-content/uploads/2024/10/Para-Site-Ipanema-Bula-Dipirona-Gotas-1141-ME-1.pdf',
  technical: 'https://guardiaodocuidado.com.br/wp-content/uploads/2024/10/BOV_0012_22D_artigo_tecnico_dipirona_210x297mm-1.pdf'
};
function cardCalculation(name) {
  return `<div class="card-calculation" data-calculation="${name}" hidden><strong>Cálculo da dose</strong><p></p></div>`;
}
function dipyroneCard(speciesIndex, route) {
  if (route === 'IV') {
    const dog = speciesIndex === 0;
    const source = dog ? 'https://www.sciencedirect.com/science/article/pii/S1467298716306730'
      : 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10814344/';
    const description = dog
      ? 'O Bretas (4ª edição, p. 165) descreve até 25 mg/kg por administração em cães.'
      : 'O exemplo de 25 mg/kg foi estudado em gatas sob acompanhamento veterinário após ovariohisterectomia.';
    return `<section class="panel drug-card"><h3>Dipirona · intravenosa</h3>
      <p>${description} Cálculo em mg para a apresentação injetável de uso IV. A administração e a monitorização cabem à equipe veterinária.</p>
      <button class="action" type="button" data-dipyrone>Usar exemplo de ${dipyrone.ivExample} mg/kg</button>
      <a href="${source}" target="_blank" rel="noopener">Consultar estudo</a>
      ${cardCalculation(dipyrone.name)}</section>`;
  }
  const source = speciesIndex === 0
    ? 'Referências: Bretas Viana, 4ª edição, p. 165 (cães), e Biovet.'
    : 'Referência da dose felina: material técnico da Biovet.';
  return `<section class="panel drug-card"><h3>Dipirona · gotas orais</h3>
    <p>Exemplo para ${species[speciesIndex].toLowerCase()} com prescrição de Dipirona Gotas Biovet (500 mg/mL), para dor ou febre. O limite da bula é de 35 gotas por administração, equivalentes a 875 mg nesta apresentação.</p>
    <p>${source} Consulte o veterinário sobre o intervalo. Evite em animais com hipersensibilidade à dipirona.</p>
    <button class="action" type="button" data-dipyrone>Usar exemplo de ${dipyrone.oralRate} mg/kg</button>
    <a href="${dipyrone.label}" target="_blank" rel="noopener">Consultar bula</a>
    <a href="${dipyrone.technical}" target="_blank" rel="noopener">Ficha técnica</a>
    ${cardCalculation(dipyrone.name)}</section>`;
}
const ivStrengths = {
  'Furosemida': { value: 50, exampleRate: 1, presentation: 'Zalix injetável contém 50 mg de furosemida por mL.', url: 'https://casadalavoura.vteximg.com.br/arquivos/1690.pdf' },
  'Ondansetrona': { value: 10, exampleRate: 0.5, presentation: 'Emedron 1% injetável contém 10 mg de ondansetrona base por mL.', url: 'https://agener.com.br/wp-content/uploads/2020/08/4020080-Emedron.pdf' },
  'Ampicilina': { value: 294.1, presentation: 'Ampicilina sódica 1 g (Teuto/Blau), volume final de 3,4 mL após reconstituição; aproximadamente 294,1 mg/mL.', url: 'https://hospitaltacchini.com.br/pdf/MANUAL-DE-PADRONIZACAO.pdf' },
  'Ampicilina + sulbactam': { value: 375, presentation: 'Unasyn 1,5 g, volume final de 4 mL após reconstituição. Total de 375 mg/mL: 250 mg/mL de ampicilina e 125 mg/mL de sulbactam.', url: 'https://labeling.pfizer.com/showlabeling.aspx?id=653' },
  'Cefazolina sódica': { value: 94, presentation: 'Kefazol IV 1 g, volume final aproximado de 10,6 mL após reconstituição (cerca de 94 mg/mL).', url: 'https://www.ablbrasil.com.br/wp-content/uploads/2022/06/Kefazol_Profissional_IB190321.pdf' },
  'Dipirona': { value: 500, presentation: 'Solução injetável de dipirona sódica a 500 mg/mL. Referência de concentração do frasco.', url: 'https://www.zoetis.com.br/global-assets/private/d-500_1.pdf' }
};
const ivInputs = ['', ''];
const selectedDrugs = [null, null, null, null];
function antibioticPanel(speciesIndex) {
  if (speciesIndex !== 0 && speciesIndex !== 1) return '';
  const patient = species[speciesIndex];
  const route = selectedRoutes[speciesIndex];
  const cards = antibioticReferences.map((drug, index) => drug.routes.includes(route) ? `
    <section class="panel drug-card">
      <h3>${drug.name}</h3>
      <p>${drug.group} · ${patient}. Faixa do guia: ${drug.minRate}–${drug.maxRate} mg/kg por dose, a cada ${drug.interval} horas. Via: ${routeLabels[route].toLowerCase()}.</p>
      <p>${drug.note} ${drug.dogNote && speciesIndex === 0 ? drug.dogNote : ''}</p>
      <button type="button" class="action" data-drug="${index}">Usar exemplo de ${drug.minRate} mg/kg</button>
      <button type="button" data-source="${index}" class="source-link">Consultar referência</button>
      ${cardCalculation(drug.name)}

    </section>` : '').join('');
  return `<section aria-label="Medicamentos por via"><h3>${route} · ${routeLabels[route]} · ${patient}</h3>
    <p>Use o exemplo para preencher a dose e calcular pelo peso. Confira a prescrição e a bula da apresentação.</p><div id="drugGrid" class="drug-grid">${cards}</div></section>`;
}
function render(){
page=pages.includes(location.hash.slice(1))?location.hash.slice(1):'inicio';
if(page==='carencia')animal=2;
$('species').innerHTML=species.map((s,i)=>'<button data-species="'+i+'"'+selected(animal===i)+'>'+s+'</button>').join('');
$('nav').innerHTML=pages.map((p,i)=>'<button data-page="'+p+'"'+selected(page===p)+'>'+icon(i)+names[i]+'</button>').join('');
const idx=pages.indexOf(page);
$('content').innerHTML='<h2>'+titles[idx]+'</h2><p class="intro">'+descriptions[idx]+'</p><div id="body"></div>';
const card=(i,title,desc)=>'<button class="card" data-page="'+pages[i]+'"><span class="badge tone'+(i-1)+'">'+icon(i)+'</span><h3>'+title+'</h3><p>'+desc+'</p></button>';
if(page==='inicio')$('body').innerHTML='<div class="cards">'+card(1,'Calculadora de doses','Cálculo por peso e dose prescrita.')+card(2,'Guia de tóxicos','Exposição, sinais e atendimento.')+card(3,'Carência em bovinos','Intervalos para carne e leite.')+card(4,'Rascunho de receita','Preparo e impressão de orientações.')+'</div>';
if(page==='doses'){
$('body').innerHTML='<section class="panel"><h3 id="calcTitle" tabindex="-1">'+species[animal]+'</h3><label for="weight">Peso do animal (kg)</label><input id="weight" type="number" step="any" min="0.001"><input id="slide" aria-label="Ajustar peso em quilogramas" type="range" min="0.1" step="0.1" max="'+(animal<2?100:1200)+'"><label for="rate">Dose prescrita (mg/kg)</label><small id="rateHint" style="display:block"></small><input id="rate" aria-describedby="rateHint" type="number" min="0.000001" step="any" placeholder="Informe a dose"><output class="value" id="result" aria-live="polite"></output></section>';;
$('body').insertAdjacentHTML('beforeend', antibioticPanel(animal));
if (animal < 2) {
  const route = selectedRoutes[animal];
  if (route === 'IV') {
    $('result').insertAdjacentHTML('beforebegin',
      '<label for="concentration">Concentração da solução (mg/mL)</label><small id="concHint">Use a concentração do líquido que será aspirado, após reconstituição quando aplicável. Confira o rótulo. Se a solução já foi diluída, informe a concentração real após a diluição.</small><input id="concentration" type="number" step="any" min="0" inputmode="decimal" aria-describedby="concHint" placeholder="Informe os mg por mL"><small id="ivPresentation"></small>');
  }
  const oral = route === 'VO';
  const hasDipyrone = oral || route === 'IV';
  if (hasDipyrone) $('drugGrid').insertAdjacentHTML('beforeend', dipyroneCard(animal, route));
  if (oral) {
    if (animal === 0) $('drugGrid').insertAdjacentHTML('beforeend', '<section class="panel drug-card"><h3>Meloxicam · manutenção</h3><p>Exemplo do vídeo para cães com prescrição de suspensão oral. A dose inicial tem cálculo próprio. Confirme a indicação e a bula da apresentação antes de usar.</p><button class="action" id="example">Usar exemplo de 0,1 mg/kg</button> <a href="https://animaldrugsatfda.fda.gov/adafda/app/search/public/document/downloadLabeling/2560" target="_blank" rel="noopener">Consultar bula</a>' + cardCalculation('Meloxicam · manutenção') + '</section>');
  }
  const controls = Object.entries(routeLabels).map(([key, label]) =>
    `<button type="button" class="install" style="margin:0;${route === key ? 'background:#175d49;color:white' : ''}" aria-pressed="${route === key}" data-route="${key}">${key} · ${label}</button>`).join('');
  const buttons = antibioticReferences.map((entry, index) => entry.routes.includes(route)
    ? `<button type="button" class="install" data-drug="${index}">${entry.name}</button>` : '').join('');
  const ivOptions = route === 'IV' ? Object.entries(ivStrengths).filter(([, product]) => product.exampleRate) : [];
  const ivButtons = ivOptions.map(([name]) =>
    `<button type="button" class="install" data-iv-drug="${name}">${name}</button>`).join('');
  for (const [name, product] of ivOptions) {
    $('drugGrid').insertAdjacentHTML('beforeend', `<section class="panel drug-card"><h3>${name} · intravenosa</h3>
      <p>${product.presentation}</p>
      <button type="button" class="action" data-iv-drug="${name}">Usar exemplo de ${fmt(product.exampleRate)} mg/kg</button>
      <a href="${product.url}" target="_blank" rel="noopener">Consultar bula</a>${cardCalculation(name)}</section>`);
  }
  $('calcTitle').insertAdjacentHTML('afterend',
    '<p>Via de administração</p><div style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0">' + controls +
    '</div><p>Escolha o medicamento para calcular pelo peso.</p><div style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0">' + buttons + ivButtons +
    (hasDipyrone ? '<button type="button" class="install" data-dipyrone>Dipirona</button>' : '') +
    (oral && animal === 0 ? '<button type="button" class="install" data-meloxicam>Meloxicam</button>' : '') + '</div>');
}
$('weight').value=weights[animal];$('slide').value=weights[animal];$('rate').value=rates[animal];
const concentration = $('concentration');
if (concentration) concentration.value = ivInputs[animal];
function calc() {
  const drug = selectedDrugs[animal];
  if (concentration) {
    ivInputs[animal] = concentration.value;
    const product = ivStrengths[drug];
    $('ivPresentation').innerHTML = product
      ? `Apresentação de referência: ${product.presentation} <a href="${product.url}" target="_blank" rel="noopener">Consultar fonte</a>`
      : '';
  }
  const reference = antibioticReferences.find(entry => entry.name === drug);
  $('rateHint').textContent = reference
    ? 'Exemplo inicial: ' + reference.minRate + ' mg/kg. Faixa do Bretas: ' + reference.minRate + '–' + reference.maxRate + ' mg/kg. Ajuste conforme a prescrição veterinária.'
    : '';
  if (concentration && ivStrengths[drug]?.exampleRate) {
    $('rateHint').textContent = 'Exemplo da bula da apresentação de referência. Ajuste a dose conforme a prescrição veterinária.';
  }
  if (drug === dipyrone.name) $('rateHint').textContent = selectedRoutes[animal] === 'IV'
    ? 'Exemplo intravenoso para cálculo em mg. Confirme a dose prescrita para este paciente.'
    : 'Exemplo da Biovet para a apresentação oral em gotas. Ajuste conforme a prescrição.';
  $('calcTitle').textContent = drug ? species[animal] + ' · ' + drug + ' · ' + selectedRoutes[animal] : species[animal];
  const weight = $('weight').valueAsNumber;
  const rate = $('rate').valueAsNumber;
  weights[animal] = $('weight').value;
  rates[animal] = $('rate').value;
  const total = weight * rate;
  let result = 'Informe um peso e uma dose prescrita maiores que zero.';
  let detail = '';
  if (weight > 0 && rate > 0 && Number.isFinite(total)) {
    result = 'Dose calculada: ' + fmt(total) + ' mg por dose.';
    detail = fmt(weight) + ' kg × ' + fmt(rate) + ' mg/kg = ' + fmt(total) + ' mg por dose';
    if (concentration) {
      const strength = concentration.valueAsNumber;
      const volume = total / strength;
      if (strength > 0 && Number.isFinite(volume) && volume > 0) {
        const rounded = Number(volume >= 0.1 ? volume.toFixed(2) : volume.toPrecision(2));
        result = 'Volume por dose: ' + (rounded === volume ? '' : '≈ ') + fmt(rounded) + ' mL.';
        detail += '\n' + fmt(total) + ' mg ÷ ' + fmt(strength) + ' mg/mL = ' + fmt(volume) + ' mL.';
      } else {
        result = 'Informe uma concentração maior que zero para calcular o volume.';
      }
    }
    if (animal === 0 && drug === 'Cefaclor' && total > 1000) {
      detail = '';
      result = 'O cálculo ultrapassa o limite de 1.000 mg por dose citado no guia para cães grandes. Confira a prescrição.';
    }
  }
  if (drug === dipyrone.name && selectedRoutes[animal] === 'VO' && total > dipyrone.maxMg) {
    detail = '';
    result = 'O cálculo excede o limite da bula para esta apresentação (875 mg por dose). Confira a prescrição com o veterinário.';
  }
  if (drug === dipyrone.name && selectedRoutes[animal] === 'IV' && animal === 0 && rate > dipyrone.ivExample) {
    detail = '';
    result = 'A dose informada supera a referência canina do Bretas. Confira a prescrição.';
  }
  $('result').textContent = result;
  document.querySelectorAll('[data-calculation]').forEach(block => {
    const active = block.dataset.calculation === drug;
    block.closest('.drug-card').classList.toggle('is-selected', active);
    block.hidden = !active || !detail;
    block.querySelector('p').textContent = active ? detail : '';
  });
}
function selectDrug(name, rate) {
  if (concentration && selectedDrugs[animal] !== name) concentration.value = ivStrengths[name]?.value ?? '';
  selectedDrugs[animal] = name;
  $('rate').value = rate;
  calc();
  if (rate) {
    $('rate').scrollIntoView({block: 'center'});
    $('rate').focus({preventScroll: true});
  }
}
$('body').onclick = event => {
  const routeButton = event.target.closest('button[data-route]');
  if (routeButton) {
    if (routeButton.dataset.route === selectedRoutes[animal]) return;
    selectedRoutes[animal] = routeButton.dataset.route;
    ivInputs[animal] = '';
    selectedDrugs[animal] = null;
    rates[animal] = '';
    render();
    return;
  }
  if (event.target.closest('button[data-meloxicam]')) {
    selectDrug('Meloxicam · manutenção', '0.1');
    return;
  }
  if (event.target.closest('button[data-dipyrone]')) {
    selectDrug(dipyrone.name, String(selectedRoutes[animal] === 'IV' ? dipyrone.ivExample : dipyrone.oralRate));
    return;
  }
  const ivButton = event.target.closest('button[data-iv-drug]');
  if (ivButton) {
    const name = ivButton.dataset.ivDrug;
    selectDrug(name, String(ivStrengths[name].exampleRate));
    return;
  }
  const source = event.target.closest('button[data-source]');
  if (source) {
    const drug = antibioticReferences[Number(source.dataset.source)];
    modal(`<h2>${drug.name}</h2><p>Fernando A. Bretas Viana, <cite>Guia Terapêutico Veterinário</cite>, 4ª edição, p. ${drug.pages}.</p><p>${drug.note}</p>`);
    return;
  }
  const button = event.target.closest('button[data-drug]');
  if (button) {
    const drug = antibioticReferences[Number(button.dataset.drug)];
    selectDrug(drug.name, String(drug.minRate));
  }
};
$('slide').oninput = () => { $('weight').value = $('slide').value; calc(); };
$('weight').oninput = () => { $('slide').value = $('weight').value; calc(); };
$('rate').oninput = calc;
if (concentration) concentration.oninput = calc;
if ($('example')) $('example').onclick = () => selectDrug('Meloxicam · manutenção', '0.1');
calc();
}
if(page==='toxicos')$('body').innerHTML='<section class="panel"><span class="badge tone1">'+icon(2)+'</span><h3>Chocolate</h3><p>Teobromina e cafeína. O risco varia com o tipo de chocolate, a quantidade ingerida e o peso do animal.</p><button class="action" id="choc">Abrir ficha</button></section>';
if($('choc'))$('choc').onclick=()=>modal('<h2>Chocolate</h2><p>Em caso de ingestão, entre em contato com um serviço veterinário imediatamente. Informe espécie, peso, produto, quantidade aproximada e horário. Tenha a embalagem em mãos.</p><h3>Sinais possíveis</h3><p>Vômitos, agitação, frequência cardíaca elevada e, em casos graves, convulsões. Evite provocar vômito por conta própria.</p><a href="https://www.merckvetmanual.com/toxicology/food-hazards/chocolate-toxicosis-in-animals" target="_blank" rel="noopener">Consultar Manual Veterinário Merck</a>');
if(page==='carencia'){
const items=[['Ivomec® Injetável','Ivermectina','35 dias','Uso vedado em vacas que produzem leite para consumo humano','https://vetsmart.com.br/be/produto/13/ivomec-injetavel'],['Banamine® Injetável','Flunixina meglumina','4 dias','36 horas','https://www.msd-saude-animal.com.br/produto/banamine-injetavel/'],['Iver OF','Ivermectina','19 dias','Uso vedado em fêmeas produtoras de leite para consumo humano','https://calculadorarural.com.br/produtos-veterinarios/ativo/ivermectina']];
$('body').innerHTML='<p>Conte a partir da última aplicação e confira a bula da embalagem.</p>'+items.map(([name,active,meat,milk,url])=>'<section class="panel"><h3>'+name+'</h3><p>'+active+'</p><dl><dt>Abate</dt><dd>'+meat+'</dd><dt>Leite</dt><dd>'+milk+'</dd></dl><a href="'+url+'" target="_blank" rel="noopener">Consultar referência</a></section>').join('')}
if(page==='receita'){
$('body').innerHTML='<section class="panel"><h3>'+species[animal]+'</h3><label for="note">Identificação e orientações do médico-veterinário</label><textarea id="note" rows="8" placeholder="Paciente, tutor, medicamento, apresentação e orientações…"></textarea><p>Rascunho mantido apenas enquanto esta página estiver aberta.</p><button class="action" id="print">Imprimir rascunho</button></section>';$('note').value=note;$('note').oninput=()=>note=$('note').value;$('print').onclick=()=>window.print()}
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.page)go(b.dataset.page);if(b.dataset.species!==undefined){animal=Number(b.dataset.species);if(page==='carencia'&&animal!==2)go('inicio');else render()}});
window.addEventListener('hashchange',render);render();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
