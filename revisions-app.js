import { LECONS, SECTIONS, QUIZ } from "./donnees.js";
import { COURS } from "./cours.js";

const STORE = "cc101fr:revisions:v1";
const AI_STORE = "cc101fr:revision-ai:v1";
// Les cours viennent de cours.js : un nouveau cours apparaît ici sans autre changement.
const COURSE_REGISTRY = COURS.map(c => ({ id: c.id, title: c.titre, lessons: c.LECONS, sections: c.SECTIONS }));
const esc = (s="") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date = (v) => new Intl.DateTimeFormat("fr-FR",{dateStyle:"medium"}).format(new Date(v));
const uid = () => "r" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
function readItems(){try{const x=JSON.parse(localStorage.getItem(STORE)||"[]");return Array.isArray(x)?x:[]}catch{return[]}}
function writeItems(x){localStorage.setItem(STORE,JSON.stringify(x))}
function renderTutorAnswer(value){
 const safe=esc(value).replace(/\r\n?/g,"\n");
 const fence=String.fromCharCode(96,96,96);
 return safe.split(fence).map((part,index)=>{
  if(index%2===1){const code=part.replace(/^[a-zA-Z0-9_-]+\n/,"");return '<pre class="tutor-code"><code>'+code+'</code></pre>';}
  return part.split(/\n{2,}/).map(paragraph=>{
   let html=paragraph.replace(/^###?\s+(.+)$/gm,'<h4>$1</h4>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/^[-•]\s+(.+)$/gm,'<li>$1</li>').replace(/^(\d+)\.\s+(.+)$/gm,'<li>$2</li>');
   if(/<li>/.test(html))html='<ul>'+html+'</ul>';else if(!/^<h4>/.test(html))html=html.replace(/\n/g,'<br>');
   return '<div class="tutor-paragraph">'+html+'</div>';
  }).join("");
 }).join("");
}
function parseTutorPayload(raw){
 const text=String(raw||"").trim();
 try{
  const clean=text.replace(/^\uFEFF/,"").replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
  const value=JSON.parse(clean);
  if(value&&typeof value==="object")return value;
 }catch{}
 return {message:text,options:[]};
}
function renderTutorPayload(raw){
 const data=parseTutorPayload(raw);
 const message=String(data.message||data.question||data.text||"");
 const options=Array.isArray(data.options)?data.options:[];
 const safeOptions=options.slice(0,8).map((option,index)=>{
  const label=typeof option==="string"?option:String(option.label||option.text||option.value||"");
  const value=typeof option==="string"?option:String(option.value||option.label||option.text||"");
  if(!label.trim())return "";
  return '<button type="button" class="tutor-choice" data-ai-choice="'+index+'" data-ai-value="'+esc(value)+'">'+esc(label)+'</button>';
 }).filter(Boolean).join("");
 return '<div class="ai-answer">'+renderTutorAnswer(message)+'</div>'+(safeOptions?'<div class="tutor-choices" aria-label="Choisir une réponse">'+safeOptions+'</div>':"");
}
function readAI(){try{return JSON.parse(localStorage.getItem(AI_STORE)||"{}")}catch{return{}}}
function writeAI(x){localStorage.setItem(AI_STORE,JSON.stringify(x))}
function topicsFor(l){
 const out=[];
 (l.objectifs||[]).forEach((t,i)=>out.push({id:"obj-"+i,titre:t}));
 (l.blocs||[]).filter(b=>b.type==="h2"||b.type==="h3").forEach((b,i)=>out.push({id:"titre-"+i,titre:b.t}));
 return out;
}
function catalog(){
 return COURSE_REGISTRY.map(course=>({...course,lessons:course.lessons.map(l=>({id:l.id,titre:l.titre,section:(course.sections||SECTIONS)[l.section],topics:topicsFor(l)}))}));
}
function save(item){
 const all=readItems(); const old=all.findIndex(x=>x.id===item.id);
 if(old>=0)all[old]=item;else all.unshift(item);
 writeItems(all);
}
function recordWrongQuiz(q,chosen){
 const lesson=LECONS.find(l=>l.id===q.l)||LECONS[0];
 const topic=(lesson.objectifs||[])[0]||lesson.titre;
 const all=readItems();
 const exists=all.find(x=>x.source==="quiz"&&x.question===q.q&&x.status!=="maitrise");
 if(exists){exists.occurrences=(exists.occurrences||1)+1;exists.updatedAt=Date.now();exists.lastAnswer=q.o[chosen];writeItems(all);return;}
 all.unshift({id:uid(),type:"Erreur",source:"quiz",courseId:"claude-code-101",courseTitle:"Claude Code 101",lessonId:lesson.id,lessonTitle:lesson.titre,topicTitle:topic,description:"Question : "+q.q+"\nRéponse donnée : "+q.o[chosen]+"\nRéponse attendue : "+q.o[q.b]+"\nExplication du cours : "+q.e,question:q.q,wrongAnswer:q.o[chosen],correctAnswer:q.o[q.b],explanation:q.e,status:"a-comprendre",createdAt:Date.now(),updatedAt:Date.now(),occurrences:1});
 writeItems(all);
}
function render(){
 const root=document.getElementById("revision-app");
 if(!root)return;
 let items=readItems(), ai=readAI(), filter="tous", search="";
 const courses=catalog();
 const statuts={"a-comprendre":"À comprendre","en-cours":"En cours d’acquisition","maitrise":"Maîtrisé"};
 const statColor={"a-comprendre":"status-warn","en-cours":"status-progress","maitrise":"status-done"};
 function shell(){
 root.innerHTML=`
 <header class="rev-top"><a class="rev-brand" href="index.html">← <span>CL4UD3</span></a><span class="rev-top-label">ESPACE DE CONSOLIDATION</span></header>
 <main class="rev-main">
 <section class="rev-intro"><p class="eyebrow">APPRENDRE · COMPRENDRE · INTÉGRER</p><h1>Révisions & compréhension</h1><p class="rev-lead">Un espace pour identifier chaque zone de flou, reprendre les notions à ton rythme et vérifier que tu les maîtrises réellement.</p></section>
 <section class="rev-stats" id="stats"></section>
 <section class="rev-layout">
 <div class="rev-primary">
 <div class="rev-section-head"><div><p class="eyebrow">TON CARNET</p><h2>Ajouter une difficulté</h2></div><span class="rev-small">Erreur · doute · question</span></div>
 <form id="entry-form" class="rev-card rev-form">
 <div class="rev-fields two"><label>Type<select name="type"><option>Question</option><option>Doute</option><option>Erreur</option></select></label><label>Cours<select name="course" id="course-select"></select></label></div>
 <div class="rev-fields two"><label>Leçon<select name="lesson" id="lesson-select"></select></label><label>Notion concernée<select name="topic" id="topic-select"></select></label></div>
 <label>Ce qui te pose problème <span class="rev-tiny">(facultatif si tu ajoutes une capture)</span><textarea name="description" rows="3" placeholder="Tu peux laisser ce champ vide : Claude analysera ta capture."></textarea></label>
 <label class="image-upload">Captures d’écran de ton exercice <input id="entry-images" type="file" accept="image/png,image/jpeg,image/webp" multiple><span class="rev-tiny">Ajoute jusqu’à 3 images pour que le tuteur puisse identifier précisément l’exercice. Elles seront conservées avec cette difficulté sur cet appareil.</span></label><div id="entry-image-preview" class="image-preview"></div>
 <div class="rev-form-foot"><span class="rev-small">Enregistré sur cet appareil.</span><button class="rev-btn primary" type="submit">Ajouter au carnet</button></div>
 </form>
 <div class="rev-section-head list-head"><div><p class="eyebrow">À TRAITER</p><h2>Mes difficultés</h2></div><span id="count-label" class="rev-small"></span></div>
 <div class="rev-tools"><input id="search" type="search" placeholder="Rechercher une notion…"><select id="filter"><option value="tous">Tous les statuts</option><option value="a-comprendre">À comprendre</option><option value="en-cours">En cours d’acquisition</option><option value="maitrise">Maîtrisé</option></select></div>
 <div id="items-list" class="rev-items"></div>
 </div>
 <aside class="rev-aside">
 <section class="rev-card rev-map"><p class="eyebrow">PARCOURS COMPLET</p><h2>Explorer les cours</h2><p class="rev-small">Choisis une leçon pour afficher ses objectifs et ses notions clés, même si tu n’as pas encore ajouté de difficulté.</p><div id="course-list" class="course-list"></div></section>
 <section class="rev-card ai-card"><p class="eyebrow">TUTEUR PÉDAGOGIQUE</p><h2>Assistant intelligent</h2><p class="rev-small">Il pourra expliquer une notion, construire des exemples et générer des exercices ciblés à partir de tes difficultés.</p><div id="ai-state" class="ai-state"></div><label class="ai-config">Adresse du service IA (facultatif)<input id="ai-endpoint" type="url" placeholder="https://ton-service-ia.example/api/chat"></label><button id="save-ai" type="button" class="rev-btn secondary full">Enregistrer et tester la connexion</button><p id="ai-feedback" class="ai-feedback" role="status" aria-live="polite"></p><p class="rev-tiny">La clé secrète ne doit jamais être placée dans cette application publique. Le service IA devra la conserver côté serveur.</p></section>
 </aside>
 </section>
 <footer class="rev-footer"><span>Tes notes restent dans le stockage local de ce navigateur.</span><button id="export-data" class="rev-btn secondary">Exporter mon carnet (.json)</button></footer>
 </main>
 <div id="detail-modal" class="rev-modal" hidden></div>`;
 }
 function refresh(){
 items=readItems(); ai=readAI();
 const mastered=items.filter(x=>x.status==="maitrise").length;
 const open=items.filter(x=>x.status!=="maitrise").length;
 const lessonsWith= new Set(items.filter(x=>x.status!=="maitrise").map(x=>(x.courseId||COURSE_REGISTRY[0].id)+":"+x.lessonId)).size;
 document.getElementById("stats").innerHTML=[
 ["Difficultés enregistrées",items.length],["À consolider",open],["Notions maîtrisées",mastered],["Leçons concernées",lessonsWith]
 ].map(([t,n])=>`<article class="rev-stat"><span>${t}</span><strong>${n}</strong></article>`).join("");
 document.getElementById("count-label").textContent=items.length+" élément"+(items.length>1?"s":"");
 document.getElementById("ai-endpoint").value=ai.endpoint||"";
 document.getElementById("ai-state").innerHTML=ai.endpoint?(ai.verifiedEndpoint===ai.endpoint&&ai.verifiedAt?'<span class="ai-dot ready"></span> Dernier test Claude réussi':'<span class="ai-dot"></span> Adresse enregistrée — connexion non vérifiée'):'<span class="ai-dot"></span> Service IA à connecter';
 document.getElementById("ai-feedback").textContent=ai.endpoint?(ai.verifiedEndpoint===ai.endpoint&&ai.verifiedAt?"Claude a répondu au test du "+new Date(ai.verifiedAt).toLocaleString("fr-FR")+".":"Appuie sur le bouton pour tester réellement Claude."):"";
 renderList();renderCourses();
 }
 function renderList(){
 const term=search.toLocaleLowerCase("fr");
 const shown=items.filter(x=>(filter==="tous"||x.status===filter)&&(!term||[x.lessonTitle,x.topicTitle,x.description,x.type].join(" ").toLocaleLowerCase("fr").includes(term)));
 document.getElementById("items-list").innerHTML=shown.length?shown.map(x=>`
 <article class="rev-item" data-id="${esc(x.id)}"><div class="rev-item-main"><div class="rev-item-meta"><span class="rev-type">${esc(x.type)}</span><span class="rev-small">${COURSE_REGISTRY.length>1&&x.courseTitle?esc(x.courseTitle)+" · ":""}${esc(x.lessonTitle||"Cours")}</span></div><h3>${esc(x.topicTitle||"Notion à préciser")}</h3><p>${esc((x.description||"").split("\n")[0])}</p><div class="rev-item-bottom"><span class="rev-status ${statColor[x.status]||statColor["a-comprendre"]}">${statuts[x.status]||statuts["a-comprendre"]}</span><span class="rev-small">${date(x.updatedAt||x.createdAt)}</span></div></div><button class="rev-open" data-open="${esc(x.id)}" aria-label="Ouvrir la fiche">Ouvrir →</button></article>`).join(""):'<div class="rev-empty"><strong>Rien à afficher.</strong><p>Ajoute une question ou sélectionne une notion du parcours pour commencer.</p></div>';
 document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>detail(b.dataset.open)));
 }
 function renderCourses(){
 document.getElementById("course-list").innerHTML=courses.map((c,ci)=>`<details class="course-row"><summary><span class="course-number">${String(ci+1).padStart(2,"0")}</span><span>${esc(c.title)}</span><span class="course-chevron">⌄</span></summary><div class="course-topics">${c.lessons.map(l=>`<details class="course-row"><summary><span class="course-number">${String(l.id).padStart(2,"0")}</span><span>${esc(l.titre)}</span></summary><div class="course-topics">${l.topics.map(t=>`<button data-topic-course="${esc(c.id)}" data-topic-lesson="${l.id}" data-topic="${esc(t.titre)}">${esc(t.titre)}</button>`).join("")}</div></details>`).join("")}</div></details>`).join("");
 document.querySelectorAll("[data-topic-lesson]").forEach(b=>b.addEventListener("click",()=>{document.getElementById("course-select").value=b.dataset.topicCourse;fillLessons();document.getElementById("lesson-select").value=b.dataset.topicLesson;fillTopics();document.getElementById("topic-select").value=b.dataset.topic;document.querySelector("#entry-form textarea").focus();window.scrollTo({top:document.getElementById("entry-form").offsetTop-90,behavior:"smooth"});}));
 }
 function fillLessons(){
 const course=COURSE_REGISTRY.find(c=>c.id===document.getElementById("course-select").value)||COURSE_REGISTRY[0];
 const lessons=course.lessons.map(l=>({id:l.id,titre:l.titre}));
 document.getElementById("lesson-select").innerHTML=lessons.map(l=>`<option value="${l.id}">Leçon ${l.id} — ${esc(l.titre)}</option>`).join("");
 fillTopics();
 }
 function fillTopics(){
 const course=COURSE_REGISTRY.find(c=>c.id===document.getElementById("course-select").value)||COURSE_REGISTRY[0];
 const l=course.lessons.find(x=>x.id===Number(document.getElementById("lesson-select").value));
 document.getElementById("topic-select").innerHTML=(l?topicsFor(l):[]).map(t=>`<option value="${esc(t.titre)}">${esc(t.titre)}</option>`).join("");
 }
 function detail(id){
 const x=items.find(i=>i.id===id);if(!x)return;
 const modal=document.getElementById("detail-modal");
 modal.hidden=false;
 modal.innerHTML=`<div class="rev-dialog"><button class="modal-close" id="close-modal" aria-label="Fermer">×</button><p class="eyebrow">FICHE DE CONSOLIDATION</p><span class="rev-type">${esc(x.type)} · ${COURSE_REGISTRY.length>1&&x.courseTitle?esc(x.courseTitle)+" · ":""}Leçon ${x.lessonId||"—"}</span><h2>${esc(x.topicTitle||"Notion à revoir")}</h2><p class="detail-question">${esc(x.description||"")}</p><label>État d’acquisition<select id="detail-status">${Object.entries(statuts).map(([k,v])=>`<option value="${k}" ${x.status===k?"selected":""}>${v}</option>`).join("")}</select></label><section class="tutor-output"><p class="eyebrow">COMPRENDRE AVEC L’ASSISTANT</p><p class="rev-small">Les captures ajoutées dans « Ajouter une difficulté » sont jointes automatiquement à cette fiche et transmises à Claude. Tu n’as pas besoin de les importer une deuxième fois. Claude te proposera uniquement des questions ciblées ou des choix à sélectionner.</p><div id="saved-image-preview" class="image-preview"></div><div id="tutor-content" class="tutor-conversation"><p class="rev-small">${(x.images||[]).length?"Analyse automatique de la capture en préparation…":"Ajoute une capture ou écris une question pour commencer."}</p></div><label class="tutor-question-label" for="tutor-question">Répondre à Claude (facultatif)<textarea id="tutor-question" rows="3" placeholder="Facultatif : ajoute une précision si les choix proposés ne suffisent pas…"></textarea></label><button id="ask-ai" class="rev-btn primary full" ${ai.endpoint?"":"disabled"}>Envoyer ma réponse</button></section><div class="detail-actions"><button id="delete-item" class="rev-btn danger">Supprimer</button><button id="close-bottom" class="rev-btn secondary">Fermer</button></div></div>`;
 const savedPreview=document.getElementById("saved-image-preview");
 if((x.images||[]).length){
  savedPreview.innerHTML='<p class="rev-small">Captures déjà enregistrées avec cette difficulté :</p>'+x.images.map((src,i)=>'<img class="saved-exercise-image" src="'+src+'" alt="Capture enregistrée '+(i+1)+'">').join("");
 }else{savedPreview.innerHTML='<p class="rev-small">Aucune capture enregistrée avec cette difficulté.</p>';}
 const close=()=>modal.hidden=true;
 document.getElementById("close-modal").onclick=close;document.getElementById("close-bottom").onclick=close;
 document.getElementById("detail-status").onchange=e=>{x.status=e.target.value;x.updatedAt=Date.now();save(x);refresh();};
 document.getElementById("delete-item").onclick=()=>{if(confirm("Supprimer cette difficulté ?")){writeItems(readItems().filter(y=>y.id!==id));close();refresh();}};
 window.__cc101TutorHistory=x.tutorHistory||[];
 document.getElementById("ask-ai").onclick=()=>askAI(x);
 if((x.images||[]).length&&!window.__cc101TutorHistory.length&&ai.endpoint){askAI(x);}
 else if((x.images||[]).length&&!ai.endpoint){document.getElementById("tutor-content").innerHTML='<p class="error-text">La capture est enregistrée. Configure et teste la connexion à Claude dans le panneau « Assistant intelligent » pour lancer son analyse automatique.</p>';}
 }
 async function askAI(x, selectedAnswer=""){
 const out=document.getElementById("tutor-content"),btn=document.getElementById("ask-ai");
 const question=document.getElementById("tutor-question");
 let history=x.tutorHistory||(window.__cc101TutorHistory||(window.__cc101TutorHistory=[]));
 if(!ai.endpoint||btn.disabled)return;
 const files=[];
 if(!selectedAnswer&&!question.value.trim()&&!(x.images||[]).length){out.insertAdjacentHTML("beforeend",'<p class="error-text">Cette difficulté ne contient aucune capture. Ajoute une image dans « Ajouter une difficulté » ou écris une question.</p>');return;}
 btn.disabled=true;btn.textContent="Analyse en cours…";
 out.insertAdjacentHTML("beforeend",'<p class="rev-small" id="tutor-pending">Claude analyse ton exercice et prépare une réponse…</p>');
 try{
  const imageParts=(x.images||[]).map(dataUrl=>({type:"image",source:{type:"base64",media_type:"image/jpeg",data:dataUrl.split(",")[1]}}));
  const outputFormat="Réfléchis en interne, mais ne révèle jamais ton raisonnement détaillé ni tes étapes de réflexion. Dans l'interface, affiche uniquement une courte question de clarification OU une courte suggestion, puis des choix cliquables. Réponds STRICTEMENT en JSON valide, sans Markdown, selon ce format : {\"message\":\"Une phrase courte et directement utile.\",\"options\":[{\"label\":\"Texte visible du choix\",\"value\":\"Réponse à envoyer si ce choix est cliqué\"}]}. Propose 2 à 5 choix concrets lorsque c'est pertinent. Les choix doivent être distincts, faciles à comprendre et permettre de cerner le problème. Si aucune question n'est nécessaire, propose les prochaines pistes à explorer. Ne donne ni cours, ni explication longue, ni résumé de ton analyse. Si l'apprenant doit répondre librement, laisse options vide et pose une seule question courte.";
  const userText=selectedAnswer?"L'apprenant a sélectionné cette réponse : "+selectedAnswer+". Poursuis avec une question ciblée ou les choix suivants. "+outputFormat:question.value.trim()?"L'apprenant précise : "+question.value.trim()+". Réponds brièvement avec une question ciblée ou des choix. "+outputFormat:(imageParts.length?"Analyse la capture en interne. Identifie les notions possibles et les incertitudes, puis aide l'apprenant à préciser le problème par une question courte et des choix cliquables. Ne montre pas ton analyse. ":"Aide-moi à cerner cette difficulté avec une question courte et des choix cliquables. ")+outputFormat;
  const content=[...imageParts,{type:"text",text:userText}];
  if(!history.length){
   content.unshift({type:"text",text:"Tu es un tuteur pédagogique expert en programmation et Claude Code. Aide un apprenant débutant francophone. Analyse les captures et le contexte en interne. Ne révèle jamais ton raisonnement détaillé. Dans l’interface, affiche uniquement une question courte ou une suggestion concrète avec des choix cliquables. N’affiche pas de longues explications ni de cours pendant cette phase de diagnostic. Ne devine jamais le contenu illisible."});
  }
  history.push({role:"user",content});
  const res=await fetch(ai.endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:history})});
  let data;try{data=await res.json();}catch{throw Error("Réponse du service illisible.");}
  if(!res.ok)throw Error(data.error||data.message||"Erreur HTTP "+res.status);
  const answer=data.answer||data.content||data.choices?.[0]?.message?.content;
  if(typeof answer!=="string"||!answer.trim())throw Error("Claude n’a pas renvoyé de réponse exploitable.");
  history.push({role:"assistant",content:[{type:"text",text:answer}]});
  x.tutorHistory=history;save(x);
  document.getElementById("tutor-pending")?.remove();
  const turn=document.createElement("div");turn.className="tutor-turn";turn.innerHTML='<span class="tutor-role">Claude</span>'+renderTutorPayload(answer);out.appendChild(turn);
  turn.querySelectorAll("[data-ai-choice]").forEach(choice=>choice.addEventListener("click",()=>{const value=choice.dataset.aiValue;document.getElementById("tutor-question").value="";askAI(x,value);}));
  question.value="";
  out.scrollTop=out.scrollHeight;
 }catch(err){
  history.pop();
  document.getElementById("tutor-pending")?.remove();
  out.insertAdjacentHTML("beforeend",'<p class="error-text">'+esc(err.message)+'</p>');
 }finally{btn.disabled=false;btn.textContent="Envoyer ma réponse";}
}
async function imageToStoredDataUrl(file){
 const source=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error("Impossible de lire l’image."));reader.readAsDataURL(file);});
 const img=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error("Image illisible : "+file.name));image.src=source;});
 const scale=Math.min(1,1600/Math.max(img.width,img.height)),canvas=document.createElement("canvas");
 canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
 canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
 return canvas.toDataURL("image/jpeg",0.72);
}
async function imageToAnthropicPart(file){
 const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error("Impossible de lire l’image."));reader.readAsDataURL(file);});
 const img=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error("Image illisible : "+file.name));image.src=dataUrl;});
 const max=1800,scale=Math.min(1,max/Math.max(img.width,img.height));
 const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
 const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,canvas.width,canvas.height);
 const jpeg=canvas.toDataURL("image/jpeg",0.82);
 return {type:"image",source:{type:"base64",media_type:"image/jpeg",data:jpeg.split(",")[1]}};
}

 shell();
 const courseSelect=document.getElementById("course-select");
 courseSelect.innerHTML=COURSE_REGISTRY.map(c=>`<option value="${esc(c.id)}">${esc(c.title)}</option>`).join("");
 courseSelect.onchange=fillLessons;
 const lessonSelect=document.getElementById("lesson-select");
 lessonSelect.onchange=fillTopics;fillLessons();
 const requestedCourse=new URLSearchParams(location.search).get("course");
 const requestedLesson=Number(new URLSearchParams(location.search).get("lesson"));
 if(requestedCourse&&COURSE_REGISTRY.some(c=>c.id===requestedCourse)){courseSelect.value=requestedCourse;fillLessons();}
 if(requestedLesson&&Array.from(lessonSelect.options).some(o=>Number(o.value)===requestedLesson)){lessonSelect.value=String(requestedLesson);fillTopics();}
 const entryImages=document.getElementById("entry-images");
 entryImages.addEventListener("change",()=>{
  const files=Array.from(entryImages.files||[]),preview=document.getElementById("entry-image-preview");
  preview.innerHTML=files.slice(0,3).map(f=>'<div class="image-preview-item"><span>'+esc(f.name)+'</span><small>'+Math.round(f.size/1024)+' Ko</small></div>').join("");
  if(files.length>3)preview.insertAdjacentHTML("beforeend",'<p class="error-text">Seules les 3 premières captures seront ajoutées.</p>');
 });
 document.getElementById("entry-form").onsubmit=async e=>{
 e.preventDefault();
 const form=e.currentTarget,submit=form.querySelector('button[type="submit"]'),fd=new FormData(form);
 const files=Array.from(entryImages.files||[]).slice(0,3);
 submit.disabled=true;submit.textContent="Enregistrement…";
 try{
  const images=[];
  for(const file of files){
   if(!["image/png","image/jpeg","image/webp"].includes(file.type))throw Error("Format non pris en charge : "+file.name);
   if(file.size>12*1024*1024)throw Error("Une image dépasse 12 Mo : "+file.name);
   images.push(await imageToStoredDataUrl(file));
  }
  const description=fd.get("description").trim();
  if(!description&&!images.length){alert("Ajoute une capture d’écran ou décris ta difficulté.");return;}
  const course=COURSE_REGISTRY.find(c=>c.id===fd.get("course")),lesson=course.lessons.find(l=>l.id===Number(fd.get("lesson")));
  save({id:uid(),type:fd.get("type"),source:"manuel",courseId:course.id,courseTitle:course.title,lessonId:lesson.id,lessonTitle:lesson.titre,topicTitle:fd.get("topic"),description:description||"Capture d’exercice à analyser par l’assistant.",images,status:"a-comprendre",createdAt:Date.now(),updatedAt:Date.now(),occurrences:1});
  form.reset();document.getElementById("entry-image-preview").innerHTML="";fillLessons();refresh();
 }catch(err){alert("Impossible d’ajouter cette difficulté : "+err.message);}
 finally{submit.disabled=false;submit.textContent="Ajouter au carnet";}
 };
 document.getElementById("search").oninput=e=>{search=e.target.value;renderList();};
 document.getElementById("filter").onchange=e=>{filter=e.target.value;renderList();};
 document.getElementById("ai-endpoint").addEventListener("input",()=>{
 const state=document.getElementById("ai-state"),feedback=document.getElementById("ai-feedback");
 state.innerHTML='<span class="ai-dot"></span> Adresse modifiée — test nécessaire';
 feedback.textContent="L’adresse modifiée n’a pas encore été vérifiée.";
 feedback.className="ai-feedback";
});
document.getElementById("save-ai").onclick=async()=>{
 const input=document.getElementById("ai-endpoint"),button=document.getElementById("save-ai"),feedback=document.getElementById("ai-feedback"),state=document.getElementById("ai-state");
 const endpoint=input.value.trim();
 if(!endpoint){writeAI({});ai={};refresh();feedback.textContent="Adresse supprimée.";return;}
 let url;
 try{url=new URL(endpoint);if(url.protocol!=="https:")throw Error("HTTPS requis");}
 catch{feedback.textContent="Saisis une adresse HTTPS valide.";feedback.className="ai-feedback error";return;}
 const previous=readAI();
 ai={endpoint,verifiedAt:previous.verifiedEndpoint===endpoint?previous.verifiedAt:null,verifiedEndpoint:previous.verifiedEndpoint===endpoint?endpoint:null};
 writeAI(ai);
 button.disabled=true;input.disabled=true;button.textContent="Test de Claude en cours…";
 state.innerHTML='<span class="ai-dot testing"></span> Connexion en cours de vérification';
 feedback.className="ai-feedback";feedback.textContent="Adresse enregistrée. Envoi d’une demande réelle à Claude…";
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);
 try{
  const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:"Réponds uniquement avec le mot OK."}]}),signal:controller.signal});
  let data;try{data=await res.json();}catch{throw Error("Réponse du serveur illisible");}
  if(!res.ok)throw Error(data.error||data.message||"Erreur HTTP "+res.status);
  const answer=data.choices?.[0]?.message?.content||data.answer||data.content;
  if(typeof answer!=="string"||!answer.trim())throw Error("Claude n’a pas renvoyé de réponse valide");
  ai={endpoint,verifiedEndpoint:endpoint,verifiedAt:Date.now()};writeAI(ai);
  state.innerHTML='<span class="ai-dot ready"></span> Connexion à Claude vérifiée';
  feedback.className="ai-feedback success";feedback.textContent="Connexion réussie : Claude a répondu au test. L’adresse est enregistrée.";
 }catch(err){
  ai={endpoint};writeAI(ai);
  state.innerHTML='<span class="ai-dot failed"></span> Connexion à Claude non vérifiée';
  feedback.className="ai-feedback error";
  feedback.textContent="Adresse enregistrée, mais le test a échoué : "+(err.name==="AbortError"?"délai de 25 secondes dépassé":err.message)+".";
 }finally{clearTimeout(timeout);button.disabled=false;input.disabled=false;button.textContent="Enregistrer et tester la connexion";}
};
 document.getElementById("export-data").onclick=()=>{const payload={exportedAt:new Date().toISOString(),version:1,items:readItems()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="claude-code-101-mon-carnet.json";a.click();URL.revokeObjectURL(url);};
 refresh();
}
render();
