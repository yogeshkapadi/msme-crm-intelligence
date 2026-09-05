
/* ===== v5.1 DATA ROBUSTNESS LAYER =====
   Purpose:
   - Normalize probability values expressed as 0..1 or 0..100.
   - Treat absent domains as "no data" rather than fabricated/demo values.
   - Preserve a diagnostic list for unmapped pipeline stages.
   This layer is intentionally client-side; no CRM records are transmitted.
*/
function v51NormalizeProbability(value) {
  if (value === null || value === undefined || value === "") return null;
  var n = Number(String(value).replace(/[% ,]/g, ""));
  if (!Number.isFinite(n)) return null;
  if (n > 1 && n <= 100) return n / 100;
  if (n >= 0 && n <= 1) return n;
  return null;
}

function v51NormalizeProbabilitiesInRows(rows) {
  if (!Array.isArray(rows)) return rows || [];
  return rows.map(function(r) {
    var x = Object.assign({}, r);
    var keys = Object.keys(x);
    var pkey = keys.find(function(k) {
      return /^(probability|probability %|win probability)$/i.test(String(k).trim());
    });
    if (pkey) {
      var p = v51NormalizeProbability(x[pkey]);
      if (p !== null) x[pkey] = p;
    }
    return x;
  });
}

function v51DomainHasData(domain) {
  return Array.isArray(domain) && domain.length > 0;
}

function v51KpiValueOrNoData(value, domain) {
  return v51DomainHasData(domain) ? value : "No data";
}

function v51RecordUnmappedStages(rows, stageKey, knownStages) {
  if (!Array.isArray(rows)) return [];
  var known = (knownStages || []).map(function(s) { return String(s).trim().toLowerCase(); });
  var seen = {};
  rows.forEach(function(r) {
    var raw = r && r[stageKey];
    if (raw === undefined || raw === null || String(raw).trim() === "") return;
    var s = String(raw).trim().toLowerCase();
    if (known.indexOf(s) === -1) seen[String(raw).trim()] = true;
  });
  return Object.keys(seen);
}

function v51ShowDataWarning(message) {
  try {
    var existing = document.getElementById("v51-data-warning");
    if (existing) existing.remove();
    var el = document.createElement("div");
    el.id = "v51-data-warning";
    el.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:99999;max-width:430px;padding:14px 16px;border:1px solid #e5c07b;border-radius:10px;background:#fff8e1;color:#5f4600;box-shadow:0 4px 18px rgba(0,0,0,.12);font:14px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;";
    el.innerHTML = "<strong>Data check</strong><br>" + String(message).replace(/</g,"&lt;").replace(/>/g,"&gt;");
    document.body.appendChild(el);
  } catch (e) {}
}


