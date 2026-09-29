const municipalities = [
  ["Bamban","Tarlac","Region III","completed",15.244,120.065,"ALRMS Staff"],
  ["Pura","Tarlac","Region III","completed",15.620,120.650,"ALRMS Staff"],
  ["Camiling","Tarlac","Region III","completed",15.686,120.414,"ALRMS Staff"],
  ["Pagbilao","Quezon","Region IV-A","completed",13.968,121.695,"ALRMS Staff"],
  ["Clarin","Bohol","Region VII","completed",9.961,124.028,"ALRMS Staff"],
  ["Tubigon","Bohol","Region VII","completed",10.066,123.963,"ALRMS Staff"],
  ["Sibonga","Cebu","Region VII","completed",10.019,123.994,"ALRMS Staff"],
  ["Toledo City","Cebu","Region VII","completed",10.379,123.638,"ALRMS Staff"],
  ["Balangiga","Eastern Samar","Region VIII","completed",11.109,125.390,"ALRMS Staff"],
  ["Calbayog","Samar","Region VIII","completed",12.066,124.596,"ALRMS Staff"],
  ["Daet","Camarines Norte","Region V","completed",14.112,122.956,"ALRMS Staff"],
  ["Virac","Catanduanes","Region V","completed",13.584,124.237,"ALRMS Staff"],
  ["Tagkawayan","Quezon","Region V","ongoing",13.999,122.535,"ALRMS Staff"],
  ["Giporlos","Eastern Samar","Region VIII","ongoing",11.119,125.449,"ALRMS Staff"],
  ["Labo","Camarines Norte","Region V","ongoing",14.154,122.830,"ALRMS Staff"],
  ["Quezon","Palawan","Region IV-B","ongoing",9.240,118.020,"ALRMS Staff"],
  ["Sibuyan","Romblon","Region IV-B","ongoing",12.391,122.555,"ALRMS Staff"],
  ["Catarman","Northern Samar","Region VIII","pending",12.498,124.638,"ALRMS Staff"],
  ["Bataraza","Palawan","Region IV-B","pending",8.691,117.625,"ALRMS Staff"],
  ["Borongan City","Eastern Samar","Region VIII","pending",11.608,125.432,"ALRMS Staff"]
];

const statusText={completed:"Completed",ongoing:"On Going",pending:"Pending"};
const statusColor={completed:"#2f855a",ongoing:"#3182ce",pending:"#d69e2e"};

const personnel = [
  ["JOHN ALGEN B. MENDEZ","OIC, ALRMS","formal-john-algen-mendez.png"],
  ["VALERIO R. ABLAZA JR.","Agriculturist II","formal-valerio-r-ablaza-jr.png"],
  ["WARREN A. DEL ROSARIO","Agriculturist II","formal-warren-a-del-rosario.png"],
  ["KATRINA S. BUDUAN","Agriculturist I","formal-katrina-s-buduan.png"],
  ["MA. MONETTE P. SERRANO","Project Development Officer II","formal-ma-monette-p-serrano.png"],
  ["MA. ANJENITTE D. CARULLA","Project Development Officer II","formal-ma-anjenitte-d-carulla.png"],
  ["GLORY T. IBAYAN","Science Research Specialist I","formal-glory-t-ibayan.png"],
  ["MICHAELA GRACE L. ENCISA","Science Research Specialist I","formal-michaela-grace-l-encisa.png"],
  ["ELOISA GERLY R. CAPISTRANO","Project Assistant III","formal-eloisa-gerly-r-capistrano.png"],
  ["CRISTEL JUNE M. MONTES","Science Research Specialist I","formal-cristel-june-m-montes.png"]
];

function counts(){
  return {
    total:municipalities.length,
    integrated:9,
    ongoing:6,
    not:5
  };
}
function updateDashboard(){
  // Integration Summary is synchronized from the live Integration & Harmonization
  // municipal status distribution. The live map and this panel use the same rules.
  updateIntegrationSummaryPercentages();
}
function statusPill(s){return `<span class="pill ${s==='integrated'||s==='completed'?'completed':s==='ongoing'?'ongoing':'new'}">${s==='integrated'?'Integrated':statusText[s]||'Pending'}</span>`;}

let map;
let municipalLayer=null;
let mapFilter="all";
let municipalFeatures=[];
const MAP_STATUS_LABELS={completed:"Completed",processing:"Processing",pending:"Pending","no-integration":"No Integration"};
const MAP_STATUS_COLORS={completed:"#16a34a",processing:"#3b82f6",pending:"#f59e0b","no-integration":"#a7afb8"};

function normalizeMapName(value){
  return String(value??"").toLowerCase().replace(/&amp;/g,"&").replace(/[“”‘’]/g,"'").replace(/\s+/g," ").trim();
}
function mapStatusClass(status){
  const s=String(status||"").trim().toLowerCase();
  if(s==="completed")return "completed";
  if(s==="processing")return "processing";
  if(s==="pending")return "pending";
  return "no-integration";
}
function mapFeatureStyle(feature){
  const key=mapStatusClass(feature?.properties?.Status);
  return {color:"#7f8a94",weight:0.45,opacity:.9,fillColor:MAP_STATUS_COLORS[key],fillOpacity:key==="no-integration"?0:.72};
}
function mapPopup(feature,layer){
  const p=feature.properties||{};
  const status=mapStatusClass(p.Status);
  layer.bindPopup(`<div class="municipality-popup"><h4>${escapeHtml(p.Mun_Name||"Municipality")}</h4><div class="province">${escapeHtml(p.Pro_Name||"")}</div><div class="status-line"><i class="status-dot" style="background:${MAP_STATUS_COLORS[status]}"></i>${MAP_STATUS_LABELS[status]}</div><small>Matched using Municipality + Province from the live Integration &amp; Harmonization sheet.</small></div>`);
}
function escapeHtml(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}
function refreshMapSize(){if(!map)return;map.invalidateSize({pan:false,animate:false});}
function initMap(){
  map=L.map("map",{preferCanvas:true,zoomControl:true,attributionControl:false}).setView([12.9,122.5],5.3);

  // Basemap layers: use Esri's public map services so the municipal boundaries remain
  // clearly visible without relying on the OpenStreetMap tile server.
  const streetBasemap=L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    {maxZoom:19,attribution:"&copy; Esri, HERE, Garmin, FAO, NOAA, USGS, EPA, NPS"}
  );
  const satelliteBasemap=L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {maxZoom:19,attribution:"&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community"}
  );
  streetBasemap.addTo(map);
  L.control.layers({
    "Street Map":streetBasemap,
    "Satellite Imagery":satelliteBasemap
  },null,{collapsed:false,position:"topright"}).addTo(map);
  const geojson=window.PHILIPPINE_MUNICIPAL_GEOJSON;
  if(!geojson||!geojson.features){
    document.getElementById("map-live-note")?.replaceChildren(document.createTextNode("Municipal boundary layer could not be loaded."));
    return;
  }
  municipalFeatures=geojson.features;
  municipalLayer=L.geoJSON(geojson,{style:mapFeatureStyle,onEachFeature:(feature,layer)=>{
    mapPopup(feature,layer);
    layer.on({mouseover:e=>{e.target.setStyle({weight:1.2,color:"#173b63",fillOpacity:.86});e.target.bringToFront();},mouseout:e=>{municipalLayer.resetStyle(e.target);},click:e=>{mapPopup(feature,e.target).openPopup();}});
  }}).addTo(map);
  try{
    map.fitBounds(municipalLayer.getBounds(),{padding:[8,8]});
    // Keep the Philippines visible, but start one level more zoomed-in.
    const fittedZoom=map.getZoom();
    map.setZoom(Math.min(fittedZoom+1,7));
  }catch(e){}
  applyMapFilter();
  document.getElementById("map-search")?.addEventListener("keydown",e=>{if(e.key==="Enter")searchMap();});
  document.getElementById("map-search")?.addEventListener("input",()=>{if(!document.getElementById("map-search").value.trim())clearMapSearch();});
  document.getElementById("map-search-clear")?.addEventListener("click",clearMapSearch);
  document.querySelectorAll("[data-map-filter]").forEach(btn=>btn.addEventListener("click",()=>{mapFilter=btn.dataset.mapFilter||"all";document.querySelectorAll("[data-map-filter]").forEach(b=>b.classList.toggle("active",b===btn));applyMapFilter();}));
  requestAnimationFrame(refreshMapSize);setTimeout(refreshMapSize,100);setTimeout(refreshMapSize,350);setTimeout(refreshMapSize,800);window.addEventListener("resize",refreshMapSize);
}
function applyMapFilter(){
  if(!municipalLayer)return;
  municipalLayer.eachLayer(layer=>{
    const key=mapStatusClass(layer.feature?.properties?.Status);
    const show=mapFilter==="all"||key===mapFilter;
    if(show){if(!map.hasLayer(layer))layer.addTo(map);}else if(map.hasLayer(layer))map.removeLayer(layer);
  });
}
function applyLiveIntegrationMap(rows){
  if(!municipalLayer)return;
  const matches=new Map();
  rows.forEach(row=>{
    const c=row.c||[];
    const province=integrationCellValue(c[0]);
    const municipality=integrationCellValue(c[1]);
    const date=integrationCellValue(c[2]);
    const rawStatus=integrationCellValue(c[3]);
    const mapped=mapIntegrationStatus(rawStatus);
    if(!mapped)return;
    const key=normalizeMapName(municipality)+"|"+normalizeMapName(province);
    const previous=matches.get(key);
    if(!previous || String(date).localeCompare(String(previous.date))>0){
      matches.set(key,{status:mapped,date,rawStatus});
    }
  });
  let matched=0;
  municipalFeatures.forEach(feature=>{
    const p=feature.properties||{};
    const key=normalizeMapName(p.Mun_Name)+"|"+normalizeMapName(p.Pro_Name);
    const hit=matches.get(key);
    p.Status=hit?hit.status:"No Integration";
    p.SourceStatus=hit?hit.rawStatus:"";
    p.LastRequestDate=hit?hit.date:"";
    if(hit)matched++;
  });
  municipalLayer.eachLayer(layer=>{layer.setStyle(mapFeatureStyle(layer.feature));mapPopup(layer.feature,layer);});
  updateIntegrationSummaryPercentages();
  applyMapFilter();
  const note=document.getElementById("map-live-note");
  if(note){const now=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});note.textContent=`Live • ${matched} municipalities matched • Last checked ${now}`;}
}
function searchMap(){
  const input=document.getElementById("map-search");if(!input||!municipalLayer)return;
  const q=normalizeMapName(input.value);if(!q)return;
  let exact=null,partial=[];
  municipalLayer.eachLayer(layer=>{
    const p=layer.feature?.properties||{};
    const mun=normalizeMapName(p.Mun_Name),prov=normalizeMapName(p.Pro_Name),combined=mun+" "+prov;
    const addressMatch=(mun.length>2&&q.includes(mun))||(prov.length>2&&q.includes(prov));
    if(combined===q||mun===q||prov===q)exact=layer;
    else if(mun.includes(q)||prov.includes(q)||combined.includes(q)||addressMatch)partial.push(layer);
  });
  const target=exact||partial[0];
  if(!target){const note=document.getElementById("map-live-note");if(note)note.textContent="No matching municipality or province found.";return;}
  if(!map.hasLayer(target))target.addTo(map);
  const bounds=target.getBounds?target.getBounds():null;if(bounds&&bounds.isValid())map.fitBounds(bounds,{padding:[40,40],maxZoom:11});
  mapPopup(target.feature,target).openPopup();
}
function clearMapSearch(){const input=document.getElementById("map-search");if(input)input.value="";if(municipalLayer){applyMapFilter();try{map.fitBounds(municipalLayer.getBounds(),{padding:[8,8]});}catch(e){}}}
function filterMapByRequest(status){
  const normalized=status==="all"?"all":status==="ongoing"?"processing":status;
  mapFilter=normalized;document.querySelectorAll("[data-map-filter]").forEach(b=>b.classList.toggle("active",b.dataset.mapFilter===normalized));applyMapFilter();
}

function fillEmailTable(){
  const rows = [
    ["02 Sep 2026","Regional Office","Request for SAFDZ Validation","ALRMS Staff","ongoing"],
    ["02 Sep 2026","Municipal Planning Office","Harmonization and Integration Request","ALRMS Staff","pending"],
    ["01 Sep 2026","DA-RFO","NPAAAD/SAFDZ Map Request","ALRMS Staff","completed"],
    ["31 Aug 2026","Municipality","Follow-up on Integration Status","ALRMS Staff","ongoing"],
    ["29 Aug 2026","Project Partner","Technical Coordination","ALRMS Staff","completed"]
  ];
  document.querySelector("#email-table tbody").innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${statusPill(r[4]==="pending"?"not":r[4])}</td><td><button class="primary" style="padding:6px 9px">View</button></td></tr>`).join("");
}
function fillPersonnel(){
  document.getElementById("personnel-grid").innerHTML=personnel.map((p,i)=>`
    <article class="person-card" tabindex="0" role="button" data-person-index="${i}" aria-label="View schedule for ${p[0]}">
      <div class="person-photo">
        <img src="assets/${p[2]}" alt="${p[0]}" onerror="this.style.display='none';this.parentElement.innerHTML='<span>PHOTO PLACEHOLDER</span>'">
      </div>
      <div class="person-info"><b>${p[0]}</b><span>${p[1]}</span></div>
    </article>`).join("");
  document.querySelectorAll(".person-card").forEach(card=>{
    const open=()=>showScheduleModal(personnel[Number(card.dataset.personIndex)][0]);
    card.addEventListener("click",open);
    card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}});
  });
}
function filterTable(input,id){
  const q=input.value.toLowerCase();
  document.querySelectorAll(`#${id} tbody tr`).forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q)?"":"none");
}
const GLOBAL_HEADER_TITLE="AGRICULTURAL LAND RESOURCES MANAGEMENT SECTION";
const GLOBAL_HEADER_SUBTITLE="ALRMS Integrated Management and Monitoring System";

