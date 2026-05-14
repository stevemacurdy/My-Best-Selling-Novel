import { useState, useEffect } from "react";

// ═══ TUTORIAL STEPS ═══
var TOUR = [
  {id:"welcome",title:"Welcome to the Bestseller Book Agent",sub:"Your AI-powered publishing command center",icon:"📚",desc:"This agent takes you from a blank page to a published bestseller. Every step of the process — writing, editing, publishing, marketing, audiobook production, and launch strategy — is handled in one tool.",action:"Let's take a quick tour"},
  {id:"genre",title:"Step 1: Genre Scanner",sub:"AI researches the market for you",icon:"🔍",desc:"The agent scans bestseller lists and identifies high-opportunity genres with low competition. It shows demand levels, reader profiles, trending tropes, and tells you exactly where the money is. You can also enter any custom genre.",demo:"genre"},
  {id:"setup",title:"Step 2: Book Setup",sub:"Configure your bestseller",icon:"⚙️",desc:"Set your title, subtitle, author name, target word count, reader profile, and the impact you want your book to have. If it's a series, there's a Series Bible to track characters, locations, and continuity across books.",demo:"setup"},
  {id:"upload",title:"Step 3: Upload & Organize",sub:"Three paths — the agent adapts to what you have",icon:"📄",desc:"Upload your manuscript in any format (PDF, DOCX, TXT). Then tell the agent what you have:\n\n📝 Unorganized blob — AI organizes it, finds gaps, recommends chapters\n📋 Outline only — Set tones per chapter, AI writes each one\n📖 Written with chapters — Local splitter loads everything instantly, no truncation",demo:"upload"},
  {id:"outline",title:"Step 4: Outline Builder",sub:"Full control over your book structure",icon:"📋",desc:"AI generates 12-20 chapters with purposes, key points, and end hooks. Every title is editable. Add or delete chapters. Insert section headers (§) to divide your book into parts. The outline drives everything downstream.",demo:"outline"},
  {id:"frontback",title:"Step 5: Front & Back Matter",sub:"Professional framing sections",icon:"📖",desc:"12 sections — from Dedication to Newsletter CTA. Each has a world-class AI prompt. Click 'AI Draft' and it auto-fills directly into the field. Copyright page auto-generates from your author name. The Newsletter CTA is the most important page in your book — it converts 3-8% of readers into email subscribers.",demo:"frontback"},
  {id:"guide",title:"Step 6: Chapter Guide",sub:"The interactive Avoid system",icon:"🎯",desc:"AI reads your actual chapter text and gives guidance: opening strategy, emotional arc, pacing, scenes needed, and things to avoid. Each Avoid item is interactive:\n\n✅ 'Not an Issue' — dismiss it\n🔴 'Yes, Fix This' → choose 'I'll Fix It Myself' or 'AI Fix in My Voice'\n\nThe AI fix reads your entire book's context — characters, storyline, voice profile — and corrects only the flagged issue. It never scrambles your facts.",demo:"guide"},
  {id:"write",title:"Step 7: Write & Record",sub:"Two modes in one step",icon:"✍️",desc:"Write mode: Edit chapters with AI assistance. AI Write matches your voice, maintains continuity with previous chapters, and never invents facts.\n\nRecord mode: Upload audio recordings per chapter for your audiobook. Play back, replace, delete. Export all chapters as separate files. Full ACX specs checklist included.",demo:"write"},
  {id:"review",title:"Step 8: AI Review",sub:"Four modes of editorial feedback",icon:"🔍",desc:"Proofread — finds errors with corrections\nEmbellish — suggests sensory details and enhancements\nCritique — harsh bestseller-readiness assessment with action items\nRewrite — completely rewrites the chapter in your voice at bestseller quality",demo:"review"},
  {id:"description",title:"Step 9: Book Description",sub:"Your #1 sales tool",icon:"📝",desc:"Generates four pieces of copy:\n• Amazon HTML description (Hook→Stakes→Promise→Comps→CTA)\n• Hook line for ads\n• One-liner for social media\n• Back cover blurb for print\n\n70% of Amazon purchases are influenced by the description. Every field is editable.",demo:"description"},
  {id:"publishing",title:"Step 10: Publishing Setup",sub:"Six tabs of Amazon optimization",icon:"📊",desc:"🔑 Keywords — 7 boxes with byte counter\n📂 Categories — ghost detection, competition levels\n💰 Pricing — launch/transition/long-term with royalty math\n🎧 Audiobook — production options, narrator guidance, distribution strategy, launch timing\n📚 Comps — 5 comparable titles for positioning and ad targeting\n📣 Ads — 3 Amazon campaigns with bids, budgets, and kill criteria",demo:"publishing"},
  {id:"cover",title:"Step 11: Cover Design",sub:"Four upload options",icon:"🎨",desc:"📤 Upload Single — with wrap cover text editor (front/spine/back fields)\n📚 Upload Series — bulk drag-drop all covers, unlimited books\n📁 Upload Folders — auto-detects ebook/print/audiobook formats from filenames\n🎨 Design Concepts — palette picker, spine view, BookTok mockup scene",demo:"cover"},
  {id:"launch",title:"Step 12: Export & Launch",sub:"Everything you need to go live",icon:"🚀",desc:"Health score dashboard (15 weighted items)\nManuscript & description downloads\nBestseller list thresholds (exact sales numbers per list)\n5 launch emails, ARC outreach, BookTok scripts\nReview velocity strategy (50+ reviews in 30 days)\n5-phase launch checklist with 40+ persisted items",demo:"launch"},
  {id:"pricing",title:"Ready to Publish?",sub:"Choose your plan",icon:"💰",desc:"Start with a free demo to explore every feature. When you're ready to write your bestseller, choose a plan that fits your publishing journey.",action:"See Plans & Pricing"},
];

