import { useState, useEffect } from "react";

var STEPS = ["Genre Scanner","Book Setup","Upload & Organize","Outline Builder","Front & Back Matter","Chapter Guide","Write & Upload","AI Review","Book Description","Publishing Setup","Cover Design","Export & Launch"];

var GC = { Romance:"#E91E63",Romantasy:"#9C27B0",Thriller:"#37474F",Fantasy:"#4A148C","Sci-Fi":"#0D47A1",Horror:"#1B0000",Mystery:"#3E2723","Self-Help":"#00695C","Business/Leadership":"#1565C0","Health & Wellness":"#2E7D32",Memoir:"#BF360C","Children's":"#F9A825","Historical Fiction":"#795548","Literary Fiction":"#455A64","Dark Romance":"#880E4F","Cozy Fantasy":"#7E57C2","Climate Fiction":"#1B5E20",LitRPG:"#FF6F00" };
var SP = [["#1B2A4A","#2A3D5E","#3A5278","#4A6892","#5A7EAC","#6A94C6"],["#4A148C","#6A1B9A","#8E24AA","#AB47BC","#CE93D8","#E1BEE7"],["#B71C1C","#C62828","#D32F2F","#E53935","#EF5350","#EF9A9A"],["#004D40","#00695C","#00796B","#00897B","#009688","#80CBC4"],["#E65100","#EF6C00","#F57C00","#FB8C00","#FF9800","#FFB74D"],["#1A237E","#283593","#303F9F","#3949AB","#3F51B5","#9FA8DA"],["#3E2723","#4E342E","#5D4037","#6D4C41","#795548","#A1887F"],["#263238","#37474F","#455A64","#546E7A","#607D8B","#90A4AE"]];
var FM = [{k:"dedication",l:"Dedication",r:false,t:"Short, personal. 1-3 sentences."},{k:"foreword",l:"Foreword",r:false,t:"Written by someone OTHER than you."},{k:"preface",l:"Preface",r:false,t:"YOUR intro. Why you wrote it. Under 2 pages."},{k:"introduction",l:"Introduction",r:false,t:"Frame the problem (NF) or establish world (Fiction)."},{k:"epigraph",l:"Epigraph",r:false,t:"A thematic quote. Brief, attributed."}];
var BM = [{k:"authorNote",l:"Author's Note",r:false,t:"Research, real vs fiction, personal story."},{k:"acknowledgments",l:"Acknowledgments",r:false,t:"Thank editors, beta readers, family."},{k:"aboutAuthor",l:"About the Author",r:true,t:"100-200 words. What you write, why, website + social."},{k:"alsoBy",l:"Also By",r:false,t:"ALL published works with links."},{k:"newsletterCTA",l:"Newsletter CTA",r:true,t:"MOST IMPORTANT. Bonus content for email signup."},{k:"reviewRequest",l:"Review Request",r:true,t:"Sincere ask for Amazon review."},{k:"excerpt",l:"Next Book Excerpt",r:false,t:"1-2 chapters of next book. End on cliffhanger."}];
var LAUNCH = [
  {p:"Pre-Publication",i:["Manuscript professionally edited","Cover designed — passes thumbnail test at 50×75px","ISBN(s) purchased ($295/10-pack at Bowker)","Interior formatted (Atticus $147 or Vellum $249)","Copyright page complete","Amazon Author Central set up","Author website with email capture","Email list building with lead magnet"]},
  {p:"Week -2: Setup",i:["Upload to KDP with pre-order (14 days out)","Select 3 deepest subcategories (<1K results)","Add 7 backend keywords (249 bytes/box, no title repeats)","Write description: Hook→Stakes→Promise→Comps→CTA","Set up IngramSpark ($49) for wide print","Recruit 25-50 ARC readers via BookFunnel","Submit to 10-15 promo sites"]},
  {p:"Week -1: Buzz",i:["Email warmup #1 — sneak peek","Cover reveal on social + email","Start BookTok/Reels (3-5 videos)","Pitch 15-20 podcasts","Set up Amazon Ads (PAUSED)","Prepare 5 launch emails","Seed 5-10 BookTok influencers","Goodreads giveaway"]},
  {p:"Launch Week",i:["DAY 1: Activate ads + email blast + outreach 50 people","DAY 1: ARC team posts reviews NOW","DAY 2: Engage ALL reviews/comments","DAY 3-4: Stack promo sites same day","DAY 5-6: Optimize Amazon Ads","DAY 7: Raise to $2.99 (70% royalty = $2.09/sale)"]},
  {p:"Weeks 2-4",i:["Apply for BookBub Featured Deal","Category swap optimization","Newsletter swaps 2-3/week","Retargeting ads (Facebook/IG)","Scale winning ad campaigns","Plan/announce next book","Month 1 assessment"]}
];
var BT = [{list:"Amazon #1 Subcategory",sales:"10-100/24hrs",ok:"YES",tip:"Deepest subcategory <1K results. Badge stays forever."},{list:"Amazon #1 New Release",sales:"50-500/week",ok:"YES",tip:"Pre-orders = Day 1. 3 categories = 3 chances."},{list:"Wall Street Journal",sales:"3K-5K/week",ok:"YES",tip:"Nielsen data. No editorial curation. Best major list for self-pub."},{list:"USA Today Top 150",sales:"5K-7K/week",ok:"YES",tip:"ALL sales count equally. Multi-author box sets work."},{list:"New York Times",sales:"5K-15K/week",ok:"VERY HARD",tip:"Editorial discretion. Indie bookstore sales weighted MORE than Amazon."}];

async function ai(prompt, sys, mt=4096) {
  try {
    var r = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:mt,system:sys||"Bestselling book expert. JSON only. No backticks.",messages:[{role:"user",content:prompt}]}),
    });
    var d = await r.json();
    return (d.content||[]).map(function(x){return x.type==="text"?x.text:""}).join("")||"";
  } catch(e) { return '{"error":"API failed"}'; }
}
async function saveB(id,b){try{if(window.storage){
  // Strip large binary data — audio uses separate keys, covers are session-only for large data
  var clean=Object.assign({},b);
  delete clean.audioRecordings; // legacy field, now uses audioIndex + per-chapter keys
  delete clean.coverFiles; // folder uploads — too large to persist
  // Strip series covers if total > 2MB
  if(clean.seriesCovers){var scSize=JSON.stringify(clean.seriesCovers).length;if(scSize>2000000)delete clean.seriesCovers}
  // Strip rawContent if > 3MB to stay under 5MB key limit
  if(clean.rawContent&&clean.rawContent.length>3000000){clean.rawContent=clean.rawContent.substring(0,3000000);clean._rawTruncated=true}
  await window.storage.set("bsa4-book-"+id,JSON.stringify(clean));
  var lib=await loadLib();var found=false;var meta={id:id,title:b.title||"Untitled",genre:b.genre||"",lastModified:Date.now(),words:wc(b)};for(var i=0;i<lib.length;i++){if(lib[i].id===id){lib[i]=meta;found=true;break}}if(!found)lib.push(meta);await window.storage.set("bsa4-lib",JSON.stringify(lib))}}catch(e){}}
async function loadB(id){try{if(!window.storage)return null;var r=await window.storage.get("bsa4-book-"+id);return r?JSON.parse(r.value):null}catch{return null}}
async function loadLib(){try{if(!window.storage)return[];var r=await window.storage.get("bsa4-lib");return r?JSON.parse(r.value):[]}catch{return[]}}
async function deleteBook(id){try{if(window.storage){await window.storage.delete("bsa4-book-"+id);var lib=await loadLib();lib=lib.filter(function(b){return b.id!==id});await window.storage.set("bsa4-lib",JSON.stringify(lib))}}catch{}}
function pJ(raw){try{return JSON.parse(raw.replace(/```json|```/g,"").trim())}catch{return null}}
function wc(b){return Object.values(b.chapterContent||{}).join(" ").split(/\s+/).filter(Boolean).length}

// Item 8: Health score
function healthScore(b) {
  var score = 0, max = 0, items = [];
  function add(name, done, weight){ if(weight===undefined)weight=1; max += weight; if(done) score += weight; items.push({name:name, done:done, weight:weight}); }
  add("Genre selected", !!b.genre);
  add("Title set", !!b.title);
  add("Author name", !!b.authorName);
  add("Outline generated", !!((b.outline||{}).chapters||[]).length);
  var chs = (b.outline||{}).chapters||[];
  var written = Object.keys(b.chapterContent||{}).filter(function(k){return((b.chapterContent[k])||"").trim().length>50}).length;
  add("Chapters written", written >= chs.length && chs.length > 0, 3);
  var tgt = parseInt((b.wordCount||"80000").replace(/\D/g,""))||80000;
  add("Word count target met", wc(b) >= tgt * 0.9, 2);
  add("Copyright page", !!((b.frontMatter||{}).copyright));
  add("About the Author", !!((b.backMatter||{}).aboutAuthor));
  add("Newsletter CTA", !!((b.backMatter||{}).newsletterCTA));
  add("Review request", !!((b.backMatter||{}).reviewRequest));
  add("Book description", !!((b.description||{}).fullDescription));
  add("Backend keywords", !!((b.keywords||{}).boxes||[]).length);
  add("Categories selected", !!((b.categories||{}).categories||[]).length);
  add("Pricing strategy", !!b.pricing);
  add("Cover concept", !!(b.coverColor || b.uploadedCover));
  return { score:score, max:max, pct: Math.round(score/max*100), items:items };
}