const titles={
  dashboard:[GLOBAL_HEADER_TITLE,GLOBAL_HEADER_SUBTITLE],
  emails:[GLOBAL_HEADER_TITLE,GLOBAL_HEADER_SUBTITLE],
  npaaad:[GLOBAL_HEADER_TITLE,GLOBAL_HEADER_SUBTITLE],
  harmonization:[GLOBAL_HEADER_TITLE,GLOBAL_HEADER_SUBTITLE],
  eo79:[GLOBAL_HEADER_TITLE,GLOBAL_HEADER_SUBTITLE],
  reports:[GLOBAL_HEADER_TITLE,GLOBAL_HEADER_SUBTITLE],
  personnel:[GLOBAL_HEADER_TITLE,GLOBAL_HEADER_SUBTITLE],
};
function activatePage(page, clicked){
  document.querySelectorAll(".nav-item,.sub-item").forEach(x=>x.classList.remove("active"));
  if(clicked) clicked.classList.add("active");
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active-page"));
  document.getElementById(page).classList.add("active-page");
  document.getElementById("page-title").textContent=titles[page][0];
  document.getElementById("page-subtitle").textContent=titles[page][1];
  if(page==="dashboard"&&map)setTimeout(()=>map.invalidateSize(),150);
}
document.querySelectorAll(".nav-item[data-page]").forEach(btn=>{
  btn.addEventListener("click",()=>activatePage(btn.dataset.page,btn));
});
document.querySelectorAll(".sub-item[data-page]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.getElementById("database-submenu").classList.add("open");
    activatePage(btn.dataset.page,btn);
  });
});
document.getElementById("database-toggle").addEventListener("click",()=>{
  const menu=document.getElementById("database-submenu");
  menu.classList.toggle("open");
  document.querySelector("#database-toggle .chevron").style.transform =
    menu.classList.contains("open") ? "rotate(0deg)" : "rotate(-90deg)";
});
updateDashboard(); fillPersonnel(); initMap();

document.querySelectorAll(".request-filter").forEach(btn=>{
  btn.addEventListener("click",()=>{
    filterMapByRequest(btn.dataset.requestStatus);
    if(map) map.invalidateSize();
  });
});

// Revision 9: live personnel whereabouts from the linked Google Sheet.
const WHEREABOUTS_SHEET_ID = "1tSBxP8mEAMJw_TvM3jEv_yUTCeb2nl5uPS9M4QJXkP8";
const WHEREABOUTS_GID = "660989601";
const WHEREABOUTS_URL = `https://docs.google.com/spreadsheets/d/${WHEREABOUTS_SHEET_ID}/edit?gid=${WHEREABOUTS_GID}#gid=${WHEREABOUTS_GID}`;

function normalizeName(value){
  return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
let currentSchedulePerson = null;
let scheduleRefreshTimer = null;
let scheduleRefreshInProgress = false;
const SCHEDULE_REFRESH_MS = 15000; // Refresh the Google Sheet every 15 seconds while the popup is open.

function showScheduleModal(personName){
  const modal=document.getElementById("schedule-modal");
  const body=document.getElementById("schedule-body");
  currentSchedulePerson=personName;
  document.getElementById("schedule-title").textContent="Personnel Schedule";
  document.getElementById("schedule-person").textContent=personName;
  body.innerHTML='<div class="schedule-status">Loading the latest schedule from the ALRMS Personnel Whereabouts sheet…</div>';
  modal.classList.add("open"); modal.setAttribute("aria-hidden","false");
  loadPersonnelSchedule(personName);
  startScheduleAutoRefresh();
}
function closeScheduleModal(){
  const modal=document.getElementById("schedule-modal");
  modal.classList.remove("open"); modal.setAttribute("aria-hidden","true");
  currentSchedulePerson=null;
  stopScheduleAutoRefresh();
}
function startScheduleAutoRefresh(){
  stopScheduleAutoRefresh();
  scheduleRefreshTimer=setInterval(()=>{
    const modal=document.getElementById("schedule-modal");
    if(!currentSchedulePerson || !modal || !modal.classList.contains("open")) return;
    loadPersonnelSchedule(currentSchedulePerson,true);
  },SCHEDULE_REFRESH_MS);
}
function stopScheduleAutoRefresh(){
  if(scheduleRefreshTimer){clearInterval(scheduleRefreshTimer);scheduleRefreshTimer=null;}
}
function loadPersonnelSchedule(personName,isRefresh=false){
  if(scheduleRefreshInProgress) return;
  scheduleRefreshInProgress=true;
  const callback="__alrmsWhereabouts_"+Date.now()+"_"+Math.random().toString(36).slice(2);
  const script=document.createElement("script");
  let finished=false;
  const cleanup=()=>{try{delete window[callback]}catch(e){} script.remove(); scheduleRefreshInProgress=false};
  const timeout=setTimeout(()=>{
    if(finished)return; finished=true; cleanup();
    if(isRefresh){
      showScheduleRefreshState("Could not refresh right now. The previous schedule is still displayed.",true);
    }else{
      document.getElementById("schedule-body").innerHTML=`<div class="schedule-empty">Unable to read the live calendar right now. Please make sure the Google Sheet is shared so that people with the link can view it.<br><br><a class="whereabouts-button" href="${WHEREABOUTS_URL}" target="_blank" rel="noopener noreferrer">Open ALRMS Personnel Whereabouts</a></div>`;
    }
  },15000);
  window[callback]=data=>{
    if(finished)return; finished=true; clearTimeout(timeout); cleanup();
    renderPersonnelSchedule(personName,data);
  };
  // headers=0 is intentional: the sheet's first rows contain the calendar
  // month/date/day headings. We need those rows to build the popup calendar.
  const query="select *";
  // The timestamp query parameter prevents the browser/proxy from reusing a stale response.
  script.src=`https://docs.google.com/spreadsheets/d/${WHEREABOUTS_SHEET_ID}/gviz/tq?tqx=responseHandler:${callback}&headers=0&gid=${WHEREABOUTS_GID}&tq=${encodeURIComponent(query)}&_=${Date.now()}`;
  script.onerror=()=>{
    if(finished)return; finished=true; clearTimeout(timeout); cleanup();
    if(isRefresh){
      showScheduleRefreshState("Could not refresh right now. The previous schedule is still displayed.",true);
    }else{
      document.getElementById("schedule-body").innerHTML=`<div class="schedule-empty">The live calendar could not be loaded. You can still open the source sheet directly.<br><br><a class="whereabouts-button" href="${WHEREABOUTS_URL}" target="_blank" rel="noopener noreferrer">Open ALRMS Personnel Whereabouts</a></div>`;
    }
  };
  document.body.appendChild(script);
}
function showScheduleRefreshState(message,isError=false){
  const note=document.getElementById("schedule-refresh-note");
  if(note){
    note.textContent=message;
    note.classList.toggle("error",!!isError);
    if(!isError) setTimeout(()=>{if(note)note.textContent=""},5000);
  }
}
function manualRefreshSchedule(){
  if(currentSchedulePerson){
    showScheduleRefreshState("Refreshing from Google Sheets…");
    loadPersonnelSchedule(currentSchedulePerson,true);
  }
}

function cellValue(row,index){
  const c=row && row.c && row.c[index];
  if(!c)return "";
  return c.f!=null ? String(c.f) : (c.v!=null ? String(c.v) : "");
}
function parseCalendarDate(value){
  const s=String(value||"").trim().replace(/\s+/g," ");
  const m=s.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})$/i);
  if(!m)return null;
  const months={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
  return new Date(2026,months[m[1].toLowerCase()],Number(m[2]));
}
function dateKey(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function monthName(monthIndex){
  return ["January","February","March","April","May","June","July","August","September","October","November","December"][monthIndex];
}
function renderPersonnelSchedule(personName,data){
  const body=document.getElementById("schedule-body");
  const table=data && data.table;
  if(!table || !table.rows){
    body.innerHTML='<div class="schedule-empty">No readable calendar data was returned from the Google Sheet.</div>'; return;
  }

  // Source structure shown in the supplied screenshot:
  // Column A = NAMES
  // Columns ES through MX = daily calendar columns.
  const NAME_COLUMN_INDEX=0;
  const SCHEDULE_START_INDEX=148; // ES
  const SCHEDULE_END_INDEX=361;   // MX
  const headers=(table.cols||[]).map((c,i)=>String(c.label||c.id||`Column ${i+1}`));
  const target=normalizeName(personName);
  const allRows=table.rows||[];

  const matches=allRows.filter(row=>normalizeName(cellValue(row,NAME_COLUMN_INDEX))===target);
  if(!matches.length){
    body.innerHTML=`<div class="schedule-empty">No record was found for <b>${escapeHtml(personName)}</b> in Column A (NAMES).<br><br><a class="whereabouts-button" href="${WHEREABOUTS_URL}" target="_blank" rel="noopener noreferrer">Open ALRMS Personnel Whereabouts</a></div>`;
    return;
  }

  // Locate the row containing date headings such as "June 1".
  // This is more reliable than assuming a fixed sheet row number.
  let dateHeaderRowIndex=-1;
  for(let r=0;r<allRows.length;r++){
    let hits=0;
    for(let c=SCHEDULE_START_INDEX;c<=SCHEDULE_END_INDEX;c++){
      if(parseCalendarDate(cellValue(allRows[r],c))) hits++;
      if(hits>=2)break;
    }
    if(hits>=2){dateHeaderRowIndex=r;break;}
  }

  const calendarColumns=[];
  if(dateHeaderRowIndex>=0){
    for(let c=SCHEDULE_START_INDEX;c<=SCHEDULE_END_INDEX;c++){
      const d=parseCalendarDate(cellValue(allRows[dateHeaderRowIndex],c));
      if(!d)continue;
      let weekday="";
      // The screenshot has the weekday directly below the date heading.
      if(allRows[dateHeaderRowIndex+1]){
        weekday=cellValue(allRows[dateHeaderRowIndex+1],c);
      }
      let schedule="";
      matches.forEach(row=>{
        const value=cellValue(row,c).trim();
        if(value) schedule += (schedule ? "\n" : "") + value;
      });
      calendarColumns.push({index:c,date:d,weekday,schedule});
    }
  }

  if(!calendarColumns.length){
    body.innerHTML=`<div class="schedule-empty">The calendar dates in Columns ES–MX could not be read from the sheet.<br><br><a class="whereabouts-button" href="${WHEREABOUTS_URL}" target="_blank" rel="noopener noreferrer">Open ALRMS Personnel Whereabouts</a></div>`;
    return;
  }

  // Group daily columns into actual month calendars.
  const months=[];
  const monthMap={};
  calendarColumns.forEach(item=>{
    const key=`${item.date.getFullYear()}-${item.date.getMonth()}`;
    if(!monthMap[key]){
      monthMap[key]={year:item.date.getFullYear(),month:item.date.getMonth(),days:[]};
      monthMap[key].index=months.length;
      months.push(monthMap[key]);
    }
    monthMap[key].days.push(item);
  });

  const weekdayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  let html=`<div class="calendar-live-note"><span>Live calendar • Names: Column A • Daily calendar: Columns ES–MX</span><span class="calendar-live-actions"><span id="schedule-refresh-note" class="schedule-refresh-note">Auto-refreshes every 15 seconds while open</span><button type="button" class="schedule-refresh-button" onclick="manualRefreshSchedule()">↻ Refresh now</button></span></div>`;

  months.forEach(m=>{
    const firstDay=new Date(m.year,m.month,1).getDay();
    const daysInMonth=new Date(m.year,m.month+1,0).getDate();
    const byDay={};
    m.days.forEach(d=>byDay[d.date.getDate()]=d);

    html+=`<section class="person-calendar-month">
      <div class="calendar-month-title">${monthName(m.month)} ${m.year}</div>
      <div class="calendar-weekdays">${weekdayNames.map(d=>`<div>${d}</div>`).join("")}</div>
      <div class="calendar-grid">`;

    for(let i=0;i<firstDay;i++) html+='<div class="calendar-day calendar-blank"></div>';
    for(let day=1;day<=daysInMonth;day++){
      const item=byDay[day];
      if(!item){
        html+=`<div class="calendar-day"><div class="calendar-date">${day}</div></div>`;
      }else{
        const schedule=item.schedule;
        html+=`<div class="calendar-day${schedule?' has-event':''}">
          <div class="calendar-date">${day}</div>
          ${schedule?`<div class="calendar-event">${escapeHtml(schedule)}</div>`:'<div class="calendar-free">No scheduled activity</div>'}
        </div>`;
      }
    }
    html+=`</div></section>`;
  });

  html+=`<div class="calendar-source-link"><a class="whereabouts-button" href="${WHEREABOUTS_URL}" target="_blank" rel="noopener noreferrer">Open ALRMS Personnel Whereabouts ↗</a></div>`;
  body.innerHTML=html;
}
function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
}


/* =========================================================
   Live NPAAAD / SAFDZ status summary
   Source: Google Sheet, Column Q (Status), gid 1353377872
   Mapping:
   Completed Request -> Completed (With CSM)
   Waiting for CSM -> Completed (Without CSM)
   Please Process -> Processing
   Waiting for required Data/Documents -> Pending
   ========================================================= */
const NPAAAD_SHEET_ID="1ZToIiqNIkTejiJ50n3kIbPLLrvQno8b9";
const NPAAAD_GID="1353377872";
const NPAAAD_STATUS_URL="https://docs.google.com/spreadsheets/d/"+NPAAAD_SHEET_ID+"/gviz/tq";
let npaaadRefreshTimer=null;
let npaaadRequestSerial=0;

