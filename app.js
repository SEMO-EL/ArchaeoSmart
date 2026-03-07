let artifacts = JSON.parse(localStorage.getItem("artifacts")) || [];

let currentID = null;

let audioRecorder;
let audioChunks = [];
let audioData = null;
let currentBrush = 3;
let currentOpacity = 1;
let currentColor = "#000000";


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
audio:audioData,
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

<h3>Voice Text (Beta)</h3>
${a.voice}

<h3>Voice Memo</h3>
${a.audio ? `<audio controls src="${a.audio}"></audio>` : "No recording"}

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



/* GPS */

function getLocation(){

const gpsField=document.getElementById("gps");

gpsField.innerText="Getting location...";

if(!navigator.geolocation){

gpsField.innerText="GPS not supported";
return;

}

navigator.geolocation.getCurrentPosition(

function(pos){

let lat=pos.coords.latitude;
let lng=pos.coords.longitude;

gpsField.innerText=lat+","+lng;

},

function(err){

console.log("GPS ERROR",err);

gpsField.innerText="Unable to get GPS";

},

{
enableHighAccuracy:true,
timeout:20000,
maximumAge:0
}

);

}



/* VOICE TO TEXT (BETA) */

function startDictation(){

const SpeechRecognition =
window.SpeechRecognition || window.webkitSpeechRecognition;

if(!SpeechRecognition){

alert("Speech recognition not supported on this device");
return;

}

const recognition=new SpeechRecognition();

recognition.lang="en-US";

recognition.onresult=function(e){

document.getElementById("voiceText").value=e.results[0][0].transcript;

};

recognition.start();

}



/* VOICE MEMO RECORDING */

async function startRecording(){

try{

const stream=await navigator.mediaDevices.getUserMedia({audio:true});

audioRecorder=new MediaRecorder(stream);

audioChunks=[];

audioRecorder.ondataavailable=e=>{
audioChunks.push(e.data);
};

audioRecorder.onstop=()=>{

const blob=new Blob(audioChunks,{type:"audio/webm"});

const reader=new FileReader();

reader.onloadend=()=>{

audioData=reader.result;

document.getElementById("audioPlayback").src=audioData;

};

reader.readAsDataURL(blob);

};

audioRecorder.start();

}catch(err){

alert("Microphone permission required");

}

}

function stopRecording(){

if(audioRecorder) audioRecorder.stop();

}



/* CANVAS RESOLUTION */

function resizeCanvas(canvas){

const rect = canvas.getBoundingClientRect();

const dpr = window.devicePixelRatio || 1;

canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;

const ctx = canvas.getContext("2d");

ctx.scale(dpr, dpr);

}



/* PHOTO */

document.getElementById("photo").onchange=function(e){

let reader=new FileReader();

reader.onload=function(){
document.getElementById("preview").src=reader.result;
};

reader.readAsDataURL(e.target.files[0]);

};



/* DRAWING ENGINE */

function enableDrawing(canvas){

const ctx = canvas.getContext("2d");

resizeCanvas(canvas);

let drawing=false;

function getPos(e){

const rect=canvas.getBoundingClientRect();

if(e.touches){

return{
x:e.touches[0].clientX-rect.left,
y:e.touches[0].clientY-rect.top
};

}

return{
x:e.clientX-rect.left,
y:e.clientY-rect.top
};

}

function start(e){

drawing=true;

const p=getPos(e);

ctx.beginPath();
ctx.moveTo(p.x,p.y);

}

function draw(e){

if(!drawing) return;

const p=getPos(e);

ctx.lineTo(p.x,p.y);

ctx.strokeStyle=currentColor;
ctx.lineWidth=currentBrush;
ctx.globalAlpha=currentOpacity;

ctx.lineCap="round";

ctx.stroke();

}

function stop(){

drawing=false;

ctx.beginPath();

}

canvas.addEventListener("mousedown",start);
canvas.addEventListener("mousemove",draw);
canvas.addEventListener("mouseup",stop);

canvas.addEventListener("touchstart",start);
canvas.addEventListener("touchmove",draw);
canvas.addEventListener("touchend",stop);

}