// UI components
function Spin({msg}){return <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 0"}}><div style={{width:20,height:20,border:"3px solid rgba(212,168,83,0.3)",borderTop:"3px solid #D4A853",borderRadius:"50%",animation:"spin 1s linear infinite"}}/><span style={{color:"#D4A853",fontStyle:"italic",fontSize:14}}>{msg||"AI analyzing..."}</span></div>}

// Item 13: Mobile-friendly nav with overflow scroll
function Nav({step,setStep,mx}){
  return <div style={{display:"flex",gap:3,marginBottom:20,overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:6}}>
    {STEPS.map((s,i)=><button key={s} onClick={()=>{if(i<=mx)setStep(i)}} disabled={i>mx} style={{
      flexShrink:0, minWidth:88, padding:"10px 6px", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, whiteSpace:"nowrap",
      background:i===step?"#D4A853":i<step?"rgba(212,168,83,0.2)":"rgba(255,255,255,0.06)",
      color:i===step?"#0f1b33":i<step?"#D4A853":"rgba(255,255,255,0.45)",
      border:i===step?"2px solid #D4A853":i<step?"2px solid rgba(212,168,83,0.3)":"2px solid rgba(255,255,255,0.08)",borderRadius:6,cursor:i<=mx?"pointer":"default",
    }}>{i+1}. {s}</button>)}
  </div>
}

function Cd({children,title,sub}){return <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(212,168,83,0.12)",borderRadius:10,padding:20,marginBottom:12}}>{title&&<h3 style={{color:"#D4A853",margin:"0 0 2px",fontSize:20,fontWeight:700}}>{title}</h3>}{sub&&<p style={{color:"rgba(255,255,255,0.7)",margin:"0 0 14px",fontSize:14}}>{sub}</p>}{children}</div>}
function TA({value,onChange,placeholder,rows=4}){return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:"100%",padding:10,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(212,168,83,0.18)",borderRadius:6,color:"#fff",fontSize:15,fontFamily:"'Crimson Pro',Georgia,serif",lineHeight:1.7,resize:"vertical",boxSizing:"border-box"}}/>}
function Inp({value,onChange,placeholder}){return <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:12,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(212,168,83,0.2)",borderRadius:8,color:"#fff",fontSize:15,boxSizing:"border-box"}}/>}
function B({children,onClick,v="primary",disabled,style:s}){var vs={primary:{background:"#D4A853",color:"#0f1b33"},secondary:{background:"rgba(212,168,83,0.15)",color:"#D4A853",border:"2px solid rgba(212,168,83,0.3)"},danger:{background:"rgba(229,57,53,0.15)",color:"#EF5350",border:"2px solid rgba(229,57,53,0.3)"},success:{background:"rgba(46,125,50,0.15)",color:"#66BB6A",border:"2px solid rgba(46,125,50,0.3)"}};return <button onClick={onClick} disabled={disabled} style={{padding:"12px 20px",borderRadius:8,fontWeight:700,fontSize:14,cursor:disabled?"default":"pointer",border:"none",opacity:disabled?0.4:1,textTransform:"uppercase",letterSpacing:0.8,...vs[v],...s}}>{children}</button>}
function Inf({text}){return <div style={{padding:12,background:"rgba(212,168,83,0.06)",borderRadius:8,borderLeft:"3px solid #D4A853",marginBottom:10}}><p style={{color:"rgba(255,255,255,0.7)",margin:0,fontSize:13,lineHeight:1.6}}>{text}</p></div>}

// ─── S0: GENRE SCANNER ───
function S0({book:b,setBook:sb,onNext}){
  var [ld,setLd]=useState(false);var [gs,setGs]=useState(null);var [page,setPage]=useState(1);var [custom,setCustom]=useState("");
  async function scan(pg){setLd(true);
    var exclude=gs?gs.map(function(g){return g.genre}).join(", "):"";
    var prompt=pg>1
      ?"JSON array of 12 MORE bestselling book genres 2026 — do NOT repeat any of these: "+exclude+". Find different, niche, or underserved genres. Each: \"genre\",\"demand\"(HIGH/VERY HIGH/GROWING),\"competition\"(LOW/MODERATE/HIGH),\"opportunity\"(1-5),\"avgWordCount\",\"readerProfile\",\"trendNote\",\"topTropes\":[]. ONLY array."
      :"JSON array of 12 bestselling book genres 2026. Each: \"genre\",\"demand\"(HIGH/VERY HIGH/GROWING),\"competition\"(LOW/MODERATE/HIGH),\"opportunity\"(1-5),\"avgWordCount\",\"readerProfile\",\"trendNote\",\"topTropes\":[]. ONLY array.";
    var r=await ai(prompt,"Book analyst. ONLY JSON array.");
    var p=pJ(r);
    if(p&&Array.isArray(p)){
      if(pg>1&&gs){setGs(gs.concat(p))}else{setGs(p)}
      setPage(pg);
    }else if(!gs){
      setGs([
        {genre:"Cozy Fantasy",demand:"VERY HIGH",competition:"LOW",opportunity:5,avgWordCount:"70K-90K",readerProfile:"Women 18-45",trendNote:"BookTok's biggest genre",topTropes:["Found family","Wholesome magic","Small-town"]},
        {genre:"Dark Romance",demand:"VERY HIGH",competition:"MODERATE",opportunity:4,avgWordCount:"75K-95K",readerProfile:"Women 18-35",trendNote:"Spicy dominates BookTok",topTropes:["Morally gray hero","Enemies to lovers","Forced proximity"]},
        {genre:"Self-Help / AI",demand:"VERY HIGH",competition:"LOW",opportunity:5,avgWordCount:"40K-60K",readerProfile:"Professionals 25-50",trendNote:"AI disruption demand",topTropes:["Frameworks","Case studies","Systems"]},
        {genre:"Thriller",demand:"HIGH",competition:"MODERATE",opportunity:4,avgWordCount:"70K-90K",readerProfile:"Adults 25-65",trendNote:"Streaming adaptations",topTropes:["Unreliable narrator","Race against time","Twists"]},
        {genre:"Romantasy",demand:"VERY HIGH",competition:"GROWING",opportunity:4,avgWordCount:"85K-120K",readerProfile:"Women 16-35",trendNote:"Romance+Fantasy hybrid",topTropes:["Enemies to lovers","Fated mates","Magic"]},
        {genre:"Climate Fiction",demand:"GROWING",competition:"VERY LOW",opportunity:5,avgWordCount:"80K-100K",readerProfile:"Eco-conscious 20-50",trendNote:"Hopepunk",topTropes:["Near-future","Solutions","Community"]},
        {genre:"Horror",demand:"HIGH",competition:"LOW-MOD",opportunity:4,avgWordCount:"70K-90K",readerProfile:"Adults 18-50",trendNote:"Gothic/folk horror breakout",topTropes:["Atmospheric dread","Folk mythology","Unreliable reality"]},
        {genre:"Memoir",demand:"HIGH",competition:"MODERATE",opportunity:3,avgWordCount:"70K-90K",readerProfile:"Adults 25-65",trendNote:"Ordinary extraordinary stories",topTropes:["Survival","Raw authenticity","Transformation"]},
        {genre:"LitRPG",demand:"HIGH",competition:"MODERATE",opportunity:4,avgWordCount:"80K-110K",readerProfile:"Men 18-40 gamers",trendNote:"Dungeon Crawler Carl hit NYT",topTropes:["Progression","Game mechanics","Level-ups"]},
        {genre:"Business",demand:"HIGH",competition:"MODERATE",opportunity:3,avgWordCount:"40K-60K",readerProfile:"Professionals 30-55",trendNote:"Concise frameworks",topTropes:["Case studies","Contrarian insight","Frameworks"]},
        {genre:"Children's EQ",demand:"GROWING",competition:"LOW",opportunity:5,avgWordCount:"500-2K",readerProfile:"Parents+teachers",trendNote:"$2.1B sector",topTropes:["One emotion/book","Inclusive illustration","Gentle lesson"]},
        {genre:"Sci-Fi (Male)",demand:"HIGH",competition:"LOW",opportunity:5,avgWordCount:"80K-110K",readerProfile:"Men 20-55",trendNote:"70% male buyers, underserved",topTropes:["Hard sci-fi","Military","Space opera"]},
      ]);
    }
    setLd(false);
  }
  function selectCustom(){
    if(custom.trim()){sb(function(x){return{...x,genre:custom.trim(),genreData:{genre:custom.trim(),demand:"—",competition:"—",opportunity:3,avgWordCount:"—",readerProfile:"—",trendNote:"Custom genre"}}});}
  }
  return <Cd title="Genre & Market Scanner" sub="AI scans bestseller data for your best opportunity">
    {!gs&&!ld&&<div style={{textAlign:"center",padding:24}}><div style={{fontSize:44,marginBottom:8}}>📊</div><p style={{color:"rgba(255,255,255,0.7)",marginBottom:14}}>Scan trending genres, competition, and opportunity scores.</p><B onClick={function(){scan(1)}}>Scan Markets</B></div>}
    {ld&&<Spin msg={page>1?"Finding more genres...":"Scanning markets..."}/>}
    {gs&&<><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:7,marginBottom:14}}>
      {gs.map(function(g,i){return <div key={i} onClick={function(){sb(function(x){return{...x,genre:g.genre,genreData:g}})}} style={{padding:11,borderRadius:7,cursor:"pointer",background:b.genre===g.genre?"rgba(212,168,83,0.15)":"rgba(255,255,255,0.02)",border:b.genre===g.genre?"2px solid #D4A853":"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
          <span style={{fontWeight:700,color:b.genre===g.genre?"#D4A853":"#fff",fontSize:15}}>{g.genre}</span>
          <span style={{fontSize:13,color:"#D4A853"}}>{"★".repeat(g.opportunity||3)}</span>
        </div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:3}}>
          <span style={{fontSize:11,padding:"3px 8px",borderRadius:4,background:g.demand==="VERY HIGH"?"rgba(229,57,53,0.12)":"rgba(212,168,83,0.08)",color:g.demand==="VERY HIGH"?"#EF5350":"#D4A853"}}>{g.demand}</span>
          <span style={{fontSize:11,padding:"3px 8px",borderRadius:4,background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)"}}>{g.competition}</span>
          <span style={{fontSize:11,padding:"3px 8px",borderRadius:4,background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)"}}>{g.avgWordCount}</span>
        </div>
        <p style={{fontSize:12,color:"rgba(255,255,255,0.7)",margin:0}}>{g.trendNote}</p>
      </div>})}
    </div>
    {/* Controls: Refresh, Show More, Custom */}
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:14}}>
      <B v="secondary" onClick={function(){setGs(null);setPage(1);scan(1)}}>Refresh All</B>
      <B v="secondary" onClick={function(){scan(page+1)}}>Show 12 More Genres</B>
      <span style={{color:"rgba(255,255,255,0.6)",fontSize:11}}>{gs.length} genres shown</span>
    </div>
    {/* Custom genre input */}
    <div style={{padding:12,background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid rgba(255,255,255,0.05)",marginBottom:14}}>
      <div style={{color:"rgba(255,255,255,0.7)",fontSize:12,marginBottom:6}}>Don't see your genre? Type it in:</div>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Inp value={custom} onChange={setCustom} placeholder="e.g. Afrofuturism, Military Thriller, Cozy Mystery..."/></div>
        <B v="secondary" onClick={selectCustom} disabled={!custom.trim()}>Use This Genre</B>
      </div>
    </div>
    {b.genre&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{color:"rgba(255,255,255,0.6)",fontSize:14}}>Selected: <strong style={{color:"#D4A853"}}>{b.genre}</strong></span>
      <B onClick={onNext}>Continue →</B>
    </div>}</>}
  </Cd>;
}

// ─── S1: BOOK SETUP ───
function S1({book:b,setBook:sb,onNext}){
  var u=(k,v)=>sb(x=>({...x,[k]:v}));var gd=b.genreData||{};
  return <Cd title="Book Setup" sub={`Configuring your ${b.genre||""} bestseller`}>
    <div style={{display:"grid",gap:10}}>
      {[["Working Title","title",""],["Subtitle","subtitle",""],["Author Name","authorName",""],["Target Word Count","wordCount",gd.avgWordCount||""]].map(([l,k,ph])=>
        <div key={k}><label style={{color:"rgba(255,255,255,0.7)",fontSize:12,display:"block",marginBottom:4}}>{l}</label><Inp value={b[k]||""} onChange={v=>u(k,v)} placeholder={ph||l}/></div>
      )}
      {[["Target Reader","targetReader",gd.readerProfile||"",2],["Impact","impact","What transformation should readers experience?",2],["Unique Angle","uniqueAngle","Your perspective or twist",2]].map(([l,k,ph,r])=>
        <div key={k}><label style={{color:"rgba(255,255,255,0.7)",fontSize:12,display:"block",marginBottom:4}}>{l}</label><TA value={b[k]||""} onChange={v=>u(k,v)} placeholder={ph} rows={r}/></div>
      )}
      <div><label style={{color:"rgba(255,255,255,0.7)",fontSize:12,marginBottom:2,display:"block"}}>Book Type</label>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {["Standalone","Series (Book 1)","Series (Continuation)"].map(t=>
            <button key={t} onClick={()=>u("bookType",t)} style={{padding:"8px 14px",borderRadius:6,fontSize:13,cursor:"pointer",background:b.bookType===t?"rgba(212,168,83,0.15)":"rgba(255,255,255,0.03)",border:b.bookType===t?"2px solid #D4A853":"1px solid rgba(255,255,255,0.05)",color:b.bookType===t?"#D4A853":"rgba(255,255,255,0.4)"}}>{t}</button>
          )}
        </div>
      </div>
      {/* Item 10: Series Bible link */}
      {(b.bookType||"").includes("Series")&&<div>
        <label style={{color:"rgba(255,255,255,0.7)",fontSize:12,display:"block",marginBottom:2}}>Series Bible (characters, locations, rules, timeline)</label>
        <TA value={b.seriesBible||""} onChange={v=>u("seriesBible",v)} placeholder="Track continuity across books: character names/descriptions, locations, magic rules, timeline, key relationships, unresolved plot threads..." rows={4}/>
        <Inf text="This series bible is passed to AI during chapter generation to maintain continuity across your entire series."/>
      </div>}
    </div>
    <div style={{marginTop:14,display:"flex",justifyContent:"flex-end"}}><B onClick={onNext} disabled={!b.title}>Continue →</B></div>
  </Cd>;
}

// ─── S2: UPLOAD & ORGANIZE (3-path: blob, outline, written) ───
function S2({book:b,setBook:sb,onNext}){
  var ld_s=useState(false);var ld=ld_s[0];var setLd=ld_s[1];
  var voiceLd_s=useState(false);var voiceLd=voiceLd_s[0];var setVoiceLd=voiceLd_s[1];
  var dragging_s=useState(false);var dragging=dragging_s[0];var setDragging=dragging_s[1];
  var parsing_s=useState(null);var parsing=parsing_s[0];var setParsing=parsing_s[1];
  var msType_s=useState(b.manuscriptType||null);var msType=msType_s[0];var setMsType=msType_s[1];
  var phase_s=useState(b.rawContent?"type":"upload");var phase=phase_s[0];var setPhase=phase_s[1];
  var blobResult_s=useState(null);var blobResult=blobResult_s[0];var setBlobResult=blobResult_s[1];
  var tones_s=useState(b.chapterTones||{});var tones=tones_s[0];var setTones=tones_s[1];
  var writingCh_s=useState(null);var writingCh=writingCh_s[0];var setWritingCh=writingCh_s[1];

  // File parsing
  function appendContent(name,text){sb(function(x){return Object.assign({},x,{rawContent:(x.rawContent||"")+"\n\n--- "+name+" ---\n\n"+text})})}
  async function loadPdfJs(){if(window.pdfjsLib)return window.pdfjsLib;return new Promise(function(resolve,reject){var s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";s.onload=function(){window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";resolve(window.pdfjsLib)};s.onerror=reject;document.head.appendChild(s)})}
  async function parsePdf(file){setParsing(file.name);try{var pdfjs=await loadPdfJs();var buf=await file.arrayBuffer();var pdf=await pdfjs.getDocument({data:buf}).promise;var t=[];for(var i=1;i<=pdf.numPages;i++){var pg=await pdf.getPage(i);var c=await pg.getTextContent();t.push(c.items.map(function(it){return it.str}).join(" "))}appendContent(file.name,t.join("\n\n"))}catch(e){appendContent(file.name,"[PDF error: "+e.message+"]")}setParsing(null)}
  async function parseDocx(file){setParsing(file.name);try{var mammoth=await import("mammoth");var buf=await file.arrayBuffer();var r=await mammoth.extractRawText({arrayBuffer:buf});appendContent(file.name,r.value)}catch(e){appendContent(file.name,"[DOCX error: "+e.message+"]")}setParsing(null)}
  function readFiles(files){Array.from(files).forEach(function(f){var ext=f.name.split(".").pop().toLowerCase();if(ext==="pdf")parsePdf(f);else if(ext==="docx"||ext==="doc")parseDocx(f);else{var r=new FileReader();r.onload=function(ev){appendContent(f.name,ev.target.result)};r.readAsText(f)}})}
  function handleFiles(e){readFiles(e.target.files);setPhase("type")}
  function handleDrop(e){e.preventDefault();e.stopPropagation();setDragging(false);if(e.dataTransfer.files&&e.dataTransfer.files.length>0){readFiles(e.dataTransfer.files);e.dataTransfer.clearData();setPhase("type")}}

  // Voice analysis
  async function analyzeVoice(){setVoiceLd(true);var raw=await ai("Analyze the writing voice/style:\n\n"+(b.rawContent||"").substring(0,20000)+"\n\nReturn JSON: {\"voiceProfile\":\"detailed voice description\",\"styleInstructions\":\"instructions for AI to match this voice\",\"samplePatterns\":[\"3-4 signature patterns\"]}","Voice analyst. ONLY JSON.");var p=pJ(raw);if(p)sb(function(x){return Object.assign({},x,{voiceProfile:p})});setVoiceLd(false)}

  // Local chapter splitter for "written with chapters" mode
  function splitByChapters(){
    var raw=b.rawContent||"";
    var numWords={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,twentyone:21,twentytwo:22,twentythree:23,twentyfour:24,twentyfive:25};
    // Try multiple patterns in order of specificity
    var patterns=[
      // "Chapter 1:", "Ch. 3:", "CHAPTER 15" (with digits)
      /(?:^|\n)\s*(?:chapter|ch\.?)\s*(\d+)\s*[:\.\-–—]?\s*([^\n]*)/gi,
      // "Part 1:", "Section 2:", "Lesson 3:", "Act 1:" (with digits)
      /(?:^|\n)\s*(?:part|section|lesson|act)\s*(\d+)\s*[:\.\-–—]?\s*([^\n]*)/gi,
      // "Chapter One:", "CHAPTER TWENTY" (spelled out)
      /(?:^|\n)\s*(?:chapter|ch\.?)\s*(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty(?:\s*-?\s*(?:one|two|three|four|five))?)\s*[:\.\-–—]?\s*([^\n]*)/gi,
    ];
    var matches=[];
    for(var pi=0;pi<patterns.length;pi++){
      matches=[];var m;var p=patterns[pi];p.lastIndex=0;
      while((m=p.exec(raw))!==null){
        var num=parseInt(m[1]);
        if(isNaN(num)){num=numWords[(m[1]||"").toLowerCase().replace(/[\s-]/g,"")]||matches.length+1}
        matches.push({index:m.index,number:num,title:(m[2]||"").trim(),fullMatch:m[0]});
      }
      if(matches.length>=2)break;
    }
    // Last resort: standalone number at line start "1.", "2.", "3."
    if(matches.length<2){
      matches=[];var np=/(?:^|\n)\s*(\d{1,2})\.\s+([^\n]{3,})/g;np.lastIndex=0;
      while((m=np.exec(raw))!==null){
        var n2=parseInt(m[1]);
        if(n2>0&&n2<=50)matches.push({index:m.index,number:n2,title:m[2].trim(),fullMatch:m[0]});
      }
    }
    if(matches.length<2)return null;
    // Sort by position in text
    matches.sort(function(a,b2){return a.index-b2.index});
    var chapters=[];
    for(var i=0;i<matches.length;i++){
      var start=matches[i].index+matches[i].fullMatch.length;
      var end=i<matches.length-1?matches[i+1].index:raw.length;
      chapters.push({number:matches[i].number,title:matches[i].title,content:raw.substring(start,end).trim()});
    }
    return chapters;
  }
  function applySplit(){
    var chapters=splitByChapters();if(!chapters)return;
    var outline={chapters:chapters.map(function(c){return{number:c.number,title:c.title,purpose:"",keyPoints:[],wordCountTarget:Math.round(c.content.split(/\s+/).length/1000)+"K",endHook:""}}),structureNotes:"Auto-detected from manuscript"};
    var content={};chapters.forEach(function(c,i){content[i]=c.content});
    sb(function(x){return Object.assign({},x,{outline:outline,chapterContent:content,manuscriptType:"written"})});
  }

  // Blob organizer
  var progress_s=useState("");var progress=progress_s[0];var setProgress=progress_s[1];

  async function organizeBlob(){setLd(true);setBlobResult(null);setProgress("");
    var fullRaw=b.rawContent||"";
    var totalWords=fullRaw.split(/\s+/).filter(Boolean).length;
    var chunkSize=70000; // ~12K words per chunk
    var chunks=[];
    for(var ci=0;ci<fullRaw.length;ci+=chunkSize){chunks.push(fullRaw.substring(ci,ci+chunkSize))}

    if(chunks.length<=1){
      // Small manuscript — single pass
      setProgress("Analyzing manuscript ("+totalWords.toLocaleString()+" words)...");
      var raw=await ai("You are a bestselling book editor. This is unorganized content for a "+b.genre+" book called \""+b.title+"\". The author wants: "+(b.impact||"not specified")+".\n\nAnalyze:\n1. Identify logical flow\n2. Find breaks/gaps\n3. Recommend chapter breaks\n4. Assess strategy\n\nReturn JSON: {\"chapters\":[{\"n\":1,\"title\":\"title\",\"summary\":\"covers what\",\"startPhrase\":\"first 8 words of this section\",\"issues\":\"problems\"}],\"gaps\":[\"gaps\"],\"strategyNotes\":\"assessment\",\"flowFixes\":[\"fixes\"]}\n\nCONTENT:\n"+fullRaw.substring(0,80000),"Editor. ONLY JSON.",4096);
      var p=pJ(raw);
      if(!p){try{var c=raw.replace(/```json|```/g,"").trim();for(var i=c.length;i>50;i=c.lastIndexOf("}",i-1)){var a=c.substring(0,i+1);var ob=0,cb=0,os=0,cs=0;for(var x of a){if(x==="{")ob++;if(x==="}")cb++;if(x==="[")os++;if(x==="]")cs++}while(cb<ob){a+="}";cb++}while(cs<os){a+="]";cs++}try{p=JSON.parse(a);break}catch(e3){}}}catch(e2){}}
      if(p)finishBlob(p);
    } else {
      // Large manuscript — chunked analysis
      setProgress("Large manuscript detected ("+totalWords.toLocaleString()+" words, "+chunks.length+" sections). Analyzing section 1 of "+chunks.length+"...");
      var chunkSummaries=[];
      for(var ci2=0;ci2<chunks.length;ci2++){
        setProgress("Reading section "+(ci2+1)+" of "+chunks.length+" ("+Math.round((ci2+1)/chunks.length*100)+"%)...");
        var chunkRaw=await ai("You are analyzing section "+(ci2+1)+" of "+chunks.length+" of a "+b.genre+" book manuscript.\n\nSummarize this section:\n- What topics/events/arguments appear?\n- What are the natural break points?\n- Note the first 8 words of each major section shift\n\nReturn JSON: {\"sections\":[{\"topic\":\"what this section covers\",\"startPhrase\":\"first 8 words\",\"endPhrase\":\"last 8 words\"}],\"notes\":\"key observations\"}\n\nTEXT:\n"+chunks[ci2],"Book analyst. ONLY JSON.",2048);
        var chunkParsed=pJ(chunkRaw);
        chunkSummaries.push({chunk:ci2+1,result:chunkParsed,rawPreview:chunks[ci2].substring(0,200)});
      }
      // Final synthesis pass
      setProgress("Synthesizing "+chunks.length+" sections into chapter structure...");
      var summaryText=chunkSummaries.map(function(cs2){return"Section "+cs2.chunk+": "+(cs2.result?JSON.stringify(cs2.result.sections||[]):cs2.rawPreview)}).join("\n");
      var synthRaw=await ai("You analyzed a "+totalWords.toLocaleString()+"-word "+b.genre+" manuscript in "+chunks.length+" sections. Here are your section summaries:\n\n"+summaryText.substring(0,6000)+"\n\nNow create the FINAL chapter structure:\n1. Recommend 12-25 chapter breaks with titles\n2. For each chapter, include the startPhrase (first 8 words from the text)\n3. Identify gaps and flow issues\n4. Assess strategy vs author's goal: "+(b.impact||"not specified")+"\n\nReturn JSON: {\"chapters\":[{\"n\":1,\"title\":\"title\",\"summary\":\"covers what\",\"startPhrase\":\"first 8 words\",\"issues\":\"problems\"}],\"gaps\":[\"gaps\"],\"strategyNotes\":\"assessment\",\"flowFixes\":[\"fixes\"]}","Senior book editor. ONLY JSON.",4096);
      var synthParsed=pJ(synthRaw);
      if(!synthParsed){try{var c2=synthRaw.replace(/```json|```/g,"").trim();for(var i2=c2.length;i2>50;i2=c2.lastIndexOf("}",i2-1)){var a2=c2.substring(0,i2+1);var ob2=0,cb2=0,os2=0,cs2b=0;for(var x2 of a2){if(x2==="{")ob2++;if(x2==="}")cb2++;if(x2==="[")os2++;if(x2==="]")cs2b++}while(cb2<ob2){a2+="}";cb2++}while(cs2b<os2){a2+="]";cs2b++}try{synthParsed=JSON.parse(a2);break}catch(e4){}}}catch(e3){}}
      if(synthParsed)finishBlob(synthParsed);
    }
    setProgress("");setLd(false);
  }

  function finishBlob(p){
    setBlobResult(p);
    var raw2=b.rawContent||"";var chs=p.chapters||[];
    var outline={chapters:[],structureNotes:p.strategyNotes||""};var content={};
    chs.forEach(function(ch,i){
      outline.chapters.push({number:ch.n||i+1,title:ch.title,purpose:ch.summary||"",keyPoints:[],wordCountTarget:"",endHook:""});
      if(ch.startPhrase&&ch.startPhrase.length>5){
        var idx=raw2.toLowerCase().indexOf(ch.startPhrase.toLowerCase().substring(0,30));
        if(idx>=0){var nextStart=raw2.length;if(i<chs.length-1&&chs[i+1].startPhrase){var ns=raw2.toLowerCase().indexOf(chs[i+1].startPhrase.toLowerCase().substring(0,30),idx+10);if(ns>idx)nextStart=ns}content[i]=raw2.substring(idx,nextStart).trim()}
      }
    });
    sb(function(x){return Object.assign({},x,{outline:outline,chapterContent:Object.assign({},(x.chapterContent||{}),content),organizedContent:p,manuscriptType:"blob"})});
  }

  // Outline mode: write a chapter
  var TONES=["Conversational","Entertaining","Instructional","Warning","Scary","Exciting","Persuasive","Dissuading","Tear-jerker","Inspirational","Author's Voice","Humorous"];
  async function writeChapter(idx){
    setWritingCh(idx);setLd(true);
    var chs=b.outline&&b.outline.chapters?b.outline.chapters:[];var ch=chs[idx];if(!ch){setLd(false);return}
    var chTones=(tones[idx]||[]).join(", ")||"conversational and engaging";
    var voiceInst=b.voiceProfile?"\nMatch this voice: "+b.voiceProfile.styleInstructions:"";
    var prevCtx="";for(var i=Math.max(0,idx-2);i<idx;i++){var pc=(b.chapterContent||{})[i]||"";if(pc.trim().length>50)prevCtx+="\nPrev ch "+chs[i].number+": "+pc.substring(0,600)+"...\n"}
    var raw=await ai("Write Chapter "+ch.number+" (\""+ch.title+"\") for "+b.genre+" book \""+b.title+"\".\n\nPurpose: "+(ch.purpose||"Not specified")+"\nKey points: "+(ch.keyPoints||[]).join(", ")+"\nTone: "+chTones+"\nAuthor's goal: "+(b.impact||"Not specified")+"\nReader: "+(b.targetReader||"General")+prevCtx+voiceInst+"\n\nWrite in GREAT DETAIL with rich storytelling. Vivid, specific, engaging. Match the tone(s) throughout. Aim for 3000-5000 words. Do not cut short.\n\nReturn JSON: {\"chapterText\":\"the complete chapter\"}","#1 NYT bestselling author. Rich detailed storytelling. ONLY JSON.",8192);
    var p=pJ(raw);if(p&&p.chapterText){sb(function(x){var cc=Object.assign({},(x.chapterContent||{}));cc[idx]=p.chapterText;return Object.assign({},x,{chapterContent:cc})})}
    setLd(false);setWritingCh(null);
  }

  var hasContent=(b.rawContent||"").trim().length>50;
  var wordCount=hasContent?(b.rawContent||"").split(/\s+/).filter(Boolean).length:0;
  var detectedChapters=hasContent?splitByChapters():null;

  return <Cd title="Upload & Organize" sub="Upload your manuscript — the agent adapts to what you have">

    {/* ── PHASE 1: Upload ── */}
    {phase==="upload"&&<div>
      <div onDrop={handleDrop} onDragOver={function(e){e.preventDefault();setDragging(true)}} onDragLeave={function(e){e.preventDefault();setDragging(false)}}
        style={{border:dragging?"3px dashed #D4A853":"3px dashed rgba(255,255,255,0.15)",borderRadius:12,padding:28,marginBottom:14,textAlign:"center",background:dragging?"rgba(212,168,83,0.08)":"rgba(255,255,255,0.01)",cursor:"pointer",position:"relative"}}>
        <div style={{fontSize:44,marginBottom:8}}>{dragging?"📂":"📄"}</div>
        <div style={{color:dragging?"#D4A853":"rgba(255,255,255,0.7)",fontSize:16,fontWeight:600,marginBottom:6}}>{dragging?"Drop files here":"Drag & drop your manuscript"}</div>
        <div style={{color:"rgba(255,255,255,0.6)",fontSize:13}}>.pdf, .docx, .txt, .md — or click to browse</div>
        <input type="file" accept=".txt,.md,.rtf,.pdf,.docx,.doc" multiple onChange={handleFiles} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0,cursor:"pointer"}}/>
      </div>
      {parsing&&<Spin msg={"Parsing "+parsing+"..."}/>}
      {hasContent&&wordCount>50000?<div style={{padding:14,background:"rgba(102,187,106,0.06)",borderRadius:8,border:"1px solid rgba(102,187,106,0.15)",marginBottom:10}}>
        <div style={{color:"#66BB6A",fontSize:14,fontWeight:600,marginBottom:4}}>✓ {wordCount.toLocaleString()} words uploaded</div>
        <p style={{color:"rgba(255,255,255,0.65)",margin:0,fontSize:12}}>Large manuscript loaded. Text is stored — you don't need to see it all here. Click Next to choose how to process it.</p>
      </div>
      :<TA value={b.rawContent||""} onChange={function(v){sb(function(x){return Object.assign({},x,{rawContent:v})})}} placeholder="Or paste everything here..." rows={5}/>}
      {hasContent&&<div style={{marginTop:8,display:"flex",justifyContent:"flex-end"}}><B onClick={function(){setPhase("type")}}>Next →</B></div>}
    </div>}

    {/* ── PHASE 2: What type? ── */}
    {phase==="type"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{color:"rgba(255,255,255,0.7)",fontSize:13}}>~{wordCount.toLocaleString()} words uploaded</span>
        {hasContent&&!voiceLd&&<B v="secondary" onClick={analyzeVoice} style={{fontSize:12}}>{b.voiceProfile?"✓ Voice Captured":"Analyze My Voice"}</B>}
      </div>
      {voiceLd&&<Spin msg="Learning your voice..."/>}
      {b.voiceProfile&&<div style={{marginBottom:10,padding:10,background:"rgba(102,187,106,0.06)",borderRadius:8,border:"1px solid rgba(102,187,106,0.15)"}}>
        <span style={{color:"#66BB6A",fontSize:12,fontWeight:600}}>✓ Voice profile captured</span>
      </div>}
      <div style={{color:"#D4A853",fontSize:18,fontWeight:700,marginBottom:14}}>How is your manuscript organized?</div>
      <div style={{display:"grid",gap:10}}>
        <div onClick={function(){setMsType("blob")}} style={{padding:18,borderRadius:10,cursor:"pointer",background:msType==="blob"?"rgba(212,168,83,0.1)":"rgba(255,255,255,0.02)",border:msType==="blob"?"2px solid #D4A853":"2px solid rgba(255,255,255,0.06)"}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{fontSize:32}}>📝</div><div>
            <div style={{color:msType==="blob"?"#D4A853":"#fff",fontSize:15,fontWeight:700}}>Unorganized Content</div>
            <div style={{color:"rgba(255,255,255,0.65)",fontSize:13,marginTop:2}}>Notes, drafts, ideas — all mixed together. AI organizes the flow, finds gaps, recommends chapter breaks, and checks the strategy.</div>
          </div></div>
        </div>
        <div onClick={function(){setMsType("outline")}} style={{padding:18,borderRadius:10,cursor:"pointer",background:msType==="outline"?"rgba(212,168,83,0.1)":"rgba(255,255,255,0.02)",border:msType==="outline"?"2px solid #D4A853":"2px solid rgba(255,255,255,0.06)"}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{fontSize:32}}>📋</div><div>
            <div style={{color:msType==="outline"?"#D4A853":"#fff",fontSize:15,fontWeight:700}}>Outline / Chapter List</div>
            <div style={{color:"rgba(255,255,255,0.65)",fontSize:13,marginTop:2}}>Chapter headings with brief notes but not written yet. AI asks what tone each chapter needs, then writes each one in rich detail.</div>
          </div></div>
        </div>
        <div onClick={function(){setMsType("written")}} style={{padding:18,borderRadius:10,cursor:"pointer",background:msType==="written"?"rgba(212,168,83,0.1)":"rgba(255,255,255,0.02)",border:msType==="written"?"2px solid #D4A853":"2px solid rgba(255,255,255,0.06)"}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{fontSize:32}}>📖</div><div>
            <div style={{color:msType==="written"?"#D4A853":"#fff",fontSize:15,fontWeight:700}}>Written with Chapter Headings</div>
            <div style={{color:"rgba(255,255,255,0.65)",fontSize:13,marginTop:2}}>Mostly written with chapter/section headings, maybe a few holes. Keeps it as-is, splits into chapters, editing tools ready if needed.</div>
            {detectedChapters&&<div style={{color:"#66BB6A",fontSize:12,marginTop:4}}>✓ Detected {detectedChapters.length} chapters</div>}
          </div></div>
        </div>
      </div>
      {msType&&<div style={{marginTop:14,display:"flex",gap:8}}>
        <B v="secondary" onClick={function(){setPhase("upload")}}>← Back</B>
        <div style={{flex:1}}/>
        <B onClick={function(){setPhase("process")}}>Process →</B>
      </div>}
    </div>}

    {/* ── PHASE 3: Process ── */}
    {phase==="process"&&<div>
      <B v="secondary" onClick={function(){setPhase("type")}} style={{marginBottom:12}}>← Change Format</B>

      {/* BLOB */}
      {msType==="blob"&&<div>
        <div style={{color:"#D4A853",fontSize:16,fontWeight:700,marginBottom:8}}>📝 Organizing Your Content</div>
        <Inf text="AI reads your entire manuscript, organizes the flow, finds gaps, recommends chapter breaks, and checks that the content achieves your goals."/>
        {!blobResult&&!ld&&<B onClick={organizeBlob}>Organize My Manuscript</B>}
        {ld&&<Spin msg={progress||"Analyzing..."}/>}
        {blobResult&&<div>
          {blobResult.strategyNotes&&<div style={{padding:12,background:"rgba(212,168,83,0.06)",borderRadius:8,marginBottom:10}}>
            <div style={{color:"#D4A853",fontSize:14,fontWeight:600,marginBottom:4}}>Strategy Assessment</div>
            <p style={{color:"rgba(255,255,255,0.75)",margin:0,fontSize:13,lineHeight:1.5}}>{blobResult.strategyNotes}</p>
          </div>}
          {blobResult.flowFixes&&blobResult.flowFixes.length>0&&<div style={{padding:12,background:"rgba(229,57,53,0.05)",borderRadius:8,marginBottom:10}}>
            <div style={{color:"#EF5350",fontSize:14,fontWeight:600,marginBottom:4}}>Flow Issues</div>
            {blobResult.flowFixes.map(function(fix,i){return <p key={i} style={{color:"rgba(255,255,255,0.7)",margin:"4px 0",fontSize:13,paddingLeft:10,borderLeft:"2px solid rgba(229,57,53,0.2)"}}>• {fix}</p>})}
          </div>}
          {blobResult.gaps&&blobResult.gaps.length>0&&<div style={{padding:12,background:"rgba(212,168,83,0.04)",borderRadius:8,marginBottom:10}}>
            <div style={{color:"#D4A853",fontSize:14,fontWeight:600,marginBottom:4}}>Content Gaps</div>
            {blobResult.gaps.map(function(gap,i){return <p key={i} style={{color:"rgba(255,255,255,0.7)",margin:"4px 0",fontSize:13,paddingLeft:10,borderLeft:"2px solid rgba(212,168,83,0.15)"}}>• {gap}</p>})}
          </div>}
          <div style={{color:"#D4A853",fontSize:14,fontWeight:600,marginBottom:6}}>Recommended Chapters</div>
          {(blobResult.chapters||[]).map(function(ch,i){return <div key={i} style={{padding:10,background:"rgba(255,255,255,0.02)",borderRadius:6,marginBottom:4,borderLeft:"3px solid rgba(212,168,83,0.3)"}}>
            <div style={{color:"#fff",fontSize:14,fontWeight:600}}>Ch. {ch.n||i+1}: {ch.title}</div>
            <p style={{color:"rgba(255,255,255,0.7)",margin:"3px 0",fontSize:12}}>{ch.summary}</p>
            {ch.issues&&<p style={{color:"#EF5350",margin:"2px 0 0",fontSize:12}}>⚠️ {ch.issues}</p>}
          </div>})}
          <div style={{marginTop:12,display:"flex",gap:8}}>
            <B v="secondary" onClick={function(){setBlobResult(null);organizeBlob()}}>Re-Organize</B>
            <B onClick={onNext}>Accept & Continue →</B>
          </div>
        </div>}
      </div>}

      {/* OUTLINE */}
      {msType==="outline"&&<div>
        <div style={{color:"#D4A853",fontSize:16,fontWeight:700,marginBottom:8}}>📋 Build From Your Outline</div>
        <Inf text="Set the tone for each chapter — what should the reader feel? Select multiple tones. Then AI writes each chapter in rich detail matching your chosen style."/>
        {b.outline&&b.outline.chapters?<div>
          {b.outline.chapters.map(function(ch,i){
            var chTone=tones[i]||[];var hasText=((b.chapterContent||{})[i]||"").trim().length>50;
            return <div key={i} style={{padding:14,background:"rgba(255,255,255,0.02)",borderRadius:8,marginBottom:8,borderLeft:hasText?"3px solid #66BB6A":"3px solid rgba(255,255,255,0.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{color:"#fff",fontSize:14,fontWeight:600}}>Ch. {ch.number}: {ch.title}</div>
                {hasText&&<span style={{color:"#66BB6A",fontSize:12,fontWeight:600}}>✓ Written</span>}
              </div>
              {ch.purpose&&<p style={{color:"rgba(255,255,255,0.65)",margin:"0 0 8px",fontSize:12}}>{ch.purpose}</p>}
              <div style={{marginBottom:8}}>
                <div style={{color:"rgba(255,255,255,0.65)",fontSize:12,marginBottom:4}}>Tone (select all that apply):</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {TONES.map(function(tone){var sel=chTone.indexOf(tone)>=0;
                    return <button key={tone} onClick={function(){var upd=sel?chTone.filter(function(t){return t!==tone}):chTone.concat([tone]);var nt=Object.assign({},tones);nt[i]=upd;setTones(nt);sb(function(x){return Object.assign({},x,{chapterTones:Object.assign({},(x.chapterTones||{}),{[i]:upd})})})}} style={{padding:"5px 12px",borderRadius:5,fontSize:12,cursor:"pointer",background:sel?"rgba(212,168,83,0.15)":"rgba(255,255,255,0.03)",color:sel?"#D4A853":"rgba(255,255,255,0.6)",border:sel?"2px solid #D4A853":"1px solid rgba(255,255,255,0.08)"}}>{tone}</button>
                  })}
                </div>
              </div>
              {!hasText&&<B v="success" onClick={function(){writeChapter(i)}} disabled={ld&&writingCh===i} style={{fontSize:12}}>
                {ld&&writingCh===i?"Writing...":"AI Write This Chapter"}
              </B>}
              {ld&&writingCh===i&&<Spin msg={"Writing Chapter "+ch.number+" in "+(chTone.join(", ")||"engaging")+" tone..."}/>}
            </div>
          })}
          <div style={{marginTop:12,display:"flex",justifyContent:"flex-end"}}><B onClick={onNext}>Continue →</B></div>
        </div>:<div>
          <p style={{color:"rgba(255,255,255,0.65)",fontSize:13}}>Generate an outline first (next step), then come back here to set tones and write chapters.</p>
          <B onClick={onNext}>Continue to Outline Builder →</B>
        </div>}
      </div>}

      {/* WRITTEN */}
      {msType==="written"&&<div>
        <div style={{color:"#D4A853",fontSize:16,fontWeight:700,marginBottom:8}}>📖 Split Into Chapters</div>
        {detectedChapters?<div>
          <Inf text={"Detected "+detectedChapters.length+" chapters in your manuscript. Click 'Split & Load' to put each chapter's content into its own editing field. Everything stays exactly as you wrote it."}/>
          <div style={{maxHeight:300,overflowY:"auto",marginBottom:12}}>
            {detectedChapters.map(function(ch,i){return <div key={i} style={{padding:10,background:"rgba(255,255,255,0.02)",borderRadius:6,marginBottom:4,borderLeft:"3px solid #66BB6A"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div style={{color:"#fff",fontSize:14,fontWeight:600}}>Ch. {ch.number}: {ch.title||"(untitled)"}</div>
                <span style={{color:"rgba(255,255,255,0.65)",fontSize:12}}>~{ch.content.split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
              </div>
              <p style={{color:"rgba(255,255,255,0.65)",margin:"3px 0 0",fontSize:12}}>{ch.content.substring(0,150)}...</p>
            </div>})}
          </div>
          <B onClick={function(){applySplit();onNext()}}>Split & Load into Chapters →</B>
        </div>:<div>
          <Inf text="Could not auto-detect chapter headings. Your manuscript may use 'CHAPTER ONE' in words or custom headings. Try 'Unorganized Content' instead, or add 'Chapter 1:', 'Chapter 2:' headings."/>
          <div style={{display:"flex",gap:8}}>
            <B v="secondary" onClick={function(){setPhase("type")}}>← Try Different Format</B>
            <B onClick={onNext}>Continue Manually →</B>
          </div>
        </div>}
      </div>}
    </div>}
    <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}><B onClick={onNext}>Continue →</B></div>
  </Cd>;
}

// ─── S3: OUTLINE BUILDER ───
function S3({book:b,setBook:sb,onNext}){
  var [ld,setLd]=useState(false);var [ol,setOl]=useState(b.outline||null);var [err,setErr]=useState(null);
  async function gen(){setOl(null);setErr(null);setLd(true);
    var oc=b.organizedContent?"\nOrganized chapters: "+JSON.stringify((b.organizedContent.suggestedChapters||[]).map(function(c){return{t:c.title,s:c.contentSummary}})):"";
    var raw=await ai("Bestseller outline for \""+b.title+"\" ("+b.genre+", "+(b.wordCount||"80K")+" words). Impact: "+(b.impact||"N/A")+". Angle: "+(b.uniqueAngle||"N/A")+". Reader: "+(b.targetReader||"N/A")+"."+oc+"\n\nReturn JSON: {\"chapters\":[{\"number\":1,\"title\":\"...\",\"purpose\":\"one sentence\",\"keyPoints\":[\"3-4 short points\"],\"wordCountTarget\":\"3K-5K\",\"endHook\":\"one sentence\"}],\"structureNotes\":\"one sentence\"}. 12-20 chapters. Every chapter ends on a hook. Keep ALL fields concise.","NYT editor. ONLY valid JSON. Be concise.", 4096);
    var p=pJ(raw);
    if(!p){try{var c=raw.replace(/```json|```/g,"").trim();for(var i=c.length;i>50;i=c.lastIndexOf("}",i-1)){var a=c.substring(0,i+1);var ob=0,cb=0,os=0,cs=0;for(var x of a){if(x==="{")ob++;if(x==="}")cb++;if(x==="[")os++;if(x==="]")cs++}while(cb<ob){a+="}";cb++}while(cs<os){a+="]";cs++}try{p=JSON.parse(a);break}catch(e3){}}}catch(e2){}}
    if(p){setOl(p);sb(function(x){return{...x,outline:p}});setErr(null)}
    else{setErr("Outline response was too long and got cut off. Try again — the AI will be more concise on retry.")}
    setLd(false);
  }
  return <Cd title="Outline Builder" sub="AI generates bestseller-optimized structure">
    <TA value={b.existingOutline||""} onChange={function(v){sb(function(x){return{...x,existingOutline:v}})}} placeholder="Existing outline or notes (optional)..." rows={3}/>
    <div style={{marginTop:8,display:"flex",gap:8,alignItems:"center"}}>
      {!ld&&<B onClick={gen}>{ol?"Regenerate Outline":"Generate Outline"}</B>}
      <div style={{flex:1}}/>
      <B onClick={onNext}>Continue →</B>
    </div>
    {ld&&<Spin msg="Building outline..."/>}
    {err&&<div style={{marginTop:12,padding:14,background:"rgba(229,57,53,0.08)",borderRadius:8,border:"1px solid rgba(229,57,53,0.2)"}}>
      <div style={{color:"#EF5350",fontSize:14,fontWeight:600,marginBottom:4}}>Outline generation failed</div>
      <p style={{color:"rgba(255,255,255,0.7)",margin:"0 0 10px",fontSize:13}}>{err}</p>
      <div style={{display:"flex",gap:8}}>
        <B v="secondary" onClick={gen}>Try Again</B>
        <B onClick={onNext}>Continue Without Outline →</B>
      </div>
    </div>}
    {ol&&!ol.error&&<div style={{marginTop:12}}>
      {ol.structureNotes&&<Inf text={ol.structureNotes}/>}
      {ol.frontMatter&&ol.frontMatter.length>0&&<div style={{marginBottom:8}}>
        <div style={{color:"rgba(255,255,255,0.6)",fontSize:11,fontWeight:600,textTransform:"uppercase",marginBottom:3}}>Front Matter</div>
        {ol.frontMatter.map(function(f,i){return <p key={i} style={{color:"rgba(255,255,255,0.7)",margin:"2px 0",fontSize:12,paddingLeft:7,borderLeft:"2px solid rgba(212,168,83,0.12)"}}>
          <strong style={{color:"rgba(255,255,255,0.6)"}}>{f.section}:</strong> {f.guidance}</p>})}
      </div>}
      <div style={{maxHeight:400,overflowY:"auto"}}>
        {(ol.chapters||[]).map(function(ch,i){return <div key={i}>
          {/* Section header - displays above the chapter that starts a new section */}
          {ch.section&&<div style={{padding:12,marginBottom:4,background:"rgba(212,168,83,0.08)",borderRadius:8,border:"2px solid rgba(212,168,83,0.2)"}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{color:"#D4A853",fontSize:11,fontWeight:700,flexShrink:0,textTransform:"uppercase",letterSpacing:1}}>§</span>
              <input value={ch.section} onChange={function(e){
                var updated=JSON.parse(JSON.stringify(ol));
                updated.chapters[i].section=e.target.value;
                setOl(updated);sb(function(x){return Object.assign({},x,{outline:updated})});
              }} style={{flex:1,padding:"4px 8px",background:"rgba(0,0,0,0.2)",border:"1px solid rgba(212,168,83,0.25)",borderRadius:4,color:"#D4A853",fontSize:15,fontWeight:700,letterSpacing:0.5}}/>
              <button onClick={function(){
                var updated=JSON.parse(JSON.stringify(ol));
                delete updated.chapters[i].section;
                setOl(updated);sb(function(x){return Object.assign({},x,{outline:updated})});
              }} style={{background:"none",border:"none",color:"rgba(229,57,53,0.7)",cursor:"pointer",fontSize:13,padding:"0 4px",flexShrink:0}} title="Remove section header">✕</button>
            </div>
          </div>}
          {/* Chapter row */}
          <div style={{padding:10,background:"rgba(255,255,255,0.02)",borderRadius:6,marginBottom:4,borderLeft:"3px solid rgba(212,168,83,0.3)"}}>
            <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
              <span style={{color:"#D4A853",fontSize:12,fontWeight:700,flexShrink:0}}>Ch. {ch.number}:</span>
              <input value={ch.title} onChange={function(e){
                var updated=JSON.parse(JSON.stringify(ol));
                updated.chapters[i].title=e.target.value;
                setOl(updated);sb(function(x){return Object.assign({},x,{outline:updated})});
              }} style={{flex:1,padding:"4px 8px",background:"rgba(0,0,0,0.2)",border:"1px solid rgba(212,168,83,0.15)",borderRadius:4,color:"#fff",fontSize:13,fontWeight:600}}/>
              {!ch.section&&<button onClick={function(){
                var updated=JSON.parse(JSON.stringify(ol));
                updated.chapters[i].section="Part "+(i+1);
                setOl(updated);sb(function(x){return Object.assign({},x,{outline:updated})});
              }} style={{background:"none",border:"1px solid rgba(212,168,83,0.2)",borderRadius:3,color:"rgba(212,168,83,0.8)",cursor:"pointer",fontSize:12,padding:"2px 5px",flexShrink:0}} title="Add section header above this chapter">§+</button>}
              <button onClick={function(){
                var updated=JSON.parse(JSON.stringify(ol));
                updated.chapters.splice(i,1);
                var num=1;updated.chapters.forEach(function(c){if(!c.isSection){c.number=num;num++}});
                setOl(updated);sb(function(x){return Object.assign({},x,{outline:updated})});
              }} style={{background:"none",border:"none",color:"rgba(229,57,53,0.7)",cursor:"pointer",fontSize:14,padding:"0 4px",flexShrink:0}} title="Delete chapter">✕</button>
            </div>
            <input value={ch.purpose||""} onChange={function(e){
              var updated=JSON.parse(JSON.stringify(ol));
              updated.chapters[i].purpose=e.target.value;
              setOl(updated);sb(function(x){return Object.assign({},x,{outline:updated})});
            }} placeholder="Chapter purpose..." style={{width:"100%",padding:"3px 8px",background:"rgba(0,0,0,0.1)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:4,color:"rgba(255,255,255,0.7)",fontSize:11,marginBottom:3,boxSizing:"border-box"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:"rgba(255,255,255,0.6)",fontSize:13}}>{ch.wordCountTarget}</span>
              {ch.endHook&&<span style={{color:"#D4A853",fontSize:13,fontStyle:"italic"}}>Hook: {ch.endHook}</span>}
            </div>
          </div>
        </div>})}
      </div>
      <div style={{marginTop:8,display:"flex",gap:8}}>
        <B v="secondary" onClick={function(){
          var updated=JSON.parse(JSON.stringify(ol));
          var nextNum=(updated.chapters||[]).filter(function(c){return !c.isSection}).length+1;
          updated.chapters.push({number:nextNum,title:"New Chapter",purpose:"",keyPoints:[],wordCountTarget:"3K-5K",endHook:""});
          setOl(updated);sb(function(x){return Object.assign({},x,{outline:updated})});
        }} style={{padding:"6px 14px",fontSize:11}}>+ Add Chapter</B>
      </div>
    </div>}
  </Cd>;
}

// ─── S4: FRONT & BACK MATTER (auto-populated copyright, world-class AI drafts) ───
function S4({book:b,setBook:sb,onNext}){
  var tab_s=useState("front");var tab=tab_s[0];var setTab=tab_s[1];
  var ld_s=useState(false);var ld=ld_s[0];var setLd=ld_s[1];
  var aiD_s=useState(null);var aiD=aiD_s[0];var setAiD=aiD_s[1];
  var aiK_s=useState(null);var aiK=aiK_s[0];var setAiK=aiK_s[1];
  var secs=tab==="front"?FM:BM;var sk=tab==="front"?"frontMatter":"backMatter";
  var author=b.authorName||"[Your Name]";

  // Build rich context for AI drafts
  function getContext(){
    var ctx="Book: \""+b.title+"\" by "+author+"\nGenre: "+b.genre+"\n";
    if(b.impact)ctx+="Impact: "+b.impact+"\n";
    if(b.uniqueAngle)ctx+="Angle: "+b.uniqueAngle+"\n";
    if(b.targetReader)ctx+="Reader: "+b.targetReader+"\n";
    if(b.outline&&b.outline.chapters)ctx+="Chapters: "+b.outline.chapters.map(function(c){return c.title}).join(", ")+"\n";
    if(b.organizedContent&&b.organizedContent.overallAssessment)ctx+="Content assessment: "+b.organizedContent.overallAssessment+"\n";
    if(b.voiceProfile)ctx+="WRITE IN THIS VOICE: "+b.voiceProfile.styleInstructions+"\nMatch these patterns: "+(b.voiceProfile.samplePatterns||[]).join("; ")+"\n";
    return ctx;
  }

  async function draft(sec){setLd(true);setAiK(sec.k);setAiD(null);
    var ctx=getContext();
    var sectionPrompts={
      dedication:"Write a powerful, heartfelt dedication for this book. Study bestselling dedications — they are SHORT (1-4 sentences), deeply personal, and often the most quoted part of a book. Consider who sacrificed, supported, or inspired the author during this journey.",
      foreword:"Write a foreword as if written by a respected figure in the author's field. It should establish the author's credibility, explain why this book matters NOW, and make the reader feel they're about to read something important. 400-600 words.",
      preface:"Write the author's preface — why they wrote this book, what personal experience drove it, what the reader will gain. Be vulnerable and authentic. This is where the author earns trust. 300-500 words.",
      introduction:"Write a compelling introduction that frames the problem this book solves, establishes urgency, and gives a roadmap of what's coming. End with a hook that makes the reader turn to Chapter 1. 500-800 words.",
      epigraph:"Suggest 3 powerful epigraph options — quotes that capture the essence of this book. Include the source/attribution for each. Choose quotes that are surprising, not cliche.",
      authorNote:"Write an author's note explaining the research, personal experiences, or events behind this book. What's real, what's adapted, and what the author wants readers to know.",
      acknowledgments:"Write acknowledgments that feel genuine, not generic. Thank specific types of people (editor, beta readers, family, mentors, the reader). Make it personal and warm. 200-400 words.",
      aboutAuthor:"Write a compelling About the Author (100-200 words). Include what they write, why, one humanizing personal detail, and where to find them online. Third person.",
      alsoBy:"Create an 'Also By' page template with placeholder links. Format for both ebook (clickable) and print.",
      newsletterCTA:"Write the MOST IMPORTANT page in the book — the newsletter signup CTA. Offer irresistible bonus content. Include a clear URL placeholder. This converts 3-8% of readers into email subscribers.",
      reviewRequest:"Write a sincere, non-desperate review request. Acknowledge the reader's time, explain how reviews help. Keep under 100 words.",
      excerpt:"Write a compelling setup for a next-book excerpt. Tease what's coming, then leave a placeholder for the first 1-2 chapters.",
    };
    var prompt=sectionPrompts[sec.k]||"Write a bestseller-quality "+sec.l+" section.";
    var raw=await ai(ctx+"\n\n"+prompt+"\n\nReturn JSON: {\"draft\":\"the complete ready-to-use text\",\"tips\":[\"3 specific tips for making this section maximize book sales\"]}","You are a #1 NYT bestselling author and publisher with 30 years experience. Write at the highest professional level. ONLY valid JSON.");
    var parsed=pJ(raw);
    if(parsed&&parsed.draft){
      // Auto-populate directly into the field
      sb(function(x){var obj={};obj[sk]=Object.assign({},(x[sk]||{}));obj[sk][sec.k]=parsed.draft;return Object.assign({},x,obj)});
      setAiD(parsed);
    }
    setLd(false);
  }

  function genCR(){
    var yr=new Date().getFullYear();
    var isFic=["Fiction","Romance","Fantasy","Thriller","Horror","Mystery","Romantasy","Dark Romance","Cozy Fantasy","Climate Fiction","LitRPG","Sci-Fi"].some(function(g){return(b.genre||"").includes(g)});
    var cp="© "+yr+" "+author+"\n\nAll rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the publisher.\n\nISBN (Ebook): [Purchase at myidentifiers.com — $125/single or $295/10-pack]\nISBN (Paperback): [Separate ISBN required per format]\nISBN (Hardcover): [Optional — separate ISBN]\n\nPublished by "+author+"\n[City, State]\n\nFirst Edition\n\nCover design by "+author+"\nEdited by "+author+"\n\n"+(isFic?"This is a work of fiction. Names, characters, places, and incidents are products of the author's imagination or are used fictitiously. Any resemblance to actual events, locales, or persons, living or dead, is entirely coincidental.":"This book is for informational purposes only and does not constitute professional advice. The author and publisher disclaim any liability for outcomes resulting from the application of methods discussed in this book.");
    sb(function(x){return Object.assign({},x,{frontMatter:Object.assign({},(x.frontMatter||{}),{copyright:cp})})});
  }

  return <Cd title="Front & Back Matter" sub="Professional framing sections — write your own or var AI draft bestseller-quality versions">
    <div style={{display:"flex",gap:3,marginBottom:12}}>
      {["front","back"].map(function(t){return <button key={t} onClick={function(){setTab(t);setAiD(null)}} style={{flex:1,padding:"8px 0",borderRadius:6,fontSize:12,fontWeight:700,textTransform:"uppercase",background:tab===t?"#D4A853":"rgba(255,255,255,0.03)",color:tab===t?"#0f1b33":"rgba(255,255,255,0.4)",border:"none",cursor:"pointer"}}>{t} Matter</button>})}
    </div>
    {tab==="front"&&<div style={{marginBottom:12,padding:14,background:"rgba(255,255,255,0.02)",borderRadius:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{color:"#fff",fontWeight:600,fontSize:14}}>Copyright Page <span style={{fontSize:12,padding:"2px 6px",borderRadius:3,background:"rgba(229,57,53,0.12)",color:"#EF5350",marginLeft:6}}>REQUIRED</span></span>
        <B v="secondary" onClick={genCR} style={{padding:"4px 10px",fontSize:13}}>Auto-Generate</B>
      </div>
      <p style={{color:"rgba(255,255,255,0.65)",margin:"0 0 6px",fontSize:12}}>Auto-fills your name from Book Setup. All fields are editable. ISBNs from myidentifiers.com ($295/10-pack recommended).</p>
      <TA value={(b.frontMatter||{}).copyright||""} onChange={function(v){sb(function(x){return Object.assign({},x,{frontMatter:Object.assign({},(x.frontMatter||{}),{copyright:v})})})}} placeholder="Click Auto-Generate to populate, then edit as needed..." rows={6}/>
    </div>}
    {secs.map(function(sec){return <div key={sec.k} style={{marginBottom:12,padding:14,background:"rgba(255,255,255,0.02)",borderRadius:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{color:"#fff",fontWeight:600,fontSize:14}}>{sec.l} {sec.r&&<span style={{fontSize:12,padding:"2px 6px",borderRadius:3,background:"rgba(229,57,53,0.12)",color:"#EF5350",marginLeft:6}}>REQUIRED</span>}</span>
        <B v="secondary" onClick={function(){draft(sec)}} style={{padding:"4px 10px",fontSize:13}} disabled={ld}>AI Draft</B>
      </div>
      <p style={{color:"rgba(255,255,255,0.7)",margin:"0 0 6px",fontSize:12}}>{sec.t}</p>
      <TA value={(b[sk]||{})[sec.k]||""} onChange={function(v){sb(function(x){var obj={};obj[sk]=Object.assign({},(x[sk]||{}));obj[sk][sec.k]=v;return Object.assign({},x,obj)})}} placeholder={"Write your own "+sec.l+" here, or click AI Draft above..."} rows={3}/>
      {ld&&aiK===sec.k&&<Spin msg={"AI drafting "+sec.l+"..."}/>}
      {aiD&&aiD.tips&&aiK===sec.k&&<div style={{marginTop:6,padding:10,background:"rgba(212,168,83,0.04)",borderRadius:6}}>
        {aiD.tips.map(function(t,i){return <p key={i} style={{color:"rgba(255,255,255,0.7)",margin:"3px 0",fontSize:12}}>💡 {t}</p>})}
      </div>}
    </div>})}
    <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}><B onClick={onNext}>Continue →</B></div>
  </Cd>;
}

// ─── S5: CHAPTER GUIDE (interactive Avoid guidance with Accept/Reject + AI Fix) ───
function S5({book:b,setBook:sb,onNext}){
  var sel_s=useState(0);var sel=sel_s[0];var setSel=sel_s[1];
  var ld_s=useState(false);var ld=ld_s[0];var setLd=ld_s[1];
  var gd_s=useState({});var gd=gd_s[0];var setGd=gd_s[1];
  var avoidState_s=useState({});var avoidState=avoidState_s[0];var setAvoidState=avoidState_s[1];
  var fixLd_s=useState(null);var fixLd=fixLd_s[0];var setFixLd=fixLd_s[1];
  var chs=b.outline&&b.outline.chapters?b.outline.chapters:[];

  async function getG(ch){if(gd[ch.number])return;setLd(true);
    // Find chapter index to get actual content
    var chIdx=-1;for(var i=0;i<chs.length;i++){if(chs[i].number===ch.number){chIdx=i;break}}
    var actualText=(b.chapterContent||{})[chIdx]||"";
    var hasContent=actualText.trim().length>50;
    var contentBlock=hasContent?"\n\nACTUAL CHAPTER TEXT (read this carefully — your guidance must match what is written here):\n"+actualText.substring(0,12000):"";
    var raw=await ai("Chapter "+ch.number+" \""+ch.title+"\" of "+b.genre+" book \""+b.title+"\".\nPurpose: "+ch.purpose+"\nKey points: "+(ch.keyPoints||[]).join(", ")+"\nEnd hook: "+(ch.endHook||"N/A")+contentBlock+"\n\nCRITICAL RULES:\n- If chapter text is provided above, base ALL guidance on what is ACTUALLY written\n- NEVER rearrange who did what — if Steve bought a company FROM someone, do not say he GAVE money TO that person\n- NEVER reassign dollar amounts to different contexts than how they appear in the text\n- NEVER swap character roles or relationships\n- If you are unsure about a detail, say so rather than guessing\n\nReturn JSON: {\"openingStrategy\":\"...\",\"scenesNeeded\":[\"3-5 scenes based on what the chapter needs\"],\"emotionalArc\":\"...\",\"pacing\":\"...\",\"bestsellerTip\":\"...\",\"avoidThese\":[\"2-3 specific issues found in the actual text, or general genre pitfalls if no text provided\"]}","Bestselling editor who reads carefully and NEVER misrepresents the author's facts. ONLY JSON.");
    var p=pJ(raw);if(p)setGd(function(g){var n={};for(var k in g)n[k]=g[k];n[ch.number]=p;return n});setLd(false);
  }

  function acceptAvoid(chNum,idx){
    var key=chNum+"-"+idx;
    setAvoidState(function(prev){var n={};for(var k in prev)n[k]=prev[k];n[key]="accepted";return n});
  }
  function rejectAvoid(chNum,idx){
    var key=chNum+"-"+idx;
    setAvoidState(function(prev){var n={};for(var k in prev)n[k]=prev[k];n[key]="rejected";return n});
  }

  async function aiFix(chNum,avoidText,chIdx){
    var key=chNum+"-"+chIdx;
    setFixLd(key);
    var chapterContent=(b.chapterContent||{})[sel]||"";
    var ch=chs[sel];

    // Build full book context so AI knows the characters and storyline
    var ctx="BOOK CONTEXT:\n";
    ctx+="Title: \""+b.title+"\" by "+(b.authorName||"the author")+"\n";
    ctx+="Genre: "+b.genre+"\n";
    if(b.impact)ctx+="Book's purpose: "+b.impact+"\n";
    if(b.uniqueAngle)ctx+="Unique angle: "+b.uniqueAngle+"\n";
    if(b.targetReader)ctx+="Target reader: "+b.targetReader+"\n";

    // Full story arc from outline
    if(chs.length>0){
      ctx+="\nFULL STORY ARC:\n";
      chs.forEach(function(c){ctx+="Ch."+c.number+" \""+c.title+"\": "+c.purpose+"\n"});
    }

    // Previous chapters for character/plot continuity
    var prevCtx="";
    for(var i=0;i<sel;i++){
      var pc=(b.chapterContent||{})[i]||"";
      if(pc.trim().length>50){
        prevCtx+="\nChapter "+chs[i].number+" \""+chs[i].title+"\" (summary): "+pc.substring(0,600)+"...\n";
      }
    }
    if(prevCtx)ctx+="\nWHAT HAPPENED BEFORE THIS CHAPTER:"+prevCtx;

    // Series bible
    if(b.seriesBible)ctx+="\nSERIES BIBLE (characters, locations, rules):\n"+b.seriesBible.substring(0,1500)+"\n";

    // Voice
    var voiceInst=b.voiceProfile?"\nWRITING VOICE — match this EXACTLY:\n"+b.voiceProfile.styleInstructions+"\nPatterns to mimic: "+(b.voiceProfile.samplePatterns||[]).join("; ")+"\n":"\nWrite naturally, engagingly, with personality.\n";

    var raw=await ai(ctx+voiceInst+"\n\nYou are fixing a specific issue in Chapter "+chNum+" (\""+ch.title+"\").\n\nEDITOR'S FLAG: \""+avoidText+"\"\n\nCURRENT CHAPTER TEXT:\n"+(chapterContent.substring(0,12000)||"[No content yet — write what this section SHOULD say]")+"\n\nCRITICAL RULES:\n- Fix ONLY the part related to the flagged issue\n- NEVER rearrange who did what to whom — if A bought from B, do NOT write that A gave to B\n- NEVER reassign dollar amounts, dates, or facts to different people or contexts\n- NEVER swap character roles or invent relationships not in the text\n- Keep every name, number, and event EXACTLY as the author wrote it\n- If unsure about a fact, leave it as-is\n- Be masterful — rich, vivid prose with humor where natural\n- Blend seamlessly with the surrounding text\n\nReturn JSON: {\"fixedExcerpt\":\"the corrected passage\",\"whatChanged\":\"one sentence explaining the fix\"}","#1 NYT bestselling author who NEVER misrepresents the author's facts. ONLY valid JSON.");
    var p=pJ(raw);
    if(p&&p.fixedExcerpt){
      setAvoidState(function(prev){var n={};for(var k in prev)n[k]=prev[k];n[key]={status:"fixed",excerpt:p.fixedExcerpt,note:p.whatChanged};return n});
    }
    setFixLd(null);
  }

  function applyFix(chIdx,excerpt){
    var existing=(b.chapterContent||{})[sel]||"";
    var updated=existing?existing+"\n\n--- AI FIX ---\n\n"+excerpt:excerpt;
    sb(function(x){var cc=Object.assign({},(x.chapterContent||{}));cc[sel]=updated;return Object.assign({},x,{chapterContent:cc})});
  }

  var ch=chs[sel];var g=ch?gd[ch.number]:null;
  return <Cd title="Chapter Guide" sub="AI writing guidance per chapter — review and act on feedback">
    <div style={{display:"flex",gap:10,minHeight:300}}>
      <div style={{width:150,flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.04)",paddingRight:8,maxHeight:500,overflowY:"auto"}}>
        {chs.map(function(c,i){return <div key={i} onClick={function(){setSel(i);getG(c)}} style={{padding:5,borderRadius:3,marginBottom:2,cursor:"pointer",background:sel===i?"rgba(212,168,83,0.1)":"transparent",borderLeft:sel===i?"3px solid #D4A853":"3px solid transparent"}}>
          <div style={{color:sel===i?"#D4A853":"rgba(255,255,255,0.35)",fontSize:12,fontWeight:600}}>Ch. {c.number}</div>
          <div style={{color:"rgba(255,255,255,0.7)",fontSize:11}}>{c.title}</div>
        </div>})}
      </div>
      <div style={{flex:1,overflowY:"auto",maxHeight:500}}>
        {ch&&<div>
          <h4 style={{color:"#D4A853",margin:"0 0 2px",fontSize:14}}>Ch. {ch.number}: {ch.title}</h4>
          <p style={{color:"rgba(255,255,255,0.65)",fontSize:12,margin:"0 0 10px"}}>{ch.purpose}</p>
          {!g&&!ld&&<B v="secondary" onClick={function(){getG(ch)}}>Get Guidance</B>}
          {ld&&<Spin/>}
          {g&&!g.error&&<div style={{display:"grid",gap:8}}>
            {[["🎯 Opening",g.openingStrategy],["💫 Arc",g.emotionalArc],["⏱️ Pacing",g.pacing],["🏆 Tip",g.bestsellerTip]].map(function(pair){var l=pair[0];var t=pair[1];return t?<div key={l} style={{padding:8,background:"rgba(255,255,255,0.02)",borderRadius:5}}>
              <div style={{color:"#D4A853",fontSize:11,fontWeight:600,marginBottom:2}}>{l}</div>
              <p style={{color:"rgba(255,255,255,0.75)",margin:0,fontSize:12,lineHeight:1.5}}>{t}</p>
            </div>:null})}
            {g.scenesNeeded&&g.scenesNeeded.length>0&&<div style={{padding:8,background:"rgba(255,255,255,0.02)",borderRadius:5}}>
              <div style={{color:"#D4A853",fontSize:11,fontWeight:600,marginBottom:4}}>📝 Scenes</div>
              {g.scenesNeeded.map(function(s,j){return <p key={j} style={{color:"rgba(255,255,255,0.7)",margin:"2px 0",fontSize:11,paddingLeft:8,borderLeft:"2px solid rgba(212,168,83,0.12)"}}>{j+1}. {s}</p>})}
            </div>}
            {g.avoidThese&&g.avoidThese.length>0&&<div style={{padding:10,background:"rgba(229,57,53,0.04)",borderRadius:6,border:"1px solid rgba(229,57,53,0.08)"}}>
              <div style={{color:"#EF5350",fontSize:12,fontWeight:600,marginBottom:6}}>⚠️ Things to Avoid</div>
              {g.avoidThese.map(function(a,j){
                var key=ch.number+"-"+j;
                var state=avoidState[key];
                var isFixed=state&&typeof state==="object"&&state.status==="fixed";
                return <div key={j} style={{padding:10,background:"rgba(255,255,255,0.02)",borderRadius:6,marginBottom:6,borderLeft:state==="rejected"?"3px solid rgba(102,187,106,0.3)":isFixed?"3px solid rgba(102,187,106,0.5)":state==="accepted"?"3px solid rgba(229,57,53,0.3)":"3px solid rgba(255,255,255,0.06)"}}>
                  <p style={{color:state==="rejected"?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.6)",margin:"0 0 6px",fontSize:13,textDecoration:state==="rejected"?"line-through":"none"}}>{a}</p>
                  {!state&&<div style={{display:"flex",gap:6}}>
                    <B v="danger" onClick={function(){acceptAvoid(ch.number,j)}} style={{padding:"4px 10px",fontSize:13}}>Yes, Fix This</B>
                    <B v="success" onClick={function(){rejectAvoid(ch.number,j)}} style={{padding:"4px 10px",fontSize:13}}>Not an Issue</B>
                  </div>}
                  {state==="accepted"&&<div>
                    <p style={{color:"rgba(255,255,255,0.7)",margin:"0 0 6px",fontSize:11}}>How would you like to fix it?</p>
                    <div style={{display:"flex",gap:6}}>
                      <B v="secondary" onClick={onNext} style={{padding:"4px 10px",fontSize:13}}>I'll Fix It Myself →</B>
                      <B onClick={function(){aiFix(ch.number,a,j)}} style={{padding:"4px 10px",fontSize:13}} disabled={fixLd===key}>AI Fix in My Voice</B>
                    </div>
                  </div>}
                  {fixLd===key&&<Spin msg="AI rewriting with your voice and style..."/>}
                  {isFixed&&<div style={{marginTop:6}}>
                    <div style={{color:"#66BB6A",fontSize:11,fontWeight:600,marginBottom:3}}>✓ {state.note}</div>
                    <div style={{padding:10,background:"rgba(255,255,255,0.02)",borderRadius:5,marginBottom:6}}>
                      <p style={{color:"rgba(255,255,255,0.65)",margin:0,fontSize:12,lineHeight:1.5,whiteSpace:"pre-wrap",maxHeight:200,overflowY:"auto"}}>{state.excerpt}</p>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <B v="success" onClick={function(){applyFix(sel,state.excerpt)}} style={{padding:"4px 10px",fontSize:13}}>Apply to Chapter</B>
                      <B v="secondary" onClick={function(){aiFix(ch.number,a,j)}} style={{padding:"4px 10px",fontSize:13}}>Regenerate Fix</B>
                    </div>
                  </div>}
                </div>
              })}
            </div>}
          </div>}
        </div>}
      </div>
    </div>
    <div style={{marginTop:12,display:"flex",justifyContent:"flex-end"}}><B onClick={onNext}>Continue →</B></div>
  </Cd>;
}

// ─── S6: WRITE & RECORD (writing + per-chapter audio recording) ───
function S6({book:b,setBook:sb,onNext,bookId}){
  var a_s=useState(0);var a=a_s[0];var setA=a_s[1];
  var ld_s=useState(false);var ld=ld_s[0];var setLd=ld_s[1];
  var mode_s=useState("write");var mode=mode_s[0];var setMode=mode_s[1];
  var rec_s=useState(null);var recorder=rec_s[0];var setRecorder=rec_s[1];
  var recording_s=useState(false);var recording=recording_s[0];var setRecording=recording_s[1];
  var recTime_s=useState(0);var recTime=recTime_s[0];var setRecTime=recTime_s[1];
  var timer_s=useState(null);var timerRef=timer_s[0];var setTimerRef=timer_s[1];
  var playing_s=useState(null);var playing=playing_s[0];var setPlaying=playing_s[1];
  // Audio stored in separate keys, loaded into local state
  var audioData_s=useState({});var audioData=audioData_s[0];var setAudioData=audioData_s[1];
  var chs=b.outline&&b.outline.chapters?b.outline.chapters:[];
  function upd(i,c){sb(function(x){var cc=Object.assign({},(x.chapterContent||{}));cc[i]=c;return Object.assign({},x,{chapterContent:cc})})}
  var wn=Object.keys(b.chapterContent||{}).filter(function(k){return((b.chapterContent[k])||"").trim().length>50}).length;
  var tw=wc(b);var tgt=parseInt((b.wordCount||"80000").replace(/\D/g,""))||80000;

  // Audio storage helpers — each chapter gets its own key
  function audioKey(idx){return "bsa4-audio-"+(bookId||"tmp")+"-"+idx}
  async function saveAudio(idx,data){
    try{if(window.storage){await window.storage.set(audioKey(idx),data)}}catch(e){}
    setAudioData(function(prev){var n=Object.assign({},prev);n[idx]=data;return n});
    sb(function(x){var ai2=Object.assign({},(x.audioIndex||{}));ai2[idx]=true;return Object.assign({},x,{audioIndex:ai2})});
  }
  async function loadAudio(idx){
    if(audioData[idx])return audioData[idx];
    try{if(window.storage){var r=await window.storage.get(audioKey(idx));if(r&&r.value){setAudioData(function(prev){var n=Object.assign({},prev);n[idx]=r.value;return n});return r.value}}}catch(e){}
    return null;
  }
  async function removeAudio(idx){
    try{if(window.storage){await window.storage.delete(audioKey(idx))}}catch(e){}
    setAudioData(function(prev){var n=Object.assign({},prev);delete n[idx];return n});
    sb(function(x){var ai2=Object.assign({},(x.audioIndex||{}));delete ai2[idx];return Object.assign({},x,{audioIndex:ai2})});
  }
  // Load audio for current chapter when switching
  useEffect(function(){if(mode==="record"&&(b.audioIndex||{})[a]&&!audioData[a]){loadAudio(a)}},[a,mode]);


  // AI write
  async function aiWrite(idx){
    setLd(true);var ch=chs[idx];
    var prevContext="";
    for(var i=Math.max(0,idx-2);i<idx;i++){
      var pc=(b.chapterContent||{})[i]||"";
      if(pc.trim().length>50)prevContext+="\nPrevious chapter "+chs[i].number+" \""+chs[i].title+"\": "+pc.substring(0,800)+"...\n";
    }
    var voiceInst=b.voiceProfile?"\nIMPORTANT — Write in this EXACT voice: "+b.voiceProfile.styleInstructions+"\nMimic these patterns: "+(b.voiceProfile.samplePatterns||[]).join("; "):"";
    var seriesCtx=b.seriesBible?"\nSeries bible (maintain continuity): "+b.seriesBible.substring(0,2000):"";
    var existingText=(b.chapterContent||{})[idx]||"";
    var existingBlock=existingText.trim().length>50?"\n\nEXISTING DRAFT (expand and improve — keep all facts EXACTLY as written):\n"+existingText.substring(0,8000):"";
    var raw=await ai("Write Chapter "+ch.number+" (\""+ch.title+"\") for "+b.genre+" book \""+b.title+"\".\n\nPurpose: "+ch.purpose+"\nKey points: "+(ch.keyPoints||[]).join(", ")+"\nEnd hook: "+(ch.endHook||"End on a compelling hook")+"\nTarget: "+(ch.wordCountTarget||"3000-5000 words")+"\nReader: "+(b.targetReader||"General")+"\nImpact: "+(b.impact||"N/A")+prevContext+voiceInst+seriesCtx+existingBlock+"\n\nCRITICAL: Keep ALL names, amounts, relationships EXACTLY as written. NEVER rearrange facts.\n\nWrite the COMPLETE chapter — aim for "+((ch.wordCountTarget||"3000-5000").split("-")[1]||"5000")+" words. Do not cut short.\n\nReturn JSON: {\"chapterText\":\"the full chapter\",\"continuityNotes\":\"characters/places/events introduced\"}","#1 NYT bestselling author who NEVER misrepresents facts. ONLY valid JSON.",8192);
    var p=pJ(raw);
    if(p&&p.chapterText){upd(idx,p.chapterText);if(p.continuityNotes)sb(function(x){return Object.assign({},x,{continuityNotes:Object.assign({},(x.continuityNotes||{}),{[idx]:p.continuityNotes})})})}
    setLd(false);
  }

  // Recording functions
  var recErr_s=useState(null);var recErr=recErr_s[0];var setRecErr=recErr_s[1];

  function startRecording(){
    setRecErr(null);
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
      setRecErr("Microphone not available in this environment. Use 'Upload Audio' below.");
      return;
    }
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
      var mr=new MediaRecorder(stream);
      var chunks=[];
      mr.ondataavailable=function(e){chunks.push(e.data)};
      mr.onstop=function(){
        var blob=new Blob(chunks,{type:"audio/webm"});
        var reader=new FileReader();
        reader.onload=function(ev){saveAudio(a,ev.target.result)};
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(function(t){t.stop()});
      };
      mr.start();setRecorder(mr);setRecording(true);setRecTime(0);
      var t=setInterval(function(){setRecTime(function(p){return p+1})},1000);
      setTimerRef(t);
    }).catch(function(err){setRecErr("Mic denied: "+err.message+". Use 'Upload Audio' below.")});
  }
  function uploadAudio(idx,e){
    var f=e.target.files[0];if(!f)return;
    var r=new FileReader();
    r.onload=function(ev){saveAudio(idx,ev.target.result)};
    r.readAsDataURL(f);
  }
  function stopRecording(){
    if(recorder&&recorder.state==="recording"){recorder.stop();setRecording(false);if(timerRef)clearInterval(timerRef)}
  }
  function playRecording(idx){
    var src=audioData[idx];
    if(!src){loadAudio(idx).then(function(d){if(d){var au=new Audio(d);au.onended=function(){setPlaying(null)};au.play();setPlaying(au)}});return}
    if(playing){playing.pause();setPlaying(null);return}
    var audio=new Audio(src);
    audio.onended=function(){setPlaying(null)};
    audio.play();setPlaying(audio);
  }
  function deleteRecording(idx){
    removeAudio(idx);
    if(playing){playing.pause();setPlaying(null)}
  }
  function exportRecordings(){
    var idx2=Object.keys(b.audioIndex||{});
    idx2.forEach(function(idx){
      loadAudio(parseInt(idx)).then(function(data){
        if(!data)return;
        var ch=chs[parseInt(idx)];
        var name=(b.title||"book").replace(/\s+/g,"_")+"_Ch"+(ch?ch.number:parseInt(idx)+1)+".webm";
        try{
          var byteStr=atob(data.split(",")[1]);
          var ab=new ArrayBuffer(byteStr.length);
          var ia=new Uint8Array(ab);
          for(var i=0;i<byteStr.length;i++)ia[i]=byteStr.charCodeAt(i);
          var blob=new Blob([ab],{type:"audio/webm"});
          var u=URL.createObjectURL(blob);
          var el=document.createElement("a");el.href=u;el.download=name;document.body.appendChild(el);el.click();document.body.removeChild(el);URL.revokeObjectURL(u);
        }catch(e2){}
      });
    });
  }
  function formatTime(s){var m=Math.floor(s/60);var sec=s%60;return m+":"+(sec<10?"0":"")+sec}
  var recCount=Object.keys(b.audioIndex||{}).length;
  var hasRec=!!(b.audioIndex||{})[a];

  return <Cd title="Write & Record" sub={wn+"/"+chs.length+" written — "+tw.toLocaleString()+" / "+tgt.toLocaleString()+" words ("+Math.round(tw/tgt*100)+"%)"+(recCount>0?" — "+recCount+" chapters recorded":"")}>
    {/* Mode toggle */}
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {[["✍️ Write","write"],["🎙️ Record Audiobook","record"]].map(function(item){return <button key={item[1]} onClick={function(){setMode(item[1])}} style={{flex:1,padding:"10px 0",borderRadius:8,fontSize:13,fontWeight:700,background:mode===item[1]?"#D4A853":"rgba(255,255,255,0.04)",color:mode===item[1]?"#0f1b33":"rgba(255,255,255,0.45)",border:mode===item[1]?"2px solid #D4A853":"2px solid rgba(255,255,255,0.08)",cursor:"pointer"}}>{item[0]}</button>})}
    </div>
    {/* Progress bar */}
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
        <span style={{color:"rgba(255,255,255,0.6)",fontSize:13}}>{mode==="write"?"Writing Progress":"Recording Progress"}</span>
        <span style={{color:tw>=tgt?"#66BB6A":"#D4A853",fontSize:13,fontWeight:600}}>{mode==="write"?tw.toLocaleString()+" / "+tgt.toLocaleString():recCount+"/"+chs.length+" recorded"}</span>
      </div>
      <div style={{height:5,background:"rgba(255,255,255,0.04)",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",background:mode==="write"?(tw>=tgt?"#66BB6A":"linear-gradient(90deg,#D4A853,#E8C97A)"):(recCount>=chs.length?"#66BB6A":"linear-gradient(90deg,#E91E63,#D4A853)"),width:(mode==="write"?Math.min(100,tw/tgt*100):chs.length>0?recCount/chs.length*100:0)+"%",borderRadius:3,transition:"width 0.3s"}}/>
      </div>
    </div>
    <div style={{display:"flex",gap:10,minHeight:300}}>
      {/* Chapter sidebar */}
      <div style={{width:140,flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.04)",paddingRight:6,maxHeight:450,overflowY:"auto"}}>
        {chs.map(function(c,i){
          var hasText=((b.chapterContent||{})[i]||"").trim().length>50;
          var hasAudio=!!(b.audioIndex||{})[i];
          return <div key={i} onClick={function(){setA(i);if(playing){playing.pause();setPlaying(null)}}} style={{padding:5,borderRadius:4,marginBottom:2,cursor:"pointer",display:"flex",alignItems:"center",gap:4,background:a===i?"rgba(212,168,83,0.1)":"transparent"}}>
            <div style={{display:"flex",flexDirection:"column",gap:1,flexShrink:0}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:hasText?"#66BB6A":"rgba(255,255,255,0.08)"}}/>
              {mode==="record"&&<span style={{width:6,height:6,borderRadius:"50%",background:hasAudio?"#E91E63":"rgba(255,255,255,0.05)"}}/>}
            </div>
            <div>
              <div style={{color:a===i?"#D4A853":"rgba(255,255,255,0.4)",fontSize:13,fontWeight:600}}>Ch. {c.number}</div>
              <div style={{color:"rgba(255,255,255,0.6)",fontSize:12}}>{c.title}</div>
            </div>
          </div>
        })}
      </div>
      {/* Main content area */}
      <div style={{flex:1}}>
        {chs[a]&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <h4 style={{color:"#D4A853",margin:0,fontSize:14}}>Ch. {chs[a].number}: {chs[a].title}</h4>
            {mode==="write"&&!ld&&<B v="success" onClick={function(){aiWrite(a)}} style={{padding:"4px 10px",fontSize:13}}>
              {((b.chapterContent||{})[a]||"").trim()?"AI Rewrite":"AI Write"}
            </B>}
          </div>
          <p style={{color:"rgba(255,255,255,0.6)",margin:"0 0 6px",fontSize:11}}>{chs[a].purpose}</p>
          {/* WRITE MODE */}
          {mode==="write"&&<div>
            {ld&&<Spin msg="AI writing chapter (matching your voice + maintaining continuity)..."/>}
            {!ld&&<TA value={(b.chapterContent||{})[a]||""} onChange={function(v){upd(a,v)}} placeholder={"Write Chapter "+chs[a].number+".\nPoints: "+(chs[a].keyPoints||[]).join(", ")} rows={12}/>}
            <div style={{marginTop:3,display:"flex",justifyContent:"space-between"}}>
              <span style={{color:"rgba(255,255,255,0.6)",fontSize:13}}>~{((b.chapterContent||{})[a]||"").split(/\s+/).filter(Boolean).length} words</span>
              <div style={{display:"flex",gap:4}}>
                {a>0&&<B v="secondary" onClick={function(){setA(a-1)}} style={{padding:"3px 8px",fontSize:12}}>←</B>}
                {a<chs.length-1&&<B v="secondary" onClick={function(){setA(a+1)}} style={{padding:"3px 8px",fontSize:12}}>→</B>}
              </div>
            </div>
          </div>}
          {/* RECORD MODE */}
          {mode==="record"&&<div>
            {/* Chapter text reference */}
            {((b.chapterContent||{})[a]||"").trim()&&<div style={{padding:12,background:"rgba(255,255,255,0.02)",borderRadius:8,marginBottom:12,maxHeight:200,overflowY:"auto"}}>
              <div style={{color:"rgba(255,255,255,0.6)",fontSize:13,marginBottom:4}}>Read this text aloud:</div>
              <p style={{color:"rgba(255,255,255,0.6)",margin:0,fontSize:14,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"'Crimson Pro',Georgia,serif"}}>{(b.chapterContent||{})[a]}</p>
            </div>}
            {/* Recorder */}
            <div style={{padding:20,background:"rgba(255,255,255,0.02)",borderRadius:12,border:recording?"2px solid #E91E63":"2px solid rgba(255,255,255,0.06)",textAlign:"center",marginBottom:12}}>
              {recording&&<div>
                <div style={{fontSize:48,marginBottom:8,animation:"spin 3s linear infinite"}}>🎙️</div>
                <div style={{color:"#E91E63",fontSize:28,fontWeight:900,marginBottom:4}}>{formatTime(recTime)}</div>
                <div style={{color:"rgba(255,255,255,0.7)",fontSize:11,marginBottom:12}}>Recording... speak clearly, consistent pace (~155 words/min)</div>
                <B v="danger" onClick={stopRecording} style={{padding:"10px 24px",fontSize:14}}>⏹ Stop Recording</B>
              </div>}
              {!recording&&!hasRec&&<div>
                <div style={{fontSize:48,marginBottom:8}}>🎙️</div>
                <div style={{color:"#D4A853",fontSize:16,fontWeight:600,marginBottom:4}}>Chapter {chs[a].number}: Upload Your Recording</div>
                <p style={{color:"rgba(255,255,255,0.6)",fontSize:13,marginBottom:14}}>Record this chapter using Voice Memos (phone), Audacity (desktop), or any recorder app. Then upload the file here.</p>
                <label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"14px 28px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",background:"#D4A853",color:"#0f1b33",textTransform:"uppercase",letterSpacing:0.8}}>
                  📁 Upload Chapter Audio
                  <input type="file" accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac,.flac" onChange={function(e){uploadAudio(a,e)}} style={{display:"none"}}/>
                </label>
                <p style={{color:"rgba(255,255,255,0.6)",fontSize:12,marginTop:10}}>Accepts: .mp3, .wav, .m4a, .webm, .ogg, .aac, .flac</p>
              </div>}
              {!recording&&hasRec&&<div>
                <div style={{fontSize:36,marginBottom:6}}>✅</div>
                <div style={{color:"#66BB6A",fontSize:15,fontWeight:600,marginBottom:10}}>Chapter {chs[a].number} — Audio Uploaded</div>
                <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                  <B v="secondary" onClick={function(){playRecording(a)}} style={{padding:"8px 16px",fontSize:12}}>{playing?"⏸ Pause":"▶ Play"}</B>
                  <label style={{display:"inline-flex",alignItems:"center",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",background:"rgba(212,168,83,0.15)",color:"#D4A853",border:"2px solid rgba(212,168,83,0.3)",textTransform:"uppercase",letterSpacing:0.6}}>
                    📁 Replace
                    <input type="file" accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac,.flac" onChange={function(e){uploadAudio(a,e)}} style={{display:"none"}}/>
                  </label>
                  <B v="danger" onClick={function(){deleteRecording(a)}} style={{padding:"8px 16px",fontSize:12}}>🗑 Delete</B>
                </div>
              </div>}
            </div>
            {/* Nav */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:"rgba(255,255,255,0.6)",fontSize:13}}>{recCount} of {chs.length} chapters recorded</span>
              <div style={{display:"flex",gap:4}}>
                {a>0&&<B v="secondary" onClick={function(){setA(a-1);if(playing){playing.pause();setPlaying(null)}}} style={{padding:"4px 10px",fontSize:13}}>← Prev</B>}
                {a<chs.length-1&&<B v="secondary" onClick={function(){setA(a+1);if(playing){playing.pause();setPlaying(null)}}} style={{padding:"4px 10px",fontSize:13}}>Next →</B>}
              </div>
            </div>
          </div>}
        </div>}
      </div>
    </div>
    {/* Recording tools & export */}
    {mode==="record"&&recCount>0&&<div style={{marginTop:16,padding:14,background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid rgba(255,255,255,0.04)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{color:"#D4A853",fontSize:13,fontWeight:700}}>🎧 Export Recordings</span>
        <B v="secondary" onClick={exportRecordings} style={{padding:"6px 14px",fontSize:11}}>Download All ({recCount} files)</B>
      </div>
      <Inf text={"Files export as WebM audio. For ACX/Audible, upload these to Adobe Podcast (free — enhance.adobe.com) for AI noise removal, then master in Audacity (free) to hit ACX specs: -18 to -23 dB RMS, -60 dB noise floor, -3 dB peak. Export final files as MP3 192kbps CBR, 44.1kHz."}/>
      <div style={{color:"rgba(255,255,255,0.7)",fontSize:12,fontWeight:600,marginBottom:6}}>ACX Submission Checklist</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
        {[["MP3 192kbps+ CBR or M4A","Format"],["44.1 kHz sample rate","Sample Rate"],["RMS -18 to -23 dB","Volume Level"],["Peak -3 dB max","Peak Level"],["Noise floor below -60 dB","Background Noise"],["0.5-1 sec room tone at head/tail","Silence Padding"],["One file per chapter","File Structure"],["Opening + closing credits files","Credits"],["First 5 min as retail sample","Sample File"],["Consistent voice across all files","Consistency"]].map(function(item,i){return <div key={i} style={{padding:6,background:"rgba(255,255,255,0.02)",borderRadius:4,display:"flex",gap:6,alignItems:"center"}}>
          <span style={{color:"rgba(255,255,255,0.6)",fontSize:13}}>☐</span>
          <div><div style={{color:"rgba(255,255,255,0.75)",fontSize:11}}>{item[0]}</div><div style={{color:"rgba(255,255,255,0.6)",fontSize:12}}>{item[1]}</div></div>
        </div>})}
      </div>
    </div>}
    {/* Recording tips */}
    {mode==="record"&&recCount===0&&<div style={{marginTop:12}}>
      <div style={{color:"#D4A853",fontSize:14,fontWeight:700,marginBottom:8}}>🎙️ How to Record Your Audiobook</div>
      <Inf text="Record each chapter separately using any recording app on your phone or computer. Then upload the files here chapter by chapter. The agent tracks your progress and exports everything properly named for ACX."/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {[["📱 Phone: Voice Memos","iPhone Voice Memos or Android Recorder — free, simple, good quality"],["💻 Desktop: Audacity (free)","audacityteam.org — records, edits, and exports to ACX specs"],["🎤 USB Mic ($50-$150)","Audio-Technica AT2020 or Blue Yeti — massive quality jump"],["💨 Pop Filter ($10)","Eliminates plosive P, B, T sounds — essential"],["🏠 Closet = Sound Booth","Record in a closet full of clothes — absorbs echo"],["🤫 Same Time of Day","Your voice changes — stay consistent across chapters"],["🧍 Stand While Reading","Better breath control, more energy in your voice"],["⏱️ Target 155 words/min","Average narration pace = ~9,300 words per hour"],["💧 Room Temp Water","Cold water tightens vocal cords — keep it warm"],["🔇 Record Room Tone","10 sec silence before each session for noise profiling"]].map(function(item,i){return <div key={i} style={{padding:12,background:"rgba(255,255,255,0.02)",borderRadius:6}}>
          <div style={{color:"#D4A853",fontSize:13,fontWeight:600,marginBottom:3}}>{item[0]}</div>
          <p style={{color:"rgba(255,255,255,0.7)",margin:0,fontSize:12}}>{item[1]}</p>
        </div>})}
      </div>
    </div>}
    <div style={{marginTop:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{height:4,flex:1,background:"rgba(255,255,255,0.04)",borderRadius:2,marginRight:12,overflow:"hidden"}}>
        <div style={{height:"100%",background:"#D4A853",width:(chs.length>0?wn/chs.length*100:0)+"%",borderRadius:2}}/>
      </div>
      <B onClick={onNext} disabled={wn===0}>Continue →</B>
    </div>
  </Cd>;
}

// ─── S7: AI REVIEW (4 modes) ───
function S7({book:b,setBook:sb,onNext}){
  var [mode,setMode]=useState(null);var [rc,setRc]=useState(null);var [ld,setLd]=useState(false);var [res,setRes]=useState(null);
  var chs=(b.outline||{}).chapters||[];var wr=chs.map((_,i)=>i).filter(i=>((b.chapterContent||{})[i]||"").trim().length>50);
  var modes={proofread:{i:"🔍",l:"Proofread",c:"#42A5F5"},embellish:{i:"✨",l:"Embellish",c:"#D4A853"},critique:{i:"⚔️",l:"Critique",c:"#EF5350"},rewrite:{i:"🔄",l:"Rewrite",c:"#66BB6A"}};
  async function run(idx){setLd(true);setRes(null);var ch=chs[idx],ct=(b.chapterContent||{})[idx]||"";
    var voiceInst=b.voiceProfile&&mode==="rewrite"?`\nMatch this voice: ${b.voiceProfile.styleInstructions}`:"";
    var ps={
      proofread:`Proofread. JSON: {"corrections":[{"original":"...","corrected":"...","reason":"..."}],"overallGrade":"A-F","summary":"..."}`,
      embellish:`Enhance for bestseller. JSON: {"enhancedSections":[{"suggestion":"...","why":"..."}],"sensoryDetails":["..."]}`,
      critique:`Harsh ${b.genre} bestseller critique. JSON: {"strengths":["..."],"weaknesses":["..."],"bestsellerReadiness":1-10,"actionItems":["ranked"],"competitiveAnalysis":"vs current ${b.genre} bestsellers"}`,
      rewrite:`Rewrite to bestseller quality. Same plot, elevated prose.${voiceInst} JSON: {"rewrittenText":"full chapter","changesExplained":["..."]}`,
    };
    var raw=await ai(`${b.genre} Ch.${ch.number} "${ch.title}":\n${ct.substring(0,15000)}\n\n${ps[mode]}`,"Ruthlessly honest NYT editor. ONLY JSON.");
    setRes(pJ(raw)||{error:"Try again."});setLd(false);
  }
  return <Cd title="AI Review Studio" sub="Proofread, embellish, critique, or rewrite">
    {!mode&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
      {Object.entries(modes).map(([k,v])=><div key={k} onClick={()=>setMode(k)} style={{padding:16,borderRadius:7,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{fontSize:26,marginBottom:3}}>{v.i}</div><div style={{color:v.c,fontWeight:700,fontSize:12}}>{v.l}</div>
      </div>)}
    </div>}
    {mode&&rc===null&&<div>
      <B v="secondary" onClick={()=>setMode(null)} style={{marginBottom:8,padding:"3px 7px",fontSize:12}}>← Back</B>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:4}}>
        {wr.map(idx=><div key={idx} onClick={()=>{setRc(idx);run(idx)}} style={{padding:7,borderRadius:4,cursor:"pointer",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{color:"#fff",fontSize:13,fontWeight:600}}>Ch. {chs[idx].number}: {chs[idx].title}</div>
        </div>)}
      </div>
    </div>}
    {rc!==null&&mode&&<div>
      <B v="secondary" onClick={()=>{setRc(null);setRes(null)}} style={{marginBottom:8,padding:"3px 7px",fontSize:12}}>← Back</B>
      {ld&&<Spin msg={mode==="rewrite"?"Rewriting (matching your voice)...":"Analyzing..."}/>}
      {res&&!res.error&&<div style={{maxHeight:380,overflowY:"auto"}}>
        {mode==="rewrite"&&res.rewrittenText&&<div>
          <div style={{padding:10,background:"rgba(255,255,255,0.02)",borderRadius:5,marginBottom:6}}>
            <div style={{color:"#66BB6A",fontSize:13,fontWeight:600,marginBottom:4}}>Rewritten Chapter</div>
            <p style={{color:"rgba(255,255,255,0.65)",margin:0,fontSize:11,lineHeight:1.5,whiteSpace:"pre-wrap",maxHeight:240,overflowY:"auto"}}>{res.rewrittenText}</p>
          </div>
          <B v="success" onClick={()=>{sb(x=>({...x,chapterContent:{...(x.chapterContent||{}),[rc]:res.rewrittenText}}));setRc(null);setRes(null)}}>Accept Rewrite</B>
        </div>}
        {mode!=="rewrite"&&Object.entries(res).map(([k,v])=>{
          if(!v||(Array.isArray(v)&&!v.length))return null;
          return <div key={k} style={{padding:7,background:"rgba(255,255,255,0.02)",borderRadius:4,marginBottom:4}}>
            <div style={{color:"#D4A853",fontSize:12,fontWeight:600,marginBottom:2}}>{k.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase())}</div>
            {typeof v==="string"||typeof v==="number"?<p style={{color:"rgba(255,255,255,0.75)",margin:0,fontSize:13}}>{String(v)}</p>
            :Array.isArray(v)?v.map((item,j)=><div key={j} style={{paddingLeft:7,borderLeft:"2px solid rgba(212,168,83,0.12)",marginBottom:2}}>
              {typeof item==="string"?<span style={{color:"rgba(255,255,255,0.7)",fontSize:12}}>{item}</span>
              :<div>{Object.entries(item).map(([ik,iv])=><p key={ik} style={{color:"rgba(255,255,255,0.7)",margin:"1px 0",fontSize:12}}><strong style={{color:"rgba(255,255,255,0.65)"}}>{ik}:</strong> {String(iv)}</p>)}</div>}
            </div>):null}
          </div>
        })}
      </div>}
    </div>}
    <div style={{marginTop:12,display:"flex",justifyContent:"flex-end"}}><B onClick={onNext}>Continue →</B></div>
  </Cd>;
}

// ─── S8: BOOK DESCRIPTION ───
function S8({book:b,setBook:sb,onNext}){
  var [ld,setLd]=useState(false);
  async function gen(){setLd(true);
    var raw=await ai(`Amazon description for "${b.title}" (${b.genre}). Reader: ${b.targetReader||"general"}. Impact: ${b.impact||"N/A"}. Angle: ${b.uniqueAngle||"N/A"}.\nFormula: 1.HOOK (curiosity) 2.STAKES (specific details) 3.PROMISE (how they'll feel) 4.COMPS ("fans of...") 5.TROPES (if romance/fantasy) 6.CTA\nReturn JSON: {"fullDescription":"with <b> <br> HTML (max 4000 chars)","hook":"one line for ads","oneLiner":"social pitch","backCoverBlurb":"150-200 words"}`,"Amazon copywriter. ONLY JSON.");
    var p=pJ(raw);if(p)sb(x=>({...x,description:p}));setLd(false);
  }
  var d=b.description;
  return <Cd title="Book Description" sub="Amazon listing, back cover, and social pitch">
    <Inf text="Your description is your #1 sales tool. 70% of Amazon purchases are influenced by it."/>
    {!d&&!ld&&<B onClick={gen}>Generate Description</B>}
    {ld&&<Spin msg="Crafting sales copy..."/>}
    {d&&<div style={{display:"grid",gap:8}}>
      {[["Amazon Description","fullDescription",5],["Hook Line (ads)","hook",0],["One-Liner (social)","oneLiner",0],["Back Cover (print)","backCoverBlurb",3]].map(([l,k,r])=><div key={k} style={{padding:9,background:"rgba(255,255,255,0.02)",borderRadius:5}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
          <span style={{color:"#D4A853",fontSize:13,fontWeight:600}}>{l}</span>
          {k==="fullDescription"&&<span style={{color:"rgba(255,255,255,0.6)",fontSize:12}}>{(d[k]||"").length}/4,000</span>}
        </div>
        {r>0?<TA value={d[k]||""} onChange={v=>sb(x=>({...x,description:{...x.description,[k]:v}}))} rows={r}/>
        :<Inp value={d[k]||""} onChange={v=>sb(x=>({...x,description:{...x.description,[k]:v}}))}/>}
      </div>)}
      <div style={{display:"flex",gap:6}}><B v="secondary" onClick={gen}>Regenerate</B><B onClick={onNext}>Continue →</B></div>
    </div>}
  </Cd>;
}

// ─── S9: PUBLISHING SETUP (Keywords, Categories, Pricing, Comps, Ads) ───
function S9({book:b,setBook:sb,onNext}){
  var [tab,setTab]=useState("keywords");var [ld,setLd]=useState(false);
  var genK=async()=>{setLd(true);var r=await ai(`Amazon KDP backend keywords for "${b.title}" (${b.genre}). Reader: ${b.targetReader||"general"}.\nRULES: 7 boxes, max 249 BYTES each. No words from title "${b.title}" or subtitle "${b.subtitle||""}". Include tropes, comp authors, synonyms, reader language.\nReturn JSON: {"boxes":["box1","box2","box3","box4","box5","box6","box7"],"strategy":"...","tips":["3 tips"]}`,"KDP keyword expert. ONLY JSON.");var p=pJ(r);if(p)sb(x=>({...x,keywords:p}));setLd(false)};
  var genC=async()=>{setLd(true);var r=await ai(`3 Amazon KDP categories for "${b.title}" (${b.genre}). DEEPEST subcategories possible. Avoid ghost categories. Target where 10-100 sales/day = Top 10.\nReturn JSON: {"categories":[{"path":"full path","reason":"...","salesForTop10":"...","competition":"LOW/MOD/HIGH"}],"strategy":"...","warning":"..."}`,"Category expert. ONLY JSON.");var p=pJ(r);if(p)sb(x=>({...x,categories:p}));setLd(false)};
  var genP=async()=>{setLd(true);var r=await ai(`Pricing for "${b.title}" (${b.genre}, ${b.bookType||"Standalone"}). $2.99 min for 70% royalty ($2.09/sale). $0.99 = 35% ($0.35). Above $9.99 drops to 35%.\nReturn JSON: {"launchPrice":"...","launchRoyalty":"...","launchDuration":"...","transitionPrice":"...","longTermPrice":"...","longTermRoyalty":"...","printPrice":"...","reasoning":"...","seriesNote":"..."}`,"Pricing strategist. ONLY JSON.");var p=pJ(r);if(p)sb(x=>({...x,pricing:p}));setLd(false)};
  var genCo=async()=>{setLd(true);var r=await ai(`5 comparable bestsellers for "${b.title}" (${b.genre}). Reader: ${b.targetReader||"general"}.\nReturn JSON: {"compTitles":[{"title":"...","author":"...","whySimilar":"...","whatToLearn":"..."}],"positioning":"...","adTargeting":"which comp authors to target in Amazon Ads"}`,"Book analyst. ONLY JSON.");var p=pJ(r);if(p)sb(x=>({...x,compTitles:p}));setLd(false)};
  // Item 5: Amazon Ads campaign builder
  var genAds=async()=>{setLd(true);var r=await ai(`Build 3 Amazon Ads campaigns for "${b.title}" (${b.genre}). Comp titles: ${((b.compTitles||{}).compTitles||[]).map(c=>c.title+" by "+c.author).join(", ")||"not yet identified"}.\nReturn JSON: {"campaigns":[{"name":"...","type":"Sponsored Products","targetingStrategy":"...","keywords":["10-15 keywords"],"suggestedBid":"$X.XX","dailyBudget":"$X.XX","notes":"..."}],"totalMonthlyBudget":"...","optimizationTips":["3 tips for first 2 weeks"],"killCriteria":"when to kill a keyword"}`,"Amazon Ads expert. ONLY JSON.");var p=pJ(r);if(p)sb(x=>({...x,adsCampaigns:p}));setLd(false)};
  // Audiobook strategy generator
  var genAudio=async()=>{setLd(true);var wds=wc(b)||40000;var hrs=Math.round(wds/9300*10)/10;var r=await ai("Audiobook production strategy for \""+b.title+"\" ("+b.genre+", ~"+wds+" words = ~"+hrs+" finished hours).\n\nConsider:\n- ACX/Audible exclusive = 40% royalty. Non-exclusive = 25%\n- Human narrator cost: $150-$400/finished hour\n- AI narration now allowed on ACX (much cheaper but less premium)\n- Audible sets retail price based on length (author cannot set it)\n- Findaway Voices for wide distribution (Apple Books, Google Play, Kobo, Chirp)\n- Audiobook listeners are a DIFFERENT audience than ebook readers — incremental revenue\n\nReturn JSON: {\"estimatedLength\":\"X hours\",\"audioPricing\":{\"retailEstimate\":\"$X-$X (set by Audible)\",\"royaltyExclusive\":\"40% = ~$X per sale\",\"royaltyNonExclusive\":\"25% = ~$X per sale\"},\"productionOptions\":[{\"option\":\"...\",\"cost\":\"...\",\"quality\":\"...\",\"timeline\":\"...\",\"bestFor\":\"...\"}],\"distributionStrategy\":\"exclusive vs wide and why\",\"narratorGuidance\":\"what to look for or how to direct AI narration for "+b.genre+"\",\"launchTiming\":\"when to release audiobook relative to ebook/print\",\"tips\":[\"3 audiobook-specific marketing tips\"]}","Audiobook production expert. ONLY JSON.");var p=pJ(r);if(p)sb(x=>({...x,audiobook:p}));setLd(false)};

  var tabs=[{id:"keywords",l:"🔑 Keywords"},{id:"categories",l:"📂 Categories"},{id:"pricing",l:"💰 Pricing"},{id:"audiobook",l:"🎧 Audiobook"},{id:"comps",l:"📚 Comps"},{id:"ads",l:"📣 Ads"}];
  return <Cd title="Publishing Setup" sub="Keywords, categories, pricing, comps, ads, and audiobook">
    <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
      {tabs.map(function(t){return <button key={t.id} onClick={function(){setTab(t.id)}} style={{padding:"10px 16px",borderRadius:8,fontSize:14,fontWeight:700,background:tab===t.id?"#D4A853":"rgba(255,255,255,0.06)",color:tab===t.id?"#0f1b33":"rgba(255,255,255,0.5)",border:tab===t.id?"2px solid #D4A853":"2px solid rgba(255,255,255,0.1)",cursor:"pointer"}}>{t.l}</button>})}
    </div>
    {tab==="keywords"&&<div>
      <Inf text="7 backend keyword boxes (249 bytes each). Never repeat title words. Include tropes, comp authors, synonyms. A10 algorithm uses these for semantic matching."/>
      {!b.keywords&&!ld&&<B onClick={genK}>Generate Keywords</B>}
      {ld&&<Spin msg="Optimizing for A10..."/>}
      {b.keywords&&<div style={{display:"grid",gap:5}}>
        {b.keywords.strategy&&<Inf text={b.keywords.strategy}/>}
        {(b.keywords.boxes||[]).map((box,i)=><div key={i} style={{padding:8,background:"rgba(255,255,255,0.02)",borderRadius:5}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
            <span style={{color:"#D4A853",fontSize:12,fontWeight:600}}>Box {i+1}</span>
            <span style={{color:(typeof TextEncoder!=="undefined"?new TextEncoder().encode(box).length:box.length)>249?"#EF5350":"rgba(255,255,255,0.25)",fontSize:12}}>{(typeof TextEncoder!=="undefined"?new TextEncoder().encode(box).length:box.length)}/249 bytes</span>
          </div>
          <Inp value={box} onChange={v=>{var bx=[...(b.keywords.boxes||[])];bx[i]=v;sb(x=>({...x,keywords:{...x.keywords,boxes:bx}}))}}/>
        </div>)}
        <B v="secondary" onClick={genK}>Regenerate</B>
      </div>}
    </div>}
    {tab==="categories"&&<div>
      <Inf text="3 category slots. Choose DEEPEST subcategories. 27% of KDP categories are ghost categories with no bestseller list."/>
      {!b.categories&&!ld&&<B onClick={genC}>Generate Categories</B>}
      {ld&&<Spin msg="Analyzing categories..."/>}
      {b.categories&&<div>
        {b.categories.strategy&&<Inf text={b.categories.strategy}/>}
        {(b.categories.categories||[]).map((cat,i)=><div key={i} style={{padding:10,background:"rgba(255,255,255,0.02)",borderRadius:5,marginBottom:4,borderLeft:"3px solid rgba(212,168,83,0.25)"}}>
          <div style={{color:"#D4A853",fontSize:13,fontWeight:600}}>Category {i+1}</div>
          <p style={{color:"#fff",margin:"2px 0",fontSize:11}}>{cat.path}</p>
          <p style={{color:"rgba(255,255,255,0.65)",margin:"1px 0",fontSize:12}}>{cat.reason}</p>
          <span style={{fontSize:12,color:"rgba(255,255,255,0.6)"}}>Top 10: ~{cat.salesForTop10}/day • {cat.competition}</span>
        </div>)}
        <B v="secondary" onClick={genC}>Regenerate</B>
      </div>}
    </div>}
    {tab==="pricing"&&<div>
      <Inf text="70% royalty: $2.99-$9.99. At $0.99 = $0.35/sale. At $2.99 = $2.09 (6x more). Launch low for velocity, then raise."/>
      {!b.pricing&&!ld&&<B onClick={genP}>Generate Pricing</B>}
      {ld&&<Spin msg="Calculating..."/>}
      {b.pricing&&<div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
          {[["Launch","launchPrice","launchRoyalty"],["Transition","transitionPrice",""],["Long-term","longTermPrice","longTermRoyalty"]].map(([l,pk,rk])=><div key={l} style={{padding:10,background:"rgba(255,255,255,0.02)",borderRadius:5,textAlign:"center"}}>
            <div style={{color:"rgba(255,255,255,0.65)",fontSize:12,textTransform:"uppercase",marginBottom:3}}>{l}</div>
            <div style={{color:"#D4A853",fontSize:18,fontWeight:900}}>{b.pricing[pk]||"—"}</div>
            {rk&&b.pricing[rk]&&<div style={{color:"rgba(255,255,255,0.6)",fontSize:12}}>{b.pricing[rk]}/sale</div>}
          </div>)}
        </div>
        {b.pricing.reasoning&&<Inf text={b.pricing.reasoning}/>}
        <B v="secondary" onClick={genP}>Regenerate</B>
      </div>}
    </div>}
    {tab==="comps"&&<div>
      <Inf text="Comp titles for positioning, description ('fans of...'), and Amazon Ads targeting."/>
      {!b.compTitles&&!ld&&<B onClick={genCo}>Find Comps</B>}
      {ld&&<Spin msg="Researching..."/>}
      {b.compTitles&&<div>
        {b.compTitles.positioning&&<Inf text={b.compTitles.positioning}/>}
        {(b.compTitles.compTitles||[]).map((c,i)=><div key={i} style={{padding:8,background:"rgba(255,255,255,0.02)",borderRadius:4,marginBottom:3,borderLeft:"3px solid rgba(212,168,83,0.2)"}}>
          <div style={{color:"#fff",fontSize:11,fontWeight:600}}>{c.title} <span style={{color:"rgba(255,255,255,0.65)",fontWeight:400}}>by {c.author}</span></div>
          <p style={{color:"rgba(255,255,255,0.65)",margin:"2px 0",fontSize:12}}>{c.whySimilar}</p>
          <p style={{color:"#D4A853",margin:0,fontSize:12}}>📝 {c.whatToLearn}</p>
        </div>)}
        <B v="secondary" onClick={genCo}>Regenerate</B>
      </div>}
    </div>}
    {tab==="ads"&&<div>
      <Inf text="Amazon Ads are the #1 paid driver of book sales. These campaigns target your comp titles' readers directly."/>
      {!b.adsCampaigns&&!ld&&<B onClick={genAds} disabled={!b.compTitles}>Generate Ad Campaigns {!b.compTitles&&"(find comps first)"}</B>}
      {ld&&<Spin msg="Building ad campaigns..."/>}
      {b.adsCampaigns&&<div>
        {b.adsCampaigns.totalMonthlyBudget&&<div style={{padding:8,background:"rgba(212,168,83,0.06)",borderRadius:5,marginBottom:8,textAlign:"center"}}>
          <span style={{color:"rgba(255,255,255,0.7)",fontSize:12}}>Suggested Monthly Budget: </span>
          <span style={{color:"#D4A853",fontSize:14,fontWeight:700}}>{b.adsCampaigns.totalMonthlyBudget}</span>
        </div>}
        {(b.adsCampaigns.campaigns||[]).map((camp,i)=><div key={i} style={{padding:10,background:"rgba(255,255,255,0.02)",borderRadius:5,marginBottom:5,borderLeft:"3px solid rgba(212,168,83,0.3)"}}>
          <div style={{color:"#D4A853",fontSize:13,fontWeight:600}}>{camp.name}</div>
          <p style={{color:"rgba(255,255,255,0.7)",margin:"2px 0",fontSize:12}}>{camp.targetingStrategy}</p>
          <div style={{display:"flex",gap:8,marginBottom:4}}>
            <span style={{color:"rgba(255,255,255,0.6)",fontSize:12}}>Bid: {camp.suggestedBid}</span>
            <span style={{color:"rgba(255,255,255,0.6)",fontSize:12}}>Daily: {camp.dailyBudget}</span>
          </div>
          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
            {(camp.keywords||[]).map((kw,j)=><span key={j} style={{fontSize:10,padding:"1px 4px",borderRadius:2,background:"rgba(212,168,83,0.07)",color:"rgba(212,168,83,0.8)"}}>{kw}</span>)}
          </div>
        </div>)}
        {b.adsCampaigns.killCriteria&&<Inf text={"Kill criteria: "+b.adsCampaigns.killCriteria}/>}
        {b.adsCampaigns.optimizationTips&&<div>{b.adsCampaigns.optimizationTips.map((t,i)=><p key={i} style={{color:"rgba(255,255,255,0.65)",margin:"2px 0",fontSize:12}}>💡 {t}</p>)}</div>}
        <B v="secondary" onClick={genAds}>Regenerate</B>
      </div>}
    </div>}
    {tab==="audiobook"&&<div>
      <Inf text={"Audiobooks are a separate revenue stream — listeners are often different people than ebook readers. Your book at ~"+((wc(b)||40000)/9300).toFixed(1)+" finished hours would likely retail at $14.99-$19.99 on Audible. You don't set the Audible price — they do."}/>
      {!b.audiobook&&!ld&&<B onClick={genAudio}>Generate Audiobook Strategy</B>}
      {ld&&<Spin msg="Building audiobook production plan..."/>}
      {b.audiobook&&<div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
          <div style={{padding:10,background:"rgba(255,255,255,0.02)",borderRadius:5,textAlign:"center"}}>
            <div style={{color:"rgba(255,255,255,0.65)",fontSize:12,textTransform:"uppercase",marginBottom:3}}>Estimated Length</div>
            <div style={{color:"#D4A853",fontSize:18,fontWeight:900}}>{b.audiobook.estimatedLength||"—"}</div>
          </div>
          {b.audiobook.audioPricing&&<div style={{padding:10,background:"rgba(255,255,255,0.02)",borderRadius:5,textAlign:"center"}}>
            <div style={{color:"rgba(255,255,255,0.65)",fontSize:12,textTransform:"uppercase",marginBottom:3}}>Retail (Audible sets)</div>
            <div style={{color:"#D4A853",fontSize:16,fontWeight:700}}>{b.audiobook.audioPricing.retailEstimate}</div>
          </div>}
          {b.audiobook.audioPricing&&<div style={{padding:10,background:"rgba(255,255,255,0.02)",borderRadius:5,textAlign:"center"}}>
            <div style={{color:"rgba(255,255,255,0.65)",fontSize:12,textTransform:"uppercase",marginBottom:3}}>Royalty (Exclusive)</div>
            <div style={{color:"#66BB6A",fontSize:14,fontWeight:700}}>{b.audiobook.audioPricing.royaltyExclusive}</div>
          </div>}
        </div>
        <div style={{color:"#D4A853",fontSize:12,fontWeight:600,marginBottom:6}}>Production Options</div>
        {(b.audiobook.productionOptions||[]).map(function(opt,i){return <div key={i} style={{padding:12,background:"rgba(255,255,255,0.02)",borderRadius:6,marginBottom:5,borderLeft:"3px solid rgba(212,168,83,0.3)"}}>
          <div style={{color:"#fff",fontSize:13,fontWeight:600,marginBottom:4}}>{opt.option}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:4}}>
            <div><span style={{color:"rgba(255,255,255,0.65)",fontSize:13}}>Cost: </span><span style={{color:"#D4A853",fontSize:11,fontWeight:600}}>{opt.cost}</span></div>
            <div><span style={{color:"rgba(255,255,255,0.65)",fontSize:13}}>Quality: </span><span style={{color:"rgba(255,255,255,0.6)",fontSize:11}}>{opt.quality}</span></div>
            <div><span style={{color:"rgba(255,255,255,0.65)",fontSize:13}}>Timeline: </span><span style={{color:"rgba(255,255,255,0.6)",fontSize:11}}>{opt.timeline}</span></div>
          </div>
          <p style={{color:"rgba(255,255,255,0.7)",margin:0,fontSize:11}}>{opt.bestFor}</p>
        </div>})}
        {b.audiobook.distributionStrategy&&<div style={{marginBottom:8}}>
          <div style={{color:"#D4A853",fontSize:12,fontWeight:600,marginBottom:4}}>Distribution Strategy</div>
          <Inf text={b.audiobook.distributionStrategy}/>
        </div>}
        {b.audiobook.narratorGuidance&&<div style={{marginBottom:8}}>
          <div style={{color:"#D4A853",fontSize:12,fontWeight:600,marginBottom:4}}>Narrator Guidance</div>
          <Inf text={b.audiobook.narratorGuidance}/>
        </div>}
        {b.audiobook.launchTiming&&<div style={{marginBottom:8}}>
          <div style={{color:"#D4A853",fontSize:12,fontWeight:600,marginBottom:4}}>Launch Timing</div>
          <Inf text={b.audiobook.launchTiming}/>
        </div>}
        {b.audiobook.tips&&<div style={{marginTop:6}}>{b.audiobook.tips.map(function(t,i){return <p key={i} style={{color:"rgba(255,255,255,0.7)",margin:"3px 0",fontSize:12}}>💡 {t}</p>})}</div>}
        <B v="secondary" onClick={genAudio}>Regenerate</B>
      </div>}
    </div>}
    <div style={{marginTop:12,display:"flex",justifyContent:"flex-end"}}><B onClick={onNext}>Continue →</B></div>
  </Cd>;
}

// ─── S10: COVER DESIGN (B1 fix, Item 4: mockup, Item 11: persist cover, specs) ───
function S10({book:b,setBook:sb,onNext}){
  var [cm,setCm]=useState(null);var [pal,setPal]=useState(0);var [sc,setSc]=useState(3);
  var gc=GC[b.genre]||"#D4A853";var st=b.seriesTitles||{};
  // Item 11: Use persisted cover from book state, fall back to local
  var [localUpl,setLocalUpl]=useState(null);
  var upl = b.uploadedCover || localUpl;
  function handleCoverUpload(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=ev=>{
    var img=ev.target.result;setLocalUpl(img);
    // Persist if small enough (<2MB to be safe with 5MB storage limit)
    if(img.length<2000000)sb(x=>({...x,uploadedCover:img}));
  };r.readAsDataURL(f)}
  function Cvr({title,subtitle,author,color,w=200,h=300,img}){
    if(img)return <div style={{width:w,height:h,borderRadius:5,overflow:"hidden",boxShadow:"0 6px 24px rgba(0,0,0,0.4)",flexShrink:0}}><img src={img} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>;
    return <div style={{width:w,height:h,borderRadius:5,overflow:"hidden",position:"relative",background:`linear-gradient(160deg,${color},${color}CC,#0a0a0a)`,boxShadow:"0 6px 24px rgba(0,0,0,0.4)",flexShrink:0,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:12,textAlign:"center",border:"1px solid rgba(255,255,255,0.08)"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"radial-gradient(ellipse at 30% 20%,rgba(255,255,255,0.07) 0%,transparent 60%)"}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{fontSize:w>140?16:10,fontWeight:900,color:"#fff",lineHeight:1.2,textTransform:"uppercase",letterSpacing:2,textShadow:"0 2px 6px rgba(0,0,0,0.5)",marginBottom:4,fontFamily:"Georgia,serif"}}>{title||"Title"}</div>
        {subtitle&&<div style={{fontSize:w>140?8:5,color:"rgba(255,255,255,0.7)",marginBottom:6,fontStyle:"italic"}}>{subtitle}</div>}
        <div style={{width:28,height:2,background:"#D4A853",margin:"6px auto"}}/>
        <div style={{fontSize:w>140?10:6,color:"#D4A853",letterSpacing:2,textTransform:"uppercase",fontWeight:600}}>{author||"Author"}</div>
      </div>
    </div>
  }
  // B1 FIX: position relative on spine parent
  function Spn({n,color,title}){return <div style={{width:28,height:280,borderRadius:2,position:"relative",background:`linear-gradient(180deg,${color},${color}BB)`,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",border:"1px solid rgba(255,255,255,0.08)",boxShadow:"2px 0 6px rgba(0,0,0,0.25)"}}>
    <div style={{writingMode:"vertical-rl",transform:"rotate(180deg)",fontSize:6,color:"#fff",fontWeight:700,letterSpacing:1,textTransform:"uppercase",maxHeight:220,overflow:"hidden"}}>{title||`Book ${n}`}</div>
    <div style={{position:"absolute",bottom:4,width:12,height:12,borderRadius:"50%",background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:6,color:"#fff",fontWeight:700}}>{n}</div>
  </div>}
  // Item 4: BookTok mockup scene
  function MockupScene(){
    return <div style={{marginTop:14}}>
      <div style={{color:"#D4A853",fontSize:11,fontWeight:600,marginBottom:6}}>📸 BookTok Mockup Scene</div>
      <div style={{position:"relative",width:"100%",height:200,background:"linear-gradient(135deg,#1a1510 0%,#2a2018 50%,#1a1510 100%)",borderRadius:8,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",gap:16}}>
        {/* Coffee cup */}
        <div style={{width:40,height:45,borderRadius:"0 0 6px 6px",background:"rgba(139,90,43,0.4)",border:"2px solid rgba(139,90,43,0.6)",position:"relative"}}>
          <div style={{position:"absolute",top:-6,right:-10,width:10,height:20,border:"2px solid rgba(139,90,43,0.5)",borderLeft:"none",borderRadius:"0 8px 8px 0"}}/>
        </div>
        {/* Book standing up at angle */}
        <div style={{transform:"perspective(300px) rotateY(-8deg)",transformOrigin:"center bottom"}}>
          <Cvr title={b.title} author={b.authorName} color={b.coverColor||gc} w={100} h={150}/>
        </div>
        {/* Small plant */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{width:3,height:30,background:"rgba(76,175,80,0.5)"}}/>
          <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(76,175,80,0.25)",marginTop:-8}}/>
          <div style={{width:24,height:14,borderRadius:"4px 4px 0 0",background:"rgba(121,85,72,0.4)",marginTop:2}}/>
        </div>
        {/* Aesthetic overlay */}
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"radial-gradient(circle at 50% 30%,rgba(212,168,83,0.06) 0%,transparent 60%)"}}/>
      </div>
      <p style={{color:"rgba(255,255,255,0.6)",fontSize:12,marginTop:4}}>Use this aesthetic for your cover reveal post. Film from above with real coffee + your printed book for maximum BookTok engagement.</p>
    </div>
  }
  return <Cd title="Cover Design" sub="Upload your covers, design concepts, or coordinate a series">
    {!cm&&<div>
      <Inf text="Cover specs: Ebook = 2,560×1,600px (1.6:1), RGB, 72-150 DPI, PNG/JPEG. Print = 300 DPI, CMYK, PDF w/bleed. Audiobook = 3,200×3,200px square."/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        {[["📤","Upload Single Cover","One book, one cover","upload"],["📚","Upload Series Covers","Multiple books, drag all at once","series"],["📁","Upload Cover Folders","Folders with multiple formats per book","folders"],["🎨","Design Concepts","Explore colors, palettes, mockups","single"]].map(function(item){return <div key={item[3]} onClick={function(){setCm(item[3])}} style={{padding:18,borderRadius:8,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.02)",border:"2px solid rgba(255,255,255,0.06)"}}>
          <div style={{fontSize:32,marginBottom:4}}>{item[0]}</div>
          <div style={{color:"#D4A853",fontWeight:700,fontSize:13,marginBottom:3}}>{item[1]}</div>
          <div style={{color:"rgba(255,255,255,0.7)",fontSize:11}}>{item[2]}</div>
        </div>})}
      </div>
    </div>}
    {cm==="upload"&&<div>
      <B v="secondary" onClick={function(){setCm(null)}} style={{marginBottom:10,padding:"4px 10px",fontSize:13}}>← Back</B>
      <div onDrop={function(e){e.preventDefault();e.stopPropagation();var f=e.dataTransfer.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){var img=ev.target.result;setLocalUpl(img);if(img.length<2000000)sb(function(x){return Object.assign({},x,{uploadedCover:img})})};r.readAsDataURL(f)}}
        onDragOver={function(e){e.preventDefault()}}
        style={{border:"3px dashed rgba(212,168,83,0.3)",borderRadius:12,padding:30,textAlign:"center",marginBottom:16,background:"rgba(255,255,255,0.01)",cursor:"pointer",position:"relative"}}>
        {upl
          ?<div><img src={upl} style={{maxWidth:"100%",maxHeight:300,borderRadius:6,boxShadow:"0 6px 24px rgba(0,0,0,0.4)"}}/><p style={{color:"#66BB6A",fontSize:12,marginTop:8}}>✓ Cover uploaded</p></div>
          :<div>
            <div style={{fontSize:48,marginBottom:8}}>📤</div>
            <div style={{color:"#D4A853",fontSize:16,fontWeight:600,marginBottom:4}}>Drag & drop your cover image here</div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:12}}>Front-only or full wrap (front + spine + back)</div>
          </div>
        }
        <input type="file" accept="image/*" onChange={handleCoverUpload} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0,cursor:"pointer"}}/>
      </div>
      {/* Wrap cover text editor */}
      {upl&&<div>
        <Inf text="If this is a full wrap cover (front + spine + back), use the fields below to specify the text that needs to be added. Copy these specs to your designer or use them in Canva/InDesign."/>
        <div style={{display:"grid",gap:12}}>
          <div style={{padding:14,background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid rgba(212,168,83,0.1)"}}>
            <div style={{color:"#D4A853",fontSize:13,fontWeight:700,marginBottom:8}}>Front Cover Text</div>
            <div style={{display:"grid",gap:6}}>
              <div><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,display:"block",marginBottom:2}}>Title</label>
                <Inp value={b.coverText_frontTitle||(b.title||"")} onChange={function(v){sb(function(x){return Object.assign({},x,{coverText_frontTitle:v})})}}/></div>
              <div><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,display:"block",marginBottom:2}}>Subtitle</label>
                <Inp value={b.coverText_frontSubtitle||(b.subtitle||"")} onChange={function(v){sb(function(x){return Object.assign({},x,{coverText_frontSubtitle:v})})}}/></div>
              <div><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,display:"block",marginBottom:2}}>Author Name</label>
                <Inp value={b.coverText_frontAuthor||(b.authorName||"")} onChange={function(v){sb(function(x){return Object.assign({},x,{coverText_frontAuthor:v})})}}/></div>
              <div><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,display:"block",marginBottom:2}}>Tagline / Endorsement (optional)</label>
                <Inp value={b.coverText_frontTagline||""} onChange={function(v){sb(function(x){return Object.assign({},x,{coverText_frontTagline:v})})}} placeholder="e.g. 'From $15M to $1B — and back again'"/></div>
            </div>
          </div>
          <div style={{padding:14,background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid rgba(212,168,83,0.1)"}}>
            <div style={{color:"#D4A853",fontSize:13,fontWeight:700,marginBottom:8}}>Spine Text</div>
            <div style={{display:"grid",gap:6}}>
              <div><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,display:"block",marginBottom:2}}>Spine Title</label>
                <Inp value={b.coverText_spineTitle||(b.title||"")} onChange={function(v){sb(function(x){return Object.assign({},x,{coverText_spineTitle:v})})}}/></div>
              <div><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,display:"block",marginBottom:2}}>Spine Author</label>
                <Inp value={b.coverText_spineAuthor||(b.authorName||"")} onChange={function(v){sb(function(x){return Object.assign({},x,{coverText_spineAuthor:v})})}}/></div>
              <div><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,display:"block",marginBottom:2}}>Publisher / Imprint (optional)</label>
                <Inp value={b.coverText_spinePublisher||""} onChange={function(v){sb(function(x){return Object.assign({},x,{coverText_spinePublisher:v})})}} placeholder="e.g. Macurdy Press"/></div>
            </div>
          </div>
          <div style={{padding:14,background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid rgba(212,168,83,0.1)"}}>
            <div style={{color:"#D4A853",fontSize:13,fontWeight:700,marginBottom:8}}>Back Cover Text</div>
            <div style={{display:"grid",gap:6}}>
              <div><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,display:"block",marginBottom:2}}>Back Cover Blurb</label>
                <TA value={b.coverText_backBlurb||(b.description&&b.description.backCoverBlurb?b.description.backCoverBlurb:"")} onChange={function(v){sb(function(x){return Object.assign({},x,{coverText_backBlurb:v})})}} placeholder="Your book description for the back cover (150-200 words)..." rows={4}/></div>
              <div><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,display:"block",marginBottom:2}}>Author Bio (short)</label>
                <TA value={b.coverText_backBio||(b.backMatter&&b.backMatter.aboutAuthor?b.backMatter.aboutAuthor.substring(0,300):"")} onChange={function(v){sb(function(x){return Object.assign({},x,{coverText_backBio:v})})}} placeholder="About the author (50-100 words for back cover)..." rows={2}/></div>
              <div><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,display:"block",marginBottom:2}}>Endorsement / Pull Quote (optional)</label>
                <Inp value={b.coverText_backEndorsement||""} onChange={function(v){sb(function(x){return Object.assign({},x,{coverText_backEndorsement:v})})}} placeholder="e.g. 'A must-read for anyone...' — Name, Title"/></div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,display:"block",marginBottom:2}}>ISBN / Barcode Area</label>
                  <Inp value={b.coverText_backISBN||""} onChange={function(v){sb(function(x){return Object.assign({},x,{coverText_backISBN:v})})}} placeholder="ISBN-13: 978-X-XXXX-XXXX-X"/></div>
                <div style={{flex:1}}><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,display:"block",marginBottom:2}}>Price / Category</label>
                  <Inp value={b.coverText_backPrice||(b.pricing?b.pricing.printPrice||"":""|"")} onChange={function(v){sb(function(x){return Object.assign({},x,{coverText_backPrice:v})})}} placeholder="e.g. Self-Help / $16.99 US"/></div>
              </div>
            </div>
          </div>
        </div>
        <Inf text="Spine width depends on page count and paper stock. KDP's cover calculator at kdp.amazon.com/cover-calculator gives exact spine width. Typically 0.5-1.0 inches for 200-400 page books."/>
        <MockupScene/>
      </div>}
    </div>}
    {cm==="folders"&&<div>
      <B v="secondary" onClick={function(){setCm(null)}} style={{marginBottom:10,padding:"4px 10px",fontSize:13}}>← Back</B>
      <Inf text="Select a folder that contains subfolders for each book. Each subfolder should have the different cover formats (ebook, print wrap, audiobook square, social). The agent auto-detects which file is for which format based on filename."/>
      {/* Folder upload */}
      <div style={{border:"3px dashed rgba(212,168,83,0.25)",borderRadius:12,padding:28,textAlign:"center",marginBottom:14,background:"rgba(255,255,255,0.01)",cursor:"pointer",position:"relative"}}>
        <div style={{fontSize:40,marginBottom:6}}>📁</div>
        <div style={{color:"#D4A853",fontSize:15,fontWeight:600,marginBottom:4}}>Select your covers folder</div>
        <div style={{color:"rgba(255,255,255,0.7)",fontSize:12,marginBottom:4}}>Pick a folder with subfolders per book, or a flat folder of cover files</div>
        <div style={{color:"rgba(255,255,255,0.6)",fontSize:11}}>Agent auto-detects: ebook, print, audiobook, social from filenames</div>
        <input type="file" webkitdirectory="" multiple onChange={function(e){
          var files=Array.from(e.target.files).filter(function(f){return f.type.startsWith("image/")});
          if(!files.length)return;
          // Parse folder structure
          var books={};
          var formats=["ebook","kindle","front","print","wrap","full","kdp","audio","square","acx","social","feed","story","twitter","linkedin","ingram","hardcover","hard","back","spine"];
          files.forEach(function(f){
            var path=f.webkitRelativePath||f.name;
            var parts=path.split("/");
            var bookName="default";
            var fileName=parts[parts.length-1].toLowerCase();
            // If there's a subfolder, use it as book name
            if(parts.length>=3)bookName=parts[1];
            else if(parts.length===2)bookName=parts[0];
            // Detect format from filename
            var fmt="other";
            if(/ebook|kindle|^front[^a-z]/i.test(fileName))fmt="ebook";
            else if(/audio|square|acx/i.test(fileName))fmt="audiobook";
            else if(/social|feed|story|twitter|linkedin|promo/i.test(fileName))fmt="social";
            else if(/ingram/i.test(fileName))fmt="ingram";
            else if(/hardcover|hard_cover/i.test(fileName))fmt="hardcover";
            else if(/print|wrap|full|kdp|paperback/i.test(fileName))fmt="print";
            else if(/back[^g]/i.test(fileName))fmt="back";
            else if(/spine/i.test(fileName))fmt="spine";
            else fmt="other";
            if(!books[bookName])books[bookName]={name:bookName,files:{}};
            // Read the file
            var r=new FileReader();
            var bk=bookName;var fm=fmt;var fn=fileName;
            r.onload=function(ev){
              sb(function(x){
                var cf=Object.assign({},(x.coverFiles||{}));
                if(!cf[bk])cf[bk]={name:bk,files:{}};
                cf[bk].files[fm]={data:ev.target.result,fileName:fn};
                return Object.assign({},x,{coverFiles:cf});
              });
            };
            r.readAsDataURL(f);
          });
        }} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0,cursor:"pointer"}}/>
      </div>
      {/* Display organized covers */}
      {b.coverFiles&&Object.keys(b.coverFiles).length>0&&<div>
        <div style={{color:"#D4A853",fontSize:14,fontWeight:700,marginBottom:10}}>Detected Cover Files</div>
        {Object.keys(b.coverFiles).sort().map(function(bookKey){
          var book=b.coverFiles[bookKey];
          var files=book.files||{};
          var fmtLabels={ebook:"📱 Ebook",print:"📖 Print Wrap",audiobook:"🎧 Audiobook",social:"📱 Social",ingram:"🏪 IngramSpark",hardcover:"📕 Hardcover",back:"↩️ Back",spine:"📏 Spine",other:"❓ Other"};
          return <div key={bookKey} style={{marginBottom:16,padding:14,background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid rgba(255,255,255,0.04)"}}>
            <div style={{color:"#fff",fontSize:14,fontWeight:700,marginBottom:8}}>{book.name}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8}}>
              {Object.keys(files).map(function(fmt){
                var file=files[fmt];
                return <div key={fmt} style={{textAlign:"center"}}>
                  <img src={file.data} style={{width:100,height:fmt==="audiobook"?100:150,objectFit:"cover",borderRadius:4,boxShadow:"0 4px 12px rgba(0,0,0,0.3)",marginBottom:4}}/>
                  <div style={{color:"#D4A853",fontSize:11,fontWeight:600}}>{fmtLabels[fmt]||fmt}</div>
                  <div style={{color:"rgba(255,255,255,0.6)",fontSize:12}}>{file.fileName}</div>
                  {/* Reassign format */}
                  <select value={fmt} onChange={function(e){
                    var newFmt=e.target.value;
                    if(newFmt===fmt)return;
                    sb(function(x){
                      var cf=JSON.parse(JSON.stringify(x.coverFiles||{}));
                      var fileData=cf[bookKey].files[fmt];
                      delete cf[bookKey].files[fmt];
                      cf[bookKey].files[newFmt]=fileData;
                      return Object.assign({},x,{coverFiles:cf});
                    });
                  }} style={{marginTop:4,padding:"2px 4px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:3,color:"#D4A853",fontSize:13,cursor:"pointer"}}>
                    {Object.keys(fmtLabels).map(function(k){return <option key={k} value={k} style={{background:"#1a2340",color:"#fff"}}>{fmtLabels[k]}</option>})}
                  </select>
                </div>
              })}
            </div>
          </div>
        })}
        <Inf text={"Detected "+Object.keys(b.coverFiles).length+" book(s) with "+Object.values(b.coverFiles).reduce(function(sum,bk){return sum+Object.keys(bk.files).length},0)+" total cover files. If a format was detected wrong, use the dropdown under each image to reassign it. These covers are stored with your book for reference — export the production files directly to KDP, IngramSpark, and ACX."}/>
      </div>}
    </div>}
    {cm==="single"&&<div>
      <B v="secondary" onClick={function(){setCm(null)}} style={{marginBottom:8,padding:"4px 10px",fontSize:13}}>← Back</B>
      <div style={{display:"flex",gap:20,flexWrap:"wrap",justifyContent:"center"}}>
        <Cvr title={b.title} subtitle={b.subtitle} author={b.authorName} color={b.coverColor||gc} img={upl}/>
        <div style={{flex:1,minWidth:180}}>
          <label style={{color:"rgba(255,255,255,0.65)",fontSize:12,marginBottom:3,display:"block"}}>Color</label>
          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
            {Object.entries(GC).map(([g,c])=><div key={g} onClick={()=>sb(x=>({...x,coverColor:c}))} title={g} style={{width:20,height:20,borderRadius:3,background:c,cursor:"pointer",border:(b.coverColor||gc)===c?"2px solid #fff":"2px solid transparent"}}/>)}
          </div>
          <Inf text="Brief a cover designer ($300-$2K) with this palette, typography, mood, and 5 comp covers."/>
        </div>
      </div>
      <MockupScene/>
    </div>}
    {cm==="series"&&<div>
      <B v="secondary" onClick={function(){setCm(null)}} style={{marginBottom:8,padding:"3px 7px",fontSize:13}}>← Back</B>
      <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap"}}>
        <div><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,marginBottom:2,display:"block"}}>Books in Series</label>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={function(){if(sc>1)setSc(sc-1)}} style={{width:30,height:30,borderRadius:4,fontSize:16,fontWeight:700,background:"rgba(255,255,255,0.06)",color:"#D4A853",border:"none",cursor:"pointer"}}>−</button>
            <span style={{color:"#D4A853",fontSize:18,fontWeight:900,minWidth:30,textAlign:"center"}}>{sc}</span>
            <button onClick={function(){setSc(sc+1)}} style={{width:30,height:30,borderRadius:4,fontSize:16,fontWeight:700,background:"rgba(255,255,255,0.06)",color:"#D4A853",border:"none",cursor:"pointer"}}>+</button>
          </div></div>
        <div><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,marginBottom:2,display:"block"}}>Color Palette</label>
          <div style={{display:"flex",gap:3}}>{SP.map(function(p,i){return <div key={i} onClick={function(){setPal(i)}} style={{display:"flex",borderRadius:3,overflow:"hidden",cursor:"pointer",border:pal===i?"2px solid #D4A853":"2px solid transparent"}}>{p.slice(0,3).map(function(c,j){return <div key={j} style={{width:7,height:20,background:c}}/>})}</div>})}</div></div>
      </div>
      {/* Series titles */}
      <div style={{marginBottom:10}}><label style={{color:"rgba(255,255,255,0.7)",fontSize:11,marginBottom:4,display:"block"}}>Series Titles</label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:4}}>
          {Array.from({length:sc},function(_,i){return <Inp key={i} value={st[i]||(i===0?b.title:"")} onChange={function(v){sb(function(x){return Object.assign({},x,{seriesTitles:Object.assign({},(x.seriesTitles||{}),{[i]:v})})})}} placeholder={"Book "+(i+1)}/>})}
        </div></div>
      {/* Bulk upload all covers at once */}
      <div onDrop={function(e){e.preventDefault();e.stopPropagation();
        var files=Array.from(e.dataTransfer.files).filter(function(f){return f.type.startsWith("image/")});
        if(!files.length)return;
        files.sort(function(a,b){return a.name.localeCompare(b.name)});
        if(files.length>sc)setSc(files.length);
        files.forEach(function(f,idx){
          var r=new FileReader();
          r.onload=function(ev){sb(function(x){return Object.assign({},x,{seriesCovers:Object.assign({},(x.seriesCovers||{}),{[idx]:ev.target.result})})})};
          r.readAsDataURL(f);
        });
      }} onDragOver={function(e){e.preventDefault()}} style={{border:"3px dashed rgba(212,168,83,0.25)",borderRadius:12,padding:24,textAlign:"center",marginBottom:14,background:"rgba(255,255,255,0.01)",cursor:"pointer",position:"relative"}}>
        <div style={{fontSize:36,marginBottom:4}}>📚</div>
        <div style={{color:"#D4A853",fontSize:14,fontWeight:600,marginBottom:4}}>Drop all your series covers here</div>
        <div style={{color:"rgba(255,255,255,0.7)",fontSize:12,marginBottom:4}}>Select or drag multiple files — they'll be assigned to Book 1, 2, 3... in filename order</div>
        <div style={{color:"rgba(255,255,255,0.6)",fontSize:11}}>{Object.keys(b.seriesCovers||{}).length} of {sc} covers uploaded</div>
        <input type="file" accept="image/*" multiple onChange={function(e){
          var files=Array.from(e.target.files);
          if(!files.length)return;
          files.sort(function(a,b){return a.name.localeCompare(b.name)});
          if(files.length>sc)setSc(files.length);
          files.forEach(function(f,idx){
            var r=new FileReader();
            r.onload=function(ev){sb(function(x){return Object.assign({},x,{seriesCovers:Object.assign({},(x.seriesCovers||{}),{[idx]:ev.target.result})})})};
            r.readAsDataURL(f);
          });
        }} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0,cursor:"pointer"}}/>
      </div>
      {/* Per-book cover uploads + previews */}
      <div style={{color:"#D4A853",fontSize:12,fontWeight:600,marginBottom:6}}>Series Covers — click any cover to replace it individually</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:14}}>
        {Array.from({length:sc},function(_,i){
          var seriesCovers=b.seriesCovers||{};
          var hasCover=!!seriesCovers[i];
          return <div key={i} style={{textAlign:"center"}}>
            {hasCover
              ?<Cvr img={seriesCovers[i]} w={120} h={180}/>
              :<Cvr title={st[i]||(i===0?b.title:"Book "+(i+1))} author={b.authorName} color={SP[pal][i%6]} w={120} h={180}/>
            }
            <div style={{marginTop:6}}>
              <label style={{display:"inline-block",padding:"4px 10px",borderRadius:4,fontSize:13,fontWeight:600,cursor:"pointer",background:hasCover?"rgba(102,187,106,0.12)":"rgba(212,168,83,0.1)",color:hasCover?"#66BB6A":"#D4A853",border:hasCover?"1px solid rgba(102,187,106,0.25)":"1px solid rgba(212,168,83,0.25)"}}>
                {hasCover?"✓ Replace":"Upload Cover"}
                <input type="file" accept="image/*" onChange={function(e){
                  var f=e.target.files[0];if(!f)return;
                  var r=new FileReader();
                  r.onload=function(ev){
                    sb(function(x){return Object.assign({},x,{seriesCovers:Object.assign({},(x.seriesCovers||{}),{[i]:ev.target.result})})});
                  };
                  r.readAsDataURL(f);
                }} style={{display:"none"}}/>
              </label>
              {hasCover&&<button onClick={function(){
                sb(function(x){var sc=Object.assign({},(x.seriesCovers||{}));delete sc[i];return Object.assign({},x,{seriesCovers:sc})});
              }} style={{background:"none",border:"none",color:"rgba(229,57,53,0.7)",cursor:"pointer",fontSize:11,marginLeft:4}} title="Remove cover">✕</button>}
            </div>
            <div style={{color:"rgba(255,255,255,0.6)",fontSize:13,marginTop:2}}>Book {i+1}</div>
          </div>
        })}
      </div>
      {/* Spine View */}
      <div style={{color:"#D4A853",fontSize:12,fontWeight:600,marginBottom:4}}>Spine View (Shelf)</div>
      <div style={{display:"flex",gap:2,justifyContent:"center",padding:"12px 0",background:"rgba(255,255,255,0.02)",borderRadius:6}}>
        {Array.from({length:sc},function(_,i){return <Spn key={i} n={i+1} color={SP[pal][i%6]} title={st[i]||(i===0?b.title:"Book "+(i+1))}/>})}
      </div>
      <Inf text="Progressive shades create a gradient on shelves — driving BookTok/Bookstagram photo shares."/>
      <MockupScene/>
    </div>}
    <div style={{marginTop:10,display:"flex",justifyContent:"flex-end"}}><B onClick={onNext}>Continue →</B></div>
  </Cd>;
}