// ═══ INTERACTIVE DEMOS ═══
function GenreDemo(){
  var genres=[
    {genre:"Cozy Fantasy",demand:"VERY HIGH",competition:"LOW",opp:5,color:"#7E57C2"},
    {genre:"Dark Romance",demand:"VERY HIGH",competition:"MODERATE",opp:4,color:"#E91E63"},
    {genre:"Self-Help / AI",demand:"VERY HIGH",competition:"LOW",opp:5,color:"#00695C"},
    {genre:"Thriller",demand:"HIGH",competition:"MODERATE",opp:4,color:"#37474F"},
    {genre:"Romantasy",demand:"VERY HIGH",competition:"GROWING",opp:4,color:"#9C27B0"},
    {genre:"LitRPG",demand:"HIGH",competition:"LOW",opp:5,color:"#FF6F00"},
  ];
  var sel_s=useState(null);var sel=sel_s[0];var setSel=sel_s[1];
  return <div>
    <p style={{color:"rgba(255,255,255,0.6)",fontSize:14,margin:"0 0 12px"}}>Click a genre to see its market data:</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
      {genres.map(function(g){return <div key={g.genre} onClick={function(){setSel(g)}} style={{padding:14,borderRadius:8,cursor:"pointer",background:sel&&sel.genre===g.genre?"rgba(212,168,83,0.15)":"rgba(255,255,255,0.03)",border:sel&&sel.genre===g.genre?"2px solid #D4A853":"2px solid rgba(255,255,255,0.06)",textAlign:"center",transition:"all 0.2s"}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:g.color,margin:"0 auto 6px"}}/>
        <div style={{color:"#fff",fontSize:13,fontWeight:700}}>{g.genre}</div>
        <div style={{color:"rgba(255,255,255,0.5)",fontSize:11}}>{g.demand}</div>
      </div>})}
    </div>
    {sel&&<div style={{marginTop:14,padding:16,background:"rgba(212,168,83,0.06)",borderRadius:10,border:"1px solid rgba(212,168,83,0.15)",animation:"fadeIn 0.3s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{color:"#D4A853",fontSize:18,fontWeight:800}}>{sel.genre}</span>
        <span style={{background:"rgba(212,168,83,0.15)",color:"#D4A853",padding:"4px 12px",borderRadius:6,fontSize:12,fontWeight:700}}>Opportunity: {sel.opp}/5</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div style={{padding:10,background:"rgba(255,255,255,0.03)",borderRadius:6}}><div style={{color:"rgba(255,255,255,0.5)",fontSize:11}}>Demand</div><div style={{color:"#66BB6A",fontSize:16,fontWeight:700}}>{sel.demand}</div></div>
        <div style={{padding:10,background:"rgba(255,255,255,0.03)",borderRadius:6}}><div style={{color:"rgba(255,255,255,0.5)",fontSize:11}}>Competition</div><div style={{color:sel.competition==="LOW"?"#66BB6A":"#D4A853",fontSize:16,fontWeight:700}}>{sel.competition}</div></div>
      </div>
    </div>}
  </div>;
}

function UploadDemo(){
  var sel_s=useState(null);var sel=sel_s[0];var setSel=sel_s[1];
  var paths=[
    {id:"blob",icon:"📝",title:"Unorganized Content",desc:"AI organizes flow, finds gaps, recommends chapters",features:["Chunked analysis (handles 200K+ words)","Flow issues detection","Content gap identification","Strategy assessment","Recommended chapter breaks"]},
    {id:"outline",icon:"📋",title:"Outline Only",desc:"Set tones per chapter, AI writes each one",features:["12 tone options per chapter","Conversational to Tear-jerker","AI writes in rich detail","Voice matching","Chapter-by-chapter progress"]},
    {id:"written",icon:"📖",title:"Written with Chapters",desc:"Splits into chapters instantly, keeps everything as-is",features:["Local regex splitter (no AI)","No truncation, unlimited size","Detects Chapter/Part/Section/Lesson","Spelled-out numbers (One through Twenty-Five)","One click: Split & Load"]},
  ];
  return <div>
    <p style={{color:"rgba(255,255,255,0.6)",fontSize:14,margin:"0 0 12px"}}>The agent asks how your manuscript is organized:</p>
    <div style={{display:"grid",gap:8}}>
      {paths.map(function(p){return <div key={p.id} onClick={function(){setSel(sel===p.id?null:p.id)}} style={{padding:16,borderRadius:10,cursor:"pointer",background:sel===p.id?"rgba(212,168,83,0.1)":"rgba(255,255,255,0.03)",border:sel===p.id?"2px solid #D4A853":"2px solid rgba(255,255,255,0.06)",transition:"all 0.2s"}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{fontSize:28}}>{p.icon}</div>
          <div>
            <div style={{color:sel===p.id?"#D4A853":"#fff",fontSize:15,fontWeight:700}}>{p.title}</div>
            <div style={{color:"rgba(255,255,255,0.6)",fontSize:12}}>{p.desc}</div>
          </div>
        </div>
        {sel===p.id&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          {p.features.map(function(f,i){return <div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
            <span style={{color:"#D4A853",fontSize:12}}>✓</span>
            <span style={{color:"rgba(255,255,255,0.7)",fontSize:13}}>{f}</span>
          </div>})}
        </div>}
      </div>})}
    </div>
  </div>;
}

function AvoidDemo(){
  var items=[
    {text:"The warehouse backstory info-dump in the first two pages slows the opening",state_s:useState(null)},
    {text:"George's motivation is unclear — reader won't understand why he helped",state_s:useState(null)},
    {text:"The $15,000 detail appears twice with different contexts — pick one",state_s:useState(null)},
  ];
  return <div>
    <p style={{color:"rgba(255,255,255,0.6)",fontSize:14,margin:"0 0 12px"}}>Try the Avoid system — accept or reject each issue:</p>
    {items.map(function(item,i){
      var state=item.state_s[0];var setState=item.state_s[1];
      var isFixed=state&&typeof state==="object";
      return <div key={i} style={{padding:12,background:"rgba(255,255,255,0.03)",borderRadius:8,marginBottom:8,borderLeft:state==="rejected"?"3px solid #66BB6A":isFixed?"3px solid #66BB6A":state==="accepted"?"3px solid #EF5350":"3px solid rgba(255,255,255,0.06)",transition:"all 0.3s"}}>
        <p style={{color:state==="rejected"?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.8)",margin:"0 0 8px",fontSize:14,textDecoration:state==="rejected"?"line-through":"none"}}>{item.text}</p>
        {!state&&<div style={{display:"flex",gap:8}}>
          <button onClick={function(){setState("accepted")}} style={{padding:"6px 14px",borderRadius:6,fontSize:12,fontWeight:700,background:"rgba(229,57,53,0.15)",color:"#EF5350",border:"2px solid rgba(229,57,53,0.3)",cursor:"pointer"}}>Yes, Fix This</button>
          <button onClick={function(){setState("rejected")}} style={{padding:"6px 14px",borderRadius:6,fontSize:12,fontWeight:700,background:"rgba(46,125,50,0.15)",color:"#66BB6A",border:"2px solid rgba(46,125,50,0.3)",cursor:"pointer"}}>Not an Issue</button>
        </div>}
        {state==="accepted"&&<div>
          <p style={{color:"rgba(255,255,255,0.5)",fontSize:12,margin:"0 0 8px"}}>How would you like to fix it?</p>
          <div style={{display:"flex",gap:8}}>
            <button onClick={function(){setState({status:"manual"})}} style={{padding:"6px 14px",borderRadius:6,fontSize:12,fontWeight:700,background:"rgba(212,168,83,0.15)",color:"#D4A853",border:"2px solid rgba(212,168,83,0.3)",cursor:"pointer"}}>I'll Fix It Myself</button>
            <button onClick={function(){setState({status:"fixed",note:"AI rewrote the opening to reveal warehouse expertise through action instead of exposition"})}} style={{padding:"6px 14px",borderRadius:6,fontSize:12,fontWeight:700,background:"#D4A853",color:"#0f1b33",border:"none",cursor:"pointer"}}>AI Fix in My Voice</button>
          </div>
        </div>}
        {isFixed&&state.status==="fixed"&&<div style={{marginTop:8,padding:10,background:"rgba(102,187,106,0.06)",borderRadius:6,border:"1px solid rgba(102,187,106,0.15)"}}>
          <div style={{color:"#66BB6A",fontSize:12,fontWeight:600}}>✓ {state.note}</div>
        </div>}
        {isFixed&&state.status==="manual"&&<div style={{marginTop:8,padding:10,background:"rgba(212,168,83,0.06)",borderRadius:6}}>
          <div style={{color:"#D4A853",fontSize:12}}>→ Go to Write step to edit this chapter</div>
        </div>}
      </div>
    })}
  </div>;
}

function PricingSection({onStart}){
  var plans=[
    {name:"Explorer",price:"Free",period:"",desc:"Try every feature with sample data",features:["Full 12-step walkthrough","AI genre scanning","Outline generation","Sample chapter writing","All publishing tools (view only)"],cta:"Start Free Demo",primary:false},
    {name:"Author",price:"$29",period:"/month",desc:"Everything you need to write and publish",features:["Unlimited AI calls","Full manuscript upload (200K+ words)","Voice analysis & matching","All 12 publishing steps","Multi-book library","Audiobook recording tools","Export manuscripts & descriptions","Cover management"],cta:"Start Writing",primary:true},
    {name:"Publisher",price:"$79",period:"/month",desc:"For authors with multiple books and series",features:["Everything in Author","Priority AI (faster responses)","Unlimited books & series","Bulk cover management (folders)","Launch email sequences","BookTok script generator","ARC outreach templates","Priority support"],cta:"Go Pro",primary:false},
  ];
  return <div style={{padding:"60px 20px",maxWidth:900,margin:"0 auto"}}>
    <div style={{textAlign:"center",marginBottom:40}}>
      <h2 style={{color:"#D4A853",fontSize:36,fontWeight:900,margin:"0 0 8px",letterSpacing:1}}>CHOOSE YOUR PATH</h2>
      <p style={{color:"rgba(255,255,255,0.6)",fontSize:16,margin:0}}>From first draft to bestseller list — pick the plan that matches your publishing journey</p>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
      {plans.map(function(plan){return <div key={plan.name} style={{padding:28,borderRadius:14,background:plan.primary?"rgba(212,168,83,0.08)":"rgba(255,255,255,0.02)",border:plan.primary?"2px solid #D4A853":"2px solid rgba(255,255,255,0.06)",position:"relative",overflow:"hidden"}}>
        {plan.primary&&<div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#D4A853,#E8C97A)"}}/>}
        <div style={{color:plan.primary?"#D4A853":"rgba(255,255,255,0.5)",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{plan.name}</div>
        <div style={{display:"flex",alignItems:"baseline",gap:2,marginBottom:4}}>
          <span style={{color:"#fff",fontSize:42,fontWeight:900}}>{plan.price}</span>
          <span style={{color:"rgba(255,255,255,0.4)",fontSize:14}}>{plan.period}</span>
        </div>
        <p style={{color:"rgba(255,255,255,0.6)",fontSize:13,margin:"0 0 20px"}}>{plan.desc}</p>
        <div style={{marginBottom:20}}>
          {plan.features.map(function(f,i){return <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:6}}>
            <span style={{color:"#D4A853",fontSize:12,marginTop:2}}>✓</span>
            <span style={{color:"rgba(255,255,255,0.7)",fontSize:13}}>{f}</span>
          </div>})}
        </div>
        <button onClick={onStart} style={{width:"100%",padding:"14px 0",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",background:plan.primary?"#D4A853":"transparent",color:plan.primary?"#0f1b33":"#D4A853",border:plan.primary?"none":"2px solid rgba(212,168,83,0.3)",textTransform:"uppercase",letterSpacing:0.8}}>{plan.cta}</button>
      </div>})}
    </div>
    <p style={{textAlign:"center",color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:20}}>All plans include a 14-day money-back guarantee. Cancel anytime.</p>
  </div>;
}

function SignupModal({onClose}){
  var tab_s=useState("signup");var tab=tab_s[0];var setTab=tab_s[1];
  var email_s=useState("");var email=email_s[0];var setEmail=email_s[1];
  var pass_s=useState("");var pass=pass_s[0];var setPass=pass_s[1];
  var name_s=useState("");var name=name_s[0];var setName=name_s[1];
  return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={onClose}>
    <div style={{background:"linear-gradient(180deg,#1a2340,#0f1b33)",borderRadius:16,padding:32,maxWidth:420,width:"90%",border:"1px solid rgba(212,168,83,0.2)",boxShadow:"0 24px 80px rgba(0,0,0,0.6)"}} onClick={function(e){e.stopPropagation()}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:32,marginBottom:8}}>📚</div>
        <h3 style={{color:"#D4A853",fontSize:22,fontWeight:800,margin:"0 0 4px"}}>Bestseller Book Agent</h3>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:13,margin:0}}>AI-powered — blank page to bestseller list</p>
      </div>
      <div style={{display:"flex",gap:2,marginBottom:20,background:"rgba(255,255,255,0.03)",borderRadius:8,padding:3}}>
        {["signup","signin"].map(function(t){return <button key={t} onClick={function(){setTab(t)}} style={{flex:1,padding:"10px 0",borderRadius:6,fontSize:13,fontWeight:700,background:tab===t?"#D4A853":"transparent",color:tab===t?"#0f1b33":"rgba(255,255,255,0.5)",border:"none",cursor:"pointer",textTransform:"uppercase",letterSpacing:0.5}}>{t==="signup"?"Sign Up":"Sign In"}</button>})}
      </div>
      {tab==="signup"&&<div style={{display:"grid",gap:12}}>
        <input value={name} onChange={function(e){setName(e.target.value)}} placeholder="Full Name" style={{width:"100%",padding:14,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(212,168,83,0.2)",borderRadius:8,color:"#fff",fontSize:15,boxSizing:"border-box"}}/>
        <input value={email} onChange={function(e){setEmail(e.target.value)}} placeholder="Email" type="email" style={{width:"100%",padding:14,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(212,168,83,0.2)",borderRadius:8,color:"#fff",fontSize:15,boxSizing:"border-box"}}/>
        <input value={pass} onChange={function(e){setPass(e.target.value)}} placeholder="Password" type="password" style={{width:"100%",padding:14,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(212,168,83,0.2)",borderRadius:8,color:"#fff",fontSize:15,boxSizing:"border-box"}}/>
        <button style={{width:"100%",padding:16,borderRadius:8,fontSize:15,fontWeight:700,background:"#D4A853",color:"#0f1b33",border:"none",cursor:"pointer",textTransform:"uppercase",letterSpacing:1}}>Create Account</button>
        <p style={{color:"rgba(255,255,255,0.4)",fontSize:11,textAlign:"center",margin:0}}>By signing up you agree to our Terms of Service and Privacy Policy</p>
      </div>}
      {tab==="signin"&&<div style={{display:"grid",gap:12}}>
        <input value={email} onChange={function(e){setEmail(e.target.value)}} placeholder="Email" type="email" style={{width:"100%",padding:14,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(212,168,83,0.2)",borderRadius:8,color:"#fff",fontSize:15,boxSizing:"border-box"}}/>
        <input value={pass} onChange={function(e){setPass(e.target.value)}} placeholder="Password" type="password" style={{width:"100%",padding:14,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(212,168,83,0.2)",borderRadius:8,color:"#fff",fontSize:15,boxSizing:"border-box"}}/>
        <button style={{width:"100%",padding:16,borderRadius:8,fontSize:15,fontWeight:700,background:"#D4A853",color:"#0f1b33",border:"none",cursor:"pointer",textTransform:"uppercase",letterSpacing:1}}>Sign In</button>
        <p style={{color:"rgba(212,168,83,0.6)",fontSize:12,textAlign:"center",margin:0,cursor:"pointer"}}>Forgot password?</p>
      </div>}
    </div>
  </div>;
}

// ═══ DEMO COMPONENTS MAP ═══
var DEMOS={genre:GenreDemo,upload:UploadDemo,guide:AvoidDemo};

// ═══ MAIN APP ═══
export default function BestsellerDemo(){
  var page_s=useState("landing");var page=page_s[0];var setPage=page_s[1];
  var tourIdx_s=useState(0);var tourIdx=tourIdx_s[0];var setTourIdx=tourIdx_s[1];
  var showSignup_s=useState(false);var showSignup=showSignup_s[0];var setShowSignup=showSignup_s[1];
  var current=TOUR[tourIdx];
  var DemoComponent=current&&current.demo?DEMOS[current.demo]:null;

  // ═══ LANDING PAGE ═══
  if(page==="landing"){return <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0a0f1a 0%,#0f1b33 40%,#0a0f1a 100%)",color:"#fff",fontFamily:"'Crimson Pro',Georgia,serif",overflow:"hidden"}}>
    <style>{"@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700;900&display=swap');@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(212,168,83,0.1)}50%{box-shadow:0 0 40px rgba(212,168,83,0.2)}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:0.8}}"}</style>

    {/* HERO */}
    <div style={{maxWidth:1000,margin:"0 auto",padding:"60px 20px 40px",textAlign:"center",position:"relative"}}>
      {/* Decorative elements */}
      <div style={{position:"absolute",top:20,left:"10%",width:80,height:80,borderRadius:"50%",background:"radial-gradient(circle,rgba(212,168,83,0.06),transparent)",animation:"float 6s ease-in-out infinite"}}/>
      <div style={{position:"absolute",top:80,right:"15%",width:60,height:60,borderRadius:"50%",background:"radial-gradient(circle,rgba(212,168,83,0.04),transparent)",animation:"float 8s ease-in-out infinite 1s"}}/>

      <div style={{display:"inline-block",padding:"6px 16px",borderRadius:6,background:"rgba(212,168,83,0.1)",border:"1px solid rgba(212,168,83,0.2)",marginBottom:16}}>
        <span style={{color:"#D4A853",fontSize:12,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>AI-Powered Publishing</span>
      </div>

      <h1 style={{fontSize:52,fontWeight:900,margin:"0 0 12px",lineHeight:1.1,letterSpacing:-1}}>
        <span style={{color:"#fff"}}>From Blank Page to</span><br/>
        <span style={{color:"#D4A853"}}>Bestseller List</span>
      </h1>

      <p style={{color:"rgba(255,255,255,0.6)",fontSize:18,maxWidth:600,margin:"0 auto 32px",lineHeight:1.6}}>
        The complete AI book agent. Write, edit, publish, market, and launch — all in one tool. 12 steps. Zero guesswork.
      </p>

      <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:40}}>
        <button onClick={function(){setPage("tour");setTourIdx(0)}} style={{padding:"16px 32px",borderRadius:10,fontSize:16,fontWeight:700,background:"#D4A853",color:"#0f1b33",border:"none",cursor:"pointer",textTransform:"uppercase",letterSpacing:1,animation:"glow 3s ease-in-out infinite"}}>Take the Tour</button>
        <button onClick={function(){setShowSignup(true)}} style={{padding:"16px 32px",borderRadius:10,fontSize:16,fontWeight:700,background:"transparent",color:"#D4A853",border:"2px solid rgba(212,168,83,0.3)",cursor:"pointer",textTransform:"uppercase",letterSpacing:1}}>Sign In</button>
      </div>

      {/* Step preview cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,maxWidth:800,margin:"0 auto"}}>
        {[["📝","Write","AI writes chapters in your voice"],["🔍","Review","4 modes of editorial feedback"],["📊","Publish","Keywords, categories, pricing, ads"],["🚀","Launch","Emails, BookTok, ARC, checklist"]].map(function(item,i){
          return <div key={i} style={{padding:16,borderRadius:10,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",animation:"fadeIn 0.6s ease-out "+(0.2+i*0.15)+"s both"}}>
            <div style={{fontSize:28,marginBottom:6}}>{item[0]}</div>
            <div style={{color:"#D4A853",fontSize:14,fontWeight:700,marginBottom:2}}>{item[1]}</div>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:12}}>{item[2]}</div>
          </div>
        })}
      </div>
    </div>

    {/* STATS BAR */}
    <div style={{maxWidth:800,margin:"40px auto",padding:"20px 0",borderTop:"1px solid rgba(255,255,255,0.04)",borderBottom:"1px solid rgba(255,255,255,0.04)",display:"flex",justifyContent:"space-around"}}>
      {[["12","Steps","Genre to Launch"],["85","Functions","Built In"],["200K+","Words","Manuscript Support"],["6","Formats","Ebook to Audiobook"]].map(function(s,i){
        return <div key={i} style={{textAlign:"center"}}>
          <div style={{color:"#D4A853",fontSize:32,fontWeight:900}}>{s[0]}</div>
          <div style={{color:"rgba(255,255,255,0.5)",fontSize:12}}>{s[1]}</div>
          <div style={{color:"rgba(255,255,255,0.35)",fontSize:11}}>{s[2]}</div>
        </div>
      })}
    </div>

    {/* FEATURE HIGHLIGHTS */}
    <div style={{maxWidth:800,margin:"40px auto",padding:"0 20px"}}>
      <h2 style={{color:"#D4A853",fontSize:28,fontWeight:800,textAlign:"center",margin:"0 0 24px"}}>What Makes This Different</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {[
          ["🎯","Anti-Fact Scrambling","AI never rearranges your characters, dollar amounts, or storyline. Every edit respects what you wrote."],
          ["🎭","12 Tone Options","Set each chapter's emotional tone — from Conversational to Tear-jerker. AI writes in the style you choose."],
          ["📝","Three Upload Paths","Unorganized blob? Outline only? Written with chapters? The agent adapts to what you have."],
          ["🎧","Audiobook Pipeline","Production options, narrator guidance, ACX specs, distribution strategy — all in one tab."],
          ["📚","Multi-Book Library","Unlimited books. Per-book storage. Auto-save. Pick up any book where you left off."],
          ["🚀","40+ Item Launch Plan","5-phase checklist from pre-publication through Week 4. Persisted checkboxes track your progress."],
        ].map(function(f,i){return <div key={i} style={{padding:18,borderRadius:10,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)",animation:"fadeIn 0.5s ease-out "+(0.1+i*0.1)+"s both"}}>
          <div style={{fontSize:24,marginBottom:6}}>{f[0]}</div>
          <div style={{color:"#fff",fontSize:15,fontWeight:700,marginBottom:4}}>{f[1]}</div>
          <div style={{color:"rgba(255,255,255,0.6)",fontSize:13,lineHeight:1.5}}>{f[2]}</div>
        </div>})}
      </div>
    </div>

    {/* PRICING */}
    <PricingSection onStart={function(){setShowSignup(true)}}/>

    {/* FOOTER */}
    <div style={{textAlign:"center",padding:"30px 20px",borderTop:"1px solid rgba(255,255,255,0.03)"}}>
      <p style={{color:"rgba(255,255,255,0.3)",fontSize:12}}>Bestseller Book Agent — Built by WoulfAI</p>
    </div>

    {showSignup&&<SignupModal onClose={function(){setShowSignup(false)}}/>}
  </div>}

  // ═══ GUIDED TOUR ═══
  if(page==="tour"){return <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0a0f1a 0%,#0f1b33 50%,#0a0f1a 100%)",color:"#fff",fontFamily:"'Crimson Pro',Georgia,serif"}}>
    <style>{"@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700;900&display=swap');@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(212,168,83,0.1)}50%{box-shadow:0 0 40px rgba(212,168,83,0.2)}}"}</style>
    <div style={{maxWidth:800,margin:"0 auto",padding:"20px 16px"}}>

      {/* Tour header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <button onClick={function(){setPage("landing")}} style={{background:"none",border:"2px solid rgba(212,168,83,0.25)",borderRadius:6,color:"#D4A853",cursor:"pointer",padding:"6px 14px",fontSize:12,fontWeight:700}}>← Back</button>
        <div style={{color:"rgba(255,255,255,0.5)",fontSize:12}}>{tourIdx+1} of {TOUR.length}</div>
        <button onClick={function(){setShowSignup(true)}} style={{padding:"6px 14px",borderRadius:6,fontSize:12,fontWeight:700,background:"#D4A853",color:"#0f1b33",border:"none",cursor:"pointer"}}>Sign Up</button>
      </div>

      {/* Progress bar */}
      <div style={{height:3,background:"rgba(255,255,255,0.04)",borderRadius:2,marginBottom:24,overflow:"hidden"}}>
        <div style={{height:"100%",background:"linear-gradient(90deg,#D4A853,#E8C97A)",width:((tourIdx+1)/TOUR.length*100)+"%",borderRadius:2,transition:"width 0.4s"}}/>
      </div>

      {/* Step dots */}
      <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:24}}>
        {TOUR.map(function(_,i){return <div key={i} onClick={function(){setTourIdx(i)}} style={{width:tourIdx===i?20:8,height:8,borderRadius:4,background:i<=tourIdx?"#D4A853":"rgba(255,255,255,0.1)",cursor:"pointer",transition:"all 0.3s"}}/>})}
      </div>

      {/* Current step */}
      {current&&<div key={current.id} style={{animation:"fadeIn 0.4s ease-out"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:56,marginBottom:8}}>{current.icon}</div>
          <h2 style={{color:"#D4A853",fontSize:28,fontWeight:900,margin:"0 0 4px"}}>{current.title}</h2>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:16,margin:0}}>{current.sub}</p>
        </div>

        {/* Description */}
        <div style={{padding:20,background:"rgba(255,255,255,0.02)",borderRadius:12,border:"1px solid rgba(255,255,255,0.05)",marginBottom:20}}>
          <p style={{color:"rgba(255,255,255,0.75)",margin:0,fontSize:15,lineHeight:1.8,whiteSpace:"pre-line"}}>{current.desc}</p>
        </div>

        {/* Interactive demo */}
        {DemoComponent&&<div style={{padding:20,background:"rgba(212,168,83,0.03)",borderRadius:12,border:"1px solid rgba(212,168,83,0.1)",marginBottom:20}}>
          <div style={{color:"#D4A853",fontSize:13,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>Interactive Demo</div>
          <DemoComponent/>
        </div>}

        {/* Navigation */}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
          <button onClick={function(){if(tourIdx>0)setTourIdx(tourIdx-1)}} disabled={tourIdx===0} style={{padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:700,background:"rgba(212,168,83,0.15)",color:"#D4A853",border:"2px solid rgba(212,168,83,0.3)",cursor:tourIdx===0?"default":"pointer",opacity:tourIdx===0?0.3:1}}>← Previous</button>
          {tourIdx<TOUR.length-1
            ?<button onClick={function(){setTourIdx(tourIdx+1)}} style={{padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:700,background:"#D4A853",color:"#0f1b33",border:"none",cursor:"pointer"}}>{current.action||"Next →"}</button>
            :<button onClick={function(){setPage("landing");setTimeout(function(){setShowSignup(true)},300)}} style={{padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:700,background:"#D4A853",color:"#0f1b33",border:"none",cursor:"pointer"}}>Get Started →</button>
          }
        </div>
      </div>}
    </div>
    {showSignup&&<SignupModal onClose={function(){setShowSignup(false)}}/>}
  </div>}

  return null;
}