/* ENABLE DRAWING */

enableDrawing(document.getElementById("canvas"));
enableDrawing(document.getElementById("canvasFull"));



function clearCanvas(){
let c=document.getElementById("canvas");
c.getContext("2d").clearRect(0,0,c.width,c.height);
}



function clearCanvasFull(){
let c=document.getElementById("canvasFull");
c.getContext("2d").clearRect(0,0,c.width,c.height);
}



/* FULLSCREEN DRAWING */

function openCanvasFullscreen(){

const fs = document.getElementById("canvasFullscreen");

fs.classList.remove("hidden");
fs.style.display="flex";

const fullCanvas = document.getElementById("canvasFull");
const smallCanvas = document.getElementById("canvas");

resizeCanvas(fullCanvas);

/* copy previous drawing */

const fullCtx = fullCanvas.getContext("2d");

fullCtx.clearRect(0,0,fullCanvas.width,fullCanvas.height);

if(smallCanvas.width > 0 && smallCanvas.height > 0){

fullCtx.drawImage(
smallCanvas,
0,
0,
smallCanvas.width,
smallCanvas.height,
0,
0,
fullCanvas.width,
fullCanvas.height
);

}

}



function closeCanvasFullscreen(){

const fullCanvas = document.getElementById("canvasFull");
const smallCanvas = document.getElementById("canvas");

/* resize small canvas to its visible size */

const rect = smallCanvas.getBoundingClientRect();

const dpr = window.devicePixelRatio || 1;

smallCanvas.width = rect.width * dpr;
smallCanvas.height = rect.height * dpr;

const smallCtx = smallCanvas.getContext("2d");

smallCtx.scale(dpr, dpr);

/* copy drawing */

smallCtx.clearRect(0,0,smallCanvas.width,smallCanvas.height);

smallCtx.drawImage(
fullCanvas,
0,
0,
fullCanvas.width,
fullCanvas.height,
0,
0,
rect.width,
rect.height
);

/* close fullscreen */

document.getElementById("canvasFullscreen").classList.add("hidden");

}

/* ensure small canvas has real resolution */

resizeCanvas(smallCanvas);

/* copy drawing */

smallCtx.clearRect(0,0,smallCanvas.width,smallCanvas.height);

smallCtx.drawImage(
fullCanvas,
0,
0,
fullCanvas.width,
fullCanvas.height,
0,
0,
smallCanvas.width,
smallCanvas.height
);

/* hide fullscreen */

fs.classList.add("hidden");
fs.style.display="none";

}



/* QR SCANNER */

function startScanner(){

hideAll();

document.getElementById("scannerScreen").classList.remove("hidden");

const html5QrCode=new Html5Qrcode("reader");

html5QrCode.start(
{facingMode:"environment"},
{fps:10,qrbox:250},
msg=>{

let artifact=artifacts.find(a=>a.id.toString()===msg);

if(artifact){
showDetail(artifact.id);
}else{
alert("Artifact not found");
}

html5QrCode.stop();

});

}



/* MAP */

function showMap(){

hideAll();

document.getElementById("mapScreen").classList.remove("hidden");

let map=L.map('map').setView([31.63,-8],6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

artifacts.forEach((a,i)=>{

if(!a.lat || !a.lng) return;

let lat=a.lat+(i*0.00005);
let lng=a.lng+(i*0.00005);

let marker=L.marker([lat,lng]).addTo(map);

marker.bindPopup(`
<b>${a.type}</b><br>
Site: ${a.site}<br>
Depth: ${a.depth} cm<br>
<button onclick="showDetail(${a.id})">Open Artifact</button>
`);

});

}



/* RESIZE HANDLING */

window.addEventListener("resize",()=>{

const canvas = document.getElementById("canvasFull");

if(canvas) resizeCanvas(canvas);

});