// ─── S11: EXPORT & LAUNCH (Items 5,6,7,9,14: emails, ARC template, BookTok, review strategy, PDF, thresholds) ───
function S11({book:b,setBook:sb}){
  var chs=(b.outline||{}).chapters||[];var chk=b.launchChecklist||{};
  var setChk=key=>sb(x=>({...x,launchChecklist:{...(x.launchChecklist||{}),[key]:!(x.launchChecklist||{})[key]}}));
  var [ld,setLd]=useState(false);var [btk,setBtk]=useState(null);var [emails,setEmails]=useState(null);var [arc,setArc]=useState(null);
  var tw=wc(b);
  function buildMS(){
    var m=`# ${b.title||"Untitled"}\n`;if(b.subtitle)m+=`## ${b.subtitle}\n`;m+=`### By ${b.authorName||"Author"}\n\n---\n\n`;
    if((b.frontMatter||{}).copyright)m+=`## Copyright\n\n${b.frontMatter.copyright}\n\n---\n\n`;
    FM.forEach(s=>{var v=(b.frontMatter||{})[s.k];if((v||"").trim())m+=`## ${s.l}\n\n${v}\n\n---\n\n`});
    chs.forEach((ch,i)=>{var c=(b.chapterContent||{})[i]||"";if(c.trim())m+=`## Chapter ${ch.number}: ${ch.title}\n\n${c}\n\n---\n\n`});
    BM.forEach(s=>{var v=(b.backMatter||{})[s.k];if((v||"").trim())m+=`## ${s.l}\n\n${v}\n\n---\n\n`});
    return m;
  }
  function dl(content,fn,type="text/markdown"){try{var u=URL.createObjectURL(new Blob([content],{type}));var a=document.createElement("a");a.href=u;a.download=fn;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u)}catch(e){console.log("Download not available in this environment")}}
  // Item 14: PDF via print
  function printPDF(){
    try{var w=window.open("","_blank");if(!w){alert("Please allow popups to print");return}
    w.document.write("<html><head><title>"+(b.title||"Manuscript")+"</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;line-height:1.8;color:#222}h1{text-align:center}h2{margin-top:40px;border-bottom:1px solid #ccc;padding-bottom:8px}h3{text-align:center;color:#666}hr{border:none;border-top:1px solid #ddd;margin:30px 0}</style></head><body>");
    var ms=buildMS();ms=ms.replace(/^# (.+)$/gm,"<h1>$1</h1>").replace(/^## (.+)$/gm,"<h2>$1</h2>").replace(/^### (.+)$/gm,"<h3>$1</h3>").replace(/---/g,"<hr>");
    var paras=ms.split("\n\n");w.document.write(paras.map(function(p){return"<p>"+p+"</p>"}).join(""));
    w.document.write("</body></html>");w.document.close();setTimeout(function(){w.print()},500)}catch(e){alert("PDF export requires popup access")}
  }
  // Item 7: ARC template
  async function genARC(){setLd(true);
    var raw=await ai(`Write an ARC (Advance Review Copy) outreach message for "${b.title}" (${b.genre}) by ${b.authorName||"author"}. This goes to potential ARC readers to recruit them.\n\nReturn JSON: {"subject":"email subject line","message":"the full outreach message — friendly, clear about expectations (read by launch day, post review on Amazon + Goodreads), mention it's free","followUp":"a shorter follow-up message for non-responders","whereToFind":"5 specific places to find ARC readers for ${b.genre}"}`,"Book marketing expert. ONLY JSON.");
    setArc(pJ(raw));setLd(false);
  }
  // Item 6: Email sequence
  async function genEmails(){setLd(true);
    var raw=await ai(`Write 5 launch week emails for "${b.title}" (${b.genre}) by ${b.authorName||"author"}. Description: ${(b.description||{}).hook||b.impact||"N/A"}.\n\nReturn JSON: {"emails":[{"day":"Day 1/2/3/5/7","subject":"...","body":"full email body — short, compelling, includes CTA","purpose":"what this email accomplishes"}],"tips":["3 email marketing tips for book launches"]}`,"Email copywriter. ONLY JSON.");
    setEmails(pJ(raw));setLd(false);
  }
  // Item 7b: BookTok
  async function genBTK(){setLd(true);
    var raw=await ai(`5 viral BookTok video scripts for "${b.title}" (${b.genre}). Description: ${(b.description||{}).hook||"N/A"}.\n\nReturn JSON: {"videos":[{"type":"format name","script":"exact text overlay 7-15sec","audioTip":"...","hashtags":"5 tags","reach":"view estimate"}],"tips":["3 ${b.genre} BookTok tips"],"schedule":"posting frequency + best times"}`,"BookTok expert. ONLY JSON.");
    setBtk(pJ(raw));setLd(false);
  }
  var hs=healthScore(b);
  return <Cd title="Export & Launch" sub="Download, marketing content, and launch checklist">
    {/* Item 8: Health Score Dashboard */}
    <div style={{padding:14,background:"rgba(255,255,255,0.02)",borderRadius:8,marginBottom:14,border:"1px solid rgba(255,255,255,0.04)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{color:"#D4A853",fontSize:13,fontWeight:700}}>📊 Book Health Score</span>
        <span style={{color:hs.pct>=90?"#66BB6A":hs.pct>=60?"#D4A853":"#EF5350",fontSize:20,fontWeight:900}}>{hs.pct}%</span>
      </div>
      <div style={{height:6,background:"rgba(255,255,255,0.04)",borderRadius:3,overflow:"hidden",marginBottom:8}}>
        <div style={{height:"100%",background:hs.pct>=90?"#66BB6A":hs.pct>=60?"#D4A853":"#EF5350",width:`${hs.pct}%`,borderRadius:3,transition:"width 0.5s"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:3}}>
        {hs.items.map((it,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"2px 0"}}>
          <span style={{color:it.done?"#66BB6A":"#EF5350",fontSize:13}}>{it.done?"✓":"✗"}</span>
          <span style={{color:it.done?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.55)",fontSize:12,textDecoration:it.done?"line-through":"none"}}>{it.name}</span>
        </div>)}
      </div>
    </div>
    {/* Downloads */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
      {[["📥","Manuscript (.md)",()=>dl(buildMS(),`${(b.title||"ms").replace(/\s+/g,"_")}.md`)],
        ["📋","Description (.txt)",()=>{var d=b.description||{};dl(`AMAZON:\n${d.fullDescription||""}\n\nHOOK:\n${d.hook||""}\n\nPITCH:\n${d.oneLiner||""}\n\nBACK COVER:\n${d.backCoverBlurb||""}`,"description.txt")}],
        ["🖨️","Print / PDF",printPDF]
      ].map(([ic,l,fn],i)=><div key={i} style={{padding:12,background:"rgba(212,168,83,0.04)",borderRadius:6,textAlign:"center",cursor:"pointer"}} onClick={fn}>
        <div style={{fontSize:24,marginBottom:2}}>{ic}</div>
        <div style={{color:"#D4A853",fontWeight:600,fontSize:13}}>{l}</div>
      </div>)}
    </div>
    {/* Bestseller thresholds */}
    <h4 style={{color:"#D4A853",margin:"12px 0 6px",fontSize:12}}>📊 Bestseller Requirements</h4>
    <div style={{display:"grid",gap:3,marginBottom:12}}>
      {BT.map((t,i)=><div key={i} style={{padding:8,background:"rgba(255,255,255,0.02)",borderRadius:4,display:"flex",gap:10,alignItems:"center"}}>
        <div style={{flex:1}}><div style={{color:"#fff",fontSize:13,fontWeight:600}}>{t.list}</div><p style={{color:"rgba(255,255,255,0.6)",margin:"1px 0 0",fontSize:12}}>{t.tip}</p></div>
        <div style={{textAlign:"right",flexShrink:0}}><div style={{color:"#D4A853",fontSize:11,fontWeight:700}}>{t.sales}</div>
          <span style={{fontSize:10,padding:"1px 4px",borderRadius:2,background:t.ok==="YES"?"rgba(102,187,106,0.12)":"rgba(229,57,53,0.1)",color:t.ok==="YES"?"#66BB6A":"#EF5350"}}>{t.ok}</span></div>
      </div>)}
    </div>
    {/* Marketing content generators */}
    <h4 style={{color:"#D4A853",margin:"0 0 6px",fontSize:12}}>🎯 Marketing Content</h4>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
      <B v="secondary" onClick={genEmails} disabled={ld} style={{fontSize:12,padding:"8px 4px"}}>📧 5 Launch Emails</B>
      <B v="secondary" onClick={genARC} disabled={ld} style={{fontSize:12,padding:"8px 4px"}}>📬 ARC Outreach</B>
      <B v="secondary" onClick={genBTK} disabled={ld} style={{fontSize:12,padding:"8px 4px"}}>🎬 BookTok Scripts</B>
    </div>
    {ld&&<Spin/>}
    {/* Email sequences */}
    {emails&&<div style={{marginBottom:12}}>
      <div style={{color:"#D4A853",fontSize:13,fontWeight:600,marginBottom:4}}>📧 Launch Email Sequence</div>
      {(emails.emails||[]).map((e,i)=><div key={i} style={{padding:8,background:"rgba(255,255,255,0.02)",borderRadius:4,marginBottom:3,borderLeft:"3px solid rgba(212,168,83,0.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
          <span style={{color:"#D4A853",fontSize:12,fontWeight:600}}>{e.day}</span><span style={{color:"rgba(255,255,255,0.6)",fontSize:12}}>{e.purpose}</span></div>
        <div style={{color:"#fff",fontSize:13,fontWeight:600,marginBottom:2}}>Subject: {e.subject}</div>
        <p style={{color:"rgba(255,255,255,0.7)",margin:0,fontSize:12,lineHeight:1.4,whiteSpace:"pre-wrap"}}>{e.body}</p>
      </div>)}
    </div>}
    {/* ARC outreach */}
    {arc&&<div style={{marginBottom:12}}>
      <div style={{color:"#D4A853",fontSize:13,fontWeight:600,marginBottom:4}}>📬 ARC Outreach</div>
      <div style={{padding:8,background:"rgba(255,255,255,0.02)",borderRadius:4,marginBottom:4}}>
        <div style={{color:"#fff",fontSize:13,fontWeight:600,marginBottom:2}}>Subject: {arc.subject}</div>
        <p style={{color:"rgba(255,255,255,0.7)",margin:0,fontSize:12,lineHeight:1.4,whiteSpace:"pre-wrap"}}>{arc.message}</p>
      </div>
      {arc.whereToFind&&<div>
        <div style={{color:"rgba(255,255,255,0.7)",fontSize:12,fontWeight:600,marginBottom:2}}>Where to find ARC readers:</div>
        {arc.whereToFind.map((w,i)=><p key={i} style={{color:"rgba(255,255,255,0.65)",margin:"1px 0",fontSize:12}}>• {w}</p>)}
      </div>}
    </div>}
    {/* BookTok */}
    {btk&&<div style={{marginBottom:12}}>
      <div style={{color:"#D4A853",fontSize:13,fontWeight:600,marginBottom:4}}>🎬 BookTok Video Scripts</div>
      {btk.schedule&&<Inf text={btk.schedule}/>}
      {(btk.videos||[]).map((v,i)=><div key={i} style={{padding:8,background:"rgba(255,255,255,0.02)",borderRadius:4,marginBottom:3,borderLeft:"3px solid rgba(212,168,83,0.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
          <span style={{color:"#D4A853",fontSize:12,fontWeight:600}}>{v.type}</span><span style={{color:"rgba(255,255,255,0.6)",fontSize:12}}>{v.reach}</span></div>
        <p style={{color:"#fff",margin:"0 0 2px",fontSize:13,lineHeight:1.3}}>{v.script}</p>
        <p style={{color:"rgba(255,255,255,0.6)",margin:0,fontSize:12}}>🎵 {v.audioTip} • {v.hashtags}</p>
      </div>)}
    </div>}
    {/* Review strategy */}
    <h4 style={{color:"#D4A853",margin:"0 0 6px",fontSize:12}}>⭐ Review Strategy (Target: 50+ in 30 days)</h4>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:4,marginBottom:14}}>
      {[["ARC Team (Day 1-3)","25-50 readers posting immediately","15-30"],["Friends/Family (Day 1-7)","Personal outreach to 50 people","10-20"],["Back Matter CTA","Review request in book + email","5-15"],["Email Follow-up (Day 7-14)","Dedicated review request email","5-10"]].map(([src,meth,exp],i)=><div key={i} style={{padding:8,background:"rgba(255,255,255,0.02)",borderRadius:4}}>
        <div style={{color:"#D4A853",fontSize:12,fontWeight:600}}>{src}</div>
        <p style={{color:"rgba(255,255,255,0.6)",margin:"1px 0",fontSize:12}}>{meth}</p>
        <span style={{color:"#66BB6A",fontSize:12,fontWeight:600}}>{exp} reviews</span>
      </div>)}
    </div>
    {/* Launch checklist */}
    <h3 style={{color:"#D4A853",margin:"0 0 8px",fontSize:14}}>🚀 Launch Checklist</h3>
    {LAUNCH.map(ph=><div key={ph.p} style={{marginBottom:10}}>
      <div style={{color:"#D4A853",fontSize:13,fontWeight:700,marginBottom:3,textTransform:"uppercase",letterSpacing:0.6}}>{ph.p}</div>
      {ph.i.map((item,idx)=>{var key=`${ph.p}-${idx}`;var ck=chk[key];
        return <div key={idx} onClick={()=>setChk(key)} style={{display:"flex",alignItems:"flex-start",gap:6,padding:"3px 6px",borderRadius:3,marginBottom:1,cursor:"pointer",background:ck?"rgba(102,187,106,0.03)":"transparent"}}>
          <span style={{width:14,height:14,borderRadius:3,border:ck?"2px solid #66BB6A":"2px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,color:"#66BB6A",marginTop:1}}>{ck?"✓":""}</span>
          <span style={{color:ck?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.55)",fontSize:13,lineHeight:1.3,textDecoration:ck?"line-through":"none"}}>{item}</span>
        </div>})}
    </div>)}
  </Cd>;
}

// ─── LIBRARY ───
function Library({onSelect,onNew}){
  var [lib,setLib]=useState([]);var [ready,setReady]=useState(false);var [delId,setDelId]=useState(null);
  useEffect(function(){(async function(){var l=await loadLib();setLib(l);setReady(true)})()},[]);
  async function confirmDelete(id){
    await deleteBook(id);
    setLib(function(prev){return prev.filter(function(b){return b.id!==id})});
    setDelId(null);
  }
  if(!ready)return <Spin msg="Loading library..."/>;
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div>
        <h1 style={{fontSize:24,fontWeight:900,color:"#D4A853",margin:0,letterSpacing:2,textTransform:"uppercase"}}>My Books</h1>
        <p style={{color:"rgba(255,255,255,0.7)",margin:0,fontSize:13}}>{lib.length} book{lib.length!==1?"s":""} in progress</p>
      </div>
      <B onClick={onNew}>+ New Book</B>
    </div>
    {lib.length===0&&<div style={{textAlign:"center",padding:60}}>
      <div style={{fontSize:64,marginBottom:16}}>📚</div>
      <p style={{color:"rgba(255,255,255,0.7)",fontSize:16,marginBottom:8}}>No books yet</p>
      <p style={{color:"rgba(255,255,255,0.6)",fontSize:13,marginBottom:20}}>Start your first bestseller — the agent will guide you from blank page to published.</p>
      <B onClick={onNew}>Start Your First Book</B>
    </div>}
    {lib.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
      {lib.sort(function(a,b){return(b.lastModified||0)-(a.lastModified||0)}).map(function(bk){
        var daysAgo=Math.floor((Date.now()-(bk.lastModified||0))/(1000*60*60*24));
        var timeLabel=daysAgo===0?"Today":daysAgo===1?"Yesterday":daysAgo+" days ago";
        return <div key={bk.id} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(212,168,83,0.12)",borderRadius:10,padding:18,cursor:"pointer",transition:"all 0.2s",position:"relative"}}
          onClick={function(){onSelect(bk.id)}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div style={{flex:1}}>
              <div style={{color:"#D4A853",fontSize:16,fontWeight:700,lineHeight:1.3}}>{bk.title||"Untitled"}</div>
              {bk.genre&&<div style={{color:"rgba(255,255,255,0.7)",fontSize:12,marginTop:2}}>{bk.genre}</div>}
            </div>
            <button onClick={function(e){e.stopPropagation();setDelId(bk.id)}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.6)",cursor:"pointer",fontSize:16,padding:"0 4px",lineHeight:1}}>✕</button>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{color:"rgba(255,255,255,0.6)",fontSize:11}}>{(bk.words||0).toLocaleString()} words</span>
            <span style={{color:"rgba(255,255,255,0.6)",fontSize:13}}>{timeLabel}</span>
          </div>
        </div>
      })}
    </div>}
    {delId&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={function(){setDelId(null)}}>
      <div style={{background:"#1a2340",borderRadius:12,padding:28,maxWidth:400,border:"1px solid rgba(212,168,83,0.2)"}} onClick={function(e){e.stopPropagation()}}>
        <h3 style={{color:"#EF5350",margin:"0 0 8px",fontSize:18}}>Delete Book?</h3>
        <p style={{color:"rgba(255,255,255,0.6)",margin:"0 0 20px",fontSize:14}}>This will permanently delete this book and all its content. This cannot be undone.</p>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <B v="secondary" onClick={function(){setDelId(null)}}>Cancel</B>
          <B v="danger" onClick={function(){confirmDelete(delId)}}>Delete Forever</B>
        </div>
      </div>
    </div>}
  </div>;
}

// ─── MAIN APP ───
export default function BestsellerBookAgent(){
  var [state,setState]=useState({step:0,mx:0,book:{},ready:false,activeId:null,showLib:true});
  var step=state.step;var book=state.book;var mx=state.mx;
  function setStep(s){setState(function(prev){return{...prev,step:s}})}
  function setBook(fn){setState(function(prev){var nb=typeof fn==="function"?fn(prev.book):fn;return{...prev,book:nb}})}
  function go(){setState(function(prev){var n=Math.min(prev.step+1,STEPS.length-1);return{...prev,step:n,mx:Math.max(prev.mx,n)}})}

  // Load library on mount
  useEffect(function(){setState(function(prev){return{...prev,ready:true}});},[]);

  // Auto-save active book
  useEffect(function(){if(state.ready&&state.activeId&&state.book){saveB(state.activeId,state.book)}},[state.book,state.ready,state.activeId]);

  function openBook(id){
    (async function(){
      var data=await loadB(id);
      if(data){
        var m=0;if(data.genre)m=1;if(data.title)m=2;if(data.outline)m=5;
        if(data.chapterContent&&Object.keys(data.chapterContent).length)m=8;if(data.description)m=10;
        setState(function(prev){return{...prev,step:0,mx:m,book:data,activeId:id,showLib:false}});
      }
    })();
  }

  function newBook(){
    var id="book-"+Date.now()+"-"+Math.random().toString(36).substring(2,8);
    setState(function(prev){return{...prev,step:0,mx:0,book:{},activeId:id,showLib:false}});
  }

  function backToLib(){setState(function(prev){return{...prev,showLib:true,activeId:null,book:{}}})}

  if(!state.ready)return <div style={{minHeight:"100vh",background:"#0a0f1a",display:"flex",alignItems:"center",justifyContent:"center"}}><Spin msg="Loading..."/></div>;

  var tw=wc(book);var tgt=parseInt((book.wordCount||"80000").replace(/\D/g,""))||80000;var hs=healthScore(book);
  return <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0a0f1a 0%,#0f1b33 50%,#0a0f1a 100%)",color:"#fff",fontFamily:"'Crimson Pro',Georgia,serif"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700;900&display=swap');@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:rgba(255,255,255,0.02)}::-webkit-scrollbar-thumb{background:rgba(212,168,83,0.25);border-radius:2px}textarea:focus,input:focus{outline:none;border-color:#D4A853!important}`}</style>
    <div style={{maxWidth:1060,margin:"0 auto",padding:"14px 12px"}}>
      {state.showLib&&<Library onSelect={openBook} onNew={newBook}/>}
      {!state.showLib&&<div>
        {/* Header with back button */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={backToLib} style={{background:"none",border:"2px solid rgba(212,168,83,0.25)",borderRadius:6,color:"#D4A853",cursor:"pointer",padding:"6px 12px",fontSize:12,fontWeight:700}}>← My Books</button>
            <div>
              <h1 style={{fontSize:24,fontWeight:900,color:"#D4A853",margin:0,letterSpacing:2,textTransform:"uppercase"}}>Bestseller Book Agent</h1>
              <p style={{color:"rgba(255,255,255,0.7)",margin:0,fontSize:13}}>AI-powered — blank page to bestseller list</p>
            </div>
          </div>
          {book.title&&<div style={{textAlign:"right"}}>
            <div style={{color:"rgba(255,255,255,0.6)",fontSize:12}}>{book.title}</div>
            <div style={{display:"flex",gap:6,justifyContent:"flex-end",alignItems:"center",marginTop:1}}>
              <span style={{color:"rgba(255,255,255,0.7)",fontSize:13}}>{book.genre}</span>
              <span style={{fontSize:13,padding:"2px 6px",borderRadius:3,background:hs.pct>=90?"rgba(102,187,106,0.12)":hs.pct>=60?"rgba(212,168,83,0.1)":"rgba(229,57,53,0.1)",color:hs.pct>=90?"#66BB6A":hs.pct>=60?"#D4A853":"#EF5350",fontWeight:700}}>{hs.pct}% ready</span>
            </div>
          </div>}
        </div>
        {/* Word count bar */}
        {book.title&&tw>0&&<div style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}>
            <span style={{color:"rgba(255,255,255,0.7)",fontSize:11}}>Words</span>
            <span style={{color:tw>=tgt?"#66BB6A":"#D4A853",fontSize:11,fontWeight:600}}>{tw.toLocaleString()}/{tgt.toLocaleString()} ({Math.round(tw/tgt*100)}%)</span>
          </div>
          <div style={{height:3,background:"rgba(255,255,255,0.04)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",background:tw>=tgt?"#66BB6A":"#D4A853",width:Math.min(100,tw/tgt*100)+"%",borderRadius:2,transition:"width 0.5s"}}/>
          </div>
        </div>}
        <Nav step={step} setStep={setStep} mx={mx}/>
        {step===0&&<S0 book={book} setBook={setBook} onNext={go}/>}
        {step===1&&<S1 book={book} setBook={setBook} onNext={go}/>}
        {step===2&&<S2 book={book} setBook={setBook} onNext={go}/>}
        {step===3&&<S3 book={book} setBook={setBook} onNext={go}/>}
        {step===4&&<S4 book={book} setBook={setBook} onNext={go}/>}
        {step===5&&<S5 book={book} setBook={setBook} onNext={go}/>}
        {step===6&&<S6 book={book} setBook={setBook} onNext={go} bookId={state.activeId}/>}
        {step===7&&<S7 book={book} setBook={setBook} onNext={go}/>}
        {step===8&&<S8 book={book} setBook={setBook} onNext={go}/>}
        {step===9&&<S9 book={book} setBook={setBook} onNext={go}/>}
        {step===10&&<S10 book={book} setBook={setBook} onNext={go}/>}
        {step===11&&<S11 book={book} setBook={setBook}/>}
        <div style={{textAlign:"center",padding:"16px 0 6px",borderTop:"1px solid rgba(255,255,255,0.03)",marginTop:16}}>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,marginTop:4}}>Bestseller Book Agent v5</p>
        </div>
      </div>}
    </div>
  </div>;
}
