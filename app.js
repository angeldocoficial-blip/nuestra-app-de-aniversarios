const defaults={
  name1:"Angel",
  name2:"Ashley",
  anniversary:"2026-04-03",
  quote:"“Dos personas, una historia y muchos recuerdos por crear.” ❤️",
  cover:"",
  photos:[],
  letters:[],
  memories:[],
  song:{
    name:"Perfecta",
    artist:"Miranda!",
    url:"https://open.spotify.com/search/Perfecta%20Miranda"
  }
};

function get(){
  try{
    const saved=JSON.parse(localStorage.getItem("loveApp")||"{}");
    const d={...defaults,...saved};
    d.photos=Array.isArray(saved.photos)?saved.photos:[];
    d.letters=Array.isArray(saved.letters)?saved.letters:[];
    d.memories=Array.isArray(saved.memories)?saved.memories:[];
    d.song={...defaults.song,...(saved.song||{})};
    if(!d.song.name)d.song={...defaults.song};
    return d;
  }catch(e){return {...defaults}}
}
const set=d=>localStorage.setItem("loveApp",JSON.stringify(d));

function addMonthsClamped(date,months){
  const day=date.getDate();
  const result=new Date(date);
  result.setDate(1);
  result.setMonth(date.getMonth()+months);
  const lastDay=new Date(result.getFullYear(),result.getMonth()+1,0).getDate();
  result.setDate(Math.min(day,lastDay));
  return result;
}

function monthsBetween(a,b){
  let m=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();
  const candidate=addMonthsClamped(a,m);
  if(candidate>b)m--;
  return Math.max(0,m);
}

function formatDate(date,options={day:"numeric",month:"long",year:"numeric"}){
  return date.toLocaleDateString("es-MX",options);
}

function update(){
  const d=get(),now=new Date(),start=new Date(d.anniversary+"T00:00:00");
  document.getElementById("displayName1").textContent=d.name1||"Angel";
  document.getElementById("displayName2").textContent=d.name2||"Ashley";

  const m=monthsBetween(start,now);
  const base=addMonthsClamped(start,m);
  const days=Math.max(0,Math.floor((now-base)/86400000));

  document.getElementById("months").textContent=m;
  document.getElementById("days").textContent=days;
  document.getElementById("sinceText").textContent="Desde el "+formatDate(start);

  const nm=m+1;
  const n=addMonthsClamped(start,nm);
  if(n<=now){
    // Protección para fechas de mes corto o cambios de hora.
    const next=addMonthsClamped(start,nm+1);
    renderNext(next,monthsBetween(start,next),now);
  }else{
    renderNext(n,nm,now);
  }

  document.querySelector(".quote").textContent=d.quote||defaults.quote;
  renderCover(d.cover);

  const sameDay=now.getDate()===n.getDate()&&now.getMonth()===n.getMonth()&&now.getFullYear()===n.getFullYear();
  const banner=document.getElementById("anniversaryBanner");
  banner.classList.toggle("hidden",!sameDay);
  if(sameDay){
    document.getElementById("specialText").textContent=specialAnniversaryText(d.name1,d.name2,m);
    if(!sessionStorage.getItem("heartsToday")){
      sessionStorage.setItem("heartsToday","1");
      hearts();
    }
  }
}

function renderNext(n,nm,now){
  const diff=Math.max(0,Math.ceil((n-now)/86400000));
  document.getElementById("nextText").textContent=formatDate(n,{day:"numeric",month:"long"});
  document.getElementById("countdown").textContent=`Su aniversario de ${nm} meses • faltan ${diff} día${diff===1?"":"s"} ❤️`;
}

function specialAnniversaryText(name1,name2,months){
  if(months>0 && months%12===0){
    const years=months/12;
    return `Hoy ${name1} y ${name2} celebran ${years} ${years===1?"año":"años"} juntos. Gracias por seguir escribiendo esta historia. ❤️`;
  }
  return `Hoy ${name1} y ${name2} cumplen ${months} meses juntos. Gracias por seguir escribiendo esta historia. ❤️`;
}

function renderCover(src){
  const el=document.getElementById("coverPhoto");
  el.innerHTML=src?`<img src="${src}" alt="Foto de nosotros">`:"<span>♥</span>";
}

function show(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0,0);
}
function showHome(){update();show("home")}
function showSettings(){
  const d=get();
  name1.value=d.name1;
  name2.value=d.name2;
  anniversary.value=d.anniversary;
  coupleQuote.value=d.quote?.replace(/^“|” ❤️$/g,"")||"";
  show("settings");
}
function saveSettings(){
  const d=get();
  d.name1=name1.value.trim()||"Angel";
  d.name2=name2.value.trim()||"Ashley";
  d.anniversary=anniversary.value||defaults.anniversary;
  d.quote=coupleQuote.value.trim()?`“${coupleQuote.value.trim()}” ❤️`:defaults.quote;
  set(d);
  showHome();
}
function showSection(id){
  show(id);
  if(id==="memories")renderPhotos();
  if(id==="letters")renderLetters();
  if(id==="music")renderSong();
  if(id==="history")renderTimeline();
}