function normalizeSheetStatus(value){
  return String(value||"").trim().toLowerCase().replace(/\s+/g," ");
}
function mapNpaaadStatus(value){
  const s=normalizeSheetStatus(value);
  if(s==="completed request" || s==="completed" || s==="waiting for csm") return "completed";
  if(s==="please process" || s==="processing" || s==="on-going processing" || s==="on going processing") return "processing";
  if(s==="waiting for required data/documents" || s==="pending") return "pending";
  return null;
}
function setNpaaadCounts(counts){
  const c=document.getElementById("npaaad-completed-count");
  const p=document.getElementById("npaaad-processing-count");
  const n=document.getElementById("npaaad-pending-count");
  const csm=document.getElementById("npaaad-csm-count");
  const wocsm=document.getElementById("npaaad-wocsm-count");
  const data=document.getElementById("npaaad-data-count");
  if(c)c.textContent=counts.completed;
  if(p)p.textContent=counts.processing;
  if(n)n.textContent=counts.pending;
  if(csm)csm.textContent=counts.originalCompleted ?? 0;
  if(wocsm)wocsm.textContent=counts.waitingForCsm ?? 0;
  if(data)data.textContent=counts.waitingForData ?? 0;
}
function setNpaaadLiveNote(message,ok=true){
  const note=document.getElementById("npaaad-update-note");
  const badge=document.getElementById("npaaad-live-status");
  if(note)note.textContent=message;
  if(badge){
    badge.textContent=ok?"LIVE":"OFFLINE";
    badge.classList.toggle("offline",!ok);
  }
}
function parseGvizResponse(text){
  const start=text.indexOf("setResponse(");
  if(start<0)throw new Error("Google Sheets response was not returned.");
  const jsonStart=text.indexOf("{",start);
  const jsonEnd=text.lastIndexOf("}");
  if(jsonStart<0 || jsonEnd<jsonStart)throw new Error("Invalid Google Sheets response.");
  return JSON.parse(text.slice(jsonStart,jsonEnd+1));
}
function refreshNpaaadStatus(){
  const serial=++npaaadRequestSerial;
  const callback="alrmsNpaaadCallback_"+Date.now()+"_"+Math.floor(Math.random()*10000);
  const script=document.createElement("script");
  const tq="select Q where Q is not null";
  const src=NPAAAD_STATUS_URL+"?gid="+encodeURIComponent(NPAAAD_GID)+"&headers=1&tqx="+encodeURIComponent("responseHandler:"+callback)+"&tq="+encodeURIComponent(tq)+"&_="+Date.now();
  let finished=false;
  const cleanup=()=>{try{delete window[callback]}catch(e){} if(script.parentNode)script.parentNode.removeChild(script);};
  const fail=()=>{if(finished)return;finished=true;cleanup();setNpaaadLiveNote("Unable to refresh Google Sheets data. Retrying automatically…",false);};
  const timer=setTimeout(fail,10000);
  window[callback]=response=>{
    if(finished)return;
    finished=true;clearTimeout(timer);cleanup();
    try{
      if(serial!==npaaadRequestSerial)return;
      const rows=(response && response.table && response.table.rows)||[];
      const counts={completed:0,processing:0,pending:0,originalCompleted:0,waitingForCsm:0,waitingForData:0};
      rows.forEach(row=>{
        const cell=row.c && row.c[0];
        const value=cell ? (cell.v!==null && cell.v!==undefined ? cell.v : cell.f||"") : "";
        const normalized=normalizeSheetStatus(value);
        const mapped=mapNpaaadStatus(value);
        if(mapped)counts[mapped]++;
        if(normalized==="completed request" || normalized==="completed") counts.originalCompleted++;
        if(normalized==="waiting for csm") counts.waitingForCsm++;
        else if(normalized==="waiting for required data/documents") counts.waitingForData++;
      });
      setNpaaadCounts(counts);
      const now=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
      setNpaaadLiveNote("Live from Column Q • Last checked "+now);
    }catch(err){
      setNpaaadLiveNote("Google Sheets data could not be read. Retrying automatically…",false);
    }
  };
  script.onerror=fail;
  script.src=src;
  document.head.appendChild(script);
}
function setupNpaaadLiveStatus(){
  refreshNpaaadStatus();
  if(npaaadRefreshTimer)clearInterval(npaaadRefreshTimer);
  npaaadRefreshTimer=setInterval(refreshNpaaadStatus,15000);
}


function pdfEscape(value){
  return String(value??"")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[•·]/g,"-")
    .replace(/[“”]/g,'"')
    .replace(/[‘’]/g,"'")
    .replace(/[^\x20-\x7E]/g,"?")
    .replace(/\\/g,"\\\\")
    .replace(/\(/g,"\\(")
    .replace(/\)/g,"\\)")
    .replace(/[\r\n]+/g," ");
}
function pdfWrap(text,maxChars){const words=String(text??"").split(/\s+/).filter(Boolean),lines=[];let line="";for(const w of words){if(!line){line=w.slice(0,maxChars);if(w.length>maxChars){lines.push(line);line=w.slice(maxChars);}}else if(line.length+1+w.length<=maxChars)line+=" "+w;else{lines.push(line);line=w;}}if(line||!lines.length)lines.push(line);return lines;}

function saveGeneratedPdf(pdfText, filename){
  /*
   * ALRMS Report Viewer PDF download
   * The button is user-initiated, so the browser may download the file
   * automatically to its configured Downloads folder. A website cannot
   * silently choose an arbitrary local folder because of browser security.
   */
  try{
    if(typeof pdfText !== 'string' || !pdfText.startsWith('%PDF-')){
      throw new Error('Invalid PDF data generated.');
    }

    // Force a real binary PDF Blob rather than relying on implicit string encoding.
    const bytes = new TextEncoder().encode(pdfText);
    const blob = new Blob([bytes], {type:'application/pdf'});
    const url = URL.createObjectURL(blob);
    const safeName = String(filename || 'ALRMS_Report.pdf').replace(/[\\/:*?"<>|]+/g,'_');

    // Legacy Microsoft browser support, if ever needed.
    if(window.navigator && typeof window.navigator.msSaveOrOpenBlob === 'function'){
      window.navigator.msSaveOrOpenBlob(blob, safeName);
      setTimeout(()=>{try{URL.revokeObjectURL(url);}catch(e){}},10000);
      return true;
    }

    const a = document.createElement('a');
    a.id = 'alrms-pdf-download-temp';
    a.href = url;
    a.download = safeName;
    a.setAttribute('download', safeName);
    a.style.position = 'fixed';
    a.style.left = '-9999px';
    a.style.top = '0';
    a.style.width = '1px';
    a.style.height = '1px';
    a.style.opacity = '0';
    a.tabIndex = -1;
    document.body.appendChild(a);

    // Keep the click directly tied to the user's Save PDF button action.
    a.click();

    // A second standards-based dispatch helps browsers that don't honor
    // HTMLElement.click() consistently for Blob downloads.
    try{
      a.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1
      }));
    }catch(e){}

    setTimeout(()=>{
      try{a.remove();}catch(e){}
      try{URL.revokeObjectURL(url);}catch(e){}
    },10000);

    return true;
  }catch(err){
    console.error('ALRMS Save PDF error:', err);
    alert('The PDF could not be downloaded. Please try the Print button and choose Save as PDF.');
    return false;
  }
}
function drawPdfAnalytics(groups, ctx, opts={}){
  const {M,W,U,yRef,setY,need,T,R,L,C}=ctx;
  let y=yRef();
  const statusTotal=groups.completed.length+groups.processing.length+groups.pending.length;
  need(36); y=yRef();
  T(M,y,"Analytics & Insights",12,true,[23,59,99]); y-=9;
  T(M,y,"Visual summary of the classified report data",6.5,false,[105,116,128]); y-=12;
  const gap=6,bw=(U-gap*2)/3;
  [['Completed',groups.completed.length,'completed'],['Processing',groups.processing.length,'processing'],['Pending',groups.pending.length,'pending']].forEach((a,i)=>{
    const x=M+i*(bw+gap); R(x,y,bw,31,[248,250,252],[220,226,233]); R(x,y,bw,3,C[a[2]]);
    T(x+7,y-12,a[0],6,true,[75,82,92]); T(x+7,y-25,String(a[1]),12,true,[35,62,101]);
  });
  y-=41; setY(y);
  const drawBarRows=(rows,title)=>{
    need(27); y=yRef();
    T(M,y,title,9.5,true,[35,62,101]); y-=8;
    const max=Math.max(1,...rows.map(x=>x[1].total));
    for(const [name,v] of rows){
      const rh=14; need(rh+2); y=yRef();
      const label=String(name||'Unspecified');
      T(M,y-10,label.length>31?label.slice(0,28)+'...':label,5.5,false,[69,86,106]);
      const xBar=M+145, wBar=U-145-28, h=7;
      R(xBar,y-4,wBar,h,[237,241,244]);
      const parts=[['completed',v.completed],['processing',v.processing],['pending',v.pending]]; let xx=xBar;
      parts.forEach(([k,val])=>{if(!val)return;const ww=wBar*(val/max);R(xx,y-4,ww,h,C[k]);xx+=ww;});
      T(M+U-18,y-10,String(v.total),5.8,true,[82,98,116]);
      y-=rh; setY(y);
    }
    y-=4; setY(y);
  };
  const allProvince=opts.locationField?reportGroupLocationStats(groups,opts.locationField,null):[];
  if(opts.locationField) drawBarRows(allProvince,opts.locationTitle||"Requests by Province");
  if(opts.regionField) drawBarRows(reportGroupRegionStats(groups),opts.regionTitle||"Requests by Region");
  return yRef();
}

function drawPdfAnalyticsLandscape(groups, ctx, opts={}){
  const {M,W,U,yRef,setY,T,R,L,C,ops}=ctx;
  let y=yRef();
  const total=groups.completed.length+groups.processing.length+groups.pending.length;
  const pct=v=>total?((v/total)*100).toFixed(1):'0.0';
  const card=(x,top,w,h)=>{R(x,top,w,h,[255,255,255],[220,228,235]);};
  const circle=(cx,cy,r,c)=>{
    const k=.5522847498*r;
    ops.push(`${c[0]/255} ${c[1]/255} ${c[2]/255} rg ${cx+r} ${cy} m ${cx+r} ${cy+k} ${cx+k} ${cy+r} ${cx} ${cy+r} c ${cx-k} ${cy+r} ${cx-r} ${cy+k} ${cx-r} ${cy} c ${cx-r} ${cy-k} ${cx-k} ${cy-r} ${cx} ${cy-r} c ${cx+k} ${cy-r} ${cx+r} ${cy-k} ${cx+r} ${cy} c f`);
  };
  // Status Distribution card
  T(M,y,'Analytics & Insights',14,true,[23,59,99]);
  T(W-M-145,y,'Live visual summary • updates with the report data',6.5,false,[105,116,128]);
  y-=12;
  const topH=180, topY=y;
  card(M,topY,U,topH);
  T(M+12,topY-17,'Status Distribution',8.8,true,[35,62,101]);
  T(M+12,topY-29,'Percentage of classified requests by current status.',5.5,false,[105,116,128]);
  const badgeW=42; R(M+U-badgeW-10,topY-10,badgeW,16,[238,243,247],[220,228,235]);
  T(M+U-badgeW-4,topY-21,`${total} total`,5.4,true,[82,98,116]);
  const cx=M+U*.46, cy=topY-91, outer=58, inner=34;
  const vals=[['completed',groups.completed.length,C.completed],['processing',groups.processing.length,C.processing],['pending',groups.pending.length,C.pending]];
  // Draw a segmented donut using arc paths.
  let start=-Math.PI/2;
  vals.forEach(([key,val,col])=>{
    if(!val)return;
    const end=start+2*Math.PI*(val/Math.max(1,total));
    const seg=Math.max(0.001,end-start);
    const n=Math.max(8,Math.ceil(seg/(Math.PI/8)));
    let pts=[];
    for(let i=0;i<=n;i++){const a=start+seg*i/n;pts.push([cx+outer*Math.cos(a),cy+outer*Math.sin(a)]);}
    let path=`${col[0]/255} ${col[1]/255} ${col[2]/255} rg ${cx} ${cy} m ${pts.map(pt=>`${pt[0]} ${pt[1]} l`).join(' ')} h f`;
    ops.push(path);
    start=end;
  });
  circle(cx,cy,inner,[255,255,255]);
  T(cx-10,cy+5,String(total),15,true,[23,59,99]);
  T(cx-14,cy-8,'Requests',5.5,false,[105,116,128]);
  const lx=cx+105, ly=topY-58;
  vals.forEach(([key,val])=>{
    const label=key==='completed'?'Completed':key==='processing'?'Processing':'Pending';
    const col=C[key];
    R(lx,ly-7,7,7,col);
    T(lx+13,ly,label,6.2,true,[51,70,90]);
    T(lx+13,ly-9,`${val} • ${pct(val)}%`,5.2,false,[122,135,148]);
    ly-=29;
  });
  y=topY-topH-14;
  const gap=14, cardW=(U-gap)/2, bottomTop=y;
  const drawBarCard=(x, title, subtitle, rows, badge)=>{
    const cardH=292;
    card(x,bottomTop,cardW,cardH);
    T(x+12,bottomTop-17,title,8.8,true,[35,62,101]);
    T(x+12,bottomTop-29,subtitle,5.5,false,[105,116,128]);
    const bw=badge.length>15?62:48; R(x+cardW-bw-10,bottomTop-10,bw,16,[238,243,247],[220,228,235]);
    T(x+cardW-bw-4,bottomTop-21,badge,5.1,true,[82,98,116]);
    const max=Math.max(1,...rows.map(r=>r[1].total));
    let yy=bottomTop-47;
    rows.forEach(([name,v])=>{
      const label=String(name||'Unspecified');
      T(x+12,yy,label.length>29?label.slice(0,27)+'...':label,5.2,false,[69,86,106]);
      const bx=x+138,bw2=cardW-170,bh=5;
      R(bx,yy+2,bw2,bh,[237,241,244]);
      let xx=bx;
      [['completed',v.completed],['processing',v.processing],['pending',v.pending]].forEach(([k,val])=>{
        if(!val)return; const ww=bw2*(val/max); R(xx,yy+2,ww,bh,C[k]); xx+=ww;
      });
      T(x+cardW-17,yy,String(v.total),5.2,true,[82,98,116]);
      yy-=13;
    });
    const legY=bottomTop-cardH+23;
    L(x+12,legY+14,x+cardW-12,[231,236,241]);
    let xx=x+12;
    [['completed','Completed'],['processing','Processing'],['pending','Pending']].forEach(([k,label])=>{
      R(xx,legY,7,7,C[k]); T(xx+11,legY+5,label,5.1,false,[105,116,128]); xx+=55;
    });
  };
  const pRows=opts.locationField?reportGroupLocationStats(groups,opts.locationField,null):[];
  const rRows=opts.regionField?reportGroupRegionStats(groups):[];
  if(opts.locationField && opts.regionField){
    drawBarCard(M,opts.locationTitle||'Requests by Province',opts.locationSubtitle||'All provinces with classified requests.',pRows,`${pRows.length} provinces`);
    drawBarCard(M+cardW+gap,opts.regionTitle||'Requests by Region',opts.regionSubtitle||'Regional distribution of completed, processing, and pending requests.',rRows,`${rRows.length} regions`);
  }else if(opts.locationField){
    drawBarCard(M,opts.locationTitle||'Requests by Requester','Classified requests by requester.',pRows,`${pRows.length} requesters`);
  }
  y=bottomTop-292-16;
  setY(y);
}

