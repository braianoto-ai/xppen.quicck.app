import { useState, useRef, useCallback } from 'react';
interface ShortcutButton { id: number; label: string; key: string; modifiers: string[]; }
type Screen = 'connect' | 'keyboard' | 'settings';
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
const DEFAULT_BUTTONS: ShortcutButton[] = [
  { id: 0,  label: 'Knob (clique)', key: 'enter', modifiers: [] },
  { id: 1,  label: 'Desfazer',      key: 'z',     modifiers: ['control'] },
  { id: 2,  label: 'Refazer',       key: 'y',     modifiers: ['control'] },
  { id: 3,  label: 'Pincel',        key: 'b',     modifiers: [] },
  { id: 4,  label: 'Borracha',      key: 'e',     modifiers: [] },
  { id: 5,  label: 'Salvar',        key: 's',     modifiers: ['control'] },
  { id: 6,  label: 'Conta-gotas',   key: 'i',     modifiers: [] },
  { id: 7,  label: 'Nova Camada',   key: 'n',     modifiers: ['control', 'shift'] },
  { id: 8,  label: 'Pan',           key: 'space', modifiers: [] },
  { id: 9,  label: 'Zoom +',        key: '=',     modifiers: ['control'] },
  { id: 10, label: 'Zoom -',        key: '-',     modifiers: ['control'] },
];
const LS_BUTTONS_KEY = 'xppen_ack05_buttons_v2';
const LS_SERVER_KEY  = 'xppen_server_v1';
const TEAL = '#00e5c8';
function loadButtons(): ShortcutButton[] { try { const r = localStorage.getItem(LS_BUTTONS_KEY); if (r) return JSON.parse(r); } catch {} return DEFAULT_BUTTONS; }
function modLabel(mods: string[]) { return mods.map(m => ({control:'Ctrl',shift:'Shift',alt:'Alt',meta:'Cmd'}[m]??m)).join('+'); }
function keyDisplay(key: string) { if(key==='space')return'⎵'; if(key==='enter')return'↵'; return key.toUpperCase(); }
function shortLabel(btn: ShortcutButton) { return (btn.modifiers.length?modLabel(btn.modifiers)+'+':'')+keyDisplay(btn.key); }
function Dial({onCW,onCCW,onPress,dialMode,pressed}:{onCW:()=>void;onCCW:()=>void;onPress:()=>void;dialMode:string;pressed:boolean}) {
  const lastAngleRef=useRef<number|null>(null),accRef=useRef(0),THRESHOLD=14;
  const getAngle=(touch:React.Touch,rect:DOMRect)=>Math.atan2(touch.clientY-rect.top-rect.height/2,touch.clientX-rect.left-rect.width/2)*(180/Math.PI);
  const onTouchStart=(e:React.TouchEvent<HTMLDivElement>)=>{lastAngleRef.current=getAngle(e.touches[0],e.currentTarget.getBoundingClientRect());accRef.current=0;};
  const onTouchMove=(e:React.TouchEvent<HTMLDivElement>)=>{e.preventDefault();if(lastAngleRef.current===null)return;const angle=getAngle(e.touches[0],e.currentTarget.getBoundingClientRect());let d=angle-lastAngleRef.current;if(d>180)d-=360;if(d<-180)d+=360;accRef.current+=d;lastAngleRef.current=angle;while(accRef.current>=THRESHOLD){onCW();accRef.current-=THRESHOLD;}while(accRef.current<=-THRESHOLD){onCCW();accRef.current+=THRESHOLD;}};
  const onTouchEnd=()=>{lastAngleRef.current=null;accRef.current=0;};
  return (<div style={{width:148,height:148,borderRadius:'50%',background:'radial-gradient(circle at 40% 35%, #3a3a3a, #1a1a1a)',boxShadow:`0 0 0 3px #2a2a2a, 0 0 0 5px ${TEAL}55, 0 8px 24px rgba(0,0,0,0.7)`,position:'relative',touchAction:'none',flexShrink:0}} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
    {[52,62,72].map(r=>(<div key={r} style={{position:'absolute',top:'50%',left:'50%',width:r*2,height:r*2,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.04)',transform:'translate(-50%,-50%)',pointerEvents:'none'}}/>))}
    <div onPointerDown={e=>{e.stopPropagation();onPress();}} style={{position:'absolute',top:'50%',left:'50%',width:62,height:62,borderRadius:'50%',background:pressed?`radial-gradient(circle,${TEAL}44,#222)`:'radial-gradient(circle at 40% 35%,#363636,#1e1e1e)',boxShadow:pressed?`0 0 18px ${TEAL}88,0 0 0 2px ${TEAL}`:`inset 0 2px 6px rgba(0,0,0,0.8),0 0 0 1.5px ${TEAL}66`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 0.07s ease',transform:`translate(-50%,-50%) ${pressed?'scale(0.94)':'scale(1)'}`}}>
      <span style={{fontSize:9,color:pressed?TEAL:'#666',fontFamily:'monospace',textAlign:'center',lineHeight:1.3,padding:'0 4px'}}>{dialMode}</span>
    </div>
  </div>);
}
function KeyBtn({btn,pressed,onPress,style}:{btn:ShortcutButton;pressed:boolean;onPress:()=>void;style?:React.CSSProperties}) {
  return (<button onPointerDown={onPress} style={{background:pressed?'linear-gradient(145deg,#3a4a48,#2a3a38)':'linear-gradient(145deg,#3a3d42,#2c2e32)',borderRadius:10,border:`1.5px solid ${pressed?TEAL:'rgba(255,255,255,0.07)'}`,boxShadow:pressed?`0 0 12px ${TEAL}55`:'inset 0 1px 0 rgba(255,255,255,0.06),0 2px 6px rgba(0,0,0,0.5)',transform:pressed?'scale(0.95)':'scale(1)',transition:'all 0.07s ease',touchAction:'manipulation',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,cursor:'pointer',outline:'none',padding:'6px 4px',...style}}>
    <span style={{fontSize:11,fontWeight:600,color:pressed?TEAL:'#c8ccd2',textAlign:'center',lineHeight:1.2,pointerEvents:'none'}}>{btn.label}</span>
    <span style={{fontSize:9,color:pressed?`${TEAL}bb`:'#4a4e55',fontFamily:'monospace',pointerEvents:'none'}}>{shortLabel(btn)}</span>
  </button>);
}
function ACK05({buttons,pressedId,dialMode,onButtonPress,onDialCW,onDialCCW,onDialClick:_}:{buttons:ShortcutButton[];pressedId:number|null;dialMode:string;onButtonPress:(b:ShortcutButton)=>void;onDialCW:()=>void;onDialCCW:()=>void;onDialClick:()=>void}) {
  const get=(id:number)=>buttons.find(b=>b.id===id)??DEFAULT_BUTTONS.find(b=>b.id===id)!;
  const W=78,H=56,GAP=8;
  return (<div style={{background:'linear-gradient(160deg,#3a3d44,#2c2f35 60%,#252830)',borderRadius:22,padding:'20px 22px 20px 20px',display:'flex',flexDirection:'row',alignItems:'center',gap:18,boxShadow:'0 24px 64px rgba(0,0,0,0.85),0 0 0 1px rgba(255,255,255,0.06)',width:'fit-content',margin:'0 auto'}}>
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
      <Dial onCW={onDialCW} onCCW={onDialCCW} onPress={()=>onButtonPress(get(0))} dialMode={dialMode} pressed={pressedId===0}/>
      <div style={{textAlign:'center',lineHeight:1}}><span style={{fontSize:11,fontWeight:700,color:'#666',fontFamily:'serif',letterSpacing:1}}>XP</span><br/><span style={{fontSize:9,color:'#555',fontFamily:'serif',letterSpacing:2}}>pen</span></div>
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:GAP}}>
      <div style={{display:'flex',gap:GAP,alignItems:'stretch'}}>
        {[1,2,3].map(id=>(<KeyBtn key={id} btn={get(id)} pressed={pressedId===id} onPress={()=>onButtonPress(get(id))} style={{width:W,height:H}}/>))}
        <KeyBtn btn={get(7)} pressed={pressedId===7} onPress={()=>onButtonPress(get(7))} style={{width:W,height:H*2+GAP,alignSelf:'flex-start'}}/>
      </div>
      <div style={{display:'flex',gap:GAP}}>
        {[4,5,6].map(id=>(<KeyBtn key={id} btn={get(id)} pressed={pressedId===id} onPress={()=>onButtonPress(get(id))} style={{width:W,height:H}}/>))}
        <div style={{width:W,flexShrink:0}}/>
      </div>
      <div style={{display:'flex',gap:GAP}}>
        <KeyBtn btn={get(8)} pressed={pressedId===8} onPress={()=>onButtonPress(get(8))} style={{width:W,height:H}}/>
        <KeyBtn btn={get(9)} pressed={pressedId===9} onPress={()=>onButtonPress(get(9))} style={{width:W*2+GAP,height:H}}/>
        <KeyBtn btn={get(10)} pressed={pressedId===10} onPress={()=>onButtonPress(get(10))} style={{width:W,height:H}}/>
      </div>
    </div>
  </div>);
}
const DIAL_MODES=['Zoom','Pincel','Desfazer/Ref','Rotacionar'];
function SettingsModal({buttons,dialMode,onClose,onSave}:{buttons:ShortcutButton[];dialMode:string;onClose:()=>void;onSave:(b:ShortcutButton[],d:string)=>void}) {
  const [draft,setDraft]=useState(buttons.map(b=>({...b})));
  const [editId,setEditId]=useState<number|null>(null);
  const [localDM,setLocalDM]=useState(dialMode);
  const editing=draft.find(b=>b.id===editId);
  const upd=(field:keyof ShortcutButton,val:string|string[])=>setDraft(prev=>prev.map(b=>b.id===editId?{...b,[field]:val}:b));
  const knobBtn=draft.find(b=>b.id===0)!;
  return (<div className="fixed inset-0 bg-black/90 z-50 flex items-end sm:items-center justify-center">
    <div className="bg-zinc-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-zinc-700 shadow-2xl overflow-auto max-h-[94vh]">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800"><h2 className="text-white font-bold">Configurar ACK05</h2><button onClick={onClose} className="text-zinc-400 text-2xl w-8 h-8 flex items-center justify-center">✕</button></div>
      <div className="p-4 border-b border-zinc-800"><p className="text-zinc-500 text-xs mb-2 uppercase tracking-wider">Modo do Dial</p><div className="flex gap-2 flex-wrap">{DIAL_MODES.map(m=>(<button key={m} onClick={()=>setLocalDM(m)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${localDM===m?'text-black':'bg-zinc-800 text-zinc-400'}`} style={localDM===m?{background:TEAL}:{}}>{m}</button>))}</div></div>
      <div className="px-4 pt-4"><p className="text-zinc-500 text-xs mb-2 uppercase tracking-wider">Clique do Knob</p><button onClick={()=>setEditId(editId===0?null:0)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${editId===0?'border-teal-500 bg-zinc-800':'border-zinc-700 bg-zinc-800/40'}`}><div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{border:`2px solid ${TEAL}66`}}><span style={{fontSize:10,color:TEAL}}>⬤</span></div><div><div className="text-zinc-300 text-sm font-medium">{knobBtn.label}</div><div className="text-zinc-500 text-xs font-mono">{shortLabel(knobBtn)}</div></div></button></div>
      <div className="p-4"><p className="text-zinc-500 text-xs mb-2 uppercase tracking-wider">Botões K1–K10</p><div className="grid grid-cols-2 gap-2">{draft.filter(b=>b.id>=1&&b.id<=10).map(btn=>(<button key={btn.id} onClick={()=>setEditId(editId===btn.id?null:btn.id)} className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${editId===btn.id?'border-teal-500 bg-zinc-800':'border-zinc-700 bg-zinc-800/40'}`}><span className="text-zinc-600 text-xs font-mono w-5 flex-shrink-0">K{btn.id}</span><div className="min-w-0"><div className="text-white text-sm font-medium truncate">{btn.label}</div><div className="text-zinc-500 text-xs font-mono">{shortLabel(btn)}</div></div></button>))}</div></div>
      {editing&&(<div className="mx-4 mb-4 p-4 bg-zinc-800 rounded-2xl border border-zinc-700 space-y-3"><p className="text-zinc-400 text-sm font-semibold">Editando: {editing.id===0?'Knob':`K${editing.id}`}</p><div><label className="text-zinc-500 text-xs block mb-1">Label</label><input className="w-full bg-zinc-700 text-white rounded-xl px-3 py-2 text-sm border border-zinc-600 outline-none" value={editing.label} onChange={e=>upd('label',e.target.value)}/></div><div><label className="text-zinc-500 text-xs block mb-1">Tecla</label><input className="w-full bg-zinc-700 text-white rounded-xl px-3 py-2 text-sm border border-zinc-600 outline-none font-mono" value={editing.key} onChange={e=>upd('key',e.target.value.toLowerCase())} placeholder="z, space, f5…"/></div><div><label className="text-zinc-500 text-xs block mb-1">Modificadores</label><div className="flex gap-2 flex-wrap">{['control','shift','alt','meta'].map(mod=>(<button key={mod} onClick={()=>{const ms=editing.modifiers.includes(mod)?editing.modifiers.filter(m=>m!==mod):[...editing.modifiers,mod];upd('modifiers',ms);}} className="px-3 py-1 rounded-full text-xs font-medium" style={editing.modifiers.includes(mod)?{background:TEAL,color:'#000'}:{background:'#3f3f3f',color:'#aaa'}}>{modLabel([mod])}</button>))}</div></div></div>)}
      <div className="p-4 border-t border-zinc-800 flex gap-3"><button onClick={()=>{setDraft(DEFAULT_BUTTONS.map(b=>({...b})));setLocalDM('Zoom');}} className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-sm">Restaurar</button><button onClick={()=>onSave(draft,localDM)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{background:TEAL,color:'#000'}}>Salvar</button></div>
    </div>
  </div>);
}
export default function App() {
  const [screen,setScreen]=useState<Screen>('connect');
  const [status,setStatus]=useState<ConnectionStatus>('disconnected');
  const [serverIP,setServerIP]=useState(()=>{try{return JSON.parse(localStorage.getItem(LS_SERVER_KEY)??'{}').ip??'192.168.1.100';}catch{return'192.168.1.100';}});
  const [serverPort,setServerPort]=useState(()=>{try{return JSON.parse(localStorage.getItem(LS_SERVER_KEY)??'{}').port??'9001';}catch{return'9001';}});
  const [buttons,setButtons]=useState<ShortcutButton[]>(loadButtons);
  const [dialMode,setDialMode]=useState('Zoom');
  const [showSettings,setShowSettings]=useState(false);
  const [pressedId,setPressedId]=useState<number|null>(null);
  const [lastAction,setLastAction]=useState('');
  const wsRef=useRef<WebSocket|null>(null);
  const DIAL_MAP:Record<string,{cw:{key:string;modifiers:string[]};ccw:{key:string;modifiers:string[]}}>={'Zoom':{cw:{key:'=',modifiers:['control']},ccw:{key:'-',modifiers:['control']}},'Pincel':{cw:{key:']',modifiers:[]},ccw:{key:'[',modifiers:[]}},'Desfazer/Ref':{cw:{key:'y',modifiers:['control']},ccw:{key:'z',modifiers:['control']}},'Rotacionar':{cw:{key:']',modifiers:['shift']},ccw:{key:'[',modifiers:['shift']}}};
  const send=useCallback((key:string,modifiers:string[])=>{wsRef.current?.send(JSON.stringify({type:'keypress',key,modifiers}));},[]);
  const handleButton=useCallback((btn:ShortcutButton)=>{if(wsRef.current?.readyState!==WebSocket.OPEN)return;send(btn.key,btn.modifiers);setLastAction(`${btn.id===0?'Knob':`K${btn.id}`} — ${btn.label}`);setPressedId(btn.id);setTimeout(()=>setPressedId(null),130);},[send]);
  const handleDial=useCallback((dir:'cw'|'ccw')=>{if(wsRef.current?.readyState!==WebSocket.OPEN)return;const a=DIAL_MAP[dialMode];if(!a)return;const{key,modifiers}=dir==='cw'?a.cw:a.ccw;send(key,modifiers);setLastAction(`Dial ${dir==='cw'?'↻':'↺'} — ${dialMode}`);},[dialMode,send]); // eslint-disable-line
  const handleDialClick=useCallback(()=>{setDialMode(prev=>{const modes=Object.keys(DIAL_MAP);const next=modes[(modes.indexOf(prev)+1)%modes.length];setLastAction(`Dial: ${next}`);return next;});},[]);// eslint-disable-line
  const disconnect=useCallback(()=>{wsRef.current?.close();wsRef.current=null;setStatus('disconnected');setScreen('connect');},[]);
  const connect=useCallback(()=>{setStatus('connecting');localStorage.setItem(LS_SERVER_KEY,JSON.stringify({ip:serverIP,port:serverPort}));const ws=new WebSocket(`ws://${serverIP}:${serverPort}`);ws.onopen=()=>{setStatus('connected');setScreen('keyboard');};ws.onclose=()=>{setStatus('disconnected');setScreen('connect');};ws.onerror=()=>{setStatus('error');ws.close();};wsRef.current=ws;},[serverIP,serverPort]);
  const saveSettings=useCallback((newBtns:ShortcutButton[],newDial:string)=>{setButtons(newBtns);setDialMode(newDial);localStorage.setItem(LS_BUTTONS_KEY,JSON.stringify(newBtns));setShowSettings(false);},[]);
  if(screen==='connect') return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center"><h1 className="text-white text-2xl font-bold">XP-Pen ACK05</h1><p className="text-zinc-500 text-sm">Painel de atalhos para iPad</p></div>
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <p className="text-zinc-400 text-sm font-semibold mb-3">Conectar ao Computador</p>
          <div className="space-y-3">
            <div><label className="text-zinc-600 text-xs block mb-1">IP do Computador</label><input type="text" inputMode="decimal" className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 border border-zinc-700 outline-none font-mono text-sm" value={serverIP} onChange={e=>setServerIP(e.target.value)} placeholder="192.168.1.100"/></div>
            <div><label className="text-zinc-600 text-xs block mb-1">Porta</label><input type="text" inputMode="numeric" className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 border border-zinc-700 outline-none font-mono text-sm" value={serverPort} onChange={e=>setServerPort(e.target.value)}/></div>
          </div>
          {status==='error'&&(<div className="mt-3 p-3 bg-red-900/30 border border-red-800/50 rounded-xl text-red-400 text-sm">Não foi possível conectar.</div>)}
          <button onClick={connect} disabled={status==='connecting'} className="mt-4 w-full py-3 rounded-xl font-semibold disabled:opacity-50 active:scale-95 transition-transform" style={{background:TEAL,color:'#000',touchAction:'manipulation'}}>{status==='connecting'?'Conectando…':'Conectar'}</button>
        </div>
        <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800 text-xs text-zinc-500 space-y-1"><p className="text-zinc-400 font-semibold mb-2">Como usar:</p><p>1. Abra <code className="text-zinc-400">xppen-server</code> no computador</p><p>2. Rode <code className="text-zinc-400">npm install && node index.js</code></p><p>3. iPad e PC na mesma rede Wi-Fi</p></div>
        <p className="text-center text-zinc-700 text-xs">Safari: ⎙ → "Adicionar à Tela de Início"</p>
      </div>
    </div>
  );
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{background:'#1e2128',userSelect:'none'}}>
      {showSettings&&(<SettingsModal buttons={buttons} dialMode={dialMode} onClose={()=>setShowSettings(false)} onSave={saveSettings}/>)}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{background:'rgba(0,0,0,0.3)',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{background:status==='connected'?TEAL:'#ef4444',boxShadow:`0 0 6px ${status==='connected'?TEAL:'#ef4444'}`}}/><span className="text-zinc-500 text-xs font-mono">{serverIP}:{serverPort}</span></div>
        <span className="text-zinc-600 text-xs flex-1 text-center px-2 truncate">{lastAction}</span>
        <div className="flex gap-1.5">
          <button onClick={()=>setShowSettings(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400" style={{background:'rgba(255,255,255,0.06)',touchAction:'manipulation'}}>⚙</button>
          <button onClick={disconnect} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400" style={{background:'rgba(255,255,255,0.06)',touchAction:'manipulation'}}>✕</button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <ACK05 buttons={buttons} pressedId={pressedId} dialMode={dialMode} onButtonPress={handleButton} onDialCW={()=>handleDial('cw')} onDialCCW={()=>handleDial('ccw')} onDialClick={handleDialClick}/>
          <p className="text-xs" style={{color:'#333'}}>Toque no dial para trocar modo • Arraste para girar</p>
        </div>
      </div>
    </div>
  );
}