photoInput.addEventListener("change",async e=>{
  const d=get();
  for(const file of [...e.target.files]){
    const r=new FileReader();
    await new Promise(res=>{
      r.onload=()=>{d.photos.push(r.result);res()};
      r.readAsDataURL(file)
    });
  }
  set(d);renderPhotos();photoInput.value="";
});
function renderPhotos(){
  const g=document.getElementById("gallery"),d=get();
  g.innerHTML=d.photos.length?d.photos.map((p,i)=>`<div class="photo"><img src="${p}" alt="Recuerdo ${i+1}"><button onclick="removePhoto(${i})">×</button></div>`).join(""):`<div class="info" style="grid-column:1/-1;text-align:center">Aún no hay fotos. Agrega sus primeros recuerdos ❤️</div>`;
}
function removePhoto(i){const d=get();d.photos.splice(i,1);set(d);renderPhotos()}
function clearPhotos(){if(confirm("¿Eliminar todas las fotos?")){const d=get();d.photos=[];set(d);renderPhotos()}}

function saveLetter(){
  const title=letterTitle.value.trim(),text=letterText.value.trim();
  if(!text)return;
  const d=get();
  d.letters.unshift({title:title||"Para ti ❤️",text,date:new Date().toLocaleDateString("es-MX")});
  set(d);letterTitle.value="";letterText.value="";renderLetters();
}
function renderLetters(){
  const d=get();
  document.getElementById("lettersList").innerHTML=d.letters.length?d.letters.map((x,i)=>`<article class="letter"><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.text)}</p><div class="date">${escapeHtml(x.date)} · <button onclick="removeLetter(${i})" style="border:0;background:none;color:#b64f73">Eliminar</button></div></article>`).join(""):`<div class="info">Todavía no han escrito cartas aquí. 💌</div>`;
}
function removeLetter(i){const d=get();d.letters.splice(i,1);set(d);renderLetters()}
function escapeHtml(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function saveSong(){
  const d=get();
  d.song={
    name:songName.value.trim()||"Perfecta",
    artist:songArtist.value.trim()||"Miranda!",
    url:songUrl.value.trim()
  };
  set(d);renderSong();
}
function renderSong(){
  const d=get();
  songName.value=d.song.name;
  songArtist.value=d.song.artist;
  songUrl.value=d.song.url;
  document.getElementById("songCard").innerHTML=d.song.name?
    `<div class="song-note">🎶</div><h3>${escapeHtml(d.song.name)}</h3><p class="small">${escapeHtml(d.song.artist||"Nuestra canción")}</p>${d.song.url?`<a class="song-button" href="${encodeURI(d.song.url)}" target="_blank" rel="noopener">Escuchar nuestra canción ♥</a>`:`<p class="small">Agrega un enlace para poder abrirla desde la app.</p>`}`
    :"";
}

function saveMemory(){
  const title=memoryTitle.value.trim(),text=memoryText.value.trim(),date=memoryDate.value;
  if(!title&&!text)return;
  const d=get();
  d.memories.push({
    title:title||"Un recuerdo especial ❤️",
    text:text||"",
    date:date||new Date().toISOString().slice(0,10)
  });
  d.memories.sort((a,b)=>new Date(a.date)-new Date(b.date));
  set(d);
  memoryTitle.value="";memoryText.value="";memoryDate.value="";
  renderTimeline();
}
function renderTimeline(){
  const d=get(),el=document.getElementById("timeline");
  if(!d.memories.length){
    el.innerHTML=`<div class="info">Aquí pueden guardar cómo se conocieron, su primera cita, el día que se hicieron novios, viajes y todos esos momentos que quieren recordar. ❤️</div>`;
    return;
  }
  el.innerHTML=d.memories.map((x,i)=>`<article class="timeline-item">
    <div class="timeline-dot">♥</div>
    <div class="timeline-card">
      <div class="date">${escapeHtml(formatMemoryDate(x.date))}</div>
      <h3>${escapeHtml(x.title)}</h3>
      <p>${escapeHtml(x.text)}</p>
      <button class="delete-memory" onclick="removeMemory(${i})">Eliminar recuerdo</button>
    </div>
  </article>`).join("");
}
function formatMemoryDate(value){
  const dt=new Date(value+"T00:00:00");
  return dt.toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"});
}
function removeMemory(i){
  const d=get();
  if(confirm("¿Eliminar este recuerdo?")){
    d.memories.splice(i,1);set(d);renderTimeline();
  }
}

coverInput.addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{const d=get();d.cover=r.result;set(d);update()};
  r.readAsDataURL(f)
});

function hearts(){
  for(let i=0;i<28;i++){
    const h=document.createElement("span");
    h.className="falling-heart";
    h.textContent=Math.random()>.25?"♥":"♡";
    h.style.left=Math.random()*100+"%";
    h.style.animationDuration=(3+Math.random()*4)+"s";
    h.style.animationDelay=(Math.random()*2)+"s";
    document.getElementById("hearts").appendChild(h);
    setTimeout(()=>h.remove(),7500)
  }
}

if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
update();
setInterval(update,60000);