function downloadNpaaadPdf(){
  const groups=window.alrmsNpaaadReportGroups;if(!groups)return;
  let W=595.28,H=841.89,M=30,U=W-2*M;const pages=[];let ops=[],y=H-M;
  const C={completed:[40,121,78],processing:[36,102,167],pending:[194,140,32]};
  const page=()=>{if(ops.length)pages.push({body:ops.join("\n"),W,H});ops=[];y=H-M;};
  const need=h=>{if(y-h<M)page();};
  const T=(x,yy,v,size=8,bold=false,c=[38,52,70])=>ops.push(`${c[0]/255} ${c[1]/255} ${c[2]/255} rg BT /${bold?'F2':'F1'} ${size} Tf ${x.toFixed(2)} ${yy.toFixed(2)} Td (${pdfEscape(v)}) Tj ET`);
  const R=(x,yy,w,h,c,stroke)=>{ops.push(`${c[0]/255} ${c[1]/255} ${c[2]/255} rg ${x} ${yy-h} ${w} ${h} re f`);if(stroke)ops.push(`${stroke[0]/255} ${stroke[1]/255} ${stroke[2]/255} RG .6 w ${x} ${yy-h} ${w} ${h} re S`);};
  const L=(x1,yy,x2,c=[215,222,229])=>ops.push(`${c[0]/255} ${c[1]/255} ${c[2]/255} RG .5 w ${x1} ${yy} m ${x2} ${yy} l S`);
  T(M,y,"BUREAU OF SOILS AND WATER MANAGEMENT • AGRICULTURAL LAND MANAGEMENT AND EVALUATION DIVISION",8.5,true,[45,58,77]);y-=18;
  T(M,y,"NPAAAD and SAFDZ Request Report",18,true,[35,62,101]);y-=16;
  T(M,y,`CY 2026 • Live request records • Generated ${new Date().toLocaleString([], {year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}`,7.5,false,[75,82,92]);y-=11;L(M,y,W-M,[35,62,101]);y-=14;
  const sum=[['Completed',groups.completed.length,'completed'],['Processing',groups.processing.length,'processing'],['Pending',groups.pending.length,'pending']],gap=8,bw=(U-gap*2)/3;
  sum.forEach((a,i)=>{const x=M+i*(bw+gap);R(x,y,bw,40,[248,250,252],[220,226,233]);R(x,y,bw,4,C[a[2]]);T(x+9,y-14,a[0].toUpperCase(),6.5,true,[75,82,92]);T(x+9,y-31,String(a[1]),16,true,[35,62,101]);});y-=51;
  R(M,y,U,25,[246,249,251],[221,228,235]);T(M+8,y-16,'Synchronized with the Dashboard “Requests for NPAAAD and SAFDZ” Summary Card • Same Column Q status mapping • Live',6.5);y-=37;
  const table=list=>{if(!list.length){need(22);T(M+6,y-14,'No matching requests found in the live sheet.',7,[100,108,118]);y-=22;return;}const ws=[82,118,235,80],hs=['DATE','REQUESTER','SUBJECT','REMARKS / STATUS'];need(25);R(M,y,U,22,[245,247,250],[218,225,232]);let x=M+6;hs.forEach((h,i)=>{T(x,y-15,h,6.2,true,[35,62,101]);x+=ws[i];});y-=22;for(const r of list){const cells=[r.date,r.requester,r.subject,r.status],wraps=cells.map((c,i)=>pdfWrap(c,Math.max(9,Math.floor(ws[i]/4.4)))),rh=Math.max(...wraps.map(a=>a.length))*9+7;need(rh+1);wraps.forEach((arr,i)=>arr.forEach((ln,j)=>T(M+6+ws.slice(0,i).reduce((a,b)=>a+b,0),y-13-j*9,ln,6.8)));L(M,y-rh,M+U);y-=rh;}};
  const sec=k=>{const label=k==='completed'?'Completed':k==='processing'?'Processing':'Pending',list=groups[k];need(38);R(M,y,U,30,C[k]);T(M+9,y-20,label,8.5,true,[255,255,255]);T(W-M-65,y-20,`${list.length} request${list.length===1?'':'s'}`,7.5,true,[255,255,255]);y-=36;if(k==='completed'){const withCsm=list.filter(r=>{const s=normalizeSheetStatus(r.status);return s==='completed request'||s==='completed';}),waitingCsm=list.filter(r=>normalizeSheetStatus(r.status)==='waiting for csm');need(23);R(M,y,U,21,[243,248,245],[215,229,220]);T(M+7,y-14,`With CSM (${withCsm.length})`,7.2,true);y-=25;table(withCsm);need(23);R(M,y,U,21,[243,245,248],[225,230,235]);T(M+7,y-14,`Waiting for CSM (${waitingCsm.length})`,7.2,true);y-=25;table(waitingCsm);}else table(list);y-=8;};
  sec('completed');sec('processing');sec('pending');
  page(); W=841.89;H=595.28;M=24;U=W-2*M;y=H-M;
  need(25);L(M,y,W-M);y-=13;T(M,y,'Source: NPAAAD and SAFDZ Google Sheet • 2026 • Column 1, Requested by, Subject, Status',6.2,false,[95,104,115]);T(W-M-135,y,`Total classified requests: ${groups.completed.length+groups.processing.length+groups.pending.length}`,6.2,false,[95,104,115]);page();
  const objs=[],add=o=>(objs.push(o),objs.length),f1=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),f2=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'),contents=[],pids=[];
  for(const pg of pages)contents.push(add(`<< /Length ${pg.body.length} >>\nstream\n${pg.body}\nendstream`));const pagesId=add('');for(let i=0;i<pages.length;i++)pids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pages[i].W} ${pages[i].H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${contents[i]} 0 R >>`));objs[pagesId-1]=`<< /Type /Pages /Kids [${pids.map(id=>id+' 0 R').join(' ')}] /Count ${pids.length} >>`;const root=add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let out='%PDF-1.4\n%ALRMS\n',off=[0];for(let i=0;i<objs.length;i++){off[i+1]=out.length;out+=`${i+1} 0 obj\n${objs[i]}\nendobj\n`;}const xr=out.length;out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;for(let i=1;i<=objs.length;i++)out+=String(off[i]).padStart(10,'0')+' 00000 n \n';out+=`trailer\n<< /Size ${objs.length+1} /Root ${root} 0 R >>\nstartxref\n${xr}\n%%EOF`;
  saveGeneratedPdf(out,'NPAAAD_and_SAFDZ_Request_Report_CY2026.pdf');
}

document.addEventListener("DOMContentLoaded",()=>{
  setupNpaaadLiveStatus();
  document.getElementById("schedule-close")?.addEventListener("click",closeScheduleModal);
  document.getElementById("schedule-modal")?.addEventListener("click",e=>{if(e.target.id==="schedule-modal")closeScheduleModal()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeScheduleModal()});
});

/* =========================================================
   Live Integration & Harmonization status summary
   Source: Google Sheet, Column S (Status), gid 0
   Mapping:
   Completed -> Completed
   Waiting for Certification -> Processing
   For final processing of data -> Processing
   For initial process; No technical discussion yet -> Processing
   Consultation meeting -> Processing
   Incomplete requirements -> Pending
   ========================================================= */
const INTEGRATION_SHEET_ID="1_K8VRKFQ4bXzSMCbt7VaF7omJLqT0Q8ouKdKzkvuyHA";
const INTEGRATION_GID="0";
const INTEGRATION_STATUS_URL="https://docs.google.com/spreadsheets/d/"+INTEGRATION_SHEET_ID+"/gviz/tq";
let integrationRefreshTimer=null;
let integrationRequestSerial=0;

function mapIntegrationStatus(value){
  // Revision 71 ruling — used by BOTH the Summary Card and Interactive Map.
  // Completed -> Completed
  // Waiting for Certification -> Processing
  // For final processing of data -> Processing
  // For initial process; No technical discussion yet -> Processing
  // Consultation meeting -> Processing
  // Processing -> Processing
  // Incomplete requirements -> Pending
  // Pending -> Pending
  const s=normalizeSheetStatus(value);
  if(s==="completed") return "completed";
  if(
    s==="waiting for certification" ||
    s==="for final processing of data" ||
    s==="for initial process; no technical discussion yet" ||
    s==="consultation meeting" ||
    s==="processing"
  ) return "processing";
  if(s==="incomplete requirements" || s==="pending") return "pending";
  return null;
}
function integrationCellValue(cell){
  if(!cell) return "";
  return cell.v!==null && cell.v!==undefined ? cell.v : (cell.f??"");
}
function integrationRowsFromResponse(response){
  if(response?.status!=="ok" || response?.table?.errors?.length){
    throw new Error((response?.table?.errors||[]).map(e=>e.detailed_message||e.message||"Google Sheets query error").join("; "));
  }
  return response?.table?.rows||[];
}
function updateIntegrationSummaryPercentages(){
  const totals={completed:0,processing:0,pending:0,"no-integration":0};
  municipalFeatures.forEach(feature=>{
    const key=mapStatusClass(feature?.properties?.Status);
    if(Object.prototype.hasOwnProperty.call(totals,key)) totals[key]++;
    else totals["no-integration"]++;
  });
  const total=municipalFeatures.length||0;
  const items=[
    ["green","completed",MAP_STATUS_COLORS.completed],
    ["blue","processing",MAP_STATUS_COLORS.processing],
    ["yellow","pending",MAP_STATUS_COLORS.pending],
    ["gray","no-integration",MAP_STATUS_COLORS["no-integration"]]
  ];
  items.forEach(([id,key,color])=>{
    const pct=total?Math.round((totals[key]/total)*1000)/10:0;
    const label=document.getElementById("p-"+id);
    const bar=document.getElementById("bar-"+id);
    if(label) label.textContent=pct+"%";
    if(bar){bar.style.width=pct+"%";bar.style.background=color;}
  });
}

function setIntegrationCounts(counts){
  const c=document.getElementById("integration-completed-count");
  const p=document.getElementById("integration-processing-count");
  const n=document.getElementById("integration-pending-count");
  if(c)c.textContent=counts.completed;
  if(p)p.textContent=counts.processing;
  if(n)n.textContent=counts.pending;
}
function setIntegrationLiveNote(message,ok=true){
  const note=document.getElementById("integration-update-note");
  const badge=document.getElementById("integration-live-status");
  if(note)note.textContent=message;
  if(badge){
    badge.textContent=ok?"LIVE":"OFFLINE";
    badge.classList.toggle("offline",!ok);
  }
}
function refreshIntegrationStatus(){
  const serial=++integrationRequestSerial;
  const callback="alrmsIntegrationCallback_"+Date.now()+"_"+Math.floor(Math.random()*10000);
  const script=document.createElement("script");
  // Revision 71 used Column S directly with a non-null filter.
  // Keep that ruling as the authoritative source for Summary Card counts,
  // while also retrieving B/C/D/S so the same classified records drive the map.
  const tq="select B,C,D,S where S is not null";
  const src=INTEGRATION_STATUS_URL+"?gid="+encodeURIComponent(INTEGRATION_GID)+"&headers=1&tqx="+encodeURIComponent("responseHandler:"+callback)+"&tq="+encodeURIComponent(tq)+"&_="+Date.now();
  let finished=false;
  const cleanup=()=>{try{delete window[callback]}catch(e){} if(script.parentNode)script.parentNode.removeChild(script);};
  const fail=()=>{if(finished)return;finished=true;cleanup();setIntegrationLiveNote("Unable to refresh Google Sheets data. Retrying automatically…",false);};
  const timer=setTimeout(fail,10000);
  window[callback]=response=>{
    if(finished)return;
    finished=true;clearTimeout(timer);cleanup();
    try{
      if(serial!==integrationRequestSerial)return;
      const rows=integrationRowsFromResponse(response);
      const counts={completed:0,processing:0,pending:0};
      rows.forEach(row=>{
        const value=integrationCellValue(row.c && row.c[3]);
        const mapped=mapIntegrationStatus(value);
        if(mapped)counts[mapped]++;
      });
      setIntegrationCounts(counts);
      applyLiveIntegrationMap(rows);
      const now=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
      setIntegrationLiveNote("Live from Column S • Last checked "+now);
    }catch(err){
      console.error("Integration & Harmonization live data error:",err);
      // Preserve the last valid counts instead of replacing them with 0/0/0.
      setIntegrationLiveNote("Google Sheets data could not be read. Retrying automatically…",false);
    }
  };
  script.onerror=fail;
  script.src=src;
  document.head.appendChild(script);
}
function setupIntegrationLiveStatus(){
  refreshIntegrationStatus();
  if(integrationRefreshTimer)clearInterval(integrationRefreshTimer);
  integrationRefreshTimer=setInterval(refreshIntegrationStatus,15000);
}

// Start the Integration & Harmonization live status reader alongside the NPAAAD reader.
document.addEventListener("DOMContentLoaded",()=>{
  setupIntegrationLiveStatus();
});


/* =========================================================
   Live E.O. 79 Matters status summary
   Source: Google Sheet tab "2026", Column P (Status)
   Mapping:
   FOR JOINT VALIDATION -> Pending
   FOR FINALIZATION OF REPORT -> Processing
   CHIEF ON ACTION -> Processing
   COMPLETED -> Completed
   REFERRED TO MGB (PROPER RULES) -> Pending
   No further action from Client -> Pending
   For re-validation or further action -> Processing
   PROVIDED SAFDZ MAP -> Completed
   ========================================================= */
const EO79_SHEET_ID="1q-LvcPGu7NCfBIY60CsZS0KXCeVpduFehTQ04UD4Gk0";
const EO79_GID="249796757";
const EO79_STATUS_URL="https://docs.google.com/spreadsheets/d/"+EO79_SHEET_ID+"/gviz/tq";
let eo79RefreshTimer=null;
let eo79RequestSerial=0;

function mapEo79Status(value){
  // E.O. 79 Dashboard Summary Card methodology — use ONLY the
  // status categories specifically provided for the 2026 sheet.
  const s=normalizeSheetStatus(value);
  if(s==="completed" || s==="provided safdz map") return "completed";
  if(s==="for finalization of report" ||
     s==="chief on action" ||
     s==="for re-validation or further action") return "processing";
  if(s==="for joint validation" ||
     s==="referred to mgb (proper rules)" ||
     s==="no further action from client") return "pending";
  return null;
}
function setEo79Counts(counts){
  const c=document.getElementById("eo79-completed-count");
  const p=document.getElementById("eo79-processing-count");
  const n=document.getElementById("eo79-pending-count");
  if(c)c.textContent=counts.completed;
  if(p)p.textContent=counts.processing;
  if(n)n.textContent=counts.pending;
}
function setEo79LiveNote(message,ok=true){
  const note=document.getElementById("eo79-update-note");
  const badge=document.getElementById("eo79-live-status");
  if(note)note.textContent=message;
  if(badge){
    badge.textContent=ok?"LIVE":"OFFLINE";
    badge.classList.toggle("offline",!ok);
  }
}
function refreshEo79Status(){
  const serial=++eo79RequestSerial;
  const callback="alrmsEo79Callback_"+Date.now()+"_"+Math.floor(Math.random()*10000);
  const script=document.createElement("script");
  const tq="select P where P is not null";
  const src=EO79_STATUS_URL+"?gid="+encodeURIComponent(EO79_GID)+"&headers=1&tqx="+encodeURIComponent("responseHandler:"+callback)+"&tq="+encodeURIComponent(tq)+"&_="+Date.now();
  let finished=false;
  const cleanup=()=>{try{delete window[callback]}catch(e){} if(script.parentNode)script.parentNode.removeChild(script);};
  const fail=()=>{if(finished)return;finished=true;cleanup();setEo79LiveNote("Unable to refresh Google Sheets data. Retrying automatically…",false);};
  const timer=setTimeout(fail,10000);
  window[callback]=response=>{
    if(finished)return;
    finished=true;clearTimeout(timer);cleanup();
    try{
      if(serial!==eo79RequestSerial)return;
      const rows=(response && response.table && response.table.rows)||[];
      const counts={completed:0,processing:0,pending:0};
      rows.forEach(row=>{
        const cell=row.c && row.c[0];
        const value=cell ? (cell.v!==null && cell.v!==undefined ? cell.v : cell.f||"") : "";
        const mapped=mapEo79Status(value);
        if(mapped)counts[mapped]++;
      });
      setEo79Counts(counts);
      const now=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
      setEo79LiveNote("Live from 2026 • Column P • Last checked "+now);
    }catch(err){
      setEo79LiveNote("Google Sheets data could not be read. Retrying automatically…",false);
    }
  };
  script.onerror=fail;
  script.src=src;
  document.head.appendChild(script);
}
function setupEo79LiveStatus(){
  refreshEo79Status();
  if(eo79RefreshTimer)clearInterval(eo79RefreshTimer);
  eo79RefreshTimer=setInterval(refreshEo79Status,15000);
}

document.addEventListener("DOMContentLoaded",()=>{
  setupEo79LiveStatus();
});

/* =========================================================
   Revision 39 — Editable ALRMS Activities and Schedules Calendar
   - Opens on the current month.
   - Previous/Next month navigation.
   - Click any date to add/edit/delete schedules.
   - Schedules are stored locally in this browser.
   - Philippine 2026 national holidays are displayed.
   ========================================================= */
const ALRMS_CAL_STORAGE_KEY="alrmsDashboardCalendarSchedules_v1";
let alrmsCalDate=new Date();
let alrmsCalSelectedDate="";
let alrmsCalSchedules=loadAlrmsCalendarSchedules();

const ALRMS_PH_HOLIDAYS={
  "2026-01-01":"New Year's Day",
  "2026-02-17":"Chinese New Year",
  "2026-02-25":"EDSA People Power Revolution Anniversary (Special Working Day)",
  "2026-03-20":"Eid'l Fitr",
  "2026-04-02":"Maundy Thursday",
  "2026-04-03":"Good Friday",
  "2026-04-04":"Black Saturday",
  "2026-04-09":"Araw ng Kagitingan",
  "2026-05-01":"Labor Day",
  "2026-05-27":"Eid'l Adha",
  "2026-06-12":"Independence Day",
  "2026-08-21":"Ninoy Aquino Day",
  "2026-08-31":"National Heroes Day",
  "2026-11-01":"All Saints' Day",
  "2026-11-02":"All Souls' Day",
  "2026-11-30":"Bonifacio Day",
  "2026-12-08":"Feast of the Immaculate Conception of Mary",
  "2026-12-24":"Christmas Eve",
  "2026-12-25":"Christmas Day",
  "2026-12-30":"Rizal Day",
  "2026-12-31":"Last Day of the Year"
};

function loadAlrmsCalendarSchedules(){
  try{
    const raw=localStorage.getItem(ALRMS_CAL_STORAGE_KEY);
    const parsed=raw?JSON.parse(raw):{};
    return parsed && typeof parsed==="object" ? parsed : {};
  }catch(e){return {};}
}
function saveAlrmsCalendarSchedules(){
  try{localStorage.setItem(ALRMS_CAL_STORAGE_KEY,JSON.stringify(alrmsCalSchedules));}catch(e){}
}
function alrmsDateKey(y,m,d){return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}
function alrmsTodayKey(){const d=new Date();return alrmsDateKey(d.getFullYear(),d.getMonth(),d.getDate());}
function alrmsFormatDate(key){
  const [y,m,d]=key.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"});
}
function escapeCalendarText(value){return String(value||"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));}
function getAlrmsDaySchedules(key){return Array.isArray(alrmsCalSchedules[key])?alrmsCalSchedules[key]:[];}
function renderAlrmsCalendar(){
  const grid=document.getElementById("alrms-calendar-grid");
  const title=document.getElementById("alrms-cal-title");
  if(!grid||!title)return;
  const year=alrmsCalDate.getFullYear(), month=alrmsCalDate.getMonth();
  title.textContent=alrmsCalDate.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  grid.innerHTML="";
  const first=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const prevDays=new Date(year,month,0).getDate();
  const totalCells=Math.ceil((first+daysInMonth)/7)*7;
  for(let i=0;i<totalCells;i++){
    let dayNum=i-first+1, cellYear=year, cellMonth=month, inMonth=true;
    if(dayNum<1){dayNum=prevDays+dayNum;cellMonth=month-1;if(cellMonth<0){cellMonth=11;cellYear--;};inMonth=false;}
    else if(dayNum>daysInMonth){dayNum=dayNum-daysInMonth;cellMonth=month+1;if(cellMonth>11){cellMonth=0;cellYear++;};inMonth=false;}
    const key=alrmsDateKey(cellYear,cellMonth,dayNum);
    const holiday=ALRMS_PH_HOLIDAYS[key];
    const events=getAlrmsDaySchedules(key);
    const cell=document.createElement("button");
    cell.type="button";cell.className="alrms-cal-day"+(inMonth?"":" other-month")+(key===alrmsTodayKey()?" today":"")+(holiday?" holiday":"");
    cell.setAttribute("aria-label",`${alrmsFormatDate(key)}${holiday?" — "+holiday:""}${events.length?" — "+events.length+" schedule(s)":""}`);
    let html=`<div class="alrms-cal-date"><span>${dayNum}</span>${events.length?`<span>${events.length}▸</span>`:""}</div>`;
    if(holiday)html+=`<div class="alrms-cal-holiday">${escapeCalendarText(holiday)}</div>`;
    events.slice(0,2).forEach(ev=>{html+=`<div class="alrms-cal-event">${ev.time?escapeCalendarText(ev.time)+" · ":""}${escapeCalendarText(ev.title)}</div>`;});
    if(events.length>2)html+=`<div class="alrms-cal-more">+${events.length-2} more</div>`;
    cell.innerHTML=html;
    cell.addEventListener("click",()=>openAlrmsCalendarEditor(key));
    grid.appendChild(cell);
  }
}
function clearAlrmsScheduleForm(){
  const form=document.getElementById("alrms-schedule-form");
  if(form)form.reset();
  const id=document.getElementById("alrms-edit-id");if(id)id.value="";
}
function renderAlrmsDayEvents(){
  const box=document.getElementById("alrms-day-events");
  if(!box)return;
  const events=getAlrmsDaySchedules(alrmsCalSelectedDate);
  if(!events.length){box.innerHTML='<div class="alrms-event-empty">No schedules yet for this date. Add one below.</div>';return;}
  box.innerHTML=events.map(ev=>`<div class="alrms-event-row"><div class="event-copy"><b>${escapeCalendarText(ev.title)}</b><small>${ev.time?escapeCalendarText(ev.time)+" • ":""}${escapeCalendarText(ev.notes||"No additional notes")}</small></div><button type="button" data-cal-edit="${escapeCalendarText(ev.id)}">Edit</button><button type="button" data-cal-delete="${escapeCalendarText(ev.id)}">Delete</button></div>`).join("");
  box.querySelectorAll("[data-cal-edit]").forEach(btn=>btn.addEventListener("click",()=>editAlrmsSchedule(btn.dataset.calEdit)));
  box.querySelectorAll("[data-cal-delete]").forEach(btn=>btn.addEventListener("click",()=>deleteAlrmsSchedule(btn.dataset.calDelete)));
}
function openAlrmsCalendarEditor(key){
  alrmsCalSelectedDate=key;
  const modal=document.getElementById("alrms-calendar-modal");
  document.getElementById("alrms-editor-title").textContent="Add Schedule";
  document.getElementById("alrms-editor-date").textContent=alrmsFormatDate(key)+(ALRMS_PH_HOLIDAYS[key]?" • "+ALRMS_PH_HOLIDAYS[key]:"");
  clearAlrmsScheduleForm();renderAlrmsDayEvents();
  modal.classList.add("open");modal.setAttribute("aria-hidden","false");
  document.getElementById("alrms-event-title")?.focus();
}
function closeAlrmsCalendarEditor(){
  const modal=document.getElementById("alrms-calendar-modal");
  if(modal){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");}
  alrmsCalSelectedDate="";clearAlrmsScheduleForm();
}
function editAlrmsSchedule(id){
  const ev=getAlrmsDaySchedules(alrmsCalSelectedDate).find(x=>x.id===id);if(!ev)return;
  document.getElementById("alrms-editor-title").textContent="Edit Schedule";
  document.getElementById("alrms-edit-id").value=ev.id;
  document.getElementById("alrms-event-title").value=ev.title||"";
  document.getElementById("alrms-event-time").value=ev.time||"";
  document.getElementById("alrms-event-notes").value=ev.notes||"";
  document.getElementById("alrms-event-title")?.focus();
}
function deleteAlrmsSchedule(id){
  const events=getAlrmsDaySchedules(alrmsCalSelectedDate).filter(x=>x.id!==id);
  if(events.length)alrmsCalSchedules[alrmsCalSelectedDate]=events;else delete alrmsCalSchedules[alrmsCalSelectedDate];
  saveAlrmsCalendarSchedules();renderAlrmsCalendar();renderAlrmsDayEvents();clearAlrmsScheduleForm();
}
function initAlrmsCalendar(){
  // The browser's current month is intentionally used as the initial view.
  alrmsCalDate=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  document.getElementById("alrms-cal-prev")?.addEventListener("click",()=>{alrmsCalDate.setMonth(alrmsCalDate.getMonth()-1);renderAlrmsCalendar();});
  document.getElementById("alrms-cal-next")?.addEventListener("click",()=>{alrmsCalDate.setMonth(alrmsCalDate.getMonth()+1);renderAlrmsCalendar();});
  document.getElementById("alrms-editor-close")?.addEventListener("click",closeAlrmsCalendarEditor);
  document.getElementById("alrms-calendar-modal")?.addEventListener("click",e=>{if(e.target.id==="alrms-calendar-modal")closeAlrmsCalendarEditor();});
  document.getElementById("alrms-form-cancel")?.addEventListener("click",clearAlrmsScheduleForm);
  document.getElementById("alrms-schedule-form")?.addEventListener("submit",e=>{
    e.preventDefault();
    if(!alrmsCalSelectedDate)return;
    const title=document.getElementById("alrms-event-title").value.trim();
    if(!title)return;
    const idField=document.getElementById("alrms-edit-id");
    const editId=idField.value;
    const ev={id:editId||("evt_"+Date.now()+"_"+Math.random().toString(36).slice(2,8)),title,time:document.getElementById("alrms-event-time").value,notes:document.getElementById("alrms-event-notes").value.trim()};
    const events=getAlrmsDaySchedules(alrmsCalSelectedDate);
    if(editId){const idx=events.findIndex(x=>x.id===editId);if(idx>=0)events[idx]=ev;else events.push(ev);}else events.push(ev);
    alrmsCalSchedules[alrmsCalSelectedDate]=events;saveAlrmsCalendarSchedules();renderAlrmsCalendar();renderAlrmsDayEvents();clearAlrmsScheduleForm();
    document.getElementById("alrms-editor-title").textContent="Add Schedule";
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){const m=document.getElementById("alrms-calendar-modal");if(m?.classList.contains("open"))closeAlrmsCalendarEditor();}});
  renderAlrmsCalendar();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initAlrmsCalendar);else initAlrmsCalendar();

/* =========================================================
   Reports
   NPAAAD and SAFDZ Request Report
   Source: Google Sheet tab/gid 1353377872
   Columns: A = Date / Column 1, D = Requested by, F = Subject, Q = Status
   ========================================================= */
const NPAAAD_REPORT_URL=NPAAAD_STATUS_URL;
let npaaadReportRequestSerial=0;
let npaaadReportRefreshTimer=null;
// Shared report-viewer state prevents one report's live refresh/callback from overwriting another report.
let activeReportType=null;
let reportViewerSerial=0;
let reportRefreshTimer=null;
function stopReportRefresh(){
  if(reportRefreshTimer){clearInterval(reportRefreshTimer);reportRefreshTimer=null;}
  if(npaaadReportRefreshTimer){clearInterval(npaaadReportRefreshTimer);npaaadReportRefreshTimer=null;}
  if(eo79ReportRefreshTimer){clearInterval(eo79ReportRefreshTimer);eo79ReportRefreshTimer=null;}
}
function startReportRefresh(type, viewer){
  stopReportRefresh();
  reportRefreshTimer=setInterval(()=>{
    if(!viewer || viewer.hidden || activeReportType!==type) return;
    if(type==="npaaad") loadNpaaadReport(false);
    else if(type==="integration") loadIntegrationReport(false);
    else if(type==="eo79") loadEo79Report(false);
  },15000);
}

function getGvizCell(row,index){
  const cell=row && row.c && row.c[index];
  if(!cell) return "";
  if(cell.f!==null && cell.f!==undefined && String(cell.f).trim()!=="") return String(cell.f);
  if(cell.v!==null && cell.v!==undefined) return String(cell.v);
  return "";
}
function reportEscape(value){return escapeHtml(value===null||value===undefined?"":value);}
function mapReportNpaaadStatus(value){
  const s=normalizeSheetStatus(value);
  // For the NPAAAD and SAFDZ Request Report only:
  // Completed is divided into two subsections:
  // 1) With CSM = the original Completed Request records
  // 2) Waiting for CSM = records whose current sheet status is Waiting for CSM
  // Waiting for required Data/Documents remains Pending.
  if(s==="completed request" || s==="completed" || s==="waiting for csm") return "completed";
  if(s==="please process" || s==="processing" || s==="on-going processing" || s==="on going processing") return "processing";
  if(s==="waiting for required data/documents" || s==="pending") return "pending";
  return null;
}
function reportStatusLabel(status){
  return status==="completed"?"Completed":status==="processing"?"Processing":"Pending";
}

function mapReportIntegrationStatus(value){
  const s=normalizeSheetStatus(value);
  if(s==="completed") return "completed";
  if(
    s==="waiting for certification" ||
    s==="for final processing of data" ||
    s==="for initial process; no technical discussion yet" ||
    s==="consultation meeting"
  ) return "processing";
  if(s==="incomplete requirements") return "pending";
  return null;
}

function chartEsc(v){return reportEscape(String(v||""));}
function reportStatusChart(groups){
  const total=groups.completed.length+groups.processing.length+groups.pending.length;
  const items=[['Completed',groups.completed.length,'completed'],['Processing',groups.processing.length,'processing'],['Pending',groups.pending.length,'pending']];
  const pct=n=>total?((n/total)*100):0;
  const degs=items.map(x=>pct(x[1])*3.6);
  let start=0; const stops=[]; const css={completed:'#28794e',processing:'#2466a7',pending:'#c28c20'};
  items.forEach((x,i)=>{const end=start+degs[i];stops.push(`${css[x[2]]} ${start}deg ${end}deg`);start=end;});
  return `<div class="report-chart-card report-status-chart-card"><div class="report-chart-head"><div><h3>Status Distribution</h3><p>Percentage of classified requests by current status.</p></div><span class="report-chart-total">${total} total</span></div><div class="report-donut-row"><div class="report-donut" style="background:conic-gradient(${stops.join(',')})"><div class="report-donut-hole"><b>${total}</b><span>Requests</span></div></div><div class="report-chart-legend">${items.map(x=>`<div class="report-legend-item"><span class="report-legend-dot ${x[2]}"></span><div><b>${x[0]}</b><span>${x[1]} · ${pct(x[1]).toFixed(1)}%</span></div></div>`).join('')}</div></div></div>`;
}
const PH_REPORT_REGIONS=[
  {key:"ncr",name:"National Capital Region (NCR)"},
  {key:"car",name:"Cordillera Administrative Region (CAR)"},
  {key:"r1",name:"Region I (Ilocos Region)"},
  {key:"r2",name:"Region II (Cagayan Valley)"},
  {key:"r3",name:"Region III (Central Luzon)"},
  {key:"r4a",name:"Region IV-A (CALABARZON)"},
  {key:"mimaropa",name:"MIMAROPA Region"},
  {key:"r5",name:"Region V (Bicol Region)"},
  {key:"r6",name:"Region VI (Western Visayas)"},
  {key:"nir",name:"Negros Island Region (NIR)"},
  {key:"r7",name:"Region VII (Central Visayas)"},
  {key:"r8",name:"Region VIII (Eastern Visayas)"},
  {key:"r9",name:"Region IX (Zamboanga Peninsula)"},
  {key:"r10",name:"Region X (Northern Mindanao)"},
  {key:"r11",name:"Region XI (Davao Region)"},
  {key:"r12",name:"Region XII (SOCCSKSARGEN)"},
  {key:"r13",name:"Region XIII (Caraga)"},
  {key:"barmm",name:"Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)"}
];
function reportRegionKey(value){
  const s=String(value||'').trim().toLowerCase().replace(/[.\-–—_]/g,' ').replace(/\s+/g,' ');
  if(!s)return "unspecified";
  if(/^(ncr|national capital region|metro manila)/.test(s))return "ncr";
  if(/^(car|cordillera administrative region)/.test(s))return "car";
  if(/^region\s*i(\s*\(|$)/.test(s)||/ilocos region/.test(s))return "r1";
  if(/^region\s*ii(\s*\(|$)/.test(s)||/cagayan valley/.test(s))return "r2";
  if(/^region\s*iii(\s*\(|$)/.test(s)||/central luzon/.test(s))return "r3";
  if(/^region\s*iv\s*a(\s*\(|$)/.test(s)||/calabarzon/.test(s))return "r4a";
  if(/mimaropa/.test(s))return "mimaropa";
  if(/^region\s*v(\s*\(|$)/.test(s)||/bicol region/.test(s))return "r5";
  if(/^region\s*vi(\s*\(|$)/.test(s)||/western visayas/.test(s))return "r6";
  if(/^(nir|negros island region)/.test(s))return "nir";
  if(/^region\s*vii(\s*\(|$)/.test(s)||/central visayas/.test(s))return "r7";
  if(/^region\s*viii(\s*\(|$)/.test(s)||/eastern visayas/.test(s))return "r8";
  if(/^region\s*ix(\s*\(|$)/.test(s)||/zamboanga peninsula/.test(s))return "r9";
  if(/^region\s*x(\s*\(|$)/.test(s)||/northern mindanao/.test(s))return "r10";
  if(/^region\s*xi(\s*\(|$)/.test(s)||/davao region/.test(s))return "r11";
  if(/^region\s*xii(\s*\(|$)/.test(s)||/soccsk?sargen|soccsksargen/.test(s))return "r12";
  if(/^region\s*xiii(\s*\(|$)/.test(s)||/caraga/.test(s))return "r13";
  if(/^(barmm|bangsamoro|bangsamoro autonomous region)/.test(s))return "barmm";
  return "unspecified";
}
function reportGroupLocationStats(groups, field, limit=12){
  const all=[...groups.completed.map(r=>({...r,_status:'completed'})),...groups.processing.map(r=>({...r,_status:'processing'})),...groups.pending.map(r=>({...r,_status:'pending'}))];
  const map={};
  all.forEach(r=>{const key=String(r[field]||'').trim()||'Unspecified';if(!map[key])map[key]={completed:0,processing:0,pending:0,total:0};map[key][r._status]++;map[key].total++;});
  const rows=Object.entries(map).sort((a,b)=>b[1].total-a[1].total);
  return limit===null ? rows.filter(([,v])=>v.total>0) : rows.slice(0,limit);
}
function reportGroupRegionStats(groups){
  const map={};
  PH_REPORT_REGIONS.forEach(r=>map[r.key]={completed:0,processing:0,pending:0,total:0});
  let unspecified={completed:0,processing:0,pending:0,total:0};
  const all=[...groups.completed.map(r=>({...r,_status:'completed'})),...groups.processing.map(r=>({...r,_status:'processing'})),...groups.pending.map(r=>({...r,_status:'pending'}))];
  all.forEach(r=>{const key=reportRegionKey(r.region);if(map[key]){map[key][r._status]++;map[key].total++;}else{unspecified[r._status]++;unspecified.total++;}});
  const rows=PH_REPORT_REGIONS.map(r=>[r.name,map[r.key]]);
  if(unspecified.total)rows.push(['Unspecified',unspecified]);
  return rows;
}
function reportStackedLocationChart(groups,field,title,subtitle,locationLimit=12){
  const isRegion=field==='region';
  const rows=isRegion?reportGroupRegionStats(groups):reportGroupLocationStats(groups,field,locationLimit);
  if(!rows.length)return '';
  const max=Math.max(1,...rows.map(x=>x[1].total));
  const badge=isRegion?`${PH_REPORT_REGIONS.length} regions`:(locationLimit===null?`${rows.length} provinces`:`Top ${rows.length}`);
  return `<div class="report-chart-card report-location-chart${isRegion?' report-region-chart':''}"><div class="report-chart-head"><div><h3>${chartEsc(title)}</h3><p>${chartEsc(subtitle)}</p></div><span class="report-chart-total">${badge}</span></div><div class="report-bar-list">${rows.map(([name,v])=>{const cw=v.completed/max*100,pw=v.processing/max*100,qw=v.pending/max*100;return `<div class="report-bar-row"><div class="report-bar-label" title="${chartEsc(name)}">${chartEsc(name)}</div><div class="report-bar-track"><span class="report-bar-seg completed" style="width:${cw}%"></span><span class="report-bar-seg processing" style="width:${pw}%"></span><span class="report-bar-seg pending" style="width:${qw}%"></span></div><b class="report-bar-total">${v.total}</b></div>`;}).join('')}</div><div class="report-mini-legend"><span><i class="completed"></i>Completed</span><span><i class="processing"></i>Processing</span><span><i class="pending"></i>Pending</span></div></div>`;
}
function reportChartSection(groups, opts={}){
  const status=reportStatusChart(groups);
  const second=opts.locationField?reportStackedLocationChart(groups,opts.locationField,opts.locationTitle||'Requests by Location',opts.locationSubtitle||'Completed, processing, and pending requests.',opts.locationLimit===undefined?12:opts.locationLimit):'';
  const third=opts.regionField?reportStackedLocationChart(groups,opts.regionField,opts.regionTitle||'Requests by Region',opts.regionSubtitle||'Status distribution across regions.'):'';
  return `<section class="report-analytics"><div class="report-analytics-title"><span>Analytics & Insights</span><small>Live visual summary • updates with the report data</small></div><div class="report-chart-grid">${status}${second}${third}</div></section>`;
}

function renderIntegrationReport(rows){
  const target=document.getElementById("npaaad-report-document");
  if(!target)return;
  const groups={completed:[],processing:[],pending:[]};
  rows.forEach(row=>{
    const rawStatus=getGvizCell(row,7);
    const mapped=mapReportIntegrationStatus(rawStatus);
    if(mapped){
      groups[mapped].push({
        date:getGvizCell(row,3),
        control:getGvizCell(row,4),
        requester:(()=>{
          const municipality=getGvizCell(row,2).trim();
          const province=getGvizCell(row,1).trim();
          let region=getGvizCell(row,0).trim();
          if(region && !/^region\b/i.test(region)) region="Region "+region;
          return [municipality,province,region].filter(Boolean).join(", ");
        })(),
        province:getGvizCell(row,1).trim(),
        region:(()=>{let v=getGvizCell(row,0).trim();return v&&!/^region\b/i.test(v)?"Region "+v:v;})(),
        subject:getGvizCell(row,5),
        staff:getGvizCell(row,6),
        status:rawStatus,
        remarks:getGvizCell(row,8)
      });
    }
  });
  Object.keys(groups).forEach(k=>sortReportRows(groups[k]));
  window.alrmsIntegrationReportGroups=groups;
  const generated=new Date().toLocaleString([], {year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  const tableFor=list=>{
    if(!list.length)return '<div class="report-empty">No matching requests found in the live sheet.</div>';
    return `<div class="report-table-wrap"><table class="report-table integration-report-table"><thead><tr>
      <th style="width:95px">Date Received</th><th style="width:125px">Request Letter / Control No.</th><th style="width:155px">Requestor</th><th>Subject</th><th style="width:125px">Assigned Staff</th><th style="width:155px">Status</th><th style="width:170px">Remarks</th>
      </tr></thead><tbody>${list.map(item=>`<tr>
        <td>${reportEscape(item.date)}</td><td>${reportEscape(item.control)}</td><td>${reportEscape(item.requester)}</td><td>${reportEscape(item.subject)}</td><td>${reportEscape(item.staff)}</td><td>${reportEscape(item.status)}</td><td>${reportEscape(item.remarks)}</td>
      </tr>`).join("")}</tbody></table></div>`;
  };
  const section=status=>{
    const list=groups[status];
    return `<section class="report-status-section ${status}"><div class="report-status-title ${status}"><span>${reportStatusLabel(status)}</span><span>${list.length} request${list.length===1?"":"s"}</span></div>${tableFor(list)}</section>`;
  };
  const total=groups.completed.length+groups.processing.length+groups.pending.length;
  target.innerHTML=`<div class="report-doc-header">
    <div class="agency">Bureau of Soils and Water Management • Agricultural Land Management and Evaluation Division</div>
    <h1>Integration and Harmonization Report</h1>
    <div class="doc-meta">CY 2026 • Live request records • Generated ${reportEscape(generated)}</div>
  </div>
  <div class="report-source-summary"><div><span>Completed</span><b>${groups.completed.length}</b></div><div><span>Processing</span><b>${groups.processing.length}</b></div><div><span>Pending</span><b>${groups.pending.length}</b></div></div>
  <div class="report-sync-note">Synchronized with the Dashboard “Requests for Integration and Harmonization” Summary Card • Same Column S status mapping • Live</div>
  ${section("completed")}${section("processing")}${section("pending")}
  ${reportChartSection(groups,{locationField:"province",locationTitle:"Requests by Province",locationSubtitle:"All provinces with classified requests.",regionField:"region",regionTitle:"Requests by Region",regionSubtitle:"Regional distribution of completed, processing, and pending requests.",locationLimit:null})}
  <div class="report-footer"><span>Source: Integration and Harmonization Google Sheet • 2026 • Date Received, Control No., Municipality, Province, Subject, Assigned Staff, Status, Remarks</span><span>Total classified requests: ${total}</span></div>`;
  document.getElementById("report-viewer-meta").textContent=`Live report • ${groups.completed.length} Completed • ${groups.processing.length} Processing • ${groups.pending.length} Pending`;
}
let integrationReportRequestSerial=0;
function loadIntegrationReport(showLoading=true){
  const target=document.getElementById("npaaad-report-document"); if(!target)return;
  const viewSerial=reportViewerSerial;
  const serial=++integrationReportRequestSerial;
  if(showLoading)target.innerHTML='<div class="report-loading">Preparing the live Integration and Harmonization report…</div>';
  const callback="alrmsIntegrationReportCallback_"+Date.now()+"_"+Math.floor(Math.random()*10000);
  const script=document.createElement("script");
  const tq="select A,B,C,D,E,F,R,S,T where S is not null";
  const src=INTEGRATION_STATUS_URL+"?gid="+encodeURIComponent(INTEGRATION_GID)+"&headers=1&tqx="+encodeURIComponent("responseHandler:"+callback)+"&tq="+encodeURIComponent(tq)+"&_="+Date.now();
  let finished=false;
  const cleanup=()=>{try{delete window[callback]}catch(e){} if(script.parentNode)script.parentNode.removeChild(script);};
  const fail=()=>{if(finished)return;finished=true;clearTimeout(timer);cleanup();target.innerHTML='<div class="report-error">The live Integration and Harmonization Google Sheet could not be read right now. Please check that the sheet is accessible and try again.</div>';};
  const timer=setTimeout(fail,12000);
  window[callback]=response=>{if(finished)return;finished=true;clearTimeout(timer);cleanup();try{if(serial!==integrationReportRequestSerial || viewSerial!==reportViewerSerial || activeReportType!=="integration")return;renderIntegrationReport((response&&response.table&&response.table.rows)||[]);}catch(e){fail();}};
  script.onerror=fail; script.src=src; document.head.appendChild(script);
}
function openIntegrationReport(){
  const cards=document.querySelector(".report-card-grid"),viewer=document.getElementById("report-viewer"),intro=document.querySelector(".reports-intro-card");
  stopReportRefresh();
  activeReportType="integration";
  reportViewerSerial++;
  if(cards)cards.hidden=true;if(intro)intro.hidden=true;if(viewer)viewer.hidden=false;
  const title=document.getElementById("report-viewer-title");if(title)title.textContent="Integration and Harmonization Report";
  loadIntegrationReport(true);
  startReportRefresh("integration",viewer);
  viewer?.scrollIntoView({behavior:"smooth",block:"start"});
}
function parseReportDate(value){
  const v=String(value||"").trim();
  if(!v) return 0;
  // Google Sheets may return formatted dates such as "01/09/2026" or "Jan 9, 2026".
  const m=v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if(m){
    const a=Number(m[1]), b=Number(m[2]), y=Number(m[3]);
    // Prefer month/day when the first number can be a month; otherwise day/month.
    const month=a<=12?a:b, day=a<=12?b:a;
    return Date.UTC(y,month-1,day);
  }
  const t=Date.parse(v);
  return Number.isNaN(t)?0:t;
}
function sortReportRows(list){
  return list.sort((a,b)=>parseReportDate(a.date)-parseReportDate(b.date));
}
function renderNpaaadReport(rows){
  const target=document.getElementById("npaaad-report-document");
  if(!target)return;

  const groups={completed:[],processing:[],pending:[]};
  rows.forEach(row=>{
    const rawStatus=getGvizCell(row,3);
    const mapped=mapReportNpaaadStatus(rawStatus);
    if(mapped){
      groups[mapped].push({
        date:getGvizCell(row,0),
        requester:getGvizCell(row,1),
        requesterKey:getGvizCell(row,1),
        subject:getGvizCell(row,2),
        status:rawStatus
      });
    }
  });

  // Keep the report order consistent with the live Summary Card counts.
  Object.keys(groups).forEach(k=>sortReportRows(groups[k]));
  window.alrmsNpaaadReportGroups = groups;

  // Completed requests are divided into two report subsections:
  // With CSM = original Completed Request records; Waiting for CSM = current Waiting for CSM records.
  const withCsm=groups.completed.filter(item=>{const s=normalizeSheetStatus(item.status);return s==="completed request"||s==="completed";});
  const waitingForCsm=groups.completed.filter(item=>normalizeSheetStatus(item.status)==="waiting for csm");

  const generated=new Date().toLocaleString([], {
    year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"
  });

  const tableFor=(list)=>{
    if(!list.length) return `<div class="report-empty">No matching requests found in the live sheet.</div>`;
    return `<div class="report-table-wrap"><table class="report-table"><thead><tr>
      <th style="width:110px">Date</th><th style="width:170px">Requester</th><th>Subject</th><th style="width:210px">Remarks / Status</th>
      </tr></thead><tbody>${list.map(item=>`<tr>
        <td>${reportEscape(item.date)}</td><td>${reportEscape(item.requester)}</td>
        <td>${reportEscape(item.subject)}</td><td>${reportEscape(item.status)}</td>
      </tr>`).join("")}</tbody></table></div>`;
  };

  const section=(status)=>{
    const list=groups[status];
    let content="";
    if(status==="completed"){
      content=`
        <div class="report-subsection">
          <div class="report-subsection-title">With CSM <span>${withCsm.length} request${withCsm.length===1?"":"s"}</span></div>
          ${tableFor(withCsm)}
        </div>
        <div class="report-subsection">
          <div class="report-subsection-title">Waiting for CSM <span>${waitingForCsm.length} request${waitingForCsm.length===1?"":"s"}</span></div>
          ${tableFor(waitingForCsm)}
        </div>`;
    }else{
      content=tableFor(list);
    }
    return `<section class="report-status-section">
      <div class="report-status-title ${status}">
        <span>${reportStatusLabel(status)}</span><span>${list.length} request${list.length===1?"":"s"}</span>
      </div>${content}
    </section>`;
  };

  const total=groups.completed.length+groups.processing.length+groups.pending.length;
  target.innerHTML=`<div class="report-doc-header">
    <div class="agency">Bureau of Soils and Water Management • Agricultural Land Management and Evaluation Division</div>
    <h1>NPAAAD and SAFDZ Request Report</h1>
    <div class="doc-meta">CY 2026 • Live request records • Generated ${reportEscape(generated)}</div>
  </div>
  <div class="report-source-summary">
    <div><span>Completed</span><b>${groups.completed.length}</b></div>
    <div><span>Processing</span><b>${groups.processing.length}</b></div>
    <div><span>Pending</span><b>${groups.pending.length}</b></div>
  </div>
  <div class="report-sync-note">Synchronized with the Dashboard “Requests for NPAAAD and SAFDZ” Summary Card • Same Column Q status mapping • Live</div>
  ${section("completed")}${section("processing")}${section("pending")}
  <div class="report-footer">
    <span>Source: NPAAAD and SAFDZ Google Sheet • 2026 • Column 1, Requested by, Subject, Status</span>
    <span>Total classified requests: ${total}</span>
  </div>`;
  document.getElementById("report-viewer-meta").textContent=
    `Live report • ${groups.completed.length} Completed • ${groups.processing.length} Processing • ${groups.pending.length} Pending`;
}
function loadNpaaadReport(showLoading=true){
  const target=document.getElementById("npaaad-report-document");
  if(!target)return;
  const viewSerial=reportViewerSerial;
  const serial=++npaaadReportRequestSerial;
  if(showLoading)target.innerHTML='<div class="report-loading">Preparing the live NPAAAD and SAFDZ request report…</div>';
  const callback="alrmsNpaaadReportCallback_"+Date.now()+"_"+Math.floor(Math.random()*10000);
  const script=document.createElement("script");
  const tq="select A,D,F,Q where Q is not null";
  const src=NPAAAD_REPORT_URL+"?gid="+encodeURIComponent(NPAAAD_GID)+"&headers=1&tqx="+encodeURIComponent("responseHandler:"+callback)+"&tq="+encodeURIComponent(tq)+"&_="+Date.now();
  let finished=false;
  const cleanup=()=>{try{delete window[callback]}catch(e){} if(script.parentNode)script.parentNode.removeChild(script);};
  const fail=()=>{if(finished)return;finished=true;clearTimeout(timer);cleanup();target.innerHTML='<div class="report-error">The live Google Sheet could not be read right now. Please check that the sheet is accessible and try Refresh Report again.</div>';};
  const timer=setTimeout(fail,12000);
  window[callback]=response=>{
    if(finished)return; finished=true; clearTimeout(timer); cleanup();
    try{
      if(serial!==npaaadReportRequestSerial || viewSerial!==reportViewerSerial || activeReportType!=="npaaad")return;
      const rows=(response&&response.table&&response.table.rows)||[];
      renderNpaaadReport(rows);
    }catch(err){fail();}
  };
  script.onerror=fail;
  script.src=src;
  document.head.appendChild(script);
}
function openNpaaadReport(){
  const cards=document.querySelector(".report-card-grid");
  const viewer=document.getElementById("report-viewer");
  stopReportRefresh();
  activeReportType="npaaad";
  reportViewerSerial++;
  if(cards)cards.hidden=true;
  const intro=document.querySelector(".reports-intro-card");
  if(intro)intro.hidden=true;
  if(viewer){viewer.hidden=false;}
  const title=document.getElementById("report-viewer-title");
  if(title)title.textContent="NPAAAD and SAFDZ Request Report";
  loadNpaaadReport(true);
  startReportRefresh("npaaad",viewer);
  viewer?.scrollIntoView({behavior:"smooth",block:"start"});
}
function closeReportViewer(){
  const cards=document.querySelector(".report-card-grid");
  const viewer=document.getElementById("report-viewer");
  const intro=document.querySelector(".reports-intro-card");
  if(cards)cards.hidden=false;
  if(intro)intro.hidden=false;
  if(viewer)viewer.hidden=true;
  activeReportType=null;
  reportViewerSerial++;
  stopReportRefresh();
}


/* =========================================================
   E.O. 79 Matters Report
   Source: Google Sheet tab "2026", gid 249796757
   Status: Column P
   Mapping matches the E.O. 79 Dashboard Summary Card exactly.
   Details: B Date Endorsed, E Applicant, I Region, J Province,
   K Municipality, L Barangay, F Area (Ha), N Date Validated,
   O Assigned To, M Notes.
   ========================================================= */
let eo79ReportRequestSerial=0;
let eo79ReportRefreshTimer=null;
function mapReportEo79Status(value){
  // Must remain identical to the E.O. 79 Dashboard Summary Card.
  return mapEo79Status(value);
}
function sentenceCaseLocation(value){
  const s=String(value||"").trim();
  if(!s)return "";
  return s.toLowerCase().replace(/(^|[\s\-\/])([a-z])/g,(m,p,c)=>p+c.toUpperCase());
}
function eo79Location(row){
  const brgy=sentenceCaseLocation(getGvizCell(row,6));
  const municipality=sentenceCaseLocation(getGvizCell(row,5));
  const province=sentenceCaseLocation(getGvizCell(row,4));
  let region=sentenceCaseLocation(getGvizCell(row,3));
  if(region && !/^region\b/i.test(region)) region="Region "+region;
  return [brgy,municipality,province,region].filter(Boolean).join(", ");
}
function renderEo79Report(rows){
  const target=document.getElementById("npaaad-report-document"); if(!target)return;
  const groups={completed:[],processing:[],pending:[]};
  rows.forEach(row=>{
    const rawStatus=getGvizCell(row,10);
    const mapped=mapReportEo79Status(rawStatus);
    if(mapped){
      groups[mapped].push({
        date:getGvizCell(row,0), applicant:getGvizCell(row,1), location:eo79Location(row), province:sentenceCaseLocation(getGvizCell(row,4)),
        region:(()=>{let v=sentenceCaseLocation(getGvizCell(row,3));return v&&!/^region\b/i.test(v)?"Region "+v:v;})(),
        area:getGvizCell(row,2), validated:getGvizCell(row,8), assigned:getGvizCell(row,9), notes:getGvizCell(row,7), status:rawStatus
      });
    }
  });
  Object.keys(groups).forEach(k=>sortReportRows(groups[k]));
  window.alrmsEo79ReportGroups=groups;
  const generated=new Date().toLocaleString([], {year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  const tableFor=list=>{
    if(!list.length)return '<div class="report-empty">No matching E.O. 79 matters found in the live sheet.</div>';
    return `<div class="report-table-wrap"><table class="report-table eo79-report-table"><thead><tr>
      <th style="width:105px">Date Endorsed</th><th style="width:175px">Applicant Name / Representative</th><th style="width:215px">Location</th><th style="width:75px">Area (Ha)</th><th style="width:105px">Date Validated</th><th style="width:125px">Assigned To</th><th style="width:180px">Notes</th>
      </tr></thead><tbody>${list.map(item=>`<tr><td>${reportEscape(item.date)}</td><td>${reportEscape(item.applicant)}</td><td>${reportEscape(item.location)}</td><td>${reportEscape(item.area)}</td><td>${reportEscape(item.validated)}</td><td>${reportEscape(item.assigned)}</td><td>${reportEscape(item.notes)}</td></tr>`).join("")}</tbody></table></div>`;
  };
  const section=status=>{const list=groups[status];return `<section class="report-status-section ${status}"><div class="report-status-title ${status}"><span>${reportStatusLabel(status)}</span><span>${list.length} request${list.length===1?"":"s"}</span></div>${tableFor(list)}</section>`;};
  const total=groups.completed.length+groups.processing.length+groups.pending.length;
  target.innerHTML=`<div class="report-doc-header"><div class="agency">Bureau of Soils and Water Management • Agricultural Land Management and Evaluation Division</div><h1>E.O. 79 Matters Report</h1><div class="doc-meta">CY 2026 • Live E.O. 79 records • Generated ${reportEscape(generated)}</div></div>
  <div class="report-source-summary"><div><span>Completed</span><b>${groups.completed.length}</b></div><div><span>Processing</span><b>${groups.processing.length}</b></div><div><span>Pending</span><b>${groups.pending.length}</b></div></div>
  <div class="report-sync-note">Synchronized with the Dashboard “E.O. 79 Matters” Summary Card • Same Column P status mapping • Live</div>
  ${section("completed")}${section("processing")}${section("pending")}
  ${reportChartSection(groups,{locationField:"province",locationTitle:"E.O. 79 Matters by Province",locationSubtitle:"All provinces with classified E.O. 79 matters.",regionField:"region",regionTitle:"E.O. 79 Matters by Region",regionSubtitle:"Regional distribution of completed, processing, and pending matters.",locationLimit:null})}
  <div class="report-footer"><span>Source: E.O. 79 Matters Google Sheet • 2026 • Date Endorsed, Applicant, Location, Area, Date Validated, Assigned To, Notes</span><span>Total classified requests: ${total}</span></div>`;
  document.getElementById("report-viewer-meta").textContent=`Live report • ${groups.completed.length} Completed • ${groups.processing.length} Processing • ${groups.pending.length} Pending`;
}
function loadEo79Report(showLoading=true){
  const target=document.getElementById("npaaad-report-document"); if(!target)return;
  const viewSerial=reportViewerSerial;
  const serial=++eo79ReportRequestSerial;
  if(showLoading)target.innerHTML='<div class="report-loading">Preparing the live E.O. 79 Matters report…</div>';
  const callback="alrmsEo79ReportCallback_"+Date.now()+"_"+Math.floor(Math.random()*10000);
  const script=document.createElement("script");
  const tq="select B,E,F,I,J,K,L,M,N,O,P where P is not null";
  const src=EO79_STATUS_URL+"?gid="+encodeURIComponent(EO79_GID)+"&headers=1&tqx="+encodeURIComponent("responseHandler:"+callback)+"&tq="+encodeURIComponent(tq)+"&_="+Date.now();
  let finished=false;
  const cleanup=()=>{try{delete window[callback]}catch(e){} if(script.parentNode)script.parentNode.removeChild(script);};
  const fail=()=>{if(finished)return;finished=true;clearTimeout(timer);cleanup();target.innerHTML='<div class="report-error">The live E.O. 79 Matters Google Sheet could not be read right now. Please check that the sheet is accessible and try again.</div>';};
  const timer=setTimeout(fail,12000);
  window[callback]=response=>{if(finished)return;finished=true;clearTimeout(timer);cleanup();try{if(serial!==eo79ReportRequestSerial || viewSerial!==reportViewerSerial || activeReportType!=="eo79")return;renderEo79Report((response&&response.table&&response.table.rows)||[]);}catch(e){fail();}};
  script.onerror=fail;script.src=src;document.head.appendChild(script);
}
function openEo79Report(){
  const cards=document.querySelector(".report-card-grid"),viewer=document.getElementById("report-viewer"),intro=document.querySelector(".reports-intro-card");
  stopReportRefresh();
  activeReportType="eo79";
  reportViewerSerial++;
  if(cards)cards.hidden=true;if(intro)intro.hidden=true;if(viewer)viewer.hidden=false;
  const title=document.getElementById("report-viewer-title");if(title)title.textContent="E.O. 79 Matters Report";
  loadEo79Report(true);
  startReportRefresh("eo79",viewer);
  viewer?.scrollIntoView({behavior:"smooth",block:"start"});
}
function downloadEo79Pdf(){
  const groups=window.alrmsEo79ReportGroups;if(!groups)return;
  let W=595.28,H=841.89,M=22,U=W-2*M;const pages=[];let ops=[],y=H-M;
  const C={completed:[40,121,78],processing:[36,102,167],pending:[194,140,32]};
  const page=()=>{if(ops.length)pages.push({body:ops.join("\n"),W,H});ops=[];y=H-M;};
  const need=h=>{if(y-h<M)page();};
  const T=(x,yy,v,size=6.5,bold=false,c=[38,52,70])=>ops.push(`${c[0]/255} ${c[1]/255} ${c[2]/255} rg BT /${bold?'F2':'F1'} ${size} Tf ${x.toFixed(2)} ${yy.toFixed(2)} Td (${pdfEscape(v)}) Tj ET`);
  const R=(x,yy,w,h,c,stroke)=>{ops.push(`${c[0]/255} ${c[1]/255} ${c[2]/255} rg ${x} ${yy-h} ${w} ${h} re f`);if(stroke)ops.push(`${stroke[0]/255} ${stroke[1]/255} ${stroke[2]/255} RG .6 w ${x} ${yy-h} ${w} ${h} re S`);};
  const L=(x1,yy,x2,c=[215,222,229])=>ops.push(`${c[0]/255} ${c[1]/255} ${c[2]/255} RG .5 w ${x1} ${yy} m ${x2} ${yy} l S`);
  T(M,y,"BUREAU OF SOILS AND WATER MANAGEMENT • AGRICULTURAL LAND MANAGEMENT AND EVALUATION DIVISION",8,true,[45,58,77]);y-=17;T(M,y,"E.O. 79 Matters Report",17,true,[35,62,101]);y-=15;T(M,y,`CY 2026 • Live E.O. 79 records • Generated ${new Date().toLocaleString([], {year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}`,7,false,[75,82,92]);y-=10;L(M,y,W-M,[35,62,101]);y-=12;
  const sum=[['Completed',groups.completed.length,'completed'],['Processing',groups.processing.length,'processing'],['Pending',groups.pending.length,'pending']],gap=7,bw=(U-gap*2)/3;sum.forEach((a,i)=>{const x=M+i*(bw+gap);R(x,y,bw,36,[248,250,252],[220,226,233]);R(x,y,bw,4,C[a[2]]);T(x+8,y-13,a[0].toUpperCase(),6,true,[75,82,92]);T(x+8,y-29,String(a[1]),14,true,[35,62,101]);});y-=47;R(M,y,U,22,[246,249,251],[221,228,235]);T(M+7,y-14,'Synchronized with the Dashboard “E.O. 79 Matters” Summary Card • Same Column P mapping • Live',6);y-=31;
  const table=list=>{
    if(!list.length){need(20);T(M+5,y-13,'No matching E.O. 79 matters found in the live sheet.',6.5,false,[100,108,118]);y-=20;return;}
    // Revision 120: E.O. 79 PDF header readability fix.
    // Use explicit compact header labels, fixed line spacing, and column widths that stay
    // strictly inside the A4 printable width so DATE/APPLICANT/LOCATION never overlap.
    const ws=[49,115,110,44,57,69,101],hs=[
      'DATE\nENDORSED',
      'APPLICANT\nNAME /\nREPRESENTATIVE',
      'LOCATION',
      'AREA (HA)',
      'DATE\nVALIDATED',
      'ASSIGNED\nTO',
      'NOTES'
    ];
    const headerFont=3.7, headerLine=5.2, headerPad=7;
    const headerLines=hs.map(h=>String(h).split('\n'));
    const headerH=Math.max(31,Math.max(...headerLines.map(a=>a.length))*headerLine+headerPad);
    need(headerH+2);
    R(M,y,U,headerH,[245,247,250],[218,225,232]);
    let x=M+3;
    hs.forEach((h,i)=>{
      const lines=headerLines[i];
      lines.forEach((ln,j)=>T(x,y-10-j*headerLine,ln,headerFont,true,[35,62,101]));
      x+=ws[i];
    });
    y-=headerH;
    for(const r of list){
      const cells=[r.date,r.applicant,r.location,r.area,r.validated,r.assigned,r.notes];
      const wraps=cells.map((c,i)=>pdfWrap(c,Math.max(7,Math.floor(ws[i]/4.15))));
      const rh=Math.max(1,Math.max(...wraps.map(a=>a.length)))*6.7+6;
      need(rh+1);
      wraps.forEach((arr,i)=>arr.forEach((ln,j)=>T(M+3+ws.slice(0,i).reduce((a,b)=>a+b,0),y-11-j*6.7,ln,5.15)));
      L(M,y-rh,M+U);
      y-=rh;
    }
  };
  ['completed','processing','pending'].forEach(k=>{const list=groups[k];need(30);R(M,y,U,25,C[k]);T(M+8,y-16,k==='completed'?'Completed':k==='processing'?'Processing':'Pending',7.5,true,[255,255,255]);T(W-M-58,y-16,`${list.length}`,7,true,[255,255,255]);y-=30;table(list);y-=5;});
  page(); W=841.89;H=595.28;M=24;U=W-2*M;y=H-M;
  drawPdfAnalyticsLandscape(groups,{M,W,U,yRef:()=>y,setY:v=>{y=v;},need,T,R,L,C,ops},{locationField:'province',locationTitle:'E.O. 79 Matters by Province',regionField:'region',regionTitle:'E.O. 79 Matters by Region'});
  need(20);L(M,y,W-M);y-=11;T(M,y,'Source: E.O. 79 Matters Google Sheet • 2026 • Columns B,E,F,I,J,K,L,M,N,O,P',5.5,false,[95,104,115]);page();
  const objs=[],add=o=>(objs.push(o),objs.length),f1=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),f2=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'),contents=[],pids=[];for(const pg of pages)contents.push(add(`<< /Length ${pg.body.length} >>\nstream\n${pg.body}\nendstream`));const pagesId=add('');for(let i=0;i<pages.length;i++)pids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pages[i].W} ${pages[i].H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${contents[i]} 0 R >>`));objs[pagesId-1]=`<< /Type /Pages /Kids [${pids.map(id=>id+' 0 R').join(' ')}] /Count ${pids.length} >>`;const root=add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);let out='%PDF-1.4\n%ALRMS\n',off=[0];for(let i=0;i<objs.length;i++){off[i+1]=out.length;out+=`${i+1} 0 obj\n${objs[i]}\nendobj\n`;}const xr=out.length;out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;for(let i=1;i<=objs.length;i++)out+=String(off[i]).padStart(10,'0')+' 00000 n \n';out+=`trailer\n<< /Size ${objs.length+1} /Root ${root} 0 R >>\nstartxref\n${xr}\n%%EOF`;saveGeneratedPdf(out,'EO79_Matters_Report_CY2026.pdf');
}

