import React,{useState} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import { ProjectHubAppHeader, ProjectHubProjectCenter } from "../components/HmBrandLockup";
import {
  hmProjectHubPageBackground,
  hmProjectSidebarAsideStyle,
  hmProjectSidebarFooterStyle,
  hmProjectSidebarNavItemStyle,
  hmProjectSidebarNavScrollStyle,
  hmProjectSidebarProjectCardStyle,
} from "../lib/hmBrand";
import {PHASES} from "../lib/stageData";
const OR="#C85F2B";
const fmt=(n)=>"₹"+(n/100000).toFixed(2)+"L";
function Ring({pct,color,size=64}){const r=26,c=32,ci=2*Math.PI*r;return(<svg width={size} height={size} viewBox="0 0 64 64"><circle cx={c} cy={c} r={r} fill="none" stroke="#E2D9CF" strokeWidth="6"/><circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${(pct/100)*ci} ${ci}`} strokeLinecap="round" transform="rotate(-90 32 32)"/><text x="32" y="37" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1C1917">{pct}%</text></svg>);}
function Av({name,sz=28}){const cs=[OR,"#2A6496","#22A36B","#7A4FC0","#D97706"];return(<div style={{width:sz,height:sz,borderRadius:"50%",background:cs[name.charCodeAt(0)%5],color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:sz*.36,fontWeight:700,flexShrink:0}}>{name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>);}
function ScopeItem({name,st}){
  const cfg={done:{bg:"#F0F8EE",border:"#C3DEB8",dot:"#22A36B",lbl:"Completed",icon:"✓"},active:{bg:"#FBE5D4",border:"#F5C6A0",dot:OR,lbl:"In Progress",icon:"⟳"},none:{bg:"#F8F4EF",border:"#E2D9CF",dot:"#D1C9BF",lbl:"Not Started",icon:"○"}};
  const c=cfg[st]||cfg.none;
  return(<div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:9,border:`1.5px solid ${c.border}`,background:c.bg}}>
    <div style={{width:20,height:20,borderRadius:"50%",background:c.dot,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{c.icon}</div>
    <div><div style={{fontSize:13,fontWeight:600}}>{name}</div><div style={{fontSize:10,color:"#7A6E62"}}>{c.lbl}</div></div>
  </div>);
}
export default function StageDashboard(){
  const nav=useNavigate();
  const loc=useLocation();
  const [pi,setPi]=useState(3);
  const [tab,setTab]=useState("Overview");
  const p=PHASES[pi];
  const tabs=["Overview","Tasks","Budget","Documents","Site Feed"];
  const navItems=[{icon:"⊞",l:"Overview",path:"/project"},{icon:"📅",l:"Timeline",path:"#"},{icon:"✓",l:"Tasks",path:"#"},{icon:"₹",l:"Budget",path:"#"},{icon:"📸",l:"Site Feed",path:"#"},{icon:"📄",l:"Documents",path:"/documents"},{icon:"🛒",l:"Marketplace",path:"/marketplace"},{icon:"👥",l:"Team",path:"/team"},{icon:"⚙️",l:"Settings",path:"#"}];
  return(
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:hmProjectHubPageBackground,fontFamily:"'DM Sans',sans-serif",color:"#1C1917"}}>
      <ProjectHubAppHeader
        center={<ProjectHubProjectCenter />}
        trailing={<><span style={{fontSize:18,cursor:"pointer",color:"#7A6E62"}}>🔔</span><Av name="Ankit" sz={30}/><span style={{fontSize:13,fontWeight:600}}>Hi, Ankit ∨</span></>}
      />
      <div style={{display:"flex",flex:1,minWidth:0,minHeight:0}}>
      <aside style={hmProjectSidebarAsideStyle}>
        <div style={{padding:"14px 20px 8px",fontSize:10,fontWeight:700,color:"#9A8F87",letterSpacing:"0.08em"}}>PROJECTS</div>
        <div style={{padding:"0 10px 8px"}}><div style={hmProjectSidebarProjectCardStyle} onClick={()=>nav("/project")}><div style={{fontWeight:700,fontSize:13,color:OR}}>Shanti Nagar Residence</div><div style={{fontSize:11,color:"#9A8F87"}}>Sharma Project</div></div></div>
        <nav style={hmProjectSidebarNavScrollStyle}>{navItems.map(n=>{
          const active=n.path!=="#"&&loc.pathname===n.path;
          return(<div key={n.l} role="button" tabIndex={0} onClick={()=>nav(n.path)} onKeyDown={(e)=>{(e.key==="Enter"||e.key===" ")&&nav(n.path)}} style={hmProjectSidebarNavItemStyle(active)}><span style={{fontSize:15}}>{n.icon}</span>{n.l}</div>);
        })}</nav>
        <div style={hmProjectSidebarFooterStyle}><div style={{fontSize:12,fontWeight:700,marginBottom:4}}>Need Help?</div><div style={{fontSize:11,color:"#7A6E62",marginBottom:10}}>Chat with your project expert</div><button type="button" style={{width:"100%",background:OR,color:"#fff",border:"none",borderRadius:8,padding:"9px 0",fontWeight:700,fontSize:12,cursor:"pointer"}}>💬 Start Chat</button></div>
      </aside>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div className="px-5 md:px-10" style={{flex:1,paddingTop:24,paddingBottom:24,overflowY:"auto",display:"grid",gridTemplateColumns:"1fr 290px",gap:24,alignItems:"start"}}>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <h1 style={{fontSize:24,fontWeight:800,margin:0}}>{p.name}</h1>
                  <span style={{background:p.status==="Completed"?"#F0F8EE":p.status==="Upcoming"?"#F8F4EF":"#FBE5D4",color:p.status==="Completed"?"#22A36B":p.status==="Upcoming"?"#9A8F87":OR,border:`1px solid ${p.color}`,borderRadius:20,padding:"3px 12px",fontSize:12,fontWeight:700}}>● {p.status}</span>
                </div>
                <div style={{fontSize:13,color:"#7A6E62"}}>{p.subtitle}</div>
                <div style={{fontSize:12,color:"#9A8F87",marginTop:4}}>Started {p.started} • Estimated completion {p.end}</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button style={{padding:"8px 16px",border:"1.5px solid #D1C9BF",borderRadius:9,background:"#fff",fontSize:13,cursor:"pointer"}}>⬆ Share</button>
                <button style={{padding:"8px 12px",border:"1.5px solid #D1C9BF",borderRadius:9,background:"#fff",cursor:"pointer"}}>⋮</button>
              </div>
            </div>
            <div style={{background:"#fff",border:"1px solid #E2D9CF",borderRadius:12,padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:4,overflowX:"auto"}}>
              <button style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#7A6E62",flexShrink:0}}>‹</button>
              {PHASES.map((ph,i)=>(
                <div key={ph.id} onClick={()=>{setPi(i);setTab("Overview");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"8px 16px",cursor:"pointer",flexShrink:0,borderRadius:10,background:i===pi?"#FBE5D4":"transparent",transition:"all .15s"}}>
                  {ph.pct===100?<div style={{width:56,height:56,borderRadius:"50%",background:"#22A36B",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:22}}>✓</div>:<Ring pct={ph.pct} color={ph.color} size={56}/>}
                  <div style={{fontSize:11,fontWeight:700,textAlign:"center",color:i===pi?OR:"#1C1917",maxWidth:80,lineHeight:1.3}}>{ph.name}</div>
                  <div style={{fontSize:10,color:ph.status==="Completed"?"#22A36B":ph.status==="Upcoming"?"#9A8F87":OR,fontWeight:600}}>{ph.status}</div>
                </div>
              ))}
              <button style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#7A6E62",flexShrink:0}}>›</button>
            </div>
            <div style={{display:"flex",gap:0,borderBottom:"2px solid #E2D9CF",marginBottom:20}}>
              {tabs.map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"10px 18px",border:"none",background:"none",fontWeight:t===tab?700:500,fontSize:14,color:t===tab?OR:"#5C5147",borderBottom:t===tab?`2px solid ${OR}`:"2px solid transparent",cursor:"pointer",marginBottom:-2}}>{t}</button>)}
            </div>
            {tab==="Overview"&&<>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:20}}>
                {[
                  {label:"Progress",body:<><Ring pct={p.pct} color={p.color} size={70}/><div style={{marginLeft:12}}><div style={{fontSize:13,fontWeight:600}}>{p.pct}% completed</div><div style={{fontSize:12,color:"#22A36B"}}>● On track</div></div></>},
                  {label:"Budget",body:<><div><div style={{fontSize:20,fontWeight:800,color:OR}}>{fmt(p.spent)}</div><div style={{fontSize:11,color:"#7A6E62"}}>of {fmt(p.budget)}</div><div style={{height:5,background:"#E2D9CF",borderRadius:3,marginTop:8,overflow:"hidden"}}><div style={{width:`${Math.round(p.spent/p.budget*100)}%`,height:"100%",background:OR,borderRadius:3}}/></div><div style={{fontSize:10,color:"#9A8F87",marginTop:3}}>{Math.round(p.spent/p.budget*100)}% used</div></div></>},
                  {label:"Time",body:<><div><div style={{fontSize:16,fontWeight:800}}>📅 {p.daysUsed} / {p.totalDays} Days</div><div style={{fontSize:11,color:"#7A6E62",marginTop:4}}>Start: {p.started}</div><div style={{fontSize:11,color:"#7A6E62"}}>End: {p.end}</div></div></>},
                  {label:"Status",body:<><div><div style={{display:"inline-block",background:"#F0F8EE",border:"1px solid #C3DEB8",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:700,color:"#22A36B",marginBottom:8}}>On Track</div><div style={{fontSize:12,color:"#5C5147",lineHeight:1.5}}>{p.statusNote}</div></div></>},
                ].map(c=>(
                  <div key={c.label} style={{background:"#fff",border:"1.5px solid #E2D9CF",borderRadius:12,padding:"16px"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#9A8F87",marginBottom:10,letterSpacing:"0.04em"}}>{c.label.toUpperCase()}</div>
                    <div style={{display:"flex",alignItems:"center"}}>{c.body}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"#fff",border:"1.5px solid #E2D9CF",borderRadius:12,padding:"18px 20px",marginBottom:20}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>Scope of Work</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
                  {p.scope.map(s=><ScopeItem key={s.name} name={s.name} st={s.st}/>)}
                </div>
              </div>
              {p.tasks.length>0&&<div style={{background:"#fff",border:"1.5px solid #E2D9CF",borderRadius:12,padding:"18px 20px"}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>Next Tasks</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr auto auto auto auto auto",gap:"8px 16px",alignItems:"center",fontSize:12,color:"#9A8F87",fontWeight:700,padding:"0 0 8px",borderBottom:"1px solid #F0EBE3",letterSpacing:"0.05em"}}>
                  {["TASK","ASSIGNEE","DUE DATE","PRIORITY","STATUS",""].map(h=><div key={h}>{h}</div>)}
                </div>
                {p.tasks.map((t,i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto auto auto",gap:"8px 16px",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #F5EFE8"}}>
                    <div><div style={{fontWeight:600,fontSize:13}}>{t.name}</div><div style={{fontSize:11,color:"#9A8F87"}}>{t.cat}</div></div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><Av name={t.assignee} sz={26}/><div><div style={{fontSize:12,fontWeight:600}}>{t.assignee}</div><div style={{fontSize:10,color:"#9A8F87"}}>{t.role}</div></div></div>
                    <div><div style={{fontSize:12}}>{t.due}</div><div style={{fontSize:10,color:OR}}>{t.left}</div></div>
                    <span style={{background:"#FEE2E2",color:"#DC2626",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700}}>{t.priority}</span>
                    <span style={{background:t.status==="In Progress"?"#FBE5D4":"#F5EFE8",color:t.status==="In Progress"?OR:"#7A6E62",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700}}>{t.status}</span>
                    <span style={{color:"#9A8F87",cursor:"pointer"}}>›</span>
                  </div>
                ))}
                <button style={{background:"none",border:"none",color:OR,fontWeight:700,fontSize:13,cursor:"pointer",marginTop:12}}>View all tasks →</button>
              </div>}
            </>}
            {tab==="Tasks"&&<div style={{background:"#fff",border:"1.5px solid #E2D9CF",borderRadius:12,padding:"20px"}}><div style={{fontWeight:700,fontSize:15,marginBottom:14}}>All Tasks — {p.name}</div>{p.tasks.length===0?<div style={{color:"#9A8F87",fontSize:14}}>No tasks for this phase yet.</div>:p.tasks.map((t,i)=><div key={i} style={{padding:"12px 0",borderBottom:"1px solid #F5EFE8",display:"flex",alignItems:"center",gap:12}}><Av name={t.assignee} sz={30}/><div style={{flex:1}}><div style={{fontWeight:600}}>{t.name}</div><div style={{fontSize:12,color:"#9A8F87"}}>{t.due} • {t.left}</div></div><span style={{background:"#FBE5D4",color:OR,borderRadius:20,padding:"3px 12px",fontSize:12,fontWeight:700}}>{t.status}</span></div>)}</div>}
            {tab==="Budget"&&<div style={{background:"#fff",border:"1.5px solid #E2D9CF",borderRadius:12,padding:"20px"}}><div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Budget — {p.name}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{[["Allocated",fmt(p.budget)],["Spent",fmt(p.spent)],["Committed","₹5.20 L"],["Remaining",fmt(p.budget-p.spent)]].map(([k,v])=><div key={k} style={{border:"1.5px solid #E2D9CF",borderRadius:10,padding:"14px"}}><div style={{fontSize:11,color:"#9A8F87",fontWeight:700}}>{k.toUpperCase()}</div><div style={{fontSize:22,fontWeight:800,color:OR,marginTop:4}}>{v}</div></div>)}</div><div style={{marginTop:16,height:8,background:"#E2D9CF",borderRadius:4,overflow:"hidden"}}><div style={{width:`${Math.round(p.spent/p.budget*100)}%`,height:"100%",background:`linear-gradient(90deg,#22A36B,${OR})`,borderRadius:4}}/></div><div style={{fontSize:12,color:"#9A8F87",marginTop:6}}>{Math.round(p.spent/p.budget*100)}% of budget used</div></div>}
            {tab==="Documents"&&<div style={{background:"#fff",border:"1.5px solid #E2D9CF",borderRadius:12,padding:"20px"}}><div style={{fontWeight:700,fontSize:15,marginBottom:12}}>Documents — {p.name}</div><div style={{color:"#9A8F87",fontSize:13}}>No documents uploaded yet for this phase.</div><button onClick={()=>nav("/documents")} style={{marginTop:14,padding:"10px 20px",background:OR,color:"#fff",border:"none",borderRadius:9,fontWeight:700,cursor:"pointer"}}>Open documents</button></div>}
            {tab==="Site Feed"&&<div style={{background:"#fff",border:"1.5px solid #E2D9CF",borderRadius:12,padding:"20px"}}><div style={{fontWeight:700,fontSize:15,marginBottom:12}}>Site Feed — {p.name}</div><div style={{borderRadius:10,overflow:"hidden",marginBottom:10,position:"relative"}}><img src={p.siteImg} alt="site" style={{width:"100%",height:240,objectFit:"cover",display:"block"}}/><div style={{position:"absolute",top:10,left:10,background:"#22A36B",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20}}>● Live</div></div><div style={{fontSize:12,color:"#9A8F87",marginBottom:4}}>Today, 10:30 AM</div><div style={{fontSize:14,fontWeight:600}}>{p.siteCaption}</div></div>}
          </div>
          <div>
            <div style={{background:"#fff",border:"1.5px solid #E2D9CF",borderRadius:14,padding:"18px 20px",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><span style={{fontSize:16}}>₹</span><div style={{fontWeight:700,fontSize:15}}>Budget Summary</div></div>
              {[["TOTAL ALLOCATED",fmt(p.budget)],["SPENT TILL DATE",fmt(p.spent)]].map(([k,v])=><div key={k} style={{marginBottom:10}}><div style={{fontSize:10,color:"#9A8F87",fontWeight:700}}>{k}</div><div style={{fontSize:22,fontWeight:800,color:k.includes("SPENT")?OR:"#1C1917"}}>{v}</div></div>)}
              <div style={{height:8,background:"#E2D9CF",borderRadius:4,marginBottom:6,overflow:"hidden"}}><div style={{width:`${Math.round(p.spent/p.budget*100)}%`,height:"100%",background:"#22A36B",borderRadius:4}}/></div>
              <div style={{fontSize:11,color:"#9A8F87",marginBottom:14}}>{Math.round(p.spent/p.budget*100)}% of total budget used</div>
              {[["Committed","₹5.20 L"],["Remaining",fmt(p.budget-p.spent)]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderTop:"1px solid #F5EFE8",fontSize:12}}><span style={{color:"#7A6E62"}}>{k}</span><span style={{fontWeight:700}}>{v}</span></div>)}
              <button style={{width:"100%",background:"none",border:"none",color:OR,fontWeight:700,fontSize:13,cursor:"pointer",marginTop:10,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>View Budget Details →</button>
            </div>
            <div style={{background:"#fff",border:"1.5px solid #E2D9CF",borderRadius:14,padding:"18px 20px",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div style={{fontWeight:700,fontSize:15}}>Latest Site Feed</div><button style={{background:"none",border:"none",color:OR,fontWeight:700,fontSize:12,cursor:"pointer"}}>View All</button></div>
              <div style={{borderRadius:10,overflow:"hidden",position:"relative",marginBottom:8}}><img src={p.siteImg} alt="site" style={{width:"100%",height:150,objectFit:"cover",display:"block"}}/><div style={{position:"absolute",top:8,left:8,background:"#22A36B",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20}}>● Live</div></div>
              <div style={{fontSize:11,color:"#9A8F87",marginBottom:3}}>Today, 10:30 AM</div>
              <div style={{fontSize:13,fontWeight:600}}>{p.siteCaption}</div>
            </div>
            <div style={{background:"#fff",border:"1.5px solid #E2D9CF",borderRadius:14,padding:"18px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><div style={{fontWeight:700,fontSize:15}}>Upcoming Milestones</div><button style={{background:"none",border:"none",color:OR,fontWeight:700,fontSize:12,cursor:"pointer"}}>View All</button></div>
              {p.milestones.map(m=>(
                <div key={m.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #F5EFE8"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:30,height:30,borderRadius:8,background:m.done?"#F0F8EE":"#FBE5D4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{m.done?"✓":m.icon}</div>
                    <span style={{fontSize:13,fontWeight:600,color:m.done?"#9A8F87":"#1C1917",textDecoration:m.done?"line-through":"none"}}>{m.name}</span>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:m.done?"#22A36B":OR}}>{m.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
