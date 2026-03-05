let artifacts = JSON.parse(localStorage.getItem("artifacts")) || [];

let currentID = null;

function hideAll(){
document.querySelectorAll("#homeScreen,#artifactScreen,#databaseScreen,#detailScreen,#mapScreen,#scannerScreen")
.forEach(e=>e.classList.add("hidden"));
}

function showHome(){
hideAll();
document.getElementById("homeScreen").classList.remove("hidden");
}

function showArtifact(){

hideAll();
document.getElementById("artifactScreen").classList.remove("hidden");

currentID = Date.now();

document.getElementById("date").innerText = new Date().toLocaleString();

document.getElementById("qrcode").innerHTML="";
new QRCode(document.getElementById("qrcode"), currentID.toString());

}

function saveArtifact(){

let photo=document.getElementById("preview").src || "";
let drawing=document.getElementById("canvas").toDataURL("image/png");

let gps=document.getElementById("gps").innerText;

let lat=null;
let lng=null;

if(gps.includes(",")){
let p=gps.split(",");
lat=parseFloat(p[0]);
lng=parseFloat(p[1]);
}

let artifact={
id:currentID,
site:document.getElementById("site").value,
type:document.getElementById("type").value,
depth:document.getElementById("depth").value,
notes:document.getElementById("notes").value,
voice:document.getElementById("voiceText").value,
gps:gps,
lat:lat,
lng:lng,
date:document.getElementById("date").innerText,
photo:photo,
drawing:drawing
};

artifacts.push(artifact);

localStorage.setItem("artifacts",JSON.stringify(artifacts));

alert("Artifact saved");

}

function showDatabase(){

hideAll();
document.getElementById("databaseScreen").classList.remove("hidden");

renderDatabase(artifacts);

}

function renderDatabase(list){

let container=document.getElementById("artifactList");

container.innerHTML="";

list.forEach(a=>{

let div=document.createElement("div");

div.className="artifactCard";

div.innerHTML=`
<b>ID:</b> ${a.id}<br>
<b>Site:</b> ${a.site}<br>
<b>Type:</b> ${a.type}
`;

div.onclick=()=>showDetail(a.id);

container.appendChild(div);

});

}

function showDetail(id){

hideAll();

document.getElementById("detailScreen").classList.remove("hidden");

let a=artifacts.find(x=>x.id===id);

document.getElementById("artifactDetail").innerHTML=`

<div class="detailCard">

<b>ID:</b> ${a.id}<br>
<b>Site:</b> ${a.site}<br>
<b>Type:</b> ${a.type}<br>
<b>Depth:</b> ${a.depth}<br>
<b>GPS:</b> ${a.gps}<br>
<b>Date:</b> ${a.date}<br>

<h3>Notes</h3>
${a.notes}

<h3>Voice Memo</h3>
${a.voice}

<h3>Photo</h3>
${a.photo ? `<img src="${a.photo}">` : "No photo"}

<h3>Drawing</h3>
${a.drawing ? `<img src="${a.drawing}">` : "No drawing"}

</div>

`;

}

function searchArtifact(){

let id=document.getElementById("searchID").value;

let results=artifacts.filter(a=>a.id.toString().includes(id));

renderDatabase(results);

}

function exportCSV(){

let csv="ID,Site,Type,Depth,GPS,Date\n";

artifacts.forEach(a=>{
csv+=`${a.id},${a.site},${a.type},${a.depth},${a.gps},${a.date}\n`;
});

let blob=new Blob([csv],{type:"text/csv"});

let link=document.createElement("a");

link.href=URL.createObjectURL(blob);

link.download="archaeosmart_data.csv";

link.click();

}

function getLocation(){

navigator.geolocation.getCurrentPosition(pos=>{

document.getElementById("gps").innerText=
pos.coords.latitude+","+pos.coords.longitude;

});

}

function startDictation(){

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();

recognition.onresult = e => {
document.getElementById("voiceText").value = e.results[0][0].transcript;
};

recognition.start();

}

document.getElementById("photo").onchange=function(e){

let reader=new FileReader();

reader.onload=function(){
document.getElementById("preview").src=reader.result;
};

reader.readAsDataURL(e.target.files[0]);

};

let canvas=document.getElementById("canvas");
let ctx=canvas.getContext("2d");

let drawing=false;

canvas.onmousedown=e=>{
drawing=true;
ctx.beginPath();
ctx.moveTo(e.offsetX,e.offsetY);
};

canvas.onmouseup=()=>drawing=false;

canvas.onmousemove=e=>{
if(!drawing)return;
ctx.lineTo(e.offsetX,e.offsetY);
ctx.stroke();
};

function clearCanvas(){
ctx.clearRect(0,0,canvas.width,canvas.height);
}

function startScanner(){

hideAll();
document.getElementById("scannerScreen").classList.remove("hidden");

const html5QrCode=new Html5Qrcode("reader");

html5QrCode.start(
{facingMode:"environment"},
{fps:10,qrbox:250},
qrCodeMessage=>{

let artifact=artifacts.find(a=>a.id.toString()===qrCodeMessage);

if(artifact){
showDetail(artifact.id);
}else{
alert("Artifact not found");
}

html5QrCode.stop();

});
}

function showMap(){

hideAll();

document.getElementById("mapScreen").classList.remove("hidden");

let map=L.map('map').setView([31.63,-8],6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

artifacts.forEach(a=>{

if(a.lat && a.lng){

let marker=L.marker([a.lat,a.lng]).addTo(map);

marker.bindPopup(`
<b>${a.type}</b><br>
Site: ${a.site}<br>
<button onclick="showDetail(${a.id})">Open Artifact</button>
`);

}

});

}