function downloadIntegrationPdf(){
  const groups=window.alrmsIntegrationReportGroups;if(!groups)return;
  let W=595.28,H=841.89,M=24,U=W-2*M;const pages=[];let ops=[],y=H-M;
  const C={completed:[40,121,78],processing:[36,102,167],pending:[194,140,32]};
  const page=()=>{if(ops.length)pages.push({body:ops.join("\n"),W,H});ops=[];y=H-M;};
  const need=h=>{if(y-h<M)page();};
  const T=(x,yy,v,size=7,bold=false,c=[38,52,70])=>ops.push(`${c[0]/255} ${c[1]/255} ${c[2]/255} rg BT /${bold?'F2':'F1'} ${size} Tf ${x.toFixed(2)} ${yy.toFixed(2)} Td (${pdfEscape(v)}) Tj ET`);
  const R=(x,yy,w,h,c,stroke)=>{ops.push(`${c[0]/255} ${c[1]/255} ${c[2]/255} rg ${x} ${yy-h} ${w} ${h} re f`);if(stroke)ops.push(`${stroke[0]/255} ${stroke[1]/255} ${stroke[2]/255} RG .6 w ${x} ${yy-h} ${w} ${h} re S`);};
  const L=(x1,yy,x2,c=[215,222,229])=>ops.push(`${c[0]/255} ${c[1]/255} ${c[2]/255} RG .5 w ${x1} ${yy} m ${x2} ${yy} l S`);
  T(M,y,"BUREAU OF SOILS AND WATER MANAGEMENT • AGRICULTURAL LAND MANAGEMENT AND EVALUATION DIVISION",8,true,[45,58,77]);y-=17;T(M,y,"Integration and Harmonization Report",17,true,[35,62,101]);y-=15;T(M,y,`CY 2026 • Live request records • Generated ${new Date().toLocaleString([], {year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}`,7,false,[75,82,92]);y-=10;L(M,y,W-M,[35,62,101]);y-=12;
  const sum=[['Completed',groups.completed.length,'completed'],['Processing',groups.processing.length,'processing'],['Pending',groups.pending.length,'pending']],gap=7,bw=(U-gap*2)/3;sum.forEach((a,i)=>{const x=M+i*(bw+gap);R(x,y,bw,36,[248,250,252],[220,226,233]);R(x,y,bw,4,C[a[2]]);T(x+8,y-13,a[0].toUpperCase(),6,true,[75,82,92]);T(x+8,y-29,String(a[1]),14,true,[35,62,101]);});y-=47;
  R(M,y,U,22,[246,249,251],[221,228,235]);T(M+7,y-14,'Synchronized with the Dashboard “Requests for Integration and Harmonization” Summary Card • Same Column S mapping • Live',6);y-=31;
  const table=list=>{if(!list.length){need(20);T(M+5,y-13,'No matching requests found in the live sheet.',6.5,[100,108,118]);y-=20;return;}const ws=[55,78,92,100,70,72,80],hs=['DATE','CONTROL NO.','REQUESTOR','SUBJECT','ASSIGNED STAFF','STATUS','REMARKS'];need(22);R(M,y,U,20,[245,247,250],[218,225,232]);let x=M+4;hs.forEach((h,i)=>{T(x,y-13,h,5.3,true,[35,62,101]);x+=ws[i];});y-=20;for(const r of list){const cells=[r.date,r.control,r.requester,r.subject,r.staff,r.status,r.remarks],wraps=cells.map((c,i)=>pdfWrap(c,Math.max(8,Math.floor(ws[i]/4.3)))),rh=Math.max(...wraps.map(a=>a.length))*7+6;need(rh+1);wraps.forEach((arr,i)=>arr.forEach((ln,j)=>T(M+4+ws.slice(0,i).reduce((a,b)=>a+b,0),y-11-j*7,ln,5.8)));L(M,y-rh,M+U);y-=rh;}};
  ['completed','processing','pending'].forEach(k=>{const list=groups[k];need(30);R(M,y,U,25,C[k]);T(M+8,y-16,k==='completed'?'Completed':k==='processing'?'Processing':'Pending',7.5,true,[255,255,255]);T(W-M-58,y-16,`${list.length}`,7,true,[255,255,255]);y-=30;table(list);y-=5;});
  page(); W=841.89;H=595.28;M=24;U=W-2*M;y=H-M;
  drawPdfAnalyticsLandscape(groups,{M,W,U,yRef:()=>y,setY:v=>{y=v;},need,T,R,L,C,ops},{locationField:'province',locationTitle:'Requests by Province',regionField:'region',regionTitle:'Requests by Region'});
  need(20);L(M,y,W-M);y-=11;T(M,y,'Source: Integration and Harmonization Google Sheet • 2026 • Columns D,E,B+C,F,R,S,T',5.5,false,[95,104,115]);page();
  const objs=[],add=o=>(objs.push(o),objs.length),f1=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),f2=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'),contents=[],pids=[];for(const pg of pages)contents.push(add(`<< /Length ${pg.body.length} >>\nstream\n${pg.body}\nendstream`));const pagesId=add('');for(let i=0;i<pages.length;i++)pids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pages[i].W} ${pages[i].H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${contents[i]} 0 R >>`));objs[pagesId-1]=`<< /Type /Pages /Kids [${pids.map(id=>id+' 0 R').join(' ')}] /Count ${pids.length} >>`;const root=add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);let out='%PDF-1.4\n%ALRMS\n',off=[0];for(let i=0;i<objs.length;i++){off[i+1]=out.length;out+=`${i+1} 0 obj\n${objs[i]}\nendobj\n`;}const xr=out.length;out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;for(let i=1;i<=objs.length;i++)out+=String(off[i]).padStart(10,'0')+' 00000 n \n';out+=`trailer\n<< /Size ${objs.length+1} /Root ${root} 0 R >>\nstartxref\n${xr}\n%%EOF`;saveGeneratedPdf(out,'Integration_and_Harmonization_Report_CY2026.pdf');
}

document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("open-npaaad-report")?.addEventListener("click",openNpaaadReport);
  document.getElementById("open-harmonization-report")?.addEventListener("click",openIntegrationReport);
  document.getElementById("open-eo79-report")?.addEventListener("click",openEo79Report);
  document.getElementById("report-back")?.addEventListener("click",closeReportViewer);
  document.getElementById("report-print")?.addEventListener("click",()=>{
    const oldTitle=document.title;
    const titles={
      npaaad:"NPAAAD_and_SAFDZ_Request_Report_CY2026",
      integration:"Integration_and_Harmonization_Report_CY2026",
      eo79:"EO79_Matters_Report_CY2026"
    };
    document.title=titles[activeReportType]||"ALRMS_Report_CY2026";
    window.print();
    setTimeout(()=>{document.title=oldTitle;},1000);
  });
});
