const defaultData = {
  name1: "Angel",
  name2: "Ashley",
  anniversary: "2026-04-03"
};

function getData(){
  try { return {...defaultData, ...JSON.parse(localStorage.getItem("anniversaryData") || "{}")}; }
  catch(e){ return {...defaultData}; }
}
function saveData(data){ localStorage.setItem("anniversaryData", JSON.stringify(data)); }

function monthsBetween(start, end){
  let months=(end.getFullYear()-start.getFullYear())*12+(end.getMonth()-start.getMonth());
  if(end.getDate()<start.getDate()) months--;
  return Math.max(0,months);
}
function nextAnniversary(start, now){
  let year=now.getFullYear();
  let candidate=new Date(year,start.getMonth(),start.getDate(),0,0,0);
  if(candidate<=now) candidate=new Date(year+1,start.getMonth(),start.getDate(),0,0,0);
  return candidate;
}
function updateHome(){
  const d=getData();
  document.getElementById("displayName1").textContent=d.name1 || "Angel";
  document.getElementById("displayName2").textContent=d.name2 || "Ashley";

  const start=new Date(d.anniversary+"T00:00:00");
  const now=new Date();
  const months=monthsBetween(start,now);
  const temp=new Date(start);
  temp.setMonth(start.getMonth()+months);
  const days=Math.max(0,Math.floor((now-temp)/(1000*60*60*24)));

  document.getElementById("months").textContent=months;
  document.getElementById("days").textContent=days;
  document.getElementById("sinceText").textContent=
    "Desde el "+start.toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"});

  const next=nextAnniversary(start,now);
  const diff=Math.ceil((next-now)/(1000*60*60*24));
  const nextMonths=monthsBetween(start,next);
  document.getElementById("nextText").textContent=
    next.toLocaleDateString("es-MX",{day:"numeric",month:"long"});
  document.getElementById("countdown").textContent=
    `Su aniversario de ${nextMonths} meses • faltan ${diff} día${diff===1?"":"s"} ❤️`;
}

function showSettings(){
  const d=getData();
  document.getElementById("name1").value=d.name1;
  document.getElementById("name2").value=d.name2;
  document.getElementById("anniversary").value=d.anniversary;
  document.getElementById("home").classList.remove("active");
  document.getElementById("settings").classList.add("active");
}
function showHome(){
  updateHome();
  document.getElementById("settings").classList.remove("active");
  document.getElementById("home").classList.add("active");
}
function saveSettings(){
  const data={
    name1:document.getElementById("name1").value.trim() || "Angel",
    name2:document.getElementById("name2").value.trim() || "Ashley",
    anniversary:document.getElementById("anniversary").value || "2026-04-03"
  };
  saveData(data);
  showHome();
}

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
updateHome();
setInterval(updateHome,60000);
