
// ─── Supabase client ──────────────────────────────────────────────────────────
// Replace these two values with your own from supabase.com → Project Settings → API
const SB_URL = 'https://gsthbaydpvxtkxktilyx.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdGhiYXlkcHZ4dGt4a3RpbHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTA5NTUsImV4cCI6MjA5MDA4Njk1NX0.LngNYJkcVgnJy2NFBmI2rxa1Mv4lPi7cwOxCGSyM2h0';
const SB = supabase.createClient(SB_URL, SB_KEY);
// Replace with your Stripe Publishable Key from dashboard.stripe.com
const STRIPE_KEY = 'pk_test_placeholder';
const stripe = typeof Stripe !== 'undefined' ? Stripe(STRIPE_KEY) : null;
// ─────────────────────────────────────────────────────────────────────────────

const BL='#007AFF',GR='#34C759',OR='#FF9500',RD='#FF3B30',PU='#AF52DE',IN='#5856D6',TE='#5AC8FA';
let _dl = [];
try { _dl = JSON.parse(localStorage.getItem('dl_cache')||'[]'); } catch(e){}
if(_dl.length===0){
  _dl=[
    {d:'Mar 26, 2026',w:'Sunny, 32°C',h:34,e:2,p:'Slab preparation complete. All rebar tied and inspected by structural engineer.',v:['Delivered 120 bags cement'],n:'No incidents.',c:BL,s:true},
    {d:'Mar 25, 2026',w:'Morning Rain, 29°C',h:32,e:2,p:'Delayed start due to rain. Continued CHB laying at East wing after 10 AM.',v:['Delivered 2,000 CHB'],n:'1 worker sent home (fever)',c:BL,s:true}
  ];
  localStorage.setItem('dl_cache',JSON.stringify(_dl));
}
window.addEventListener('online',()=>{
  let c=false; _dl.forEach(r=>{if(!r.s){r.s=true;c=true;}});
  if(c){localStorage.setItem('dl_cache',JSON.stringify(_dl)); render();}
});
const fmt=n=>'₱'+Number(n).toLocaleString();
const fmtK=n=>n>=1e6?'₱'+(n/1e6).toFixed(2)+'M':'₱'+(n/1e3).toFixed(0)+'k';
const cl=(v,a,b)=>Math.min(b,Math.max(a,v));

const MKT=[
  {name:'Cement (Portland Type 1)',unit:'40kg bag',price:285,change:+1.2,trend:'up',risk:'Med',supplier:'Holcim / Republic Cement',note:'PSA: cement index -1.5% YoY. Stable for now. Buy 100+ bags in bulk.'},
  {name:'Rebar 12mm Grade 40',unit:'kg',price:68,change:-3.0,trend:'down',risk:'Low',supplier:'Pag-asa Steel / NatSteel',note:'PSA: structural steel -3.0% YoY. Good time to lock in pricing before structural phase.'},
  {name:'Rebar 16mm Grade 40',unit:'kg',price:70,change:-2.8,trend:'down',risk:'Low',supplier:'Pag-asa Steel',note:'Prices declining YoY. Secure PO now before structural phase.'},
  {name:'Sand (River Wash)',unit:'m³',price:520,change:+0.2,trend:'stable',risk:'Low',supplier:'Rizal Province suppliers',note:'PSA: sand & gravel +0.2%. Negligible. Source direct from Rizal for best rates.'},
  {name:'Gravel ¾"',unit:'m³',price:680,change:+0.2,trend:'stable',risk:'Low',supplier:'Rizal Province',note:'Stable. Combine delivery with sand orders to save on hauling cost.'},
  {name:'CHB 6" Solid',unit:'piece',price:18,change:0,trend:'stable',risk:'Low',supplier:'Dynasty Hardware / Local',note:'Flat pricing YoY. Buy from local manufacturer for best rates at 5,000+ pcs.'},
  {name:'Plywood ¾" Marine',unit:'sheet',price:1450,change:+0.3,trend:'up',risk:'Med',supplier:'Yuchengco Timber',note:'PSA: plywood +0.3% YoY. Minor increase. Order ahead for formworks.'},
  {name:'Long Span Roofing GA26',unit:'lin.m',price:215,change:+1.5,trend:'up',risk:'Med',supplier:'Union Galvasteel / BlueScope',note:'Painting works index +0.6%. Color-coated adds 15-20%. Lock in orders early.'},
  {name:'PVC Pipe 4" (Sanimold)',unit:'length',price:320,change:0,trend:'stable',risk:'Low',supplier:'Neltex / Moldex',note:'Stable pricing. Short lead time — order per project phase only.'},
  {name:'Paint Elastomeric Ext.',unit:'4L can',price:680,change:+0.6,trend:'up',risk:'Med',supplier:'Asian Paints / Boysen',note:'PSA: painting index +0.6%. Buy per estimate plus 10% buffer.'},
  {name:'Steel Sheet GI #26',unit:'sheet',price:890,change:-1.0,trend:'down',risk:'Low',supplier:'Steel Asia',note:'Hardware & steel casement index -0.1%. Market softening on steel.'},
  {name:'Ready-Mix Concrete',unit:'m³',price:5402,change:+0.5,trend:'up',risk:'Med',supplier:'Holcim ReadyMix',note:'DPWH market rate ₱5,402/m³. Confirm lead time — 3-day advance order required.'},
  {name:'Diesel (Euro 4 Bulk)',unit:'liter',price:58.45,change:+2.1,trend:'up',risk:'High',supplier:'Shell / Petron Fleet',note:'DOE: Diesel +₱1.20/L next week. Expect 5-8% increase in hauling rates.'},
  {name:'Hauling (10-Wheeler)',unit:'trip',price:4500,change:+5.0,trend:'up',risk:'High',supplier:'Rizal Haulers',note:'Fuel surge impacting trip rates. Bundle deliveries to optimize cost.'},
];

const NEWS_DATA=[
  {date:'Mar 25, 2025',tag:'PRICES',title:'PSA: NCR Construction Materials Price Index up 0.8% YoY — December 2025',body:'The annual growth rate of the CMWPI in NCR remained at 0.8% in December. Structural steel posted the largest annual decline at 3.0%, while sand & gravel and painting works recorded small increases. Annual average growth rate slowed to 0.1% for 2025.',source:'Philippine Statistics Authority',color:BL,urgent:false},
  {date:'Mar 22, 2025',tag:'POLICY',title:'DPWH Orders Up to 75% Cut in Government Construction Material Costs',body:'Public Works Secretary Dizon signed an order aligning government project material costs with current market prices. Rebar Gr.40 market: ₱36/kg vs previous govt rate of ₱52/kg. Cement: ₱213/bag vs ₱236. Expected ₱60B in savings for 2026 budget.',source:'Philippine Daily Inquirer',color:GR,urgent:false},
  {date:'Mar 20, 2025',tag:'ALERT',title:'PAGASA: La Niña Conditions May Return Q2 2025 — Extended Rainy Season',body:'PAGASA warns of potential La Niña from Q2 2025. Contractors should add 15–20% weather buffer to earthworks and roofing schedules. Stock up on waterproofing materials before June to avoid supply constraints during peak rainy season.',source:'PAGASA',color:RD,urgent:true},
  {date:'Mar 18, 2025',tag:'STEEL',title:'Structural Steel Prices Continue Declining — PSA Index Down 3.0% YoY',body:'Following a 9.0% average increase in 2024, structural steel prices reversed with a 2.0% average annual decline in 2025. Contractors procuring for structural works should act now to lock in favorable rates before potential supply disruptions in Q2.',source:'PSA / BusinessWorld',color:OR,urgent:false},
  {date:'Mar 15, 2025',tag:'PERMIT',title:'Quezon City CPDO Now Accepting Online Building Permit Applications',body:'QC CPDO has expanded its e-permit system covering new construction and renovation. Digital submission reduces document turnaround by 40%. Required: architectural plans, structural plans, soil boring report, and site development plan.',source:'Quezon City Government',color:IN,urgent:false},
  {date:'Mar 12, 2025',tag:'LABOR',title:'DOLE Sets New NCR Minimum Daily Wage — Contractors Must Update Payroll',body:'New NCR minimum wage effective March 2025: ₱645/day for non-agricultural workers. Contractors with direct-hire labor must update payroll immediately. Non-compliance subject to DOLE Labor Inspectorate enforcement and penalties.',source:'DOLE Philippines',color:PU,urgent:true},
  {date:'Mar 10, 2025',tag:'MARKET',title:'Holcim Philippines Confirms Stable Cement Prices for Q2 2025',body:'Holcim confirmed no planned price increases for cement in Q2. Current retail: ₱285–₱295 per 40kg bag in NCR. Contractors can plan BOQ without cement price escalation clauses for the next quarter.',source:'Holcim Philippines',color:TE,urgent:false},
  {date:'Mar 8, 2025',tag:'SAFETY',title:'DOLE Issues 47 Stop-Work Orders in NCR in February — OSH Violations',body:'DOLE Labor Inspectorate issued stop-work orders to 47 construction sites in NCR in February 2025 for R.A. 11058 violations. Most common: missing PPE, no CSHP posted, inadequate scaffolding tagging. Administrative fines up to ₱100,000 per day.',source:'DOLE Philippines',color:RD,urgent:true},
  {date:'Mar 26, 2025',tag:'FUEL',title:'DOE: Diesel Prices Expected to Rise ₱1.20/Liter next Tuesday',body:'Department of Energy monitors global oil surge. Contractors should prepare for a 5-8% increase in hauling and trucking rates for bulk materials like sand, gravel, and rebar. Update logistics budgets immediately.',source:'DOE Philippines',color:OR,urgent:true},
  {date:'Mar 26, 2025',tag:'PCAB',title:'PCAB Board Res. No. 042: New License Renewal Calendar for FY2026',body:'The Philippine Contractors Accreditation Board released the mandatory renewal schedule. Avoid the ₱5,000 late penalty by filing 60 days before your specific license expiration date. New digital portal now active.',source:'PCAB / CIAP',color:BL,urgent:true},
  {date:'Mar 25, 2025',tag:'GOVT',title:'PhilGEPS: DPWH Region IV-A Opens Bidding for ₱42M Road Project',body:'Infrastructure Project ID: 25-DPWH-4A-012. Civil works for road widening in Batangas. Deadline for submission of bids: April 15, 2025. Pre-bid conference scheduled for April 2.',source:'PhilGEPS',color:GR,urgent:false},
];

const MOCK_PROJECTS=[
  {id:1,name:'Santos Residence',client:'Maria Santos',location:'BGC, Taguig',value:4250000,spent:1240000,billed:980000,received:750000,pct:42,phase:'Structural Works',cashGap:230000,openPunch:4,margin:13.4,daysLeft:89,health:'good'},
  {id:2,name:'Reyes Commercial Bldg',client:'Roberto Reyes',location:'Quezon City',value:12800000,spent:7680000,billed:10240000,received:9260000,pct:78,phase:'Finishing Works',cashGap:980000,openPunch:12,margin:8.2,daysLeft:22,health:'watch'},
  {id:3,name:'Lim Townhouse',client:'Daphne Lim',location:'Parañaque',value:8400000,spent:8400000,billed:8400000,received:8400000,pct:100,phase:'Warranty Period',cashGap:0,openPunch:0,margin:14.8,daysLeft:0,health:'good'},
  {id:4,name:'Cruz Warehouse',client:'Jose Cruz',location:'Laguna',value:6200000,spent:620000,billed:620000,received:620000,pct:10,phase:'Earthworks',cashGap:0,openPunch:0,margin:11.0,daysLeft:145,health:'good'},
  {id:5,name:'Tan Villa Reno',client:'Alice Tan',location:'Alabang',value:2100000,spent:1890000,billed:1680000,received:1260000,pct:90,phase:'Punch List',cashGap:420000,openPunch:8,margin:6.1,daysLeft:8,health:'critical'},
];
const PHASES=[
  {name:'Pre-Construction & Permits',pct:100,status:'done',date:'Feb 1 – Feb 14'},
  {name:'Earthworks & Foundation',pct:100,status:'done',date:'Feb 15 – Mar 7'},
  {name:'Structural Works',pct:65,status:'active',date:'Mar 8 – Apr 18'},
  {name:'Roofing & Waterproofing',pct:0,status:'pending',date:'Apr 19 – May 2'},
  {name:'MEP Rough-in',pct:0,status:'pending',date:'May 3 – May 16'},
  {name:'Finishing Works',pct:0,status:'pending',date:'May 17 – Jun 13'},
  {name:'Turnover & Inspection',pct:0,status:'pending',date:'Jun 14 – Jun 20'},
];