const state={
 demo:true,
 source:"Demo CRM data",
 datasets:window.DEMO_DATA||{customers:[],opportunities:[],marketing:[],service:[],financial:[]}
};
const fmt=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n)||0);
const pct=n=>(Number(n)||0).toFixed(1)+"%";
const num=n=>Number(n)||0;
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const by=(arr,key)=>arr.reduce((o,r)=>(o[r[key]]=(o[r[key]]||[]).concat(r),o),{});
// FIX (bug #2): stage matching used to be an exact, case-sensitive match against
// "Lead/Qualified/Proposal/Negotiation/Won/Lost" only. Real CRM exports (Salesforce,
// Zoho, HubSpot, Pipedrive...) use different stage labels, so every KPI silently
// showed 0. This maps common real-world labels onto our canonical 6 stages, and
// falls back to a case-insensitive contains-check for anything else so an unmapped
// label still lands somewhere sensible instead of vanishing.
const STAGE_ALIASES={
 "closed won":"Won","won":"Won","closed-won":"Won",
 "closed lost":"Lost","lost":"Lost","closed-lost":"Lost","disqualified":"Lost",
 "prospecting":"Lead","new":"Lead","lead":"Lead","open":"Lead",
 "qualified":"Qualified","qualification":"Qualified","discovery":"Qualified",
 "proposal":"Proposal","quote":"Proposal","proposal/price quote":"Proposal",
 "negotiation":"Negotiation","negotiation/review":"Negotiation","contract sent":"Negotiation"
};
// FIX (bug #5): "latest month" used to be whichever month appeared last while scanning
// the rows (via a plain Set), which only worked because the demo data happens to be
// pre-sorted. Real spreadsheets are often grouped by customer first, which would pick
// the wrong month silently. Sort chronologically instead of trusting row order.
function latestTwoMonths(fin){
 const months=[...new Set(fin.map(r=>r.Month))].sort((a,b)=>{
  const da=Date.parse(a+"-01"),db=Date.parse(b+"-01");
  if(!isNaN(da)&&!isNaN(db))return da-db;
  return String(a).localeCompare(String(b));
 });
 return{last:months.at(-1),prev:months.at(-2)};
}
function normalizeStage(raw){
 const s=String(raw||"").trim();
 if(!s)return"";
 const key=s.toLowerCase();
 if(STAGE_ALIASES[key])return STAGE_ALIASES[key];
 if(key.includes("won"))return"Won";
 if(key.includes("lost")||key.includes("disqualif"))return"Lost";
 if(key.includes("negotiat"))return"Negotiation";
 if(key.includes("propos")||key.includes("quote"))return"Proposal";
 if(key.includes("qualif"))return"Qualified";
 return s; // unrecognized label: keep as-is rather than silently discarding it
}
function parseCSV(text){const lines=text.trim().split(/\r?\n/);if(!lines.length||!lines[0])return[];const split=s=>{let a=[],c="",q=false;for(let i=0;i<s.length;i++){let x=s[i];if(x==='"'){if(q&&s[i+1]==='"'){c+='"';i++}else q=!q}else if(x===','&&!q){a.push(c);c=""}else c+=x}a.push(c);return a};const h=split(lines[0]);return lines.slice(1).filter(x=>x.trim()).map(l=>{let v=split(l),o={};h.forEach((k,i)=>o[k]=v[i]??"");return o})}
function saveSession(){try{sessionStorage.setItem("crmDatasets",JSON.stringify(state.datasets));sessionStorage.setItem("crmSource",state.source);sessionStorage.setItem("crmDemo",state.demo?"1":"0")}catch(e){}}
function loadSession(){try{let raw=sessionStorage.getItem("crmDatasets");if(raw){let d=JSON.parse(raw);if(d&&d.opportunities){state.datasets=d;state.source=sessionStorage.getItem("crmSource")||"Your data";state.demo=sessionStorage.getItem("crmDemo")!=="0";return true}}}catch(e){}return false}
function set(id,v){const e=document.getElementById(id);if(e)e.innerHTML=v}
function downloadDemoWorkbook(){window.location.href="data/CRM_Intelligence_Demo_Data.xlsx"}
// FIX (bug #3): customers.html, pipeline.html, sales.html and reports.html call downloadDemo(),
// which never existed — clicking "Download Demo Data" on those pages did nothing. Alias it.
function downloadDemo(){downloadDemoWorkbook()}
function downloadDemoCSV(name){const rows=state.datasets[name]||[];if(!rows.length)return;const h=Object.keys(rows[0]);const cell=x=>`"${String(x??"").replace(/"/g,'""')}"`;const text=[h.map(cell).join(","),...rows.map(r=>h.map(k=>cell(r[k])).join(","))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/csv"}));a.download=`CRM_Intelligence_${name}.csv`;a.click();URL.revokeObjectURL(a.href)}
async function handleFile(file){
 if(!file)return;
 try{
  if(file.name.toLowerCase().endsWith(".csv")){
   const rows=parseCSV(await file.text());
   if(!rows.length)throw 0;
   // A CSV upload only ever contains the opportunities table.
   // FIX (bug #1): this used to leave state.datasets.customers/marketing/service/financial
   // untouched, so they kept whatever was loaded before (usually the demo data) while the
   // page relabelled itself with the user's real filename — showing fabricated companies
   // and numbers as if they belonged to the user's own data. A CSV upload is opportunities-only,
   // so every other domain must be explicitly cleared, exactly like the XLSX branch below does
   // for any sheet it can't find.
   state.datasets={customers:[],opportunities:rows,marketing:[],service:[],financial:[]};
  }else{
   const wb=XLSX.read(await file.arrayBuffer(),{type:"array"});
   const map={};
   wb.SheetNames.forEach(n=>map[n.toLowerCase()]=n);
   const read=(name,aliases)=>{let actual=aliases.map(a=>map[a]).find(Boolean);return actual?XLSX.utils.sheet_to_json(wb.Sheets[actual],{defval:""}):[]};
   state.datasets.customers=read("Customers",["customers","customer"]);
   state.datasets.opportunities=v51NormalizeProbabilitiesInRows(read("Opportunities",["opportunities","opportunity","sales"]));
   state.datasets.marketing=read("Marketing",["marketing"]);
   state.datasets.service=read("Service",["service","support"]);
   state.datasets.financial=read("Financial",["financial","finance"]);
   if(!state.datasets.opportunities.length){
     // fallback to first sheet
     state.datasets.opportunities=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:""});
   }
  }
  state.demo=false;state.source=file.name;saveSession();window.location.href="dashboard.html";
 }catch(e){alert("Could not read this file. Please use the provided Excel template or a valid CSV/XLSX file.")}
}
function resetDemo(){sessionStorage.clear();window.location.href="dashboard.html"}
function opportunities(){
 const rows=v51NormalizeProbabilitiesInRows(state.datasets.opportunities||[]);
 const out=rows.map(r=>{
   let value=num(r["Deal Value"]||r.Revenue||r.Amount||r["Invoice Value"]);
   let p=v51NormalizeProbability(r.Probability);
   let explicit=num(r["Expected Revenue"]);
   let expected=explicit || (p===null ? 0 : value*p);
   return {...r,value,probability:p,expected,
     stage:normalizeStage(r.Stage||r["Opportunity Stage"]||r["Opportunity Status"]||""),
     customer:r.Customer||r["Customer Name"]||r["Client Name"]||"",
     salesperson:r.Salesperson||r["Salesperson Name"]||r["Account Manager"]||"",
     region:r.Region||r.Territory||"",
     industry:r.Industry||r.Segment||""};
 });
 if(!state.demo){
   const rawStages=[...new Set(rows.map(r=>r.Stage||r["Opportunity Stage"]||r["Opportunity Status"]||"").filter(Boolean).map(String))];
   const unknown=rawStages.filter(s=>{
     const n=normalizeStage(s);
     return !["Lead","Qualified","Proposal","Negotiation","Won","Lost"].includes(n);
   });
   if(unknown.length) v51ShowDataWarning("Some sales stages could not be confidently mapped: "+unknown.join(", ")+". Pipeline KPIs exclude these stages until they are mapped.");
 }
 return out;
}
let charts=[];function clearCharts(){charts.forEach(c=>c.destroy());charts=[]}
function drawBar(id,obj,label,formatCurrency=true){const c=document.getElementById(id);if(!c)return;const ch=new Chart(c,{type:"bar",data:{labels:Object.keys(obj),datasets:[{label,data:Object.values(obj)}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{ticks:{callback:v=>formatCurrency?fmt(v):v}}}}});charts.push(ch)}
function drawDoughnut(id,obj){const c=document.getElementById(id);if(!c)return;const ch=new Chart(c,{type:"doughnut",data:{labels:Object.keys(obj),datasets:[{data:Object.values(obj)}]},options:{responsive:true,maintainAspectRatio:false}});charts.push(ch)}
function renderDashboard(){
 clearCharts();const o=opportunities(),won=o.filter(r=>r.stage==="Won"),closed=o.filter(r=>["Won","Lost"].includes(r.stage)),open=o.filter(r=>!["Won","Lost"].includes(r.stage));
 const revenue=won.reduce((a,r)=>a+r.value,0),pipe=open.reduce((a,r)=>a+r.value,0),win=won.length/(closed.length||1)*100,avg=won.length?revenue/won.length:0; const cycleDays=o.reduce((a,r)=>{const d1=Date.parse(r["Created Date"]),d2=Date.parse(r["Expected Close"]);return a+(isNaN(d1)||isNaN(d2)?0:Math.max(1,(d2-d1)/86400000))},0)/(o.length||1); const velocity=((o.filter(r=>["Qualified","Proposal","Negotiation"].includes(r.stage)).length)*(avg||0)*(win/100))/(cycleDays||1);
 set("kRevenue",fmt(revenue));set("kPipeline",fmt(pipe));set("kWin",pct(win));set("kAvgDeal",fmt(avg));set("kVelocity",fmt(velocity)+"/day");set("kCustomers",new Set(o.map(r=>r.customer).filter(Boolean)).size.toLocaleString());
 const m=state.datasets.marketing||[], leads=m.reduce((a,r)=>a+num(r.Leads),0),mops=m.reduce((a,r)=>a+num(r.Opportunities),0),mwon=m.reduce((a,r)=>a+num(r["Won Customers"]),0),spend=m.reduce((a,r)=>a+num(r.Spend),0),attr=m.reduce((a,r)=>a+num(r["Attributed Revenue"]),0),clicks=m.reduce((a,r)=>a+num(r["Email Clicks"]),0),sends=m.reduce((a,r)=>a+num(r["Emails Sent"]),0);
 if(m.length){set("kLeadConv",pct(mwon/(leads||1)*100));set("kCPL",fmt(spend/(leads||1)));set("kCAC",fmt(spend/(mwon||1)));set("kCTR",pct(clicks/(sends||1)*100));}else{set("kLeadConv","No data");set("kCPL","No data");set("kCAC","No data");set("kCTR","No data");}
 const fin=state.datasets.financial||[],{last,prev}=latestTwoMonths(fin),mrr=fin.filter(r=>r.Month===last).reduce((a,r)=>a+num(r.MRR),0),prevMrr=fin.filter(r=>r.Month===prev).reduce((a,r)=>a+num(r.MRR),0);
 set("kMRR",fmt(mrr));set("kMRRGrowth",pct((mrr/(prevMrr||1)-1)*100)); const ic=(fin.reduce((a,r)=>a+num(r["Interaction Cost"]),0)/(fin.reduce((a,r)=>a+num(r.Interactions),0)||1));set("kInteractionCost",fmt(ic));
 const cust=state.datasets.customers||[], churned=cust.filter(r=>r.Status==="Churned").length, active=cust.filter(r=>r.Status==="Active").length;
 if(cust.length){set("kChurn",pct(churned/((active+churned)||1)*100));set("kRetention",pct(active/((active+churned)||1)*100));}else{set("kChurn","No data");set("kRetention","No data");}
 const svc=state.datasets.service||[],resp=svc.reduce((a,r)=>a+num(r["First Response Hours"]),0)/(svc.length||1),self=svc.filter(r=>String(r["Self Service"]).toLowerCase()==="yes").length/(svc.length||1)*100,csat=svc.reduce((a,r)=>a+num(r.CSAT),0)/(svc.length||1);
 if(svc.length){set("kResponse",resp.toFixed(1)+" hrs");set("kSelf",pct(self));set("kCSAT",csat.toFixed(1)+"/5");}else{set("kResponse","No data");set("kSelf","No data");set("kCSAT","No data");}
 const stages=["Lead","Qualified","Proposal","Negotiation","Won","Lost"];drawBar("stageChart",Object.fromEntries(stages.map(s=>[s,o.filter(r=>r.stage===s).reduce((a,r)=>a+r.value,0)])),"Deal Value");
 drawBar("regionChart",Object.fromEntries(["North","South","East","West"].map(s=>[s,o.filter(r=>r.region===s&&r.stage==="Won").reduce((a,r)=>a+r.value,0)])),"Won Revenue");
 const campaign=by(m,"Campaign");drawBar("campaignChart",Object.fromEntries(Object.entries(campaign).map(([k,v])=>[k,v.reduce((a,r)=>a+num(r["Attributed Revenue"]),0)])),"Attributed Revenue");
 const alerts=[];if(win<20)alerts.push("Win rate is below 20% — review qualification and loss reasons.");if(open.filter(r=>r.value>1000000).length>8)alerts.push("High-value opportunities require close-date review.");if(churned>active*.15)alerts.push("Customer churn is above 15% in the demo portfolio.");if(resp>24)alerts.push("Average first response time exceeds 24 hours.");set("insights",alerts.map(x=>`<div class="insight">⚠ ${x}</div>`).join("")||'<div class="insight">✓ No major exceptions detected in the demo data.</div>');
}
function renderCustomers(){const o=opportunities(),g=by(o,"customer"),arr=Object.entries(g).filter(([k])=>k).map(([customer,rs])=>({customer,revenue:rs.filter(r=>r.stage==="Won").reduce((a,r)=>a+r.value,0),deals:rs.length,open:rs.filter(r=>!["Won","Lost"].includes(r.stage)).length})).sort((a,b)=>b.revenue-a.revenue);set("customerCount",arr.length);set("customerTable",arr.map(r=>`<tr><td>${esc(r.customer)}</td><td>${fmt(r.revenue)}</td><td>${r.deals}</td><td>${r.open}</td></tr>`).join(""))}
function renderPipeline(){const o=opportunities(),st=["Lead","Qualified","Proposal","Negotiation","Won","Lost"];drawBar("pipelineChart",Object.fromEntries(st.map(s=>[s,o.filter(r=>r.stage===s).reduce((a,r)=>a+r.value,0)])),"Deal Value");set("pipelineTable",st.map(s=>{let r=o.filter(x=>x.stage===s);return `<tr><td>${s}</td><td>${r.length}</td><td>${fmt(r.reduce((a,x)=>a+x.value,0))}</td><td>${fmt(r.reduce((a,x)=>a+x.expected,0))}</td></tr>`}).join(""))}
function renderSales(){const o=opportunities(),g=by(o,"salesperson"),arr=Object.entries(g).filter(([k])=>k).map(([name,rs])=>{let w=rs.filter(r=>r.stage==="Won"),c=rs.filter(r=>["Won","Lost"].includes(r.stage));return{name,revenue:w.reduce((a,r)=>a+r.value,0),pipeline:rs.filter(r=>!["Won","Lost"].includes(r.stage)).reduce((a,r)=>a+r.value,0),win:w.length/(c.length||1)*100}}).sort((a,b)=>b.revenue-a.revenue);drawBar("salesChart",Object.fromEntries(arr.map(x=>[x.name,x.revenue])),"Won Revenue");set("salesTable",arr.map(x=>`<tr><td>${esc(x.name)}</td><td>${fmt(x.revenue)}</td><td>${fmt(x.pipeline)}</td><td>${pct(x.win)}</td></tr>`).join(""))}
function renderReports(){clearCharts();const m=state.datasets.marketing||[],g=by(m,"Campaign");drawBar("industryChart",Object.fromEntries(Object.entries(g).map(([k,v])=>[k,v.reduce((a,r)=>a+num(r["Attributed Revenue"]),0)])),"Attributed Revenue")}
function renderKpis(){
 const m=state.datasets.marketing||[],svc=state.datasets.service||[],fin=state.datasets.financial||[],cust=state.datasets.customers||[];
 // FIX (bug #4): these two used to print raw counts (e.g. "19,386") under labels that
 // promise a rate/ratio ("Lead Conversion Rate", "Lead-to-Opportunity Ratio"). Show the
 // actual percentage each label claims, matching the calculation already used on the dashboard.
 const totalLeads=m.reduce((a,r)=>a+num(r.Leads),0),totalOpps=m.reduce((a,r)=>a+num(r.Opportunities),0),totalWonCust=m.reduce((a,r)=>a+num(r["Won Customers"]),0);
 if(m.length){set("leadCount",pct(totalWonCust/(totalLeads||1)*100));set("oppCount",pct(totalOpps/(totalLeads||1)*100));}else{set("leadCount","No data");set("oppCount","No data");}
 if(m.length){set("cplDetail",fmt(m.reduce((a,r)=>a+num(r.Spend),0)/(m.reduce((a,r)=>a+num(r.Leads),0)||1)));set("ctrDetail",pct(m.reduce((a,r)=>a+num(r["Email Clicks"]),0)/(m.reduce((a,r)=>a+num(r["Emails Sent"]),0)||1)*100));}else{set("cplDetail","No data");set("ctrDetail","No data");}
 set("csatDetail",svc.length?(svc.reduce((a,r)=>a+num(r.CSAT),0)/svc.length).toFixed(1)+"/5":"No data");set("responseDetail",svc.length?(svc.reduce((a,r)=>a+num(r["First Response Hours"]),0)/svc.length).toFixed(1)+" hrs":"No data");
 const {last,prev}=latestTwoMonths(fin),mr=fin.filter(r=>r.Month===last).reduce((a,r)=>a+num(r.MRR),0),pm=fin.filter(r=>r.Month===prev).reduce((a,r)=>a+num(r.MRR),0);if(fin.length){set("mrrDetail",fmt(mr));set("mrrGrowth",pct((mr/(pm||1)-1)*100));}else{set("mrrDetail","No data");set("mrrGrowth","No data");}
 set("retentionDetail",cust.length?pct(cust.filter(r=>r.Status==="Active").length/cust.length*100):"No data");set("churnDetail",cust.length?pct(cust.filter(r=>r.Status==="Churned").length/cust.length*100):"No data");
}
function renderData(){set("recordCount",opportunities().length.toLocaleString());set("columns",Object.keys((state.datasets.opportunities||[])[0]||{}).map(esc).join(", "));set("dataSource",esc(state.source));}
function renderAll(){document.querySelectorAll("[data-source]").forEach(x=>x.textContent=state.demo?"DEMO DATA":state.source);const p=document.body.dataset.page;if(p==="dashboard")renderDashboard();if(p==="customers")renderCustomers();if(p==="pipeline")renderPipeline();if(p==="sales")renderSales();if(p==="reports")renderReports();if(p==="data")renderData();if(p==="kpis")renderKpis()}
function init(){document.querySelectorAll("[data-upload]").forEach(i=>i.addEventListener("change",e=>handleFile(e.target.files[0])));if(!loadSession()){state.demo=true;state.source="Demo CRM data";state.datasets=window.DEMO_DATA||{};saveSession()}renderAll()}
document.addEventListener("DOMContentLoaded",init);


