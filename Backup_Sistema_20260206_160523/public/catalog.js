// Lightweight non-JSX replacement for catalog rendering.
// The previous file used JSX which the browser can't parse without a build step.
// To avoid that issue, expose a minimal renderVitrineReact that delegates to
// the DOM fallback if React/ReactDOM/JSX aren't available.

function renderVitrineReact(motorcycles){
  try{
    if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined' && React.createElement){
      const e = React.createElement;
      function Card(m){
        return e('div',{className:'service-card moto-card', key:m.id},
          e('div',{className:'thumb'}, e('img',{src: m.thumb || m.image || `/images/thumb-${m.id}.jpg`, 'data-fallback': m.image || `/images/${m.id}.jpg`, alt:m.name, onError:function(evt){
            try{
              if (!evt.target._triedFallback){ evt.target._triedFallback = true; evt.target.src = evt.target.dataset.fallback || '/images/moto-1.jpg'; return; }
              evt.target.closest('.thumb').classList.add('no-image'); evt.target.style.display = 'none';
            }catch(e){}
          }})),
          e('div',{className:'service-info'},
            e('strong',null,`${m.name} (${m.year})`),
            e('div',{className:'meta'}, (m.displacement ? `Cilindrada: ${m.displacement} cc` : '') + (m.mileage_display ? ` • ${m.mileage_display}` : '')),
            e('div',{className:'moto-desc'}, m.desc)
          ),
          e('div',{className:'service-actions'},
            e('button',{className:'view-moto', 'data-id':m.id, onClick:()=>{ const ev = new Event('click',{bubbles:true}); const btn = document.querySelector(`button.view-moto[data-id="${m.id}"]`); /* no-op*/ }}, 'Ver detalhes'),
            e('button',{className:'select-service','data-id':m.id, onClick:()=>{ const ev = new Event('click',{bubbles:true}); }}, 'Tenho interesse')
          )
        );
      }
      const rootEl = document.getElementById('services');
      rootEl.innerHTML = '<div id="react-root"></div>';
      const root = ReactDOM.createRoot(document.getElementById('react-root'));
      root.render(e('div', {className:'services-list-flat'}, motorcycles.map(m=>Card(m))));
      return;
    }
  }catch(e){
    console.debug('React rendering skipped:', e);
  }
  if (typeof window.renderVitrineFallback === 'function'){
    window.renderVitrineFallback(motorcycles);
    return;
  }
  const container = document.getElementById('services');
  container.innerHTML = '';
  const listWrap = document.createElement('div'); listWrap.className = 'services-list-flat';
  motorcycles.forEach(m=>{
    const card = document.createElement('div'); card.className = 'service-card moto-card';
    const thumb = document.createElement('div'); thumb.className = 'thumb';
    const img = document.createElement('img'); img.src = m.thumb || m.image || `/images/thumb-${m.id}.jpg`; img.alt = m.name; img.dataset.fallback = m.image || `/images/${m.id}.jpg`;
    img.onerror = function(){ try{ if (!this._triedFallback){ this._triedFallback = true; this.src = this.dataset.fallback; return; } this.closest('.thumb').classList.add('no-image'); this.style.display='none'; }catch(e){} };
    thumb.appendChild(img);
    card.appendChild(thumb);
    const info = document.createElement('div'); info.className = 'service-info';
    const strong = document.createElement('strong'); strong.textContent = `${m.name} (${m.year})`;
    const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = (m.displacement ? `Cilindrada: ${m.displacement} cc` : '') + (m.mileage_display ? ` • ${m.mileage_display}` : '');
    const desc = document.createElement('div'); desc.className='moto-desc'; desc.textContent = m.desc || '';
    info.appendChild(strong); info.appendChild(meta); info.appendChild(desc);
    card.appendChild(info);
    const actions = document.createElement('div'); actions.className='service-actions';
    const vbtn = document.createElement('button'); vbtn.className='view-moto'; vbtn.dataset.id = m.id; vbtn.textContent='Ver detalhes';
    const sbtn = document.createElement('button'); sbtn.className='select-service'; sbtn.dataset.id = m.id; sbtn.textContent='Tenho interesse';
    actions.appendChild(vbtn); actions.appendChild(sbtn); card.appendChild(actions);
    listWrap.appendChild(card);
  });
  container.appendChild(listWrap);
}