let A={
  theme:'light',view:'landing',user:null,project:null,dbProjects:null,dashTab:'overview',
  authMode:'signin',
  workers:[
    {id:'W-001',n:'Ramon Diaz',r:'Lead Mason',s:'In',t:'06:58 AM',p:'https://i.pravatar.cc/150?u=1'},
    {id:'W-002',n:'Luis Reyes',r:'Foreman',s:'In',t:'06:45 AM',p:'https://i.pravatar.cc/150?u=2'},
    {id:'W-003',n:'Carlos Tan',r:'Electrician',s:'Out',t:'Yesterday',p:'https://i.pravatar.cc/150?u=3'},
    {id:'W-004',n:'Mike Santos',r:'Laborer',s:'In',t:'07:12 AM',p:'https://i.pravatar.cc/150?u=4'},
  ],
  scanningQR:false,
  punches:[
    {id:1,area:'Kitchen',item:'Grout missing on floor tiles (3 spots)',trade:'Tiles',priority:'High',status:'Open',due:'Apr 22'},
    {id:2,area:'Master BR',item:'Paint peeling at ceiling cornice',trade:'Painter',priority:'Med',status:'Open',due:'Apr 25'},
    {id:3,area:'CR 1',item:'Exhaust fan not working',trade:'Electrical',priority:'High',status:'Resolved',due:'Apr 20'},
    {id:4,area:'Staircase',item:'Baluster 3 wobbly — regrout needed',trade:'Masonry',priority:'High',status:'Open',due:'Apr 22'},
  ],
  messages:[
    {from:'contractor',text:'Column rebar works Level 1 complete. On track for Apr 18 slab pour.',time:'Mar 18, 2:14 PM'},
    {from:'client',text:'Looks great in the photos!',time:'Mar 18, 3:02 PM'},
    {from:'contractor',text:'Still on schedule. I will notify you 3 days before the slab pour.',time:'Mar 18, 3:15 PM'},
  ],
  inventory:[
    {id:1,mat:'Cement (bags)',delivered:820,used:640,expected:180,cost:285,reorder:50},
    {id:2,mat:'Rebar 12mm (pcs)',delivered:480,used:390,expected:90,cost:408,reorder:20},
    {id:3,mat:'CHB 6" (pcs)',delivered:1500,used:1100,expected:400,cost:18,reorder:200},
    {id:4,mat:'Sand (m³)',delivered:42,used:35,expected:7,cost:520,reorder:5},
    {id:5,mat:'Gravel (m³)',delivered:38,used:32,expected:6,cost:680,reorder:5},
    {id:6,mat:'Plywood sheets',delivered:80,used:72,expected:8,cost:1450,reorder:10},
    {id:7,mat:'GI Wire (kg)',delivered:120,used:98,expected:22,cost:85,reorder:20},
    {id:8,mat:'Paint 4L (cans)',delivered:24,used:8,expected:16,cost:680,reorder:0},
  ],
  showDelivery:false,showUsage:false,showReportForm:false,dailyLogs:_dl,
  featureRequests:[
    {id:1,title:'Offline mode for daily reports',category:'Mobile',votes:47,status:'In Review',by:'Engr. dela Cruz',date:'Mar 10',description:'File reports on site even without internet. Sync automatically when back online.'},
    {id:2,title:'QR code attendance scanning',category:'Workforce',votes:38,status:'Planned',by:'Arch. Santos',date:'Mar 8',description:'Workers scan QR code at gate to record time-in/out. Eliminates ghost workers automatically.'},
    {id:3,title:'GCash direct payment in client portal',category:'Payments',votes:31,status:'In Review',by:'Daphne Lim',date:'Mar 5',description:'Allow clients to pay progress billings directly in their portal via GCash or Maya.'},
    {id:4,title:'Export BOQ to Excel',category:'BOQ',votes:25,status:'Completed',by:'Engr. Reyes',date:'Feb 28',description:'One-click export of full BOQ to Excel for client submission and archiving.'},
  ],
  frTitle:'',frCategory:'General',frDescription:'',frName:'',frEmail:'',frSubmitted:false,showFrForm:false,
  faqs:[
    {id:1,q:'How does the client portal work?',a:'Clients get a unique secure link to see real-time progress, photos, and milestones. No app download needed.'},
    {id:2,q:'Can I manage multiple projects?',a:'Yes. Pro supports 10 active projects, Enterprise is unlimited. Each has its own dashboard, portal, and billing tracker.'},
    {id:3,q:'Can I cancel anytime?',a:'Monthly billing — cancel anytime, no penalties. Annual gives 2 months free. 14-day trial, no credit card required.'},
    {id:4,q:'Can I integrate with PhilGEPS?',a:'Yes. Pro & Enterprise plans include a PhilGEPS opportunity scraper that alerts you to new bidding opportunities in your region.'},
    {id:5,q:'How do you help with PCAB compliance?',a:'ConstructAI tracks your license validity and sends automatic alerts 60 days before renewal is due to prevent late penalties and business disruption.'},
    {id:6,q:'Why track fuel prices?',a:'Logistics and hauling costs usually impact 15-20% of your project budget. We provide DOE fuel updates so you can adjust your hauling rates in real-time.'},
  ],
  testimonials:[
    {id:1,name:'Engr. Ramon dela Cruz',role:'General Contractor',company:'RDC Construction Corp',location:'Quezon City',rating:5,text:'Before ConstructAI, clients called me 3x a day. Now they check their portal. Disputes dropped to zero.',avatar:'RC'},
    {id:2,name:'Arch. Maria Santos',role:'Design-Build Contractor',company:'Santos Design Build',location:'BGC, Taguig',rating:5,text:'The change order module paid for the subscription in month 1. We recovered ₱340,000 we would have lost.',avatar:'MS'},
    {id:3,name:'Engr. Jose Reyes',role:'Civil Works',company:'Reyes Civil Works',location:'Cebu City',rating:5,text:'The weather delay tracker helped me claim 12 extra days on a government project. Client accepted immediately.',avatar:'JR'},
    {id:4,name:'Daphne Lim',role:'Property Developer',company:'Lim Properties',location:'Makati',rating:5,text:'I oversee 6 projects at once. ConstructAI shows me which need attention. My accountant loves the billing tracker.',avatar:'DL'},
  ],
  coItems:[
    {id:1,desc:'Perimeter fence (CHB)',by:'Client',amount:85000,status:'Approved',date:'Mar 3'},
    {id:2,desc:'Upgrade roofing to GA26',by:'Client',amount:42000,status:'Pending',date:'Mar 10'},
    {id:3,desc:'Relocate kitchen drain',by:'Architect',amount:18500,status:'Disputed',date:'Mar 14'},
  ],
  billings:[
    {ref:'DP-01',ms:'Down Payment (10%)',amount:425000,due:'Feb 1',status:'Received'},
    {ref:'PR-01',ms:'Foundation Complete (20%)',amount:850000,due:'Feb 20',status:'Received'},
    {ref:'PR-02',ms:'Structural Framing (20%)',amount:850000,due:'Mar 15',status:'Partial'},
    {ref:'PR-03',ms:'Roofing & MEP (20%)',amount:850000,due:'Apr 10',status:'Not Due'},
    {ref:'FN-01',ms:'Final Turnover (10%)',amount:425000,due:'Jun 1',status:'Not Due'},
  ],
  openFaq:null,portalTab:'progress',adminSection:'faqs',
  editFaqIdx:null,editFaqQ:'',editFaqA:'',showFaqForm:false,
  boqRates:[85000,6200,72,18,850],editBoq:false,
  billing:'annual',showPunchForm:false,
  newsFilter:'All',mktDetail:null,
  aiChat: [{r:'ai',t:"I am ConstructAI, your project's command center. Ask me anything about Santos Residence, such as material spend, weather delays, or open punch list items."}],
  aiTyping: false,
  aff:{ id:'REF-'+Math.random().toString(36).substr(2,6).toUpperCase(), refs:12, earnings:5840, clicks:248, tier:'Bronze (10%)' },
  payoutRequests: [{id:1,user:'Engr. Diaz',amount:1200,method:'GCash',status:'Pending',date:'Mar 25'}],
  leads: [
    {id:1,name:'Atty. Garcia',location:'Forbes Park, Makati',value:45000000,stage:'Architectural Design',source:'Referral',health:'hot',contact:'0917-555-0123'},
    {id:2,name:'Dr. Wong',location:'Ayala Alabang',value:12000000,stage:'Site Inspection',source:'Website',health:'warm',contact:'0918-555-4567'},
    {id:3,name:'Tan Commercial Bldg',location:'Quezon City',value:85000000,stage:'Inquiry',source:'Facebook',health:'hot',contact:'0919-555-8888'}
  ],
  rfqs: [
    {id:101,item:'Portland Cement (40kg)',qty:800,budget:295,status:'Bidding Open',bids:[{v:'Holcim',p:285,d:'2 days'},{v:'Republic',p:292,d:'1 day'}]},
    {id:102,item:'Rebar 12mm Gr40',qty:1200,budget:72,status:'Awarded',bids:[{v:'Pag-asa',p:68,win:true,d:'3 days'},{v:'NatSteel',p:71,d:'2 days'}]},
  ],
  pos: [
    {id:'PO-405',vendor:'Pag-asa Steel',amount:81600,status:'Pending PM Approval',date:'Mar 26'},
  ],
  crmStageFilter:'All',
  rentals: [
    {id:1,name:'1-Bagger Mixer',owner:'RDC Construction',loc:'Quezon City',price:450,status:'Available',img:'https://images.unsplash.com/photo-1541888946425-d81bb1930060?auto=format&fit=crop&q=80&w=200'},
    {id:2,name:'Mini Excavator',owner:'Santos Build',loc:'BGC',price:5500,status:'In Use',img:'https://images.unsplash.com/photo-1504307651254-35680f3366d4?auto=format&fit=crop&q=80&w=200'},
    {id:3,name:'Plate Compactor',owner:'Lim Properties',loc:'Makati',price:850,status:'Available',img:'https://images.unsplash.com/photo-1541888946425-d81bb1930060?auto=format&fit=crop&q=80&w=200'},
  ],
  subs: [
    {id:1,name:'A1 Tiling Services',trade:'Masonry/Tiles',score:4.8,projects:12,reliability:'High',last:'Feb 2026',badge:'Verified'},
    {id:2,name:'JP Plumbing',trade:'Plumbing/Sanitary',score:3.2,projects:5,reliability:'Low',last:'Mar 2026',badge:'Provisional'},
    {id:3,name:'Solaris Electrical',trade:'Electrical',score:5.0,projects:28,reliability:'High',last:'Jan 2026',badge:'Top Rated'},
  ],
  aiAnalysis: {
    delayRisk: 'High',
    predictedDelay: 12,
    cause: 'Precipitation + Crew Turnover',
    recommendation: 'Draft EOT Claim & Increase Masonry Crew by 2.'
  },
  marketTrends: [
    {mat: 'Cement', trend: 'UP', change: '+5.2%', alert: 'Buy now to save ₱4,200', color: RD},
    {mat: 'SteelAsia Rebar', trend: 'DOWN', change: '-2.1%', alert: 'Hold for Phase 2', color: GR},
    {mat: 'River Sand', trend: 'STABLE', change: '0%', alert: 'Order upon need', color: BL},
  ],
};

const hc=h=>h==='good'?GR:h==='watch'?OR:RD;
const sc=s=>({Received:GR,Pass:GR,Approved:GR,Resolved:GR,Completed:GR,done:GR,Partial:OR,Pending:OR,'In Review':OR,'Not Due':'#8e8e93',Fail:RD,Disputed:RD,Open:OR,AWOL:RD,Planned:BL}[s]||'#8e8e93');
const bdg=(t,c)=>`<span style="background:${c}20;color:${c};border-radius:20px;padding:2px 10px;font-size:12px;font-weight:500;white-space:nowrap">${t}</span>`;
const cd=(html,style='')=>`<div class="card" style="${style}">${html}</div>`;
const st=(icon,label,val,color)=>`<div class="card2"><div style="font-size:20px;margin-bottom:8px">${icon}</div><div style="font-size:22px;font-weight:700;color:${color};margin-bottom:2px;letter-spacing:-.02em">${val}</div><div style="font-size:13px;color:var(--text3)">${label}</div></div>`;
const pb=(v,c,h=6)=>`<div style="height:${h}px;background:var(--card3);border-radius:${h}px;overflow:hidden"><div style="height:100%;width:${cl(v,0,100)}%;background:${c};border-radius:${h}px;transition:width .8s ease"></div></div>`;
const bt=(label,oc,v='filled',c,sm)=>{const col=c||BL;const bg=v==='filled'?col:v==='tinted'?col+'20':'transparent';const tc=v==='filled'?'#fff':col;return`<button onclick="${oc}" style="background:${bg};color:${tc};border:${v==='ghost'?'0.5px solid var(--sep)':'none'};border-radius:20px;padding:${sm?'5px 12px':'9px 18px'};font-size:${sm?12:13}px;font-weight:500">${label}</button>`;};

function NAV(){
  const vs=[{id:'landing',l:'Home'},{id:'projects',l:'Projects'},{id:'dashboard',l:'Dashboard'},{id:'crm',l:'Sales CRM'},{id:'client',l:'Client Portal'},{id:'market',l:'Market'},{id:'admin',l:'Admin'},{id:'saas',l:'SaaS Core'}];
  return`<nav style="background:var(--nav);backdrop-filter:saturate(180%) blur(20px);border-bottom:0.5px solid var(--sep);padding:0 20px;display:flex;align-items:center;justify-content:space-between;height:50px;position:sticky;top:0;z-index:200;transition:background .3s">
    <div style="display:flex;align-items:center;gap:8px;cursor:pointer" onclick="go('landing')">
      <img src="logo.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover">
      <span style="font-size:15px;font-weight:700;letter-spacing:-.02em;color:var(--text)">ConstructAI <span style="color:${BL}">PH</span></span>
    </div>
    <div style="display:flex;gap:2px">
      ${vs.map(v=>`<button onclick="go('${v.id}')" style="padding:6px 12px;border-radius:16px;border:none;background:${A.view===v.id?BL+'20':'transparent'};color:${A.view===v.id?BL:'var(--text3)'};font-size:13px;font-weight:${A.view===v.id?500:400}">${v.l}</button>`).join('')}
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <button onclick="const tm={light:'dark',dark:'solana',solana:'blueprint',blueprint:'light'};ss({theme:tm[A.theme]})" style="background:var(--card2);border:0.5px solid var(--sep);border-radius:20px;padding:5px 13px;font-size:13px;font-weight:500;color:var(--text2)">${{light:'☀️ Light',dark:'🌙 Dark',solana:'🟩 Solana',blueprint:'📐 Blueprint'}[A.theme]}</button>
      ${A.user?`<span style="font-size:12px;color:var(--text3)">${A.user.name}</span>${bt('Sign Out','doSignOut()','ghost',null,true)}`:bt('Sign In',"go('auth')",'tinted',BL,true)}
    </div>
  </nav>`;
}

function TICKER(){
  const items=NEWS_DATA.map(n=>`<span style="font-size:12px;color:var(--text2);display:inline-flex;align-items:center;gap:6px"><span style="background:${n.color}20;color:${n.color};border-radius:10px;padding:1px 7px;font-size:11px;font-weight:500">${n.tag}</span>${n.urgent?'🚨 ':''}<span>${n.title}</span></span>`).join('');
  return`<div class="tw" style="background:var(--card);border-bottom:0.5px solid var(--sep);padding:8px 0"><div class="ti" style="gap:60px">${items}&nbsp;&nbsp;&nbsp;${items}</div></div>`;
}