/* MSME_CRM_CONTACT_GATE_V2
   Lead metadata is submitted to the configured Google Apps Script endpoint.
   Customer Excel/CSV files are never submitted by this flow; they are read locally.
*/
const CRM_CONFIG = {
  leadEndpoint: "https://script.google.com/macros/s/AKfycbzAfwHKdbHublMVUh2utH1Nf_pC0iyWYWp9PtjK17URXCtvdbzFg0YToJSzKQuQACMK/exec",
  feedbackForm: "https://docs.google.com/forms/d/e/1FAIpQLSeSqTyiWnf_q6D5WyPcJ9bAAUKj14NmdHzKYY6EwbWHOE2MMA/viewform?usp=header",
  diagnosticForm: "https://docs.google.com/forms/d/e/1FAIpQLSfXSyxVT5dIkMTJmHnwyLYMcXs_MuYERsYjjR4w2rBPEe7-1g/viewform?usp=publish-editor",
  contactEmail: "yogesh.kapadi.iimk@gmail.com"
};

function openExternalCRMForm(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

(function() {
  const CONTACT_EMAIL = CRM_CONFIG.contactEmail;

  function ensureContactGate() {
    if (document.getElementById("contactGateModal")) return;
    const style = document.createElement("style");
    style.textContent = `
      .crm-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px}
      .crm-modal{width:min(600px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#111827;border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:28px;box-shadow:0 20px 70px rgba(0,0,0,.45)}
      .crm-modal h2{margin:0 0 8px}
      .crm-modal p{color:#aab3c2;line-height:1.5}
      .crm-field{margin:14px 0}
      .crm-field label,.crm-question-label{display:block;font-size:13px;margin-bottom:6px;color:#d8dee8}
      .crm-field input[type="text"],.crm-field input[type="email"]{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:8px;border:1px solid #394455;background:#0b1220;color:#fff}
      .crm-choice{display:block;margin:9px 0;color:#d8dee8;line-height:1.35}
      .crm-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:20px;flex-wrap:wrap}
      .crm-btn{border:0;border-radius:8px;padding:10px 16px;cursor:pointer}
      .crm-btn:disabled{opacity:.65;cursor:wait}
      .crm-primary{background:#fff;color:#111}
      .crm-secondary{background:#273142;color:#fff}
      .crm-note{font-size:12px;color:#8f99a9}
      .crm-status{font-size:12px;color:#aab3c2;margin-top:10px;display:none}
    `;
    document.head.appendChild(style);

    const modal = document.createElement("div");
    modal.id = "contactGateModal";
    modal.className = "crm-modal-backdrop";
    modal.style.display = "none";
    modal.innerHTML = `
      <div class="crm-modal" role="dialog" aria-modal="true" aria-labelledby="crmGateTitle">
        <h2 id="crmGateTitle">Before you connect your data</h2>
        <p>Tell us a little about yourself. Your Excel/CSV data remains on your computer and is processed locally in your browser.</p>

        <div class="crm-field"><label for="crmLeadName">Name *</label><input id="crmLeadName" type="text" autocomplete="name"></div>
        <div class="crm-field"><label for="crmLeadCompany">Company Name *</label><input id="crmLeadCompany" type="text" autocomplete="organization"></div>
        <div class="crm-field"><label for="crmLeadEmail">Business Email <span class="crm-note">(optional)</span></label><input id="crmLeadEmail" type="email" autocomplete="email"></div>

        <div class="crm-field">
          <div class="crm-question-label">Would you like us to contact you? *</div>
          <label class="crm-choice"><input type="radio" name="crmContactPref" value="Yes, I'd like to hear from you"> Yes, I'd like to hear from you</label>
          <label class="crm-choice"><input type="radio" name="crmContactPref" value="No, I'll contact you if I need assistance"> No, I'll contact you if I need assistance</label>
        </div>

        <div class="crm-field">
          <div class="crm-question-label">What would you like to do today? *</div>
          <label class="crm-choice"><input type="radio" name="crmPurpose" value="Analyze my own business data"> Analyze my own business data</label>
          <label class="crm-choice"><input type="radio" name="crmPurpose" value="Evaluate the product for my company"> Evaluate the product for my company</label>
          <label class="crm-choice"><input type="radio" name="crmPurpose" value="Explore the product for a future decision"> Explore the product for a future decision</label>
          <label class="crm-choice"><input type="radio" name="crmPurpose" value="Other"> Other</label>
        </div>

        <p class="crm-note">If you choose No, we will respect that preference. You can always contact us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
        <div class="crm-status" id="crmGateStatus">Saving your details securely…</div>
        <div class="crm-actions">
          <button type="button" class="crm-btn crm-secondary" id="crmGateCancel">Cancel</button>
          <button type="button" class="crm-btn crm-primary" id="crmGateContinue">Continue to Connect My Data</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById("crmGateCancel").onclick = () => modal.style.display = "none";

    document.getElementById("crmGateContinue").onclick = () => {
      const name = document.getElementById("crmLeadName").value.trim();
      const company = document.getElementById("crmLeadCompany").value.trim();
      const emailValue = document.getElementById("crmLeadEmail").value.trim();
      const pref = document.querySelector('input[name="crmContactPref"]:checked')?.value;
      const purpose = document.querySelector('input[name="crmPurpose"]:checked')?.value;
      const button = document.getElementById("crmGateContinue");
      const status = document.getElementById("crmGateStatus");

      if (!name || !company || !pref || !purpose) {
        alert("Please enter your name, company name, contact preference, and purpose.");
        return;
      }
      if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        alert("Please enter a valid email address.");
        return;
      }
      if (!CRM_CONFIG.leadEndpoint) {
        alert("The lead connection endpoint is not configured.");
        return;
      }

      button.disabled = true;
      status.style.display = "block";

      sessionStorage.setItem("crm_lead", JSON.stringify({
        timestamp: new Date().toISOString(),
        name, company, email: emailValue,
        contact_preference: pref,
        purpose
      }));

      // Use a native HTML form POST to avoid browser CORS restrictions.
      // The hidden iframe keeps the user on this page while Apps Script receives the lead.
      let frame = document.getElementById("crmLeadSubmitFrame");
      if (!frame) {
        frame = document.createElement("iframe");
        frame.id = "crmLeadSubmitFrame";
        frame.name = "crmLeadSubmitFrame";
        frame.style.display = "none";
        document.body.appendChild(frame);
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = CRM_CONFIG.leadEndpoint;
      form.target = "crmLeadSubmitFrame";
      form.style.display = "none";

      const fields = {
        "Name": name,
        "Company Name": company,
        "Business Email": emailValue,
        "Would you like us to contact you regarding MSME CRM Intelligence?": pref,
        "What would you like to do today?": purpose
      };
      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
      form.remove();

      // Apps Script submission happens in the hidden frame. After a short handoff,
      // continue with the local file picker. No CRM file is included in the POST.
      setTimeout(() => {
        modal.style.display = "none";
        button.disabled = false;
        status.style.display = "none";
        const fileInput = document.querySelector('input[data-upload]');
        if (fileInput) fileInput.click();
        else alert("Your data connection control is ready, but the file selector could not be found on this page.");
      }, 900);
    };
  }

  window.openCRMContactGate = function() {
    ensureContactGate();
    const modal = document.getElementById("contactGateModal");
    modal.style.display = "flex";
    const first = document.getElementById("crmLeadName");
    if (first) setTimeout(() => first.focus(), 0);
  };

  document.addEventListener("DOMContentLoaded", () => {
    ensureContactGate();
  });
})();


(function v51StageAndDomainChecks() {
  try {
    var opp = window.opportunities || window.Opportunities || null;
    var stageKey = null;
    if (Array.isArray(opp) && opp.length) {
      var keys = Object.keys(opp[0]);
      stageKey = keys.find(function(k){ return /^(stage|opportunity stage|sales stage)$/i.test(String(k).trim()); });
      if (stageKey) {
        var unknown = v51RecordUnmappedStages(opp, stageKey, ["Lead","Qualified","Proposal","Negotiation","Won","Lost","Closed Won","Closed Lost","Prospecting","Qualification"]);
        if (unknown.length) {
          v51ShowDataWarning("Some sales stages could not be confidently mapped: " + unknown.join(", ") + ". Review the stage mapping before relying on pipeline KPIs.");
        }
      }
    }
  } catch (e) {}
})();


/* v5.1 UX rule:
   A cleared domain is not the same as a zero-valued business metric.
   Pages should prefer "No data" when a domain has no rows. The helper above
   is available to KPI/card renderers without changing valid zero results.
*/
