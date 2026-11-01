import { LECONS, SECTIONS, QUIZ } from "./donnees.js";

const STORE = "cc101fr:revisions:v1";
const AI_STORE = "cc101fr:revision-ai:v1";
const COURSE_REGISTRY = [{ id: "claude-code-101", title: "Claude Code 101", lessons: LECONS }];
const esc = (s="") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date = (v) => new Intl.DateTimeFormat("fr-FR",{dateStyle:"medium"}).format(new Date(v));
const uid = () => "r" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
function readItems(){try{const x=JSON.parse(localStorage.getItem(STORE)||"[]");return Array.isArray(x)?x:[]}catch{return[]}}
function writeItems(x){localStorage.setItem(STORE,JSON.stringify(x))}
function readAI(){try{return JSON.parse(localStorage.getItem(AI_STORE)||"{}")}catch{return{}}}
function writeAI(x){localStorage.setItem(AI_STORE,JSON.stringify(x))}
function topicsFor(l){
 const out=[];
 (l.objectifs||[]).forEach((t,i)=>out.push({id:"obj-"+i,titre:t}));
 (l.blocs||[]).filter(b=>b.type==="h2"||b.type==="h3").forEach((b,i)=>out.push({id:"titre-"+i,titre:b.t}));
 return out;
}
function catalog(){
 return COURSE_REGISTRY.map(course=>({...course,lessons:course.lessons.map(l=>({id:l.id,titre:l.titre,section:SECTIONS[l.section],topics:topicsFor(l)}))}));
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
 <header class="rev-top"><a class="rev-brand" href="index.html">← <span>Claude Code 101</span></a><span class="rev-top-label">ESPACE DE CONSOLIDATION</span></header>
 <main class="rev-main">
 <section class="rev-intro"><p class="eyebrow">APPRENDRE · COMPRENDRE · INTÉGRER</p><h1>Révisions & compréhension</h1><p class="rev-lead">Un espace pour identifier chaque zone de flou, reprendre les notions à ton rythme et vérifier que tu les maîtrises réellement.</p></section>
 <section class="rev-stats" id="stats"></section>
 <section class="rev-layout">
 <div class="rev-primary">
 <div class="rev-section-head"><div><p class="eyebrow">TON CARNET</p><h2>Ajouter une difficulté</h2></div><span class="rev-small">Erreur · doute · question</span></div>
 <form id="entry-form" class="rev-card rev-form">
 <div class="rev-fields two"><label>Type<select name="type"><option>Question</option><option>Doute</option><option>Erreur</option></select></label><label>Cours<select name="course" id="course-select"></select></label></div>
 <div class="rev-fields two"><label>Leçon<select name="lesson" id="lesson-select"></select></label><label>Notion concernée<select name="topic" id="topic-select"></select></label></div>
 <label>Ce qui te pose problème<textarea name="description" rows="3" placeholder="Décris ton erreur, ton doute ou ta question avec tes mots…" required></textarea></label>
 <div class="rev-form-foot"><span class="rev-small">Enregistré sur cet appareil.</span><button class="rev-btn primary" type="submit">Ajouter au carnet</button></div>
 </form>
 <div class="rev-section-head list-head"><div><p class="eyebrow">À TRAITER</p><h2>Mes difficultés</h2></div><span id="count-label" class="rev-small"></span></div>
 <div class="rev-tools"><input id="search" type="search" placeholder="Rechercher une notion…"><select id="filter"><option value="tous">Tous les statuts</option><option value="a-comprendre">À comprendre</option><option value="en-cours">En cours d’acquisition</option><option value="maitrise">Maîtrisé</option></select></div>
 <div id="items-list" class="rev-items"></div>
 </div>
 <aside class="rev-aside">
 <section class="rev-card rev-map"><p class="eyebrow">PARCOURS COMPLET</p><h2>Explorer les cours</h2><p class="rev-small">Choisis une leçon pour afficher ses objectifs et ses notions clés, même si tu n’as pas encore ajouté de difficulté.</p><div id="course-list" class="course-list"></div></section>
 <section class="rev-card ai-card"><p class="eyebrow">TUTEUR PÉDAGOGIQUE</p><h2>Assistant intelligent</h2><p class="rev-small">Il pourra expliquer une notion, construire des exemples et générer des exercices ciblés à partir de tes difficultés.</p><div id="ai-state" class="ai-state"></div><label class="ai-config">Adresse du service IA (facultatif)<input id="ai-endpoint" type="url" placeholder="https://ton-service-ia.example/api/chat"></label><button id="save-ai" class="rev-btn secondary full">Enregistrer l’adresse</button><p class="rev-tiny">La clé secrète ne doit jamais être placée dans cette application publique. Le service IA devra la conserver côté serveur.</p></section>
 </aside>
 </section>
 <footer class="rev-footer">Tes notes restent dans le stockage local de ce navigateur. Pense à exporter régulièrement une sauvegarde.</footer>
 </main>
 <div id="detail-modal" class="rev-modal" hidden></div>`;
 }
 function refresh(){
 items=readItems(); ai=readAI();
 const mastered=items.filter(x=>x.status==="maitrise").length;
 const open=items.filter(x=>x.status!=="maitrise").length;
 const lessonsWith= new Set(items.filter(x=>x.status!=="maitrise").map(x=>x.lessonId)).size;
 document.getElementById("stats").innerHTML=[
 ["Difficultés enregistrées",items.length],["À consolider",open],["Notions maîtrisées",mastered],["Leçons concernées",lessonsWith]
 ].map(([t,n])=>`<article class="rev-stat"><span>${t}</span><strong>${n}</strong></article>`).join("");
 document.getElementById("count-label").textContent=items.length+" élément"+(items.length>1?"s":"");
 document.getElementById("ai-endpoint").value=ai.endpoint||"";
 document.getElementById("ai-state").innerHTML=ai.endpoint?'<span class="ai-dot ready"></span> Service IA configuré':'<span class="ai-dot"></span> Service IA à connecter';
 renderList();renderCourses();
 }
 function renderList(){
 const term=search.toLocaleLowerCase("fr");
 const shown=items.filter(x=>(filter==="tous"||x.status===filter)&&(!term||[x.lessonTitle,x.topicTitle,x.description,x.type].join(" ").toLocaleLowerCase("fr").includes(term)));
 document.getElementById("items-list").innerHTML=shown.length?shown.map(x=>`
 <article class="rev-item" data-id="${esc(x.id)}"><div class="rev-item-main"><div class="rev-item-meta"><span class="rev-type">${esc(x.type)}</span><span class="rev-small">${esc(x.lessonTitle||"Cours")}</span></div><h3>${esc(x.topicTitle||"Notion à préciser")}</h3><p>${esc((x.description||"").split("\n")[0])}</p><div class="rev-item-bottom"><span class="rev-status ${statColor[x.status]||statColor["a-comprendre"]}">${statuts[x.status]||statuts["a-comprendre"]}</span><span class="rev-small">${date(x.updatedAt||x.createdAt)}</span></div></div><button class="rev-open" data-open="${esc(x.id)}" aria-label="Ouvrir la fiche">Ouvrir →</button></article>`).join(""):'<div class="rev-empty"><strong>Rien à afficher.</strong><p>Ajoute une question ou sélectionne une notion du parcours pour commencer.</p></div>';
 document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>detail(b.dataset.open)));
 }
 function renderCourses(){
 document.getElementById("course-list").innerHTML=courses.map(c=>`<details class="course-row"><summary><span class="course-number">01</span><span>${esc(c.title)}</span><span class="course-chevron">⌄</span></summary><div class="course-topics">${c.lessons.map(l=>`<details class="course-row"><summary><span class="course-number">${String(l.id).padStart(2,"0")}</span><span>${esc(l.titre)}</span></summary><div class="course-topics">${l.topics.map(t=>`<button data-topic-course="${esc(c.id)}" data-topic-lesson="${l.id}" data-topic="${esc(t.titre)}">${esc(t.titre)}</button>`).join("")}</div></details>`).join("")}</div></details>`).join("");
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
 modal.innerHTML=`<div class="rev-dialog"><button class="modal-close" id="close-modal" aria-label="Fermer">×</button><p class="eyebrow">FICHE DE CONSOLIDATION</p><span class="rev-type">${esc(x.type)} · Leçon ${x.lessonId||"—"}</span><h2>${esc(x.topicTitle||"Notion à revoir")}</h2><p class="detail-question">${esc(x.description||"")}</p><label>État d’acquisition<select id="detail-status">${Object.entries(statuts).map(([k,v])=>`<option value="${k}" ${x.status===k?"selected":""}>${v}</option>`).join("")}</select></label><section class="tutor-output"><p class="eyebrow">EXPLICATION ET ENTRAÎNEMENT</p><div id="tutor-content"><p class="rev-small">Demande une explication personnalisée à l’assistant intelligent. Il utilisera le contexte de cette difficulté.</p></div><button id="ask-ai" class="rev-btn primary full" ${ai.endpoint?"":"disabled"}>Préparer mon explication et mes exercices</button></section><div class="detail-actions"><button id="delete-item" class="rev-btn danger">Supprimer</button><button id="close-bottom" class="rev-btn secondary">Fermer</button></div></div>`;
 const close=()=>modal.hidden=true;
 document.getElementById("close-modal").onclick=close;document.getElementById("close-bottom").onclick=close;
 document.getElementById("detail-status").onchange=e=>{x.status=e.target.value;x.updatedAt=Date.now();save(x);refresh();};
 document.getElementById("delete-item").onclick=()=>{if(confirm("Supprimer cette difficulté ?")){writeItems(readItems().filter(y=>y.id!==id));close();refresh();}};
 document.getElementById("ask-ai").onclick=()=>askAI(x);
 }
 async function askAI(x){
 const out=document.getElementById("tutor-content"),btn=document.getElementById("ask-ai");
 if(!ai.endpoint)return;
 btn.disabled=true;btn.textContent="Préparation en cours…";out.innerHTML='<p class="rev-small">L’assistant prépare une réponse adaptée à cette notion.</p>';
 const prompt=`Tu es un tuteur pédagogique expert en programmation et Claude Code. Tu accompagnes un apprenant débutant francophone. Réponds en français, avec rigueur et pédagogie. Pour cette difficulté, fournis : 1) une explication progressive et précise, 2) une analogie ou un exemple concret, 3) deux exemples de code commentés si pertinent, 4) trois erreurs fréquentes, 5) trois exercices progressifs avec leurs corrigés masqués sous une section distincte. Ne suppose aucune connaissance non acquise.\nCours : ${x.courseTitle}\nLeçon : ${x.lessonTitle}\nNotion : ${x.topicTitle}\nDifficulté : ${x.description}`;
 try{
 const res=await fetch(ai.endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}],temperature:0.3})});
 if(!res.ok)throw new Error("Le service IA a répondu avec le statut "+res.status);
 const data=await res.json();const answer=data.choices?.[0]?.message?.content||data.answer||data.content||"Réponse vide du service IA.";
 out.innerHTML=`<div class="ai-answer">${esc(answer).replace(/\n/g,"<br>")}</div>`;
 }catch(err){out.innerHTML=`<p class="error-text">${esc(err.message)}. Vérifie l’adresse du service et sa configuration CORS.</p>`;}
 finally{btn.disabled=false;btn.textContent="Régénérer l’explication et les exercices";}
 }
 shell();
 const courseSelect=document.getElementById("course-select");
 courseSelect.innerHTML=COURSE_REGISTRY.map(c=>`<option value="${esc(c.id)}">${esc(c.title)}</option>`).join("");
 courseSelect.onchange=fillLessons;
 const lessonSelect=document.getElementById("lesson-select");
 lessonSelect.onchange=fillTopics;fillLessons();
 document.getElementById("entry-form").onsubmit=e=>{
 e.preventDefault();const fd=new FormData(e.currentTarget),course=COURSE_REGISTRY.find(c=>c.id===fd.get("course")),lesson=course.lessons.find(l=>l.id===Number(fd.get("lesson")));
 save({id:uid(),type:fd.get("type"),source:"manuel",courseId:course.id,courseTitle:course.title,lessonId:lesson.id,lessonTitle:lesson.titre,topicTitle:fd.get("topic"),description:fd.get("description").trim(),status:"a-comprendre",createdAt:Date.now(),updatedAt:Date.now(),occurrences:1});
 e.currentTarget.reset();fillLessons();refresh();
 };
 document.getElementById("search").oninput=e=>{search=e.target.value;renderList();};
 document.getElementById("filter").onchange=e=>{filter=e.target.value;renderList();};
 document.getElementById("save-ai").onclick=()=>{const endpoint=document.getElementById("ai-endpoint").value.trim();writeAI({endpoint});refresh();};
 refresh();
}
render();