function LANDING(){
  const bA=p=>A.billing==='annual'?p.annual:p.monthly;
  const PL=[
    {name:'Starter',monthly:990,annual:790,color:BL,stripeMo:'#',stripeYr:'#',features:['3 active projects','Client progress portal','BOQ & billing tracker','Material inventory','Change order log','Email support']},
    {name:'Pro',monthly:2490,annual:1990,color:OR,popular:true,stripeMo:'#',stripeYr:'#',features:['10 active projects','Everything in Starter','Workforce attendance','Weather delay tracker','Safety OSH compliance','AI BOQ Generator','Market news feed','Priority support']},
    {name:'Enterprise',monthly:5990,annual:4790,color:GR,stripeMo:'#',stripeYr:'#',features:['Unlimited projects','Everything in Pro','Multi-project dashboard','5 team users','E-signature module','GCash/Maya payments','API access','Dedicated account manager']},
  ];
  const FT=[
    {icon:'📊',title:'Live Client Portal',desc:'Clients see real-time progress, photos, milestones. No more 3-calls-a-day.',color:BL},
    {icon:'💰',title:'Cash Flow Tracker',desc:'CIAP 102 billing milestones. Know exactly what\'s billed vs collected.',color:GR},
    {icon:'📦',title:'Live Material Inventory',desc:'Real-time delivery and usage tracking. Low-stock alerts. Variance detection.',color:OR},
    {icon:'📰',title:'Market News Feed',desc:'PSA price indices, DOLE advisories, PAGASA alerts, and industry news.',color:TE},
    {icon:'👷',title:'Workforce Attendance',desc:'Daily headcount, AWOL alerts, anti-ghost worker checklist.',color:PU},
    {icon:'💡',title:'Feature Requests',desc:'Vote on features. Most-voted get built first. Submit your own ideas.',color:IN},
    {icon:'🦺',title:'DOLE OSH Compliance',desc:'R.A. 11058 checklist. Track incidents. Avoid ₱100k/day fines.',color:RD},
    {icon:'🤖',title:'AI BOQ Generator',desc:'Input area and finish level — complete BOQ in 30 seconds.',color:OR},
  ];
  return`<div style="max-width:920px;margin:0 auto;padding:0 20px 60px">
    <div style="text-align:center;padding:52px 20px 44px">
      <div style="display:inline-flex;align-items:center;gap:8px;background:${BL}15;border:0.5px solid ${BL}30;border-radius:20px;padding:5px 14px;margin-bottom:20px">
        <div style="width:7px;height:7px;border-radius:50%;background:${GR};animation:pulse 2s infinite"></div>
        <span style="font-size:13px;color:${BL};font-weight:500">🇵🇭 Built for Philippine Contractors</span>
      </div>
      <h1 style="font-size:clamp(30px,5vw,52px);font-weight:700;line-height:1.08;letter-spacing:-.04em;margin-bottom:16px;color:var(--text)">Your client sees progress,<br><span style="color:${BL}">not problems.</span></h1>
      <p style="font-size:16px;color:var(--text2);max-width:480px;margin:0 auto 28px;line-height:1.6">The all-in-one construction management platform for Philippine contractors.</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:12px">
        ${bt('Start Free Trial — Open App','goDashDemo()')}${bt('View Market Prices',"go('market')",'ghost')}
      </div>
      <p style="font-size:12px;color:var(--text4)">14-day free trial · No credit card · Cancel anytime</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:40px">
      ${[['1,200+','Active Contractors'],['₱4.8B','Projects Managed'],['94%','Client Satisfaction'],['Zero','Billing Disputes']].map(([v,l])=>`<div style="text-align:center;background:var(--card);border:0.5px solid var(--sep);border-radius:13px;padding:16px"><div style="font-size:26px;font-weight:700;color:${BL};letter-spacing:-.03em;margin-bottom:4px">${v}</div><div style="font-size:13px;color:var(--text3)">${l}</div></div>`).join('')}
    </div>
    <h2 style="font-size:22px;font-weight:700;text-align:center;margin-bottom:18px;color:var(--text)">Features built for real contractor problems</h2>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:44px">
      ${FT.map(f=>`<div style="background:var(--card);border:0.5px solid var(--sep);border-radius:13px;padding:18px;transition:all .2s" onmouseenter="this.style.boxShadow='0 4px 20px rgba(0,0,0,.1)'" onmouseleave="this.style.boxShadow='none'">
        <div style="font-size:22px;margin-bottom:8px">${f.icon}</div>
        <div style="width:20px;height:2px;background:${f.color};border-radius:2px;margin-bottom:8px"></div>
        <div style="font-size:14px;font-weight:600;margin-bottom:4px;color:var(--text)">${f.title}</div>
        <div style="font-size:12px;color:var(--text3);line-height:1.5">${f.desc}</div>
      </div>`).join('')}
    </div>
    <h2 style="font-size:22px;font-weight:700;text-align:center;margin-bottom:8px;color:var(--text)">Stories from the field</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:44px">
      ${A.testimonials.map(t=>`<div style="background:var(--card);border:0.5px solid var(--sep);border-radius:13px;padding:20px">
        <div style="color:${OR};font-size:14px;margin-bottom:10px">${'★'.repeat(t.rating)}</div>
        <p style="font-size:14px;color:var(--text2);line-height:1.65;margin-bottom:14px;font-style:italic">"${t.text}"</p>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:38px;height:38px;border-radius:50%;background:${BL};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#fff;flex-shrink:0">${t.avatar}</div>
          <div><div style="font-size:13px;font-weight:600;color:var(--text)">${t.name}</div><div style="font-size:11px;color:var(--text3)">${t.role} · ${t.company}</div></div>
        </div>
      </div>`).join('')}
    </div>
    <h2 style="font-size:22px;font-weight:700;text-align:center;margin-bottom:16px;color:var(--text)">Plans for every contractor</h2>
    <div style="display:flex;justify-content:center;gap:4px;background:var(--card2);border-radius:20px;padding:4px;width:fit-content;margin:0 auto 22px">
      ${['monthly','annual'].map(b=>`<button onclick="ss({billing:'${b}'})" style="padding:7px 18px;border-radius:16px;border:none;background:${A.billing===b?'var(--card)':'transparent'};color:var(--text);font-size:13px;font-weight:${A.billing===b?500:400};box-shadow:${A.billing===b?'var(--sh)':'none'}">${b==='annual'?'Annual (−20%)':'Monthly'}</button>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:44px">
      ${PL.map(p=>`<div style="background:var(--card);border:${p.popular?`1.5px solid ${p.color}`:'0.5px solid var(--sep)'};border-radius:16px;padding:24px;position:relative">
        ${p.popular?`<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:${p.color};color:#fff;border-radius:20px;padding:3px 14px;font-size:11px;font-weight:600;white-space:nowrap">Most Popular</div>`:''}
        <div style="width:8px;height:8px;border-radius:2px;background:${p.color};margin-bottom:10px"></div>
        <div style="font-size:19px;font-weight:700;margin-bottom:4px;color:var(--text)">${p.name}</div>
        <div style="font-size:30px;font-weight:700;color:${p.color};letter-spacing:-.03em;margin-bottom:18px">₱${bA(p).toLocaleString()}<span style="font-size:13px;color:var(--text3);font-weight:400">/mo</span></div>
        <button onclick="checkout('${p.name}',${bA(p)},${A.billing==='annual'?'\''+p.stripeYr+'\'':'\''+p.stripeMo+'\''})" style="width:100%;background:${p.popular?p.color:p.color+'20'};color:${p.popular?'#fff':p.color};border:none;border-radius:20px;padding:11px;font-size:14px;font-weight:500;margin-bottom:18px">Get Started</button>
        <div style="border-top:0.5px solid var(--sep);padding-top:14px">
          ${p.features.map(f=>`<div style="display:flex;gap:8px;margin-bottom:8px"><span style="color:${p.color};font-size:13px">✓</span><span style="font-size:13px;color:var(--text2)">${f}</span></div>`).join('')}
        </div>
      </div>`).join('')}
    </div>
    <h2 style="font-size:22px;font-weight:700;text-align:center;margin-bottom:18px;color:var(--text)">Common questions</h2>
    <div class="card" style="max-width:680px;margin:0 auto 44px">
      ${A.faqs.map((f,i)=>`<div style="border-bottom:${i<A.faqs.length-1?'0.5px solid var(--sep)':'none'}">
        <button onclick="ss({openFaq:${A.openFaq===i?null:i}})" style="width:100%;background:none;border:none;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;gap:16px;text-align:left">
          <span style="font-size:15px;font-weight:500;color:var(--text)">${f.q}</span>
          <span style="color:${BL};font-size:20px;flex-shrink:0;transition:transform .2s;transform:${A.openFaq===i?'rotate(45deg)':'rotate(0)'}">+</span>
        </button>
        ${A.openFaq===i?`<div style="padding:0 20px 16px"><p style="font-size:14px;color:var(--text2);line-height:1.65">${f.a}</p></div>`:''}
      </div>`).join('')}
    </div>
    <div style="text-align:center;background:var(--card);border:0.5px solid var(--sep);border-radius:18px;padding:44px 24px">
      <h2 style="font-size:34px;font-weight:700;letter-spacing:-.03em;margin-bottom:12px;color:var(--text)">Stop losing money to poor tracking.</h2>
      <p style="font-size:15px;color:var(--text2);margin-bottom:24px">Join 1,200+ Philippine contractors.</p>
      ${bt('Try Free for 14 Days','goDashDemo()')}
      <p style="font-size:12px;color:var(--text4);margin-top:12px">No credit card · No contract · Cancel anytime</p>
    </div>
  </div>`;
}

function AUTH(){
  const isUp = A.authMode==='signup';
  return`<div style="min-height:600px;display:flex;align-items:center;justify-content:center;padding:40px 20px">
    <div style="width:100%;max-width:380px">
      <div style="text-align:center;margin-bottom:28px">
        <img src="logo.png" style="width:52px;height:52px;border-radius:14px;object-fit:cover;margin:0 auto 14px;display:block">
        <div style="font-size:22px;font-weight:700;margin-bottom:4px;color:var(--text)">${isUp?'Create Account':'Sign In'}</div>
        <div style="font-size:13px;color:var(--text3)">${isUp?'Join the ConstructAI ecosystem':'Sign in with your contractor account'}</div>
      </div>
      <div class="card" style="padding:28px">
        ${isUp?`<div style="margin-bottom:14px"><div style="font-size:12px;color:var(--text3);margin-bottom:5px">Full Name</div><input type="text" id="an" placeholder="Juan dela Cruz"></div>`:''}
        <div style="margin-bottom:14px"><div style="font-size:12px;color:var(--text3);margin-bottom:5px">Email</div><input type="email" id="ae" placeholder="you@company.com"></div>
        <div style="margin-bottom:16px"><div style="font-size:12px;color:var(--text3);margin-bottom:5px">Password</div><input type="password" id="ap" placeholder="••••••••" onkeydown="if(event.key==='Enter')${isUp?'doSignUp()':'doLogin()'}"></div>
        
        <div id="login-err" style="color:${RD};font-size:13px;margin-bottom:12px;display:none;background:${RD}10;padding:10px;border-radius:8px"></div>
        
        <button id="login-btn" onclick="${isUp?'doSignUp()':'doLogin()'}" style="width:100%;background:${BL};color:#fff;border:none;border-radius:20px;padding:12px;font-size:15px;font-weight:600;margin-bottom:16px">${isUp?'Create Free Account':'Sign In'}</button>
        
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;color:var(--text4)">
          <div style="flex:1;height:0.5px;background:var(--sep)"></div>
          <span style="font-size:11px;font-weight:600;text-transform:uppercase">or</span>
          <div style="flex:1;height:0.5px;background:var(--sep)"></div>
        </div>
        
        <button onclick="signInWithGoogle()" style="width:100%;background:var(--card);border:0.5px solid var(--sep);border-radius:20px;padding:10px;font-size:14px;font-weight:500;color:var(--text2);display:flex;align-items:center;justify-content:center;gap:10px">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
          Continue with Google
        </button>
      </div>
      <div style="text-align:center;margin-top:20px;font-size:14px">
        <span style="color:var(--text3)">${isUp?'Already have an account?':'Don\'t have an account?'}</span>
        <button onclick="ss({authMode:'${isUp?'signin':'signup'}'})" style="color:${BL};background:none;border:none;font-weight:600;margin-left:5px">${isUp?'Sign In':'Register'}</button>
      </div>
      <div style="text-align:center;margin-top:10px">
        <button onclick="goDashDemo()" style="font-size:12px;color:var(--text4);background:none;border:none">Skip — Developer Demo Mode</button>
      </div>
    </div>
  </div>`;
}

function PROJECTS(){
  const PL=A.dbProjects||MOCK_PROJECTS;
  const total=PL.reduce((a,p)=>a+p.value,0);
  return`<div style="max-width:860px;margin:0 auto;padding:28px 20px">
    <div style="margin-bottom:22px">
      <div style="font-size:26px;font-weight:700;letter-spacing:-.03em;margin-bottom:4px;color:var(--text)">Your Projects</div>
      <div style="font-size:14px;color:var(--text3)">Select a project to open its dashboard</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px">
      ${st('💼','Active Projects',PL.filter(p=>p.phase!=='Warranty Period').length,BL)}
      ${st('💰','Total Pipeline',fmtK(total),GR)}
      ${st('⚠️','Need Attention',PL.filter(p=>p.health!=='good').length,OR)}
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
      ${PL.map(p=>`<div class="card rh" onclick="selectProject('${p.id}')" style="padding:16px 20px;cursor:pointer;border-color:${p.health==='critical'?RD+'40':p.health==='watch'?OR+'30':'var(--sep)'}">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:10px;height:10px;border-radius:50%;background:${hc(p.health)};flex-shrink:0"></div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
              <span style="font-size:14px;font-weight:600;color:var(--text)">${p.name}</span>
              ${bdg(p.health==='good'?'On Track':p.health==='watch'?'Watch':'Critical',hc(p.health))}
            </div>
            <div style="font-size:12px;color:var(--text3)">${p.client} · ${p.location} · ${p.phase}</div>
          </div>
          <div style="text-align:center;min-width:60px">
            <div style="font-size:22px;font-weight:700;color:${hc(p.health)};letter-spacing:-.03em">${p.pct}%</div>
            <div style="font-size:11px;color:var(--text4)">complete</div>
          </div>
          <div style="text-align:right;min-width:100px">
            <div style="font-size:15px;font-weight:600;color:var(--text)">${fmtK(p.value)}</div>
            <div style="font-size:12px;color:${p.margin>10?GR:p.margin>7?OR:RD}">${p.margin}% margin</div>
          </div>
          <div style="text-align:right;min-width:50px">
            <div style="font-size:14px;font-weight:600;color:${p.daysLeft<14&&p.daysLeft>0?RD:'var(--text)'}">${p.daysLeft>0?p.daysLeft+'d':'✓'}</div>
            <div style="font-size:11px;color:var(--text4)">left</div>
          </div>
        </div>
      </div>`).join('')}
    </div>
    <div style="background:var(--card2);border-radius:13px;padding:16px">
      <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:5px">Client Portal Demo</div>
      <div style="font-size:13px;color:var(--text3);margin-bottom:12px">See exactly what your client sees when they open their progress link.</div>
      ${bt('Open Client Portal Demo →',"go('client')",'tinted')}
    </div>
  </div>`;
}

function DASHBOARD(){
  const p=A.project||(A.dbProjects||MOCK_PROJECTS)[0];
  const TB=[{id:'overview',icon:'📊',l:'Overview'},{id:'billing',icon:'💰',l:'Billing'},{id:'workforce',icon:'👷',l:'Workforce'},{id:'gantt',icon:'📅',l:'Timeline'},{id:'variations',icon:'🔄',l:'Variations'},{id:'profit',icon:'💹',l:'Profit'}];
  let C='';

  if(A.dashTab==='overview'){
    C=`<div style="display:grid;grid-template-columns:2.2fr 1fr 1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="background:${BL};border-radius:13px;padding:22px;color:#fff">
        <div style="font-size:11px;opacity:0.7;margin-bottom:5px;text-transform:uppercase">Contract Value</div>
        <div style="font-size:32px;font-weight:700;margin-bottom:12px">${fmtK(p.value)}</div>
        ${pb(p.pct,'rgba(255,255,255,.9)',7)}
        <div style="font-size:12px;opacity:0.65;margin-top:6px">${p.pct}% complete · ${p.phase}</div>
      </div>
      ${st('💰','Cash Gap',fmtK(p.cashGap),RD)}
      ${st('✅','Punches',A.punches.filter(x=>x.status==='Open').length,OR)}
      ${st('💹','Margin',p.margin+'%',GR)}
    </div>
    <div style="background:${RD}12;border:0.5px solid ${RD}40;border-radius:14px;padding:20px;margin-bottom:20px">
      <div style="font-size:14px;font-weight:700;color:${RD};margin-bottom:12px">🧠 AI Early Warning System</div>
      <div style="font-size:18px;font-weight:800;margin-bottom:6px">High Risk: Predicted 12-Day Delay</div>
      <div style="font-size:13px;color:var(--text2)">Weather LPA + Subcontractor risk detected. Predicted handover shifted to August.</div>
    </div>`;
  }
  else if(A.dashTab==='workforce'){
    C=`<div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:20px;font-weight:700">AI-Face Attendance</div>
      ${bt('📸 Scan Crew Face-In','alert(\'AI Scanning Crew... 32 workers identified.\')','filled',BL,true)}
    </div>
    <div class="card"><table style="width:100%"><thead><tr style="background:var(--card2)">${['Worker','Role','Certifications','Status'].map(h=>`<th style="padding:12px;text-align:left;font-size:11px">${h}</th>`).join('')}</tr></thead><tbody>${A.workers.map(w=>`<tr><td style="padding:12px;font-size:13px;font-weight:600">${w.n}</td><td style="padding:12px;font-size:13px">${w.r}</td><td style="padding:12px"><span style="font-size:10px;background:var(--card3);padding:2px 6px;border-radius:4px">BFP Safety</span></td><td style="padding:12px">${bdg('On-Site',GR)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  else if(A.dashTab==='billing'){
    C=`<div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center"><div style="font-size:20px;font-weight:700">1-Click AIA Billing</div>${bt('📄 Generate PR-03','exportBOQ()','filled',GR,true)}</div>
    <div class="card">${A.billings.map(b=>`<div style="display:flex;justify-content:space-between;padding:15px;border-bottom:1px solid var(--sep)"><div><div style="font-weight:500">${b.ms}</div><div style="font-size:11px;color:var(--text3)">${b.ref}</div></div><div style="font-size:15px;font-weight:700">${fmt(b.amount)}</div></div>`).join('')}</div>`;
  }
  else if(A.dashTab==='variations'){
    C=`<div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center"><div style="font-size:20px;font-weight:700">Variation Negotiator</div>${bt('+ Create Variation','','filled',BL,true)}</div>
    ${A.changeOrders.map(c=>`<div class="card" style="padding:15px;margin-bottom:10px;border-left:4px solid ${c.status==='Approved'?GR:OR};display:flex;justify-content:space-between"><div><div style="font-weight:700">${c.desc}</div><div style="font-size:12px;color:var(--text3)">₱${c.amount.toLocaleString()}</div></div>${bdg(c.status,c.status==='Approved'?GR:OR)}</div>`).join('')}`;
  }
  else if(A.dashTab==='procurement'){
    C=`<div style="margin-bottom:24px">
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px;display:flex;align-items:center;gap:10px">Procurement & RFQ Matrix ${bdg('Enterprise',PU)}</div>
      <div style="font-size:13px;color:var(--text3)">Blast Requests for Quote (RFQ) to your subcontractor network and compare bids side-by-side.</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
      ${st('🛒','Active RFQs',A.rfqs.filter(r=>r.status==='Bidding Open').length,BL)}
      ${st('✅','Suppliers Replied',3,GR)}
      ${st('💰','Est. Savings','₱14,200',OR)}
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      ${A.rfqs.map(r=>`<div class="card" style="padding:0;overflow:hidden">
        <div style="padding:16px 20px;background:var(--card2);border-bottom:0.5px solid var(--sep);display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-size:15px;font-weight:700;color:var(--text)">${r.item}</div><div style="font-size:11px;color:var(--text3)">Quantity: ${r.qty} · Budget: ${fmt(r.budget)}/unit</div></div>
          ${bdg(r.status,r.status==='Bidding Open'?OR:GR)}
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:500px">
            <thead><tr style="border-bottom:0.1px solid var(--sep)">${['Vendor','Unit Price','Total','Delivery','Status','Action'].map(h=>`<th style="padding:10px 20px;text-align:left;font-size:11px;color:var(--text4);font-weight:600">${h}</th>`).join('')}</tr></thead>
            <tbody>${r.bids.map(b=>`<tr style="border-bottom:0.1px solid var(--sep);background:${b.win?GR+'05':'transparent'}">
              <td style="padding:12px 20px;font-size:13px;font-weight:600;color:var(--text)">${b.v} ${b.win?'✅':''}</td>
              <td style="padding:12px 20px;font-size:13px;color:${b.p<r.budget?GR:RD}">${fmt(b.p)}</td>
              <td style="padding:12px 20px;font-size:13px;font-weight:700;color:var(--text)">${fmt(b.p*r.qty)}</td>
              <td style="padding:12px 20px;font-size:13px;color:var(--text3)">${b.d}</td>
              <td style="padding:12px 20px">${bdg(b.win?'Awarded':'Quoted',b.win?GR:BL)}</td>
              <td style="padding:12px 20px">${b.win?bt('Order Material Now ↓','alert(\'Order requisition sent to Vendor API!\')','filled',GR,true):bt('Award Bid',`alert('Bid Awarded to ${b.v}!')`,'filled',GR,true)}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>`).join('')}
    </div>`;
  }
  else if(A.dashTab==='approvals'){
    C=`<div style="margin-bottom:24px">
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">Pending Owner Approvals</div>
      <div style="font-size:13px;color:var(--text3)">Review and digitally sign high-value Purchase Orders and Project Variations.</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${A.pos.map(p=>`<div class="card" style="padding:20px;display:flex;justify-content:space-between;align-items:center;border-left:4px solid ${OR}">
        <div>
          <div style="font-size:16px;font-weight:700;color:var(--text)">${p.id}: ${p.vendor}</div>
          <div style="font-size:13px;color:var(--text2)">Amount: <span style="font-weight:700;color:${GR}">${fmt(p.amount)}</span></div>
          <div style="font-size:11px;color:var(--text3);margin-top:4px">Requested by PM on ${p.date}</div>
        </div>
        <div style="display:flex;gap:10px">
          ${bt('Review & Sign',`ss({showSigModal:true})`,'filled',BL)}
          ${bt('Reject','','ghost',RD)}
        </div>
      </div>`).join('')}
    </div>`;
  }
  else if(A.dashTab==='performance'){
    C=`<div style="margin-bottom:24px">
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">Weather & Productivity Intelligence</div>
      <div style="font-size:13px;color:var(--text3)">Correlate weather delays with labor speed to predict final turnover date.</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
      <div class="card">
        <div style="padding:16px 20px;border-bottom:0.5px solid var(--sep);font-size:14px;font-weight:700">Labor Productivity (Last 7 Days)</div>
        <div style="padding:20px">
          ${[['Masonry (Exterior)','3.2 sqm/day','4.0 sqm/day',OR],['Rebar (Structural)','120 kg/day','110 kg/day',GR],['Concrete (Pouring)','8.5 m3/day','8.0 m3/day',GR],['Painting (Priming)','12 sqm/day','15 sqm/day',OR]].map(([t,a,tg,c])=>`<div style="margin-bottom:18px">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:13px;font-weight:600">${t}</span><span style="font-size:12px;color:var(--text3)">Target: ${tg}</span></div>
            <div style="display:flex;align-items:center;gap:12px">
              <div style="flex:1;height:8px;background:var(--card3);border-radius:4px;overflow:hidden"><div style="height:100%;width:${(parseFloat(a)/parseFloat(tg))*100}%;background:${c}"></div></div>
              <span style="font-size:14px;font-weight:700;color:${c}">${a}</span>
            </div>
          </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div style="padding:16px 20px;border-bottom:0.5px solid var(--sep);font-size:14px;font-weight:700">Rainfall Impact Tracker (Simulated)</div>
        <div style="padding:20px">
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:20px">
            ${[0,2,42,12,0,0,5].map((mm,i)=>`<div style="text-align:center">
              <div style="height:60px;background:var(--card3);border-radius:4px;position:relative;display:flex;align-items:flex-end">
                <div style="width:100%;height:${Math.min(100,mm*2)}%;background:${mm>10?BL:OR};border-radius:4px"></div>
              </div>
              <div style="font-size:10px;color:var(--text4);margin-top:4px">Mar ${20+i}</div>
              <div style="font-size:11px;font-weight:600;color:${mm>10?BL:OR}">${mm}mm</div>
            </div>`).join('')}
          </div>
          <div style="background:${BL}10;padding:12px;border-radius:12px;border:0.5px solid ${BL}30">
            <div style="font-size:12px;font-weight:700;color:${BL};margin-bottom:4px">Automatic Delay Claim Suggested</div>
            <div style="font-size:11px;color:var(--text2);line-height:1.4">Mar 22 recorded 42mm precipitation (Heavy Rain). System suggests adding <b>1.5 days extension</b> to 'Structural Works' phase.</div>
            <button onclick="alert('Delay claim added to logs!')" style="margin-top:10px;background:${BL};color:#fff;border:none;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:600">Apply to Gantt</button>
          </div>
        </div>
      </div>
    </div>`;
  }
  else if(A.dashTab==='reports'){
    const DR=A.dailyLogs;
    const unsynced=DR.filter(x=>!x.s).length;
    C=`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
      ${st('📝','Total Logs',DR.length+' days',BL)}${st('👷','Avg Headcount','33',PU)}${st('⚠️','Incidents','0 this week',GR)}${st('📶','Offline Sync',unsynced>0?unsynced+' offline':'Synced',unsynced>0?OR:GR)}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div><div style="font-size:20px;font-weight:700;color:var(--text);letter-spacing:-.02em">Daily Site Reports</div><div style="font-size:13px;color:var(--text3)">Log weather, headcount, equipment, and progress. Runs fully offline via local caching.</div></div>
      ${bt('+ New Report','ss({showReportForm:!A.showReportForm})',"filled",BL,true)}
    </div>
    ${A.showReportForm?`<div class="card" style="padding:18px;margin-bottom:16px;background:var(--card2)">
      <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:12px">Create Daily Report</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px">
         <div><div style="font-size:11px;color:var(--text3);margin-bottom:4px">Weather</div><input id="dr_w" placeholder="Sunny, 32C"></div>
         <div><div style="font-size:11px;color:var(--text3);margin-bottom:4px">Headcount</div><input type="number" id="dr_h" placeholder="30"></div>
         <div><div style="font-size:11px;color:var(--text3);margin-bottom:4px">Equip Used</div><input type="number" id="dr_e" placeholder="2"></div>
      </div>
      <div style="margin-bottom:10px"><div style="font-size:11px;color:var(--text3);margin-bottom:4px">Progress</div><textarea id="dr_p" rows="2" placeholder="Narrative..."></textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
         <div><div style="font-size:11px;color:var(--text3);margin-bottom:4px">Deliveries</div><input id="dr_v" placeholder="Cement, Rebar..."></div>
         <div><div style="font-size:11px;color:var(--text3);margin-bottom:4px">Notes/Incidents</div><input id="dr_n" placeholder="Any issues?"></div>
      </div>
      <div style="display:flex;gap:8px">
        ${bt('💾 Save (Works Offline)','saveReport()','filled',BL)}
        ${bt('Cancel','ss({showReportForm:false})','ghost')}
      </div>
    </div>`:''}
    <div style="display:flex;flex-direction:column;gap:12px">
      ${DR.map((r,i)=>`<div class="card" style="padding:18px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;border-bottom:0.5px solid var(--sep);padding-bottom:12px">
          <div>
            <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:4px">${r.d}</div>
            <div style="display:flex;gap:14px;font-size:12px;color:var(--text3)"><span style="display:flex;align-items:center;gap:4px">🌤️ ${r.w}</span><span style="display:flex;align-items:center;gap:4px">👷 ${r.h} Workers</span><span style="display:flex;align-items:center;gap:4px">🚜 ${r.e} Equipment</span></div>
          </div>
          ${bt('Export PDF',`exportReportPDF(${i})`,'tinted',r.c,true)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div>
            <div style="font-size:11px;font-weight:600;color:${BL};text-transform:uppercase;margin-bottom:4px;letter-spacing:.05em">Progress & Workflow</div>
            <div style="font-size:13px;color:var(--text);line-height:1.5;margin-bottom:12px">${r.p}</div>
            <div style="font-size:11px;font-weight:600;color:${OR};text-transform:uppercase;margin-bottom:4px;letter-spacing:.05em">Deliveries</div>
            <div style="font-size:13px;color:var(--text);line-height:1.5">${r.v.join(', ')}</div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:600;color:${PU};text-transform:uppercase;margin-bottom:4px;letter-spacing:.05em">Notes & Safety</div>
            <div style="font-size:13px;color:var(--text);line-height:1.5;margin-bottom:12px">${r.n}</div>
            <div style="font-size:11px;font-weight:600;color:${GR};text-transform:uppercase;margin-bottom:6px;letter-spacing:.05em">Site Photos</div>
            <div style="display:flex;gap:6px">
              <div style="width:40px;height:40px;background:var(--card2);border:0.5px solid var(--sep);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px">📸</div>
              ${i===0?`<div style="width:40px;height:40px;background:var(--card2);border:0.5px solid var(--sep);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px">📸</div>`:``}
            </div>
          </div>
        </div>
      </div>`).join('')}
    </div>`;
  }

  else if(A.dashTab==='inventory'){
    const V = [
      {mat:'Cement (40kg)',delivered:820,used:640,onHand:140,variance:-40,severity:RD},
      {mat:'Rebar 12mm',delivered:480,used:390,onHand:90,variance:0,severity:GR},
      {mat:'Sand (m3)',delivered:42,used:35,onHand:7,variance:0,severity:GR},
    ];
    C=`<div style="margin-bottom:24px">
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">Material Reconciliation ${bdg('Anti-Theft',RD)}</div>
      <div style="font-size:13px;color:var(--text3)">Detecting shrinkage by comparing Delivered vs. Used vs. Actual Stock.</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
      ${st('📦','Total SKUs',A.inventory.length+' mats',BL)}${st('✅','Low Variance','92% accurate',GR)}${st('⚠️','High Loss','₱11,400 est.',RD)}${st('🔔','Low Stock',A.inventory.filter(x=>x.delivered-x.used<=x.reorder).length,OR)}
    </div>
    <div class="card" style="margin-bottom:14px">
      <div style="padding:13px 18px;border-bottom:0.5px solid var(--sep);display:flex;justify-content:space-between;align-items:center">
        <div><span style="font-size:14px;font-weight:600;color:var(--text)">Live Inventory Ledger</span></div>
        <div style="display:flex;gap:8px">
          ${bt('+ Log Delivery',"ss({showDelivery:!A.showDelivery,showUsage:false})",'tinted',GR,true)}
          ${bt('− Log Usage',"ss({showUsage:!A.showUsage,showDelivery:false})",'tinted',OR,true)}
        </div>
      </div>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:var(--card2)">${['Material','Delivered','Used','On Hand','Expected','Variance','Status'].map(h=>`<th style="padding:12px 14px;font-size:11px;font-weight:600;color:var(--text3);text-align:left;border-bottom:0.5px solid var(--sep)">${h}</th>`).join('')}</tr></thead>
        <tbody>${A.inventory.map(r=>{
          const oh=r.delivered-r.used,vr=oh-r.expected,low=oh<=r.reorder&&r.reorder>0,vari=vr<-5;
          let sx='OK',sc2=GR;if(low){sx='Low Stock';sc2=RD;}else if(vari){sx='Variance';sc2=OR;}
          return`<tr style="border-bottom:0.5px solid var(--sep)">
            <td style="padding:12px 14px;font-size:13px;font-weight:600;color:var(--text)">${r.mat}</td>
            <td style="padding:12px 14px;font-size:13px">${r.delivered}</td>
            <td style="padding:12px 14px;font-size:13px">${r.used}</td>
            <td style="padding:12px 14px;font-size:14px;font-weight:700">${oh}</td>
            <td style="padding:12px 14px;font-size:13px">${r.expected}</td>
            <td style="padding:12px 14px;color:${vr<-5?RD:GR};font-weight:700">${vr || '-'}</td>
            <td style="padding:12px 14px">${bdg(sx,sc2)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
    </div>`;
  }

  else if(A.dashTab==='ai'){
    C=`<div style="max-width:800px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div><div style="font-size:20px;font-weight:700;color:var(--text);letter-spacing:-.02em">ConstructAI Assistant</div><div style="font-size:13px;color:var(--text3)">Trained on your live project database, financials, and schedule.</div></div>
        <div style="background:${BL}15;color:${BL};padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600">Model: v4-Builder</div>
      </div>
      <div class="card" style="display:flex;flex-direction:column;height:550px">
        <div id="ai-chat-box" style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px;background:var(--card2)">
          ${A.aiChat.map(m=>`<div style="display:flex;gap:12px;align-items:flex-start;max-width:${m.r==='ai'?'90%':'80%'};align-self:${m.r==='ai'?'flex-start':'flex-end'}">
            ${m.r==='ai'?`<div style="width:32px;height:32px;border-radius:8px;background:#000;display:flex;align-items:center;justify-content:center;flex-shrink:0"><img src="logo.png" style="width:20px;height:20px"></div>`:''}
            <div style="background:${m.r==='ai'?'var(--card)':BL};border:0.5px solid ${m.r==='ai'?'var(--sep)':BL};border-radius:${m.r==='ai'?'4px 14px 14px 14px':'14px 14px 4px 14px'};padding:12px 16px;box-shadow:${m.r==='ai'?'0 2px 8px rgba(0,0,0,.04)':'none'}">
              <div style="font-size:14px;line-height:1.6;color:${m.r==='ai'?'var(--text)':'#fff'}">${m.t}</div>
            </div>
            ${m.r==='user'?`<div style="width:32px;height:32px;border-radius:50%;background:var(--card3);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">👤</div>`:''}
          </div>`).join('')}
          ${A.aiTyping?`<div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:32px;height:32px;border-radius:8px;background:#000;display:flex;align-items:center;justify-content:center;flex-shrink:0"><img src="logo.png" style="width:20px;height:20px"></div>
            <div style="background:var(--card);border:0.5px solid var(--sep);border-radius:4px 14px 14px 14px;padding:12px 16px;display:flex;gap:4px;align-items:center">
              <div style="width:6px;height:6px;border-radius:50%;background:var(--text3);animation:pulse 1s infinite"></div>
              <div style="width:6px;height:6px;border-radius:50%;background:var(--text3);animation:pulse 1s infinite .2s"></div>
              <div style="width:6px;height:6px;border-radius:50%;background:var(--text3);animation:pulse 1s infinite .4s"></div>
            </div>
          </div>`:''}
        </div>
        <div style="padding:16px;border-top:0.5px solid var(--sep);background:var(--card);display:flex;gap:10px;align-items:center">
          <input type="text" id="ai-q" placeholder="Ask about materials, budget, or delays..." style="flex:1;background:var(--input);border:0.5px solid var(--sep);padding:12px 16px;border-radius:20px;font-size:14px;outline:none" onkeydown="if(event.key==='Enter')askAI()">
          <button onclick="askAI()" style="width:44px;height:44px;border-radius:50%;background:${BL};color:#fff;border:none;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;flex-shrink:0" ${A.aiTyping?'disabled':''}>↑</button>
        </div>
      </div>
    </div>`;
    setTimeout(()=>{const b=document.getElementById('ai-chat-box');if(b)b.scrollTop=b.scrollHeight;},50);
  }

  else if(A.dashTab==='partners'){
    const link = `https://constructai-antigravity.vercel.app/?ref=${A.aff.id}`;
    C=`<div style="max-width:900px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <div><div style="font-size:24px;font-weight:800;color:var(--text);letter-spacing:-.03em">Partner Program</div><div style="font-size:14px;color:var(--text3)">Earn 10% recurring commission for every referral.</div></div>
        <div style="background:${GR}15;color:${GR};padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600">Level: ${A.aff.tier}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px">
        ${st('📈','Referral Clicks',A.aff.clicks,BL)}
        ${st('🤝','Active Referrals',A.aff.refs,PU)}
        ${st('💰','Total Earnings','₱'+A.aff.earnings.toLocaleString(),GR)}
      </div>
      <div class="card" style="padding:24px;margin-bottom:24px;background:linear-gradient(135deg,${BL}10,${PU}10)">
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:8px">Your Unique Referral Link</div>
        <div style="display:flex;gap:10px;align-items:center">
          <input value="${link}" readonly style="flex:1;background:var(--card);border:0.5px solid var(--sep);padding:12px 16px;border-radius:10px;font-size:14px;color:${BL};font-weight:600">
          <button onclick="navigator.clipboard.writeText('${link}');alert('Copied!')" style="background:${BL};color:#fff;border:none;border-radius:10px;padding:12px 20px;font-size:14px;font-weight:600">Copy</button>
        </div>
        <div style="font-size:12px;color:var(--text3);margin-top:10px">Cookie duration: 20 days. Standard attribution rules apply.</div>
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px">
        <div class="card">
          <div style="padding:16px 20px;border-bottom:0.5px solid var(--sep);font-size:14px;font-weight:600">Recent Conversions</div>
          ${[1,2,3].map(i=>`<div style="display:flex;justify-content:space-between;padding:14px 20px;border-bottom:0.5px solid var(--sep)">
            <div><div style="font-size:14px;font-weight:600;color:var(--text)">Contractor #${100+i}</div><div style="font-size:12px;color:var(--text3)">Pro Plan · Active</div></div>
            <div style="text-align:right"><div style="font-size:14px;font-weight:700;color:${GR}">+₱249.00</div><div style="font-size:11px;color:var(--text4)">Mar ${20+i}, 2026</div></div>
          </div>`).join('')}
        </div>
        <div>
          <div class="card" style="padding:20px">
            <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">Request Payout</div>
            <div style="font-size:12px;color:var(--text3);margin-bottom:14px">Available for payout: <b>₱3,450.00</b></div>
            <div style="margin-bottom:12px"><div style="font-size:11px;color:var(--text3);margin-bottom:4px">Your GCash Number</div><input placeholder="09XX XXX XXXX" style="background:var(--input)"></div>
            <button style="width:100%;background:${BL};color:#fff;border:none;border-radius:14px;padding:10px;font-size:13px;font-weight:600">Request via GCash</button>
          </div>
        </div>
      </div>
    </div>`;
  }
  
  else if(A.dashTab==='requests'){
    C=`<div style="display:grid;grid-template-columns:2fr 1fr;gap:16px">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div><div style="font-size:20px;font-weight:700;letter-spacing:-.02em;color:var(--text)">Feature Requests</div><div style="font-size:13px;color:var(--text3)">Vote on features you want. Most-voted get built first.</div></div>
          ${bt('+ Submit Request',"ss({showFrForm:true})",'tinted',BL,true)}
        </div>
        ${A.showFrForm?`<div class="card" style="padding:20px;margin-bottom:16px;border-color:${BL}40">
          <div style="font-size:14px;font-weight:600;color:${BL};margin-bottom:14px">Submit a Feature Request</div>
          ${A.frSubmitted?`<div style="text-align:center;padding:24px 0">
            <div style="font-size:32px;margin-bottom:10px">🎉</div>
            <div style="font-size:16px;font-weight:600;color:var(--text);margin-bottom:6px">Request Submitted!</div>
            <div style="font-size:13px;color:var(--text3);margin-bottom:16px">Added to our backlog. We will notify you when it is planned.</div>
            ${bt('Submit Another',"ss({frSubmitted:false,frTitle:'',frDescription:'',frName:'',frEmail:''})",'ghost',null,true)}
          </div>`:`<div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
              <div><div style="font-size:12px;color:var(--text3);margin-bottom:5px">Your Name</div><input id="frn" placeholder="Engr. Juan dela Cruz" value="${A.frName}"></div>
              <div><div style="font-size:12px;color:var(--text3);margin-bottom:5px">Email</div><input id="fre" placeholder="you@company.com" type="email" value="${A.frEmail}"></div>
            </div>
            <div style="margin-bottom:12px"><div style="font-size:12px;color:var(--text3);margin-bottom:5px">Feature Title</div><input id="frt" placeholder="e.g. QR code attendance scanning" value="${A.frTitle}"></div>
            <div style="margin-bottom:12px"><div style="font-size:12px;color:var(--text3);margin-bottom:5px">Category</div>
              <select id="frc" style="background:var(--input)">
                ${['Mobile','Workforce','Payments','BOQ','Reports','Safety','General'].map(c=>`<option value="${c}" ${A.frCategory===c?'selected':''}>${c}</option>`).join('')}
              </select>
            </div>
            <div style="margin-bottom:16px"><div style="font-size:12px;color:var(--text3);margin-bottom:5px">Description</div><textarea id="frd" rows="3" placeholder="Describe the feature and why it would help contractors...">${A.frDescription}</textarea></div>
            <div style="display:flex;gap:8px">
              <button onclick="submitFR()" style="background:${BL};color:#fff;border:none;border-radius:20px;padding:9px 20px;font-size:13px;font-weight:500">Submit Request</button>
              ${bt('Cancel',"ss({showFrForm:false})",'ghost',null,true)}
            </div>
          </div>`}
        </div>`:''}
        <div style="display:flex;flex-direction:column;gap:10px">
          ${A.featureRequests.sort((a,b)=>b.votes-a.votes).map(fr=>`<div class="card" style="padding:18px 20px">
            <div style="display:flex;gap:14px;align-items:flex-start">
              <div style="text-align:center;min-width:52px">
                <div style="background:var(--card2);border:0.5px solid var(--sep);border-radius:10px;padding:8px;cursor:pointer" onclick="voteFR(${fr.id})">
                  <div style="font-size:11px;color:var(--text3)">▲</div>
                  <div style="font-size:18px;font-weight:700;color:${BL};line-height:1.1">${fr.votes}</div>
                  <div style="font-size:10px;color:var(--text3)">votes</div>
                </div>
              </div>
              <div style="flex:1">
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:5px;flex-wrap:wrap">
                  <span style="font-size:15px;font-weight:600;color:var(--text)">${fr.title}</span>
                  ${bdg(fr.category,BL)}${bdg(fr.status,sc(fr.status))}
                </div>
                <p style="font-size:13px;color:var(--text2);line-height:1.55;margin-bottom:6px">${fr.description}</p>
                <div style="font-size:12px;color:var(--text4)">By ${fr.by} · ${fr.date}</div>
              </div>
            </div>
          </div>`).join('')}
        </div>
      </div>
      <div>
        <div class="card" style="padding:18px;margin-bottom:12px">
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:12px">Request Stats</div>
          ${[['💡','Total',A.featureRequests.length,BL],['✅','Completed',A.featureRequests.filter(f=>f.status==='Completed').length,GR],['🗺️','Planned',A.featureRequests.filter(f=>f.status==='Planned').length,OR],['🔍','In Review',A.featureRequests.filter(f=>f.status==='In Review').length,PU]].map(([i,l,v,c])=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:0.5px solid var(--sep)">
            <div style="display:flex;gap:8px;align-items:center"><span style="font-size:16px">${i}</span><span style="font-size:13px;color:var(--text2)">${l}</span></div>
            <span style="font-size:16px;font-weight:700;color:${c}">${v}</span>
          </div>`).join('')}
        </div>
        <div class="card" style="padding:18px">
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:12px">Top Voted</div>
          ${A.featureRequests.sort((a,b)=>b.votes-a.votes).slice(0,3).map(fr=>`<div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:12px;color:var(--text2)">${fr.title.substring(0,30)}${fr.title.length>30?'…':''}</span>
              <span style="font-size:12px;font-weight:700;color:${BL}">${fr.votes}</span>
            </div>
            ${pb((fr.votes/A.featureRequests[0].votes)*100,BL,5)}
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  }
  else if(A.dashTab==='boq'){
    const bB=[{n:'1.0 Earthworks',q:1,u:'lot',r:0},{n:'2.0 Concrete',q:45.5,u:'m3',r:1}];
    C=`<div class="card"><div style="padding:15px;font-weight:700">BOQ Matrix</div>${bB.map(i=>`<div style="display:flex;justify-content:space-between;padding:12px;border-bottom:0.5px solid var(--sep)"><span>${i.n}</span><span>${i.q} ${i.u}</span></div>`).join('')}</div>`;
  }
  else if(A.dashTab==='changeorders'){
    C=`<div style="font-size:20px;font-weight:700;margin-bottom:15px">Change Orders</div>${A.changeOrders.map(c=>`<div class="card" style="padding:15px;margin-bottom:10px">${c.desc} — ₱${c.amount.toLocaleString()}</div>`).join('')}`;
  }
  else if(A.dashTab==='gantt'){
    C=`<div class="card" style="padding:20px"><div style="font-weight:700;margin-bottom:15px">Timeline</div>${[{n:'Foundation',p:100,c:GR},{n:'Structural',p:65,c:OR},{n:'Roofing',p:0,c:BL}].map(ph=>`<div style="margin-bottom:10px"><span>${ph.n}</span>${pb(ph.p,ph.c,6)}</div>`).join('')}</div>`;
  }
  else if(A.dashTab==='profit'){
    C=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${st('💼','Contract',fmtK(p.value),BL)}${st('💸','Spent',fmtK(p.spent),OR)}${st('📊','CPI','1.08',GR)}</div>`;
  }

  return`<div>
    <div style="background:var(--card2);border-bottom:1px solid var(--sep);padding:10px 20px;display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;align-items:center;gap:8px"><div style="width:8px;height:8px;border-radius:50%;background:${hc(p.health)}"></div><span style="font-weight:700">${p.name} Dashboard</span></div>
      <button onclick="go('projects')" style="background:none;border:none;color:var(--text3);font-size:12px">← Back</button>
    </div>
    <div style="background:var(--card);border-bottom:1px solid var(--sep);display:flex;overflow-x:auto;padding:0 15px">
      ${TB.map(t=>`<button onclick="ss({dashTab:'${t.id}'})" style="padding:12px 14px;border:none;background:transparent;color:${A.dashTab===t.id?BL:'var(--text3)'};font-size:13px;font-weight:${A.dashTab===t.id?700:400};border-bottom:2px solid ${A.dashTab===t.id?BL:'transparent'};white-space:nowrap">${t.icon} ${t.l}</button>`).join('')}
    </div>
    <div style="padding:20px" class="fade">${C}</div>
  </div>`;
}

function MARKET(){
  const NT=['All','PRICES','POLICY','ALERT','STEEL','PERMIT','LABOR','MARKET','SAFETY'];
  const FN=A.newsFilter==='All'?NEWS_DATA:NEWS_DATA.filter(n=>n.tag===A.newsFilter);
  const URG=NEWS_DATA.filter(n=>n.urgent);
  return`<div style="max-width:1100px;margin:0 auto;padding:24px 20px">
    <div style="display:grid;grid-template-columns:1.8fr 1fr;gap:20px">
      <div>
        <div style="margin-bottom:16px">
          <div style="font-size:22px;font-weight:700;letter-spacing:-.02em;margin-bottom:4px;color:var(--text)">PH Construction Market News</div>
          <div style="font-size:13px;color:var(--text3)">PSA price indices · DOLE advisories · PAGASA alerts · Industry news</div>
        </div>
        ${URG.length>0?`<div style="background:${RD}0a;border:0.5px solid ${RD}30;border-radius:13px;padding:14px 18px;margin-bottom:16px">
          <div style="font-size:12px;font-weight:600;color:${RD};margin-bottom:8px">🚨 URGENT ALERTS — Action Required</div>
          ${URG.map(n=>`<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px">
            <span style="background:${n.color}20;color:${n.color};border-radius:10px;padding:1px 7px;font-size:11px;font-weight:500;flex-shrink:0">${n.tag}</span>
            <span style="font-size:13px;color:var(--text2);line-height:1.45">${n.title}</span>
          </div>`).join('')}
        </div>`:''}
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
          ${NT.map(t=>`<button onclick="ss({newsFilter:'${t}'})" style="padding:5px 12px;border-radius:16px;border:none;background:${A.newsFilter===t?BL:BL+'15'};color:${A.newsFilter===t?'#fff':BL};font-size:12px;font-weight:500">${t}</button>`).join('')}
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${FN.map(n=>`<div class="card" style="padding:20px">
            <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
              <span style="background:${n.color}20;color:${n.color};border-radius:10px;padding:2px 9px;font-size:11px;font-weight:600">${n.tag}</span>
              ${n.urgent?`<span style="background:${RD}20;color:${RD};border-radius:10px;padding:2px 8px;font-size:10px;font-weight:600">URGENT</span>`:''}
              <span style="font-size:11px;color:var(--text3);margin-left:auto">${n.date}</span>
            </div>
            <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:7px;line-height:1.3">${n.title}</div>
            <div style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:10px">${n.body}</div>
            <div style="font-size:11px;color:var(--text3)">Source: ${n.source}</div>
          </div>`).join('')}
        </div>
      </div>
      <div>
        <div style="font-size:18px;font-weight:700;margin-bottom:4px;color:var(--text)">NCR Material Prices</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:14px">PSA CMWPI data · March 2025 · Click to expand</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
          ${MKT.map((m,i)=>`<div class="card" style="padding:14px 16px;cursor:pointer;transition:border .2s" onclick="ss({mktDetail:${A.mktDetail===i?null:i}})" onmouseenter="this.style.borderColor='${BL}40'" onmouseleave="this.style.borderColor='var(--sep)'">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.name}</div>
                <div style="font-size:11px;color:var(--text3)">per ${m.unit}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:16px;font-weight:700;color:var(--text)">₱${m.price}</div>
                <div style="font-size:11px;font-weight:500;color:${m.change>0?RD:m.change<0?GR:'var(--text3)'}">${m.change>0?'↑ +':m.change<0?'↓ ':''}${m.change}% YoY</div>
              </div>
              <div style="font-size:15px;flex-shrink:0">${m.trend==='up'?'📈':m.trend==='down'?'📉':'➡️'}</div>
            </div>
            ${A.mktDetail===i?`<div style="margin-top:12px;padding-top:12px;border-top:0.5px solid var(--sep)">
              <div style="font-size:12px;color:var(--text2);line-height:1.55;margin-bottom:8px">${m.note}</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${bdg(m.risk==='Med'?'Moderate Risk':m.risk==='Low'?'Low Risk':'High Risk',m.risk==='High'?RD:m.risk==='Med'?OR:GR)}
                <span style="font-size:11px;color:var(--text3);align-self:center">Supplier: ${m.supplier}</span>
              </div>
            </div>`:''}
          </div>`).join('')}
        </div>
        <div style="background:${BL}0a;border:0.5px solid ${BL}30;border-radius:13px;padding:14px">
          <div style="font-size:12px;font-weight:600;color:${BL};margin-bottom:6px">📊 PSA CMWPI Summary — Dec 2025</div>
          <div style="font-size:12px;color:var(--text2);line-height:1.65">Annual CMWPI growth: <strong>+0.8%</strong> YoY. Structural steel: <strong>-3.0%</strong> (favorable). Sand & gravel: <strong>+0.2%</strong>. Painting works: <strong>+0.6%</strong>. Stable market — good conditions for locking in material contracts now.</div>
        </div>
      </div>
    </div>
  </div>`;
}

function CLIENT(){
  const p=A.project||(A.dbProjects||MOCK_PROJECTS)[0];
  const PT=[['progress','Progress'],['photos','Photos'],['documents','Documents & Signature'],['messages','Messages']];
  let C='';
  if(A.portalTab==='progress'){
    C=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card"><div style="padding:13px 18px;border-bottom:0.5px solid var(--sep);font-size:14px;font-weight:600;color:var(--text)">Construction phases</div>
        <div style="padding:14px 18px">${PHASES.map((ph,i)=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:28px;height:28px;border-radius:50%;border:1.5px solid ${ph.status==='done'?GR:ph.status==='active'?OR:'var(--sep)'};background:${ph.status==='done'?GR+'18':ph.status==='active'?OR+'18':'transparent'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500;color:${ph.status==='done'?GR:ph.status==='active'?OR:'var(--text4)'};flex-shrink:0">${ph.status==='done'?'✓':ph.status==='active'?'⟳':i+1}</div>
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;margin-bottom:3px">
              <span style="font-size:13px;font-weight:${ph.status==='active'?500:400};color:${ph.status==='pending'?'var(--text3)':'var(--text)'}">${ph.name}</span>
              <span style="font-size:12px;color:${ph.status==='done'?GR:ph.status==='active'?OR:'var(--text4)'}">${ph.pct}%</span>
            </div>
            ${pb(ph.pct,ph.status==='done'?GR:ph.status==='active'?OR:'var(--card3)',5)}
            <div style="font-size:11px;color:var(--text3);margin-top:2px">${ph.date}</div>
          </div>
        </div>`).join('')}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="card" style="padding:16px">
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:12px">Upcoming milestones</div>
          ${[['Apr 18','2nd Floor Slab Pour','Structural',OR],['May 2','Roof Framing Start','Roofing',BL],['May 16','MEP Complete','MEP',PU]].map(([date,title,tag,c])=>`<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:0.5px solid var(--sep)"><span style="font-size:13px;font-weight:500;color:${c};min-width:44px">${date}</span><span style="font-size:13px;flex:1;color:var(--text)">${title}</span>${bdg(tag,c)}</div>`).join('')}
        </div>
        <div class="card" style="padding:16px">
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:12px">Payment schedule</div>
          ${A.billings.slice(0,4).map(b=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--sep)"><div><div style="font-size:13px;font-weight:500;color:var(--text)">${b.ms}</div><div style="font-size:11px;color:var(--text3)">${fmt(b.amount)} · due ${b.due}</div></div><div style="display:flex;align-items:center;gap:10px">${bdg(b.status,sc(b.status))} ${b.status==='Received'?'':b.paymongo_checkout_url?`<button onclick="window.open('${b.paymongo_checkout_url}','_blank')" style="background:${BL};color:#fff;border:none;border-radius:16px;padding:5px 12px;font-size:12px;font-weight:500;white-space:nowrap">Pay Now →</button>`:`<button onclick="clientPayLink('${b.ref}',${b.amount},'${(b.ms||'').replace(/'/g,'')}')" style="background:${BL};color:#fff;border:none;border-radius:16px;padding:5px 12px;font-size:12px;font-weight:500;white-space:nowrap">Pay Now →</button>`}</div></div>`).join('')}
        </div>
      </div>
    </div>`;
  }
  else if(A.portalTab==='photos'){
    C=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${[{d:'Mar 18',ph:'Structural',cap:'Column rebar works Level 1 complete. Ready for concrete pour.',tag:'Milestone'},{d:'Mar 14',ph:'Structural',cap:'CHB wall laying ongoing — East facade 80% complete.',tag:'Progress'},{d:'Mar 7',ph:'Foundation',cap:'Foundation slab poured and cured. Passed inspection.',tag:'Milestone'},{d:'Feb 28',ph:'Earthworks',cap:'Excavation complete. Soil compaction test passed.',tag:'Progress'}].map(u=>`<div class="card">
      <div style="height:150px;background:var(--card2);display:flex;align-items:center;justify-content:center;position:relative"><span style="font-size:36px">🏗️</span><div style="position:absolute;top:10px;right:10px">${bdg(u.tag,u.tag==='Milestone'?OR:GR)}</div></div>
      <div style="padding:12px 14px"><div style="display:flex;justify-content:space-between;margin-bottom:5px">${bdg(u.ph,BL)}<span style="font-size:12px;color:var(--text3)">${u.d}</span></div><div style="font-size:13px;color:var(--text2);line-height:1.5">${u.cap}</div></div>
    </div>`).join('')}</div>`;
  }
  else if(A.portalTab==='documents'){
    C=`<div class="card" style="padding:24px">
      <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:16px">Project Documents</div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;background:var(--card2);border:0.5px solid var(--sep);border-radius:12px">
        <div>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px">General Contractor Agreement [Draft]</div>
          <div style="font-size:12px;color:var(--text3)">Awaiting your signature to commence work.</div>
        </div>
        ${A.sigSaved?`<div style="font-size:13px;font-weight:600;color:${GR};display:flex;align-items:center;gap:6px">✅ Legally Signed<br><a href="#" style="font-size:10px;color:var(--text3)">View PDF</a></div>`:bt('Review & Sign',"ss({showSigModal:true})","filled",BL)}
      </div>
    </div>`;
  }
  else{
    C=`<div class="card" style="display:flex;flex-direction:column">
      <div style="padding:13px 18px;border-bottom:0.5px solid var(--sep);background:var(--card2)">
        <div style="font-size:14px;font-weight:600;color:var(--text)">Messages — Engr. Dela Cruz</div>
        <div style="display:flex;align-items:center;gap:5px;margin-top:2px"><div style="width:6px;height:6px;border-radius:50%;background:${GR};animation:pulse 2s infinite"></div><span style="font-size:12px;color:${GR}">Online</span></div>
      </div>
      <div style="padding:16px 18px;display:flex;flex-direction:column;gap:10px;min-height:200px">
        ${A.messages.map(m=>`<div style="display:flex;justify-content:${m.from==='client'?'flex-end':'flex-start'}">
          <div style="max-width:72%;background:${m.from==='client'?BL:'var(--card2)'};border-radius:${m.from==='client'?'14px 14px 4px 14px':'14px 14px 14px 4px'};padding:10px 13px">
            <div style="font-size:13px;color:${m.from==='client'?'#fff':'var(--text)'};line-height:1.5">${m.text}</div>
            <div style="font-size:11px;color:${m.from==='client'?'rgba(255,255,255,.55)':'var(--text3)'};margin-top:3px;text-align:right">${m.time}</div>
          </div>
        </div>`).join('')}
      </div>
      <div style="padding:12px 18px;border-top:0.5px solid var(--sep);display:flex;gap:10px">
        <input type="text" id="mi" placeholder="Message your contractor..." onkeydown="if(event.key==='Enter')sendMsg()">
        <button onclick="sendMsg()" style="background:${BL};color:#fff;border:none;border-radius:20px;padding:9px 18px;font-size:13px;font-weight:500;flex-shrink:0">Send</button>
      </div>
    </div>`;
  }
  return`<div>
    <div style="background:var(--card);border-bottom:0.5px solid var(--sep);padding:13px 20px;display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;align-items:center;gap:10px">
        <img src="logo.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover">
        <div><div style="font-size:11px;color:var(--text3)">Client progress portal</div><div style="font-size:15px;font-weight:600;color:var(--text)">${p.name}</div></div>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        ${bt('Pay Progress Bill','ss({showPayModal:true})','filled',GR)}
        <button onclick="go('projects')" style="background:none;border:0.5px solid var(--sep);border-radius:16px;padding:5px 12px;font-size:12px;color:var(--text3)">Back</button>
      </div>
    </div>
    <div style="max-width:900px;margin:0 auto;padding:20px">
      ${A.showPayModal?`<div style="position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px"><div class="card fade" style="max-width:400px;width:100%;padding:32px;text-align:center">
        <div style="font-size:20px;font-weight:800;margin-bottom:12px">Secure Checkout</div>
        <div style="font-size:13px;color:var(--text3);margin-bottom:24px">Pay Billing PR-02 via domestic PH gateways.</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <button onclick="alert('Redirecting to GCash...');ss({showPayModal:false})" style="background:#0163FF;color:#fff;border:none;border-radius:13px;padding:16px;font-weight:700;display:flex;justify-content:space-between;align-items:center">Pay with GCash <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/GCash_logo.svg/1024px-GCash_logo.svg.png" style="height:20px;filter:brightness(10)"></button>
          <button onclick="alert('Redirecting to Maya...');ss({showPayModal:false})" style="background:#000;color:#fff;border:none;border-radius:13px;padding:16px;font-weight:700;display:flex;justify-content:space-between;align-items:center">Pay with Maya <span style="font-weight:900;color:#00FFA3">M</span></button>
          <div style="font-size:11px;color:var(--text4);margin-top:12px">Powered by ConstructAI x Maya Business</div>
        </div>
      </div></div>`:''}
      <div style="display:grid;grid-template-columns:2.2fr 1fr;gap:20px;margin-bottom:24px">
        <div class="card" style="height:350px;display:flex;flex-direction:column;background:linear-gradient(135deg,#000,#222);border:none;overflow:hidden">
            <div style="padding:16px;border-bottom:0.5px solid rgba(255,255,255,.1);display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:12px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.1em">3D Digital Twin (BIM)</span>
                ${bdg('Live Progress',GR)}
            </div>
            <div style="flex:1;display:flex;align-items:center;justify-content:center;perspective:1000px">
                <div style="width:140px;height:120px;background:${BL}40;border:3px solid ${BL};border-radius:4px;transform:rotateX(30deg) rotateY(45deg);position:relative;box-shadow:0 0 30px ${BL}60">
                    <div style="position:absolute;inset:0;background:linear-gradient(45deg,transparent,${BL}20)"></div>
                    <div style="position:absolute;bottom:100%;left:0;right:0;height:80px;background:${BL}30;border:2px solid ${BL};clip-path:polygon(50% 0%, 0% 100%, 100% 100%);padding:20px;color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center">${p.pct}%</div>
                    <div style="position:absolute;top:0;left:0;right:0;bottom:0;border:1px solid rgba(255,255,255,.2);background:repeating-linear-gradient(45deg,rgba(0,0,0,0),rgba(0,0,0,0) 10px,rgba(255,255,255,.05) 10px,rgba(255,255,255,.05) 11px)"></div>
                </div>
            </div>
            <div style="padding:14px;background:rgba(255,255,255,.03);font-size:11px;color:rgba(255,255,255,.6);text-align:center">Current Phase: <b style="color:#fff">${p.phase}</b> (Simulated Digital Twin)</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
            <div style="background:${BL};border-radius:13px;padding:20px">
                <div style="font-size:11px;color:rgba(255,255,255,.7);margin-bottom:4px;text-transform:uppercase">Overall Progress</div>
                <div style="font-size:48px;font-weight:700;color:#fff;letter-spacing:-.04em">${p.pct}%</div>
                ${pb(p.pct,'rgba(255,255,255,.9)',7)}
            </div>
            ${st('💰','Contract Value',fmtK(p.value),BL)}${st('📅','Next Milestone','Apr 18',OR)}
        </div>
      </div>
      <div style="display:flex;gap:4px;background:var(--card2);border-radius:20px;padding:4px;margin-bottom:20px;width:fit-content">
        ${PT.map(([id,label])=>`<button onclick="ss({portalTab:'${id}'})" style="padding:7px 18px;border-radius:16px;border:none;background:${A.portalTab===id?'var(--card)':'transparent'};color:var(--text);font-size:13px;font-weight:${A.portalTab===id?500:400};box-shadow:${A.portalTab===id?'var(--sh)':'none'}">${label}</button>`).join('')}
      </div>
      <div class="fade">${C}</div>
    </div>
  </div>`;
}
const AUDIT_LOGS=[{time:'10 mins ago',user:'Engr. Santos',action:'Modified BOQ #102',ip:'192.168.1.1',c:BL},{time:'1 hr ago',user:'Maria Santos (Client)',action:'Signed Contractor Agreement',ip:'112.203.4.5',c:GR},{time:'3 hrs ago',user:'System Auto',action:'Generated Daily PDF Report',ip:'internal',c:OR},{time:'1 day ago',user:'Glenn Padilla',action:'Clocked In (QR Scan)',ip:'Mobile',c:PU}];
const RBAC_USERS=[{name:'Engr. Juan dela Cruz',email:'juan@construct.ph',role:'Super Admin',status:'Active'},{name:'Engr. Maria Santos',email:'maria@construct.ph',role:'Project Manager',status:'Active'},{name:'Glenn Padilla',email:'glenn@construct.ph',role:'Foreman',status:'Active'},{name:'Jose Cruz',email:'jose@client.com',role:'Client',status:'Invited'}];
const VENDORS=[{name:'Holcim Philippines',type:'Material Supplier',rating:4.8,status:'Compliant',c:GR},{name:'Pag-asa Steel',type:'Material Supplier',rating:4.9,status:'Compliant',c:GR},{name:'Rizal Hauling Services',type:'Logistics',rating:3.5,status:'Missing Insurance',c:RD},{name:'Apex MEP Contractors',type:'Subcontractor',rating:4.2,status:'Review Pending',c:OR}];

function ADMIN(){
  const SC=[['global_fin','Global Financials'],['rbac','User Roles & Access'],['vendors','Subcontractor Performance'],['affiliates','Affiliate Payouts'],['templates','Document Templates'],['audit','Security Audit Log']];
  let C='';
  const allP = A.dbProjects||MOCK_PROJECTS;
  if(!A.adminSection||A.adminSection==='overview'||A.adminSection==='testimonials'||A.adminSection==='faqs') A.adminSection='global_fin';
  
  if(A.adminSection==='global_fin'){
    const tVal=allP.reduce((s,p)=>s+(p.value||0),0);
    const tBilled=allP.reduce((s,p)=>s+(p.billed||0),0);
    const tRec=allP.reduce((s,p)=>s+(p.received||0),0);
    const tGap=allP.reduce((s,p)=>s+(p.cashGap||0),0);
    C=`<div style="margin-bottom:24px">
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">Global Financial Portfolio</div>
      <div style="font-size:13px;color:var(--text3)">Aggregated command center across all ${allP.length} active projects.</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
      <div style="background:${BL};border-radius:13px;padding:20px">
        <div style="font-size:11px;color:rgba(255,255,255,.7);margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em">Total Contract Pipeline</div>
        <div style="font-size:26px;font-weight:700;color:#fff">${fmtK(tVal)}</div>
      </div>
      ${st('📄','Total Billed',fmtK(tBilled),PU)}${st('✅','Total Received',fmtK(tRec),GR)}${st('⚠️','Global Cash Gap',fmtK(tGap),tGap>0?RD:GR)}
    </div>
    <div class="card" style="padding:16px;overflow-x:auto"><div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:12px">Active Projects Breakdown</div>
      <table style="width:100%;border-collapse:collapse;min-width:600px">
        <thead><tr style="background:var(--card2);border-bottom:0.5px solid var(--sep)">${['Project','Client','Value','Billed','Received','Gap','Phase'].map(h=>`<th style="padding:10px 14px;text-align:left;font-size:11px;color:var(--text3);font-weight:500">${h}</th>`).join('')}</tr></thead>
        <tbody>${allP.map(p=>`<tr class="rh" style="border-bottom:0.5px solid var(--sep)">
          <td style="padding:10px 14px;font-size:13px;font-weight:600;color:var(--text)">${p.name}</td>
          <td style="padding:10px 14px;font-size:12px;color:var(--text2)">${p.client}</td>
          <td style="padding:10px 14px;font-size:13px;font-weight:500;color:${BL}">${fmtK(p.value)}</td>
          <td style="padding:10px 14px;font-size:13px;color:var(--text)">${fmtK(p.billed)}</td>
          <td style="padding:10px 14px;font-size:13px;color:${GR}">${fmtK(p.received)}</td>
          <td style="padding:10px 14px;font-size:13px;font-weight:600;color:${p.cashGap>0?RD:'var(--text2)'}">${fmtK(p.cashGap||0)}</td>
          <td style="padding:10px 14px">${bdg(p.phase,sc(p.phase))}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
  }
  else if(A.adminSection==='affiliates'){
    C=`<div style="margin-bottom:24px">
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">Affiliate Payout Requests</div>
      <div style="font-size:13px;color:var(--text3)">Review and approve commissions for the ConstructAI Partner network.</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
      ${st('🤝','Total Affiliates',42,BL)}
      ${st('💰','Pending Payouts',fmtK(A.payoutRequests.length * 1200),OR)}
      ${st('✅','Paid (MTD)',fmtK(145000),GR)}
    </div>
    <div class="card" style="padding:0;overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;min-width:600px">
        <thead><tr style="background:var(--card2);border-bottom:0.5px solid var(--sep)">${['Requested By','Amount','Method','Status','Actions'].map(h=>`<th style="padding:12px 18px;text-align:left;font-size:11px;color:var(--text3);font-weight:500">${h}</th>`).join('')}</tr></thead>
        <tbody>${A.payoutRequests.map(p=>`<tr class="rh" style="border-bottom:0.5px solid var(--sep)">
          <td style="padding:14px 18px"><div style="font-size:14px;font-weight:600;color:var(--text)">${p.user}</div><div style="font-size:11px;color:var(--text3)">${p.date}</div></td>
          <td style="padding:14px 18px;font-size:15px;font-weight:700;color:${GR}">₱${p.amount.toLocaleString()}</td>
          <td style="padding:14px 18px"><div style="display:flex;align-items:center;gap:6px"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/GCash_logo.svg/1024px-GCash_logo.svg.png" style="width:20px;height:20px;object-fit:contain"><span>${p.method}</span></div></td>
          <td style="padding:14px 18px">${bdg(p.status,OR)}</td>
          <td style="padding:14px 18px;display:flex;gap:8px">${bt('Approve','',"filled",GR,true)}${bt('Deny','',"tinted",RD,true)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
  }
  else if(A.adminSection==='rbac'){
    C=`<div style="margin-bottom:24px;display:flex;justify-content:space-between;align-items:center">
      <div><div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">Access Control (RBAC)</div><div style="font-size:13px;color:var(--text3)">Manage internal team members and client portal invites.</div></div>
      ${bt('+ Invite User','',"filled",BL,true)}
    </div>
    <div class="card" style="padding:0;overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;min-width:600px">
        <thead><tr style="background:var(--card2);border-bottom:0.5px solid var(--sep)">${['Name / Email','Assigned Role','Status','Actions'].map(h=>`<th style="padding:12px 18px;text-align:left;font-size:11px;color:var(--text3);font-weight:500">${h}</th>`).join('')}</tr></thead>
        <tbody>${RBAC_USERS.map(u=>`<tr class="rh" style="border-bottom:0.5px solid var(--sep)">
          <td style="padding:14px 18px">
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:2px">${u.name}</div>
            <div style="font-size:12px;color:var(--text3)">${u.email}</div>
          </td>
          <td style="padding:14px 18px">${bdg(u.role,u.role==='Super Admin'?PU:u.role==='Client'?OR:BL)}</td>
          <td style="padding:14px 18px">${bdg(u.status,u.status==='Active'?GR:'var(--text4)')}</td>
          <td style="padding:14px 18px;font-size:12px"><a href="#" style="color:${BL};text-decoration:none">Edit</a> &middot; <a href="#" style="color:${RD};text-decoration:none">Revoke</a></td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
  }
  else if(A.adminSection==='vendors'){
    C=`<div style="margin-bottom:24px;display:flex;justify-content:space-between;align-items:center">
      <div><div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">Subcontractor Trust Network</div><div style="font-size:13px;color:var(--text3)">Vetted performance scores based on quality, safety, and attendance.</div></div>
      ${bt('+ Onboard New Sub','',"filled",BL,true)}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      ${A.subs.map(s=>`<div class="card rh" style="padding:20px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
            <span style="font-size:16px;font-weight:700;color:var(--text)">${s.name}</span>
            ${bdg(s.badge,s.badge==='Top Rated'?GR:s.badge==='Verified'?BL:OR)}
          </div>
          <div style="font-size:12px;color:var(--text3)">${s.trade} · Reliability: <span style="color:${s.reliability==='High'?GR:RD};font-weight:600">${s.reliability}</span></div>
          <div style="font-size:11px;color:var(--text4);margin-top:6px">Last active: ${s.last}</div>
        </div>
        <div style="text-align:right">
          <div style="display:flex;align-items:center;gap:4px;justify-content:flex-end;margin-bottom:4px">
            <span style="font-size:20px;font-weight:800;color:${OR}">${s.score}</span>
            <span style="color:${OR};font-size:14px">★</span>
          </div>
          ${bt('View Log','','ghost',null,true)}
        </div>
      </div>`).join('')}
    </div>`;
  }
  else if(A.adminSection==='templates'){
    C=`<div style="margin-bottom:24px">
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">Standardized Template Engine</div>
      <div style="font-size:13px;color:var(--text3)">Boilerplate legal contracts and BOQ defaults.</div>
    </div>
    <div style="display:grid;gap:12px">
      ${[['General Contractor Agreement (Default)', 'Legal', 'Last modified by Engr. Santos (2 days ago)', BL],['Standard Subcontractor Agreement', 'Legal', 'Last modified by System (1 mo ago)', OR],['Default Phase 1 Earthworks BOQ', 'BOQ', 'Last modified by Engr. Santos (3 wks ago)', PU]].map(([t,type,m,c])=>`<div class="card rh" style="padding:16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer">
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><span style="font-size:14px;font-weight:600;color:var(--text)">${t}</span>${bdg(type,c)}</div>
          <div style="font-size:11px;color:var(--text3)">${m}</div>
        </div>
        <div style="font-size:12px;color:${BL};font-weight:500">Edit Template →</div>
      </div>`).join('')}
    </div>`;
  }
  else if(A.adminSection==='audit'){
    C=`<div style="margin-bottom:24px">
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">Security Audit Log</div>
      <div style="font-size:13px;color:var(--text3)">Immutable record of all platform activity and transactions.</div>
    </div>
    <div class="card" style="padding:0">
      ${AUDIT_LOGS.map((a,i)=>`<div style="display:flex;align-items:flex-start;gap:14px;padding:16px 20px;border-bottom:${i<AUDIT_LOGS.length-1?'0.5px solid var(--sep)':'none'}">
        <div style="width:10px;height:10px;border-radius:50%;background:${a.c};margin-top:5px;flex-shrink:0;box-shadow:0 0 8px ${a.c}80"></div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">${a.action}</div>
          <div style="font-size:11px;color:var(--text3)"><span style="font-weight:500;color:var(--text2)">${a.user}</span> &middot; IP: ${a.ip}</div>
        </div>
        <div style="font-size:11px;color:var(--text4)">${a.time}</div>
      </div>`).join('')}
    </div>`;
  }
  return`<div style="display:flex;min-height:600px">
    <div style="width:200px;background:var(--card2);border-right:0.5px solid var(--sep);padding:16px 12px;flex-shrink:0;display:flex;flex-direction:column">
      <div style="font-size:14px;font-weight:600;margin-bottom:20px;padding:0 4px;color:var(--text)">Admin Portal</div>
      ${SC.map(([id,label])=>`<button onclick="ss({adminSection:'${id}'})" style="display:block;width:100%;text-align:left;padding:8px 12px;border-radius:9px;border:none;background:${A.adminSection===id?BL+'20':'transparent'};color:${A.adminSection===id?BL:'var(--text3)'};font-size:13px;font-weight:${A.adminSection===id?500:400};margin-bottom:2px;cursor:pointer;transition:all .15s">${label}</button>`).join('')}
      <div style="margin-top:auto">${bt('← Back to Demo',"go('landing')",'ghost',null,true)}</div>
    </div>
    <div style="flex:1;padding:28px;overflow-y:auto;background:var(--bg)">${C}</div>
  </div>`;
}

const SAAS_TENANTS=[
  {name:'RDC Construction Corp',plan:'Enterprise',mrr:14999,seats:45,storage:'112 GB',status:'Active',since:'Jan 2024'},
  {name:'Santos Design Build',plan:'Pro',mrr:4999,seats:12,storage:'45 GB',status:'Active',since:'Jun 2024'},
  {name:'Apex MEP Contractors',plan:'Pro',mrr:4999,seats:8,storage:'12 GB',status:'Active',since:'Nov 2024'},
  {name:'Lim Properties',plan:'Enterprise',mrr:14999,seats:60,storage:'210 GB',status:'Payment Failed',since:'Feb 2023'},
  {name:'Cruz Builders Cebu',plan:'Trial',mrr:0,seats:3,storage:'1.2 GB',status:'Trial (3 days left)',since:'Mar 2025'}
];

function MASTER(){
  const SC=[['tenants','Tenant Subscriptions'],['onboarding','Verification & KYC'],['whitelabel','White-Label Settings'],['broadcast','Global Broadcasts']];
  let C='';
  if(!A.saasSection) A.saasSection='tenants';
  
  if(A.saasSection==='tenants'){
    const tMRR = SAAS_TENANTS.map(t=>t.mrr).reduce((a,b)=>a+b,0);
    const tSeats = SAAS_TENANTS.map(t=>t.seats).reduce((a,b)=>a+b,0);
    C=`<div style="margin-bottom:24px">
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">Tenant & Subscription Analytics</div>
      <div style="font-size:13px;color:var(--text3)">High-level view of all construction companies utilizing ConstructAI.</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
      <div style="background:linear-gradient(135deg,#000,#333);border-radius:13px;padding:20px">
        <div style="font-size:11px;color:rgba(255,255,255,.7);margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em">SaaS Monthly Recurring Revenue</div>
        <div style="font-size:26px;font-weight:700;color:#00FFA3">₱${(tMRR).toLocaleString()}</div>
      </div>
      ${st('🏢','Active Construction Firms',SAAS_TENANTS.length,BL)}
      ${st('👥','Total Billed Seats',tSeats,PU)}
    </div>
    <div class="card" style="padding:16px;overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;min-width:600px">
        <thead><tr style="background:var(--card2);border-bottom:0.5px solid var(--sep)">${['Construction Firm','SaaS Plan','MRR','Licensed Seats','Storage Used','Status'].map(h=>`<th style="padding:10px 14px;text-align:left;font-size:11px;color:var(--text3);font-weight:500">${h}</th>`).join('')}</tr></thead>
        <tbody>${SAAS_TENANTS.map(t=>`<tr class="rh" style="border-bottom:0.5px solid var(--sep)">
          <td style="padding:10px 14px;font-size:13px;font-weight:600;color:var(--text)">${t.name}<div style="font-size:10px;color:var(--text3);font-weight:400">Customer since ${t.since}</div></td>
          <td style="padding:10px 14px">${bdg(t.plan,t.plan==='Enterprise'?PU:t.plan==='Pro'?BL:OR)}</td>
          <td style="padding:10px 14px;font-size:13px;font-weight:500;color:${GR}">₱${t.mrr.toLocaleString()}</td>
          <td style="padding:10px 14px;font-size:13px;color:var(--text2)">${t.seats}</td>
          <td style="padding:10px 14px;font-size:13px;color:var(--text2)">${t.storage}</td>
          <td style="padding:10px 14px">${bdg(t.status,t.status==='Active'?GR:t.status==='Payment Failed'?RD:OR)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
  }
  else if(A.saasSection==='onboarding'){
    C=`<div style="margin-bottom:24px"><div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">New Tenant KYC & Approval</div><div style="font-size:13px;color:var(--text3)">Verify PCAB licenses for inbound contracting firms.</div></div>
    <div class="card" style="padding:20px;display:flex;align-items:center;justify-content:space-between;border-left:4px solid ${OR}">
      <div>
        <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:4px">Zeta Builders Inc.</div>
        <div style="font-size:12px;color:var(--text3)">Signed up 2 hours ago. Selected 'Pro' Plan.</div>
      </div>
      <div style="display:flex;gap:12px;align-items:center">
        <a href="#" style="font-size:12px;color:${BL};font-weight:500">View PCAB PDF</a>
        ${bt('Approve & Provision DB',`alert('Tenant Database Provisioned!')`,'filled',GR)}
        ${bt('Reject','','ghost',RD)}
      </div>
    </div>`;
  }
  else if(A.saasSection==='whitelabel'){
    C=`<div style="margin-bottom:24px"><div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">Global White-Label Engine</div><div style="font-size:13px;color:var(--text3)">Allow Enterprise tenants to override ConstructAI branding with their own custom domain and logos.</div></div>
    <div class="card" style="padding:24px;max-width:500px">
      <div style="margin-bottom:16px"><div style="font-size:12px;font-weight:600;margin-bottom:6px">Select Tenant</div><select><option>RDC Construction Corp</option><option>Lim Properties</option></select></div>
      <div style="margin-bottom:16px"><div style="font-size:12px;font-weight:600;margin-bottom:6px">Custom Login Domain URL</div><input value="portal.rdcconstruction.ph"></div>
      <div style="margin-bottom:16px"><div style="font-size:12px;font-weight:600;margin-bottom:6px">Primary Brand Color (Hex)</div><input type="color" value="#cf152d" style="padding:0;height:40px;width:100px;border-radius:4px"></div>
      <div style="margin-bottom:20px"><label style="display:flex;align-items:center;gap:10px;font-size:13px"><input type="checkbox" checked> Hide "Powered by ConstructAI" badge on client portal</label></div>
      ${bt('Save Global Settings',`alert('Saved!')`)}
    </div>`;
  }
  else if(A.saasSection==='broadcast'){
    C=`<div style="margin-bottom:24px"><div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px">System-Wide Broadcast Alert</div><div style="font-size:13px;color:var(--text3)">Push an emergency banner to all 72 active contractor dashboard sessions.</div></div>
    <div class="card" style="padding:24px;max-width:600px;border-color:${RD}">
      <div style="margin-bottom:16px"><div style="font-size:12px;font-weight:600;margin-bottom:6px;color:${RD}">Alert Message</div><input value="Scheduled Maintenance: Platform will be offline Sunday 2AM-4AM PHT."></div>
      <div style="margin-bottom:20px"><div style="font-size:12px;font-weight:600;margin-bottom:6px">Alert Type</div><select><option>Warning (Red)</option><option>Info (Blue)</option><option>Success (Green)</option></select></div>
      ${bt('PUSH TO ALL TENANTS',`alert('Broadcast Sent to 72 active user WebSocket connections!')`,'filled',RD)}
    </div>`;
  }
  
  return `<div style="display:flex;min-height:600px">
    <div style="width:230px;background:#111;border-right:1px solid #333;padding:16px 12px;flex-shrink:0;display:flex;flex-direction:column">
      <div style="font-size:14px;font-weight:800;margin-bottom:20px;padding:0 4px;color:#00FFA3;letter-spacing:1px">SaaS CORE <span style="font-size:10px;color:#888;font-weight:500">v1.0</span></div>
      ${SC.map(([id,label])=>`<button onclick="ss({saasSection:'${id}'})" style="display:block;width:100%;text-align:left;padding:10px 14px;border-radius:6px;border:none;background:${A.saasSection===id?'#222':'transparent'};color:${A.saasSection===id?'#fff':'#888'};font-size:13px;font-weight:${A.saasSection===id?600:400};margin-bottom:4px;cursor:pointer;transition:all .15s">${label}</button>`).join('')}
    </div>
    <div style="flex:1;padding:28px;overflow-y:auto;background:var(--bg)">${C}</div>
  </div>`;
}

function render(){
  const app=document.getElementById('app');
  document.body.className=A.theme==='light'?'':A.theme;
  let html=NAV()+TICKER();
  if(A.view==='landing')html+=LANDING()+FOOTER();
  else if(A.view==='auth')html+=AUTH();
  else if(A.view==='projects')html+=PROJECTS();
  else if(A.view==='dashboard')html+=DASHBOARD();
  else if(A.view==='market')html+=MARKET()+FOOTER();
  else if(A.view==='client')html+=CLIENT();
  else if(A.view==='admin')html+=ADMIN();
  else if(A.view==='saas')html+=MASTER();
  else if(A.view==='partners')html+=PARTNERS_PORTAL()+FOOTER();
  else if(A.view==='crm')html+=CRM()+FOOTER();
  
  if(A.showSigModal){
    html+=`<div style="position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeUp .2s ease forwards">
      <div class="card" style="width:100%;max-width:500px;background:var(--card);padding:24px">
        <div style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:8px">Sign Document</div>
        <div style="font-size:13px;color:var(--text3);margin-bottom:20px">Please draw your signature below to legally execute the General Contractor Agreement.</div>
        <div style="border:2px dashed var(--sep);border-radius:12px;background:var(--card2);margin-bottom:20px;position:relative">
          <canvas id="sig-canvas" width="450" height="200" style="width:100%;height:200px;cursor:crosshair;touch-action:none"></canvas>
          <button onclick="clearSig()" style="position:absolute;bottom:10px;right:10px;background:var(--card);border:0.5px solid var(--sep);border-radius:12px;padding:4px 10px;font-size:11px;color:var(--text2)">Clear</button>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          ${bt('Cancel',"ss({showSigModal:false})",'ghost')}
          ${bt('Approve & Sign',"saveSig()",'filled',GR)}
        </div>
      </div>
    </div>`;
    setTimeout(initSigPad, 100);
  }
  
  app.innerHTML=html;
  document.body.classList.add('loaded');
  const splash=document.getElementById('splash');
  if(splash){splash.style.opacity='0';setTimeout(()=>splash.remove(),400);}
}

function FOOTER(){
  return `<footer style="background:var(--card);border-top:0.5px solid var(--sep);padding:60px 20px 40px;margin-top:40px">
    <div style="max-width:920px;margin:0 auto;display:grid;grid-template-columns:2fr repeat(3,1fr);gap:40px;margin-bottom:40px">
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px"><img src="logo.png" style="width:32px;height:32px;border-radius:10px"><span style="font-size:18px;font-weight:700">ConstructAI</span></div>
        <p style="font-size:14px;color:var(--text3);line-height:1.6">The modern operating system for builders and general contractors in the Philippines. Streamline from BOQ to Turnover.</p>
      </div>
      <div>
         <div style="font-size:14px;font-weight:700;margin-bottom:16px">Product</div>
         ${['Features','Pricing','Market Prices','Market News'].map(l=>`<a href="#" onclick="event.preventDefault()" style="display:block;font-size:13px;color:var(--text2);text-decoration:none;margin-bottom:10px">${l}</a>`).join('')}
      </div>
      <div>
         <div style="font-size:14px;font-weight:700;margin-bottom:16px">Partners</div>
         <a href="#" onclick="event.preventDefault();go('partners')" style="display:block;font-size:13px;color:${BL};font-weight:600;text-decoration:none;margin-bottom:10px">Partner Program</a>
         <a href="#" onclick="event.preventDefault()" style="display:block;font-size:13px;color:var(--text2);text-decoration:none;margin-bottom:10px">Developer API</a>
      </div>
      <div>
         <div style="font-size:14px;font-weight:700;margin-bottom:16px">Company</div>
         ${['About Us','Careers','Privacy','Terms'].map(l=>`<a href="#" onclick="event.preventDefault()" style="display:block;font-size:13px;color:var(--text2);text-decoration:none;margin-bottom:10px">${l}</a>`).join('')}
      </div>
    </div>
    <div style="max-width:920px;margin:0 auto;padding-top:24px;border-top:0.5px solid var(--sep);display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:12px;color:var(--text4)">© 2026 ConstructAI PH. All rights reserved.</div>
      <div style="display:flex;gap:16px"><span style="font-size:16px">🐦</span><span style="font-size:16px">📸</span><span style="font-size:16px">💼</span></div>
    </div>
  </footer>`;
}

function PARTNERS_PORTAL(){
  const tier = A.aff.refs > 20 ? 'Gold (15%)' : 'Bronze (10%)';
  const link = `https://constructai-antigravity.vercel.app/?ref=${A.aff.id}`;
  return `<div style="max-width:800px;margin:0 auto;padding:60px 20px">
    <div style="text-align:center;margin-bottom:48px">
      <div style="font-size:14px;font-weight:700;color:${BL};text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Affiliate Program</div>
      <h1 style="font-size:48px;font-weight:800;letter-spacing:-.04em;margin-bottom:16px">Build with us. <br>Earn with us.</h1>
      <p style="font-size:18px;color:var(--text2);line-height:1.6;max-width:540px;margin:0 auto">Earn <span style="color:${GR};font-weight:700">10% recurring commission</span> for every contractor you refer to ConstructAI. Weekly payouts via GCash.</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:40px">
       ${[['📈','Referral Clicks',A.aff.clicks],['🤝','Succesful Referrals',A.aff.refs],['₱','Pending Commission','₱3,450']].map(([i,l,v])=>`<div class="card" style="padding:24px;text-align:center"><div style="font-size:24px;margin-bottom:8px">${i}</div><div style="font-size:24px;font-weight:800;color:var(--text);margin-bottom:4px">${v}</div><div style="font-size:13px;color:var(--text3)">${l}</div></div>`).join('')}
    </div>
    <div class="card" style="padding:32px;background:linear-gradient(135deg,${BL}05,${PU}05)">
       <h3 style="margin-bottom:16px">Your Growth Dashboard</h3>
       <div style="margin-bottom:24px">
         <div style="font-size:12px;font-weight:600;margin-bottom:8px">Your Unique Referral Link</div>
         <div style="display:flex;gap:12px">
            <input value="${link}" readonly style="flex:1;background:var(--card);font-family:monospace;font-size:13px;color:${BL}">
            ${bt('Copy Link',`navigator.clipboard.writeText('${link}');alert('Copied!')`)}
         </div>
       </div>
       <div style="display:grid;grid-template-columns:1fr 1.2fr;gap:24px">
         <div>
            <div style="font-size:14px;font-weight:700;margin-bottom:12px">Commission Rules</div>
            <div style="font-size:13px;color:var(--text2);display:flex;flex-direction:column;gap:10px">
               <div>✅ 10% Lifetime Recurring</div>
               <div>✅ 20-Day Cookie Window</div>
               <div>✅ Real-time Analytics</div>
               <div>✅ Min. Payout: ₱1,000</div>
            </div>
         </div>
         <div class="card" style="padding:20px;background:var(--card)">
            <div style="font-size:14px;font-weight:700;margin-bottom:4px">Request GCash Payout</div>
            <div style="font-size:11px;color:var(--text4);margin-bottom:16px">Funds are released every Friday.</div>
            <input placeholder="GCash Number (09XX...)" style="margin-bottom:12px">
            ${bt('Request Payout','','filled',GR)}
         </div>
       </div>
    </div>
    <div style="margin-top:40px;text-align:center">
       <p style="font-size:13px;color:var(--text3)">Not a partner yet? <a href="#" style="color:${BL};font-weight:600">Register as a Partner</a></p>
    </div>
  </div>`;
}

function CRM(){
  const stages = ['Inquiry','Site Inspection','Architectural Design','Proposal Sent','Negotiation'];
  const filter = A.crmStageFilter;
  const filtered = filter==='All'?A.leads:A.leads.filter(l=>l.stage===filter);
  
  return `<div style="max-width:1100px;margin:0 auto;padding:28px 20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <div>
        <div style="font-size:26px;font-weight:700;letter-spacing:-.03em;color:var(--text)">Sales & Leads Engine</div>
        <div style="font-size:14px;color:var(--text3)">Track potential residential and commercial projects.</div>
      </div>
      ${bt('Add New Lead','','filled',BL)}
    </div>
    
    <div style="display:flex;gap:8px;margin-bottom:24px;overflow-x:auto;padding-bottom:10px">
      ${['All',...stages].map(s=>`<button onclick="ss({crmStageFilter:'${s}'})" style="padding:7px 16px;border-radius:20px;border:none;background:${filter===s?BL+'20':'var(--card2)'};color:${filter===s?BL:'var(--text2)'};font-size:13px;font-weight:500;white-space:nowrap">${s} ${s==='All'?`(${A.leads.length})`:''}</button>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">
      ${filtered.map(l=>`<div class="card rh" style="padding:20px;border-left:4px solid ${l.health==='hot'?RD:l.health==='warm'?OR:BL}">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          ${bdg(l.stage,BL)}
          <div style="font-size:11px;color:var(--text4);font-weight:600">ID: L-${l.id}</div>
        </div>
        <div style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:4px">${l.name}</div>
        <div style="font-size:13px;color:var(--text3);margin-bottom:16px"><span style="margin-right:8px">📍</span>${l.location}</div>
        
        <div style="background:var(--card2);border-radius:12px;padding:12px;margin-bottom:16px">
          <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Projected Value</div>
          <div style="font-size:20px;font-weight:800;color:${GR}">${fmt(l.value)}</div>
        </div>
        
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:12px;color:var(--text2)">Source: <span style="font-weight:600">${l.source}</span></div>
          <div style="display:flex;gap:8px">
            <button onclick="alert('Calling ${l.contact}...')" style="background:none;border:none;font-size:18px;cursor:pointer">📞</button>
            ${bt('View Proposal','','ghost',null,true)}
          </div>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
}

function ss(u){Object.assign(A,u);render();}
function go(v){A.view=v;if(v==='dashboard'&&!A.project)A.project=(A.dbProjects||MOCK_PROJECTS)[0];render();}
function goDashDemo(){A.user={name:'Engr. Dela Cruz'};A.project=MOCK_PROJECTS[0];A.view='dashboard';A.dashTab='overview';render();}

async function doLogin(){
  const e=document.getElementById('ae')?.value||'';
  const p=document.getElementById('ap')?.value||'';
  const btn=document.getElementById('login-btn');
  const err=document.getElementById('login-err');
  if(err){err.textContent='';err.style.display='none';}
  if(!e||!p){if(err){err.textContent='Please enter email and password.';err.style.display='block';}return;}
  if(btn){btn.textContent='Signing in…';btn.disabled=true;}
  const{data,error}=await SB.auth.signInWithPassword({email:e,password:p});
  if(error){
    if(err){err.textContent=error.message;err.style.display='block';}
    if(btn){btn.textContent='Sign In';btn.disabled=false;}
    return;
  }
}

async function doSignUp(){
  const e=document.getElementById('ae')?.value||'';
  const p=document.getElementById('ap')?.value||'';
  const n=document.getElementById('an')?.value||'';
  const btn=document.getElementById('login-btn');
  const err=document.getElementById('login-err');
  if(err){err.textContent='';err.style.display='none';}
  if(!e||!p){if(err){err.textContent='Please enter email and password.';err.style.display='block';}return;}
  if(btn){btn.textContent='Creating account…';btn.disabled=true;}
  const refCode=localStorage.getItem('ca_ref');
  const{data,error}=await SB.auth.signUp({
    email:e,
    password:p,
    options:{
      data:{
        full_name:n||e.split('@')[0],
        referred_by:refCode||'none'
      }
    }
  });
  if(error){
    if(err){err.textContent=error.message;err.style.display='block';}
    if(btn){btn.textContent='Create Account';btn.disabled=false;}
    return;
  }
  alert('Success! Please check your email for a confirmation link.');
  ss({authMode:'signin'});
}

async function signInWithGoogle(){
  const{data,error}=await SB.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}});
  if(error) alert('Error: '+error.message);
}

async function doSignOut(){
  await SB.auth.signOut();
  ss({user:null,view:'landing',dbProjects:null,project:null});
}

async function selectProject(id){
  const PL=A.dbProjects||MOCK_PROJECTS;
  // id may be UUID string or number from mock data
  A.project=PL.find(p=>String(p.id)===String(id))||MOCK_PROJECTS.find(p=>String(p.id)===String(id));
  if(A.user?.id&&A.dbProjects){await loadProjectData(String(id));}
  A.view='dashboard';A.dashTab='overview';render();
}

async function loadUserProjects(){
  const{data,error}=await SB.from('projects').select('*').order('created_at',{ascending:false});
  if(!error&&data?.length){
    A.dbProjects=data.map(p=>({
      id:p.id,name:p.name,client:p.client_name,location:p.location,
      value:p.contract_amount||0,spent:p.spent||0,billed:p.billed||0,received:p.received||0,
      pct:p.progress||0,phase:p.phase||'Pre-Construction',cash_gap:p.cash_gap||0,
      cashGap:p.cash_gap||0,openPunch:p.open_punch||0,
      margin:p.margin||0,daysLeft:p.days_left||0,health:p.health||'good'
    }));
  }
}

async function loadProjectData(projectId){
  const[punches,inv,bills,cos,msgs]=await Promise.all([
    SB.from('punches').select('*').eq('project_id',projectId).order('created_at'),
    SB.from('inventory').select('*').eq('project_id',projectId),
    SB.from('billings').select('*').eq('project_id',projectId).order('created_at'),
    SB.from('change_orders').select('*').eq('project_id',projectId).order('date',{ascending:false}),
    SB.from('messages').select('*').eq('project_id',projectId).order('created_at')
  ]);
  if(punches.data?.length) A.punches=punches.data;
  if(inv.data?.length) A.inventory=inv.data;
  if(bills.data?.length) A.billings=bills.data.map(b=>({...b,ms:b.milestone||b.ms,due:b.due_date||b.due}));
  if(cos.data?.length) A.coItems=cos.data.map(c=>({...c,desc:c.description,by:c.requested_by}));
  if(msgs.data?.length) A.messages=msgs.data.map(m=>({from:m.sender,text:m.text,time:new Date(m.created_at).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}));
}

async function initApp(){
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
  const params=new URLSearchParams(window.location.search);
  const ref=params.get('ref');
  if(ref){
    localStorage.setItem('ca_ref',ref);
    localStorage.setItem('ca_ref_exp',Date.now()+20*24*60*60*1000);
    console.log('ConstructAI: Referral tracked:',ref);
  }
  SB.auth.onAuthStateChange(async(ev,s)=>{
    if(s){
      A.user={name:s.user.user_metadata?.full_name||s.user.email.split('@')[0],email:s.user.email,id:s.user.id};
      await loadUserProjects();
      if(A.view==='auth') A.view='projects';
    }else{ A.user=null; }
    render();
  });
  try{
    const{data:{session}}=await SB.auth.getSession();
    if(session){
      A.user={name:session.user.user_metadata?.full_name||session.user.email.split('@')[0],email:session.user.email,id:session.user.id};
      await loadUserProjects();
    }
  }catch(e){console.warn('Supabase not configured — running in demo mode');}
  render();
}

async function checkout(plan, price, link){
  const btn = event?.target;
  const originalText = btn?.textContent;
  if(btn){ 
    btn.innerHTML='<span style="display:inline-block;animation:pulse 1s infinite">Connecting Stripe...</span>'; 
    btn.disabled=true; 
  }
  
  // Wait to simulate a premium loading experience
  setTimeout(()=>{
    if(link && link !== '#' && link !== 'undefined'){
      window.location.href = link;
    } else {
      // Sleek fallback notice for demo mode
      const isMobile = window.innerWidth < 600;
      const notice = document.createElement('div');
      notice.className = 'fade';
      notice.style = `position:fixed;bottom:20px;right:20px;background:#000;color:#fff;padding:16px 20px;border-radius:14px;z-index:9999;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,0.3);width:${isMobile?'calc(100% - 40px)':'340px'}`;
      notice.innerHTML = `
        <div style="font-weight:700;margin-bottom:4px;color:${BL}">Demo Mode Active</div>
        <div style="opacity:0.8;line-height:1.45">Redirecting to project dashboard. Replace '#' with your <strong>Stripe Payment Links</strong> in the code to enable live payments.</div>
      `;
      document.body.appendChild(notice);
      
      setTimeout(() => {
        if(btn){ btn.textContent = originalText; btn.disabled = false; }
        goDashDemo();
        setTimeout(()=>notice.remove(), 4000);
      }, 1500);
    }
  }, 800);
}

async function genericPayLink(ref,amount,desc,btnTitle){
  const btn=event?.target;
  if(btn){btn.textContent='Connecting…';btn.disabled=true;}
  try{
    const auth = 'Basic ' + btoa('YOUR_PAYMONGO_TEST_KEY:');
    const res=await fetch('https://api.paymongo.com/v1/links',{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':auth},
      body:JSON.stringify({data:{attributes:{amount:Math.round(amount*100),description:desc}}})
    });
    const data=await res.json();
    if(data.data){
      const url = data.data.attributes.checkout_url;
      window.open(url,'_blank');
      A.billings=A.billings.map(b=>b.ref===ref?{...b,status:'Sent',paymongo_checkout_url:url}:b);
      render();return;
    }
    alert('Payment link error: '+(data.errors?.[0]?.detail||'Unknown'));
  }catch(e){alert('Could not secure GCash link link. Network error or CORS violation.');}
  if(btn){btn.textContent=btnTitle;btn.disabled=false;}
}
function sendPayLink(ref,amount,desc){ genericPayLink(ref,amount,desc,'Send Link'); }
function clientPayLink(ref,amount,desc){ genericPayLink(ref,amount,desc,'Pay Now →'); }
function resolvePunch(id){A.punches=A.punches.map(p=>p.id===id?{...p,status:'Resolved'}:p);render();}
function addPunch(){const area=document.getElementById('pa')?.value||'';const item=document.getElementById('pi')?.value||'';const trade=document.getElementById('pt')?.value||'';if(!area||!item)return;A.punches.push({id:Date.now(),area,item,trade,priority:'Med',status:'Open',due:'TBD'});A.showPunchForm=false;render();}
function updBOQ(i,v){const r=[...A.boqRates];r[i]=parseFloat(v)||0;A.boqRates=r;render();}
function sendMsg(){const input=document.getElementById('mi');const text=input?input.value.trim():'';if(!text)return;A.messages.push({from:'client',text,time:'Just now'});render();setTimeout(()=>{A.messages.push({from:'contractor',text:'Got it! I will update you with the latest status shortly.',time:'Just now'});render();},1200);}
function saveFaq(){const q=document.getElementById('fq')?.value||'';const a=document.getElementById('fa')?.value||'';if(!q||!a)return;if(A.editFaqIdx!==null){A.faqs=A.faqs.map((f,i)=>i===A.editFaqIdx?{...f,q,a}:f);}else{A.faqs.push({id:Date.now(),q,a});}A.showFaqForm=false;A.editFaqIdx=null;A.editFaqQ='';A.editFaqA='';render();}
function editFaq(i){const f=A.faqs[i];ss({showFaqForm:true,editFaqIdx:i,editFaqQ:f.q,editFaqA:f.a});}
function delFaq(i){A.faqs=A.faqs.filter((_,j)=>j!==i);render();}
function delTestimonial(i){A.testimonials=A.testimonials.filter((_,j)=>j!==i);render();}
function logDelivery(){const id=parseInt(document.getElementById('dm')?.value);const q=parseFloat(document.getElementById('dq')?.value)||0;if(!id||q<=0)return;A.inventory=A.inventory.map(i=>i.id===id?{...i,delivered:i.delivered+q}:i);A.showDelivery=false;render();}
function logUsage(){const id=parseInt(document.getElementById('um')?.value);const q=parseFloat(document.getElementById('uq')?.value)||0;if(!id||q<=0)return;A.inventory=A.inventory.map(i=>i.id===id?{...i,used:Math.min(i.delivered,i.used+q)}:i);A.showUsage=false;render();}
function voteFR(id){A.featureRequests=A.featureRequests.map(f=>f.id===id?{...f,votes:f.votes+1}:f);render();}
function submitFR(){const title=document.getElementById('frt')?.value||'';const desc=document.getElementById('frd')?.value||'';const name=document.getElementById('frn')?.value||'';const email=document.getElementById('fre')?.value||'';const cat=document.getElementById('frc')?.value||'General';if(!title||!desc)return;A.featureRequests.unshift({id:Date.now(),title,category:cat,description:desc,by:name||'Anonymous',votes:1,status:'In Review',date:'Today'});A.frSubmitted=true;render();}
function askAI(){
  const input=document.getElementById('ai-q');
  const q=input?input.value.trim():'';
  if(!q||A.aiTyping)return;
  A.aiChat.push({r:'user',t:q});
  A.aiTyping=true;
  if(input)input.value='';
  render();
  setTimeout(()=>{
    let ans="I'm analyzing the project database... Could you be more specific? Try asking about 'material spend', 'weather delays', or 'open punch lists'.";
    const lq=q.toLowerCase();
    if(lq.includes('gravel')||lq.includes('spend')||lq.includes('cost')||lq.includes('aggregate')||lq.includes('material')){
      ans="Based on your live inventory, you've used 35 m³ of river wash sand and 32 m³ of gravel. Your total aggregate spend is ₱45,460. You are currently 14% under your allocated earthworks material budget.";
    }else if(lq.includes('delay')||lq.includes('weather')||lq.includes('schedule')||lq.includes('rain')){
      ans="Cross-referencing the Gantt chart and daily site reports: We experienced 2 days of rain delays last week during foundation works. 'Structural Works' is currently at risk of finishing on Apr 20 instead of Apr 18. I recommend drafting a weather delay claim (Extension of Time).";
    }else if(lq.includes('punch')||lq.includes('issue')||lq.includes('open')||lq.includes('defect')){
      ans="You currently have 4 open punch list items. The most critical are 'Exhaust fan not working' in CR 1 (High Priority) and 'wobbly baluster' (High Priority). I suggest assigning these to the Electrical and Masonry teams immediately to prevent handover delays.";
    }
    A.aiChat.push({r:'ai',t:ans});
    A.aiTyping=false;
    render();
  }, 1800);
}

function exportBOQ() {
  const bB=[{n:'1.0 Earthworks & Site Prep',q:1,u:'lot',r:0},{n:'2.0 Concrete Works (3000 PSI)',q:45.5,u:'m³',r:1},{n:'3.0 Reinforcing Steel Gr40',q:3200,u:'kg',r:2},{n:'4.0 Masonry 6" CHB Exterior',q:1250,u:'pcs',r:3},{n:'5.0 Roofing Pre-painted',q:120,u:'sqm',r:4}];
  const items=bB.map(i=>({...i,rate:A.boqRates[i.r],total:Math.round(i.q*A.boqRates[i.r])}));
  let csv = "Item No.,Description,Quantity,Unit,Unit Rate,Total Amount\n";
  items.forEach(i => { csv += `"${i.n.split(' ')[0]}","${i.n.substring(4)}","${i.q}","${i.u}","${i.rate}","${i.total}"\n`; });
  csv += `,,,,,"Total: ${items.reduce((s,i)=>s+i.total,0)}"\n`;
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "ConstructAI_BOQ.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
function saveReport(){
  const w=document.getElementById('dr_w')?.value||'';
  const h=parseInt(document.getElementById('dr_h')?.value)||0;
  const e=parseInt(document.getElementById('dr_e')?.value)||0;
  const p=document.getElementById('dr_p')?.value||'';
  const v=document.getElementById('dr_v')?.value||'None';
  const n=document.getElementById('dr_n')?.value||'None';
  if(!w||!p)return;
  A.dailyLogs.unshift({d:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),w,h,e,p,v:[v],n,c:BL,s:navigator.onLine});
  localStorage.setItem('dl_cache',JSON.stringify(A.dailyLogs));
  A.showReportForm=false;
  render();
}
function scanWorker(){
  const out = A.workers.find(w=>w.s==='Out');
  if(out){
    out.s='In'; out.t=new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    A.scanningQR=false;
    render();
    setTimeout(()=>alert(`Success! [${out.id}] ${out.n} clocked in.`), 50);
  } else {
    alert('No more workers to scan in demo.');
  }
}

async function exportReportPDF(i) {
  const r = A.dailyLogs[i];
  const el = document.createElement('div');
  el.style.padding = '40px';
  el.style.fontFamily = 'Arial, sans-serif';
  el.style.color = '#000';
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #000;padding-bottom:20px;margin-bottom:30px">
      <div>
        <h1 style="margin:0;font-size:32px;color:#007AFF">ConstructAI <span style="color:#000">PH</span></h1>
        <div style="font-size:14px;color:#555;margin-top:5px;letter-spacing:1px;text-transform:uppercase">Official Daily Site Report</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:20px;font-weight:bold;margin-bottom:4px">${r.d}</div>
        <div style="font-size:15px;color:#555">Project: <strong>${A.project?.name || 'Santos Residence'}</strong></div>
      </div>
    </div>
    <div style="display:flex;gap:40px;margin-bottom:35px;background:#f5f5f7;padding:25px;border-radius:12px">
      <div><strong style="display:block;font-size:11px;color:#666;margin-bottom:6px">WEATHER CONDITIONS</strong><span style="font-size:18px;font-weight:600">${r.w}</span></div>
      <div><strong style="display:block;font-size:11px;color:#666;margin-bottom:6px">ACTIVE WORKFORCE</strong><span style="font-size:18px;font-weight:600">${r.h} Personnel</span></div>
      <div><strong style="display:block;font-size:11px;color:#666;margin-bottom:6px">EQUIPMENT ON-SITE</strong><span style="font-size:18px;font-weight:600">${r.e} Units</span></div>
    </div>
    <div style="margin-bottom:30px">
      <h3 style="border-bottom:1px solid #ddd;padding-bottom:12px;color:#007AFF;font-size:14px;letter-spacing:1px">PROGRESS & WORKFLOW NARRATIVE</h3>
      <p style="line-height:1.7;font-size:15px;color:#222;margin-top:14px">${r.p}</p>
    </div>
    <div style="margin-bottom:30px">
      <h3 style="border-bottom:1px solid #ddd;padding-bottom:12px;color:#FF9500;font-size:14px;letter-spacing:1px">MATERIAL DELIVERIES LOG</h3>
      <p style="line-height:1.7;font-size:15px;color:#222;margin-top:14px">${r.v.join(', ')}</p>
    </div>
    <div>
      <h3 style="border-bottom:1px solid #ddd;padding-bottom:12px;color:#34C759;font-size:14px;letter-spacing:1px">SAFETY OBSERVATIONS & INCIDENTS</h3>
      <p style="line-height:1.7;font-size:15px;color:#222;margin-top:14px">${r.n}</p>
    </div>
    <div style="margin-top:100px;display:flex;justify-content:space-between;border-top:1px solid #ccc;padding-top:20px;font-size:13px;color:#555">
      <div>Generated automatically by ConstructAI PH</div>
      <div>Project Manager: __________________________</div>
    </div>
  `;
  document.body.appendChild(el);
  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: `Site_Report_${r.d.replace(/,/g,'').replace(/ /g,'_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  await html2pdf().set(opt).from(el).save();
  document.body.removeChild(el);
}

let sCtx, sDraw=false;
function initSigPad(){
  const c=document.getElementById('sig-canvas');
  if(!c) return;
  const rect=c.getBoundingClientRect();
  c.width=rect.width; c.height=rect.height;
  sCtx=c.getContext('2d');
  sCtx.strokeStyle=A.theme==='light'?'#000':'#fff';
  sCtx.lineWidth=2.5; sCtx.lineCap='round';
  const getP=(e)=>({x:(e.touches?e.touches[0].clientX:e.clientX)-c.getBoundingClientRect().left,y:(e.touches?e.touches[0].clientY:e.clientY)-c.getBoundingClientRect().top});
  const start=(e)=>{sDraw=true;const p=getP(e);sCtx.beginPath();sCtx.moveTo(p.x,p.y);e.preventDefault();};
  const move=(e)=>{if(!sDraw)return;const p=getP(e);sCtx.lineTo(p.x,p.y);sCtx.stroke();e.preventDefault();};
  const end=()=>sDraw=false;
  c.addEventListener('mousedown',start);c.addEventListener('mousemove',move);window.addEventListener('mouseup',end);
  c.addEventListener('touchstart',start,{passive:false});c.addEventListener('touchmove',move,{passive:false});window.addEventListener('touchend',end);
}
function clearSig(){const c=document.getElementById('sig-canvas');if(c&&sCtx)sCtx.clearRect(0,0,c.width,c.height);}
function saveSig(){ss({showSigModal:false,sigSaved:true});setTimeout(()=>alert('Document digitally signed sustainably! Agreement is now legally binding.'),50);}

initApp();

