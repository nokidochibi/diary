/**
 * Components.js
 * アプリの見た目（各画面のパーツ）をまとめたファイルです。
 * window.名前 = ... とすることで、別のファイル（index.html）から
 * 呼び出せるようにしています。
 */

// --- 便利ツール（共通で使う機能） ---
window.useSwipe = (onSwipeLeft, onSwipeRight) => {
  const touchStartX = React.useRef(null);
  const touchStartY = React.useRef(null);
  const touchTime = React.useRef(null);

  const onTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchTime.current = Date.now();
  };

  const onTouchEnd = (e) => {
    if (!touchStartX.current || !touchStartY.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const distanceX = touchStartX.current - touchEndX;
    const distanceY = touchStartY.current - touchEndY;
    const timeElapsed = Date.now() - touchTime.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (timeElapsed > 300) return;
    if (Math.abs(distanceY) > Math.abs(distanceX)) return;
    if (distanceX > 50 && onSwipeLeft) onSwipeLeft();
    else if (distanceX < -50 && onSwipeRight) onSwipeRight();
  };
  return { onTouchStart, onTouchEnd };
};

window.formatImageUrl = (url) => {
  if (!url) return '';
  if (url.includes('drive.google.com/uc')) {
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
    }
  }
  return url;
};

window.splitTags = (str) => {
  if (!str) return [];
  return str.split(/[,、]+/).map(s => s.trim()).filter(Boolean);
};

window.getDayOfWeek = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
};

window.addDays = (dateStr, days) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

window.extractTweetUrls = (text) => {
  if (!text) return [];
  const regex = /https?:\/\/(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+/g;
  return Array.from(new Set(text.match(regex) || []));
};

window.extractXUsername = (input) => {
  if (!input) return null;
  let str = input.trim();
  const urlMatch = str.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
  if (urlMatch && urlMatch[1]) return urlMatch[1];
  if (str.startsWith('@')) return str.substring(1);
  return str;
};

// --- 画像圧縮 ---
window.compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; 
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// --- 小さな部品 ---
window.TagList = ({ places, people, onOpenProfile, peopleProfiles = {} }) => {
  if (!places?.length && !people?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {places && places.map((place, i) => (
        <button key={`p-${i}`} onClick={(e) => { e.stopPropagation(); onOpenProfile && onOpenProfile({ type: 'place', name: place }); }} className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-md border border-green-100 hover:bg-green-100 active:scale-95 transition-transform shadow-sm">
          <i className="fas fa-map-marker-alt mr-1 opacity-70"></i> {place}
        </button>
      ))}
      {people && people.map((person, i) => {
        const xUsername = peopleProfiles[person]?.xUsername;
        return (
          <button key={`w-${i}`} onClick={(e) => { e.stopPropagation(); onOpenProfile && onOpenProfile({ type: 'person', name: person }); }} className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold rounded-md border border-orange-100 hover:bg-orange-100 active:scale-95 transition-transform shadow-sm">
            {xUsername ? (
              <img src={`https://unavatar.io/twitter/${xUsername}`} className="w-3.5 h-3.5 rounded-full mr-1 object-cover border border-orange-200" onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='inline-block';}}/>
            ) : null}
            <i className="fas fa-users mr-1 opacity-70" style={{ display: xUsername ? 'none' : 'inline-block' }}></i> 
            {person}
          </button>
        );
      })}
    </div>
  );
};

window.TweetEmbed = ({ url }) => {
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    const loadTwitterWidget = () => {
      if (window.twttr && containerRef.current) {
        window.twttr.widgets.load(containerRef.current);
      }
    };
    if (!window.twttr) {
      const script = document.createElement('script');
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.onload = loadTwitterWidget;
      document.body.appendChild(script);
    } else { loadTwitterWidget(); }
  }, [url]);
  const embedUrl = url.replace('x.com', 'twitter.com');
  return (
    <div ref={containerRef} className="w-full flex justify-center my-3 min-h-[100px] bg-gray-50 rounded-xl items-center text-gray-400 text-xs overflow-hidden">
      <blockquote className="twitter-tweet" data-dnt="true" data-theme="light">
        <a href={embedUrl}>Loading Tweet...</a>
      </blockquote>
    </div>
  );
};

// --- プロフィール画面 ---
window.ProfileModal = ({ profile, entries, onClose, onOpenProfile, onSelectDate, peopleProfiles, updatePersonProfile }) => {
  const { useState, useMemo, useEffect } = React;
  if (!profile) return null;
  const { type, name } = profile;
  const isPerson = type === 'person';
  const personProfile = isPerson ? (peopleProfiles[name] || {}) : null;
  const xUsername = personProfile?.xUsername;
  const [editX, setEditX] = useState(false);
  const [xInput, setXInput] = useState(xUsername || '');
  const [isSavingX, setIsSavingX] = useState(false);
  useEffect(() => { setXInput(xUsername || ''); }, [xUsername]);
  const handleSaveX = async () => {
    setIsSavingX(true);
    const username = window.extractXUsername(xInput);
    await updatePersonProfile(name, { xUsername: username || null });
    setIsSavingX(false);
    setEditX(false);
  };
  const colorClass = isPerson ? 'from-orange-400 to-orange-500' : 'from-green-400 to-green-500';
  const textClass = isPerson ? 'text-orange-600' : 'text-green-600';
  const icon = isPerson ? 'fa-user' : 'fa-map-marker-alt';
  const relatedEntries = useMemo(() => {
    return entries.filter(e => {
      if (type === 'person') return window.splitTags(e.withWhom).includes(name);
      if (type === 'place') return window.splitTags(e.where).includes(name);
      return false;
    }).sort((a, b) => new Date(b.when) - new Date(a.when));
  }, [entries, type, name]);
  const stats = useMemo(() => {
    if (relatedEntries.length === 0) return null;
    const firstDate = relatedEntries[relatedEntries.length - 1].when;
    const daysCount = relatedEntries.length;
    const relatedMap = {};
    relatedEntries.forEach(e => {
      const tags = type === 'person' ? window.splitTags(e.where) : window.splitTags(e.withWhom);
      tags.forEach(t => { relatedMap[t] = (relatedMap[t] || 0) + 1; });
    });
    const topRelated = Object.entries(relatedMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { firstDate, daysCount, topRelated };
  }, [relatedEntries, type]);
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-gray-50 w-full h-[100dvh] max-w-lg sm:h-[90vh] sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className={`p-6 pb-5 bg-gradient-to-br ${colorClass} text-white relative`}>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center transition-colors"><i className="fas fa-times"></i></button>
          <div className="flex items-start gap-4 mt-2">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl backdrop-blur-sm border border-white/30 shadow-inner overflow-hidden flex-shrink-0">
              {isPerson && xUsername ? <img src={`https://unavatar.io/twitter/${xUsername}`} className="w-full h-full object-cover" /> : <i className={`fas ${icon}`}></i>}
            </div>
            <div className="flex-1">
              <p className="text-xs opacity-90 font-medium mb-0.5 tracking-wider uppercase">{isPerson ? 'Profile' : 'Location'}</p>
              <h2 className="text-2xl font-bold leading-tight">{name}</h2>
              {isPerson && (
                <div className="mt-2">
                  {editX ? (
                    <div className="flex gap-1 items-center bg-white/10 p-1 rounded-lg backdrop-blur-md">
                      <input type="text" value={xInput} onChange={e=>setXInput(e.target.value)} placeholder="XのURL or @ID" className="text-gray-800 text-xs p-1.5 rounded-md flex-1 outline-none border-none" disabled={isSavingX}/>
                      <button onClick={handleSaveX} disabled={isSavingX} className={`bg-white text-orange-500 px-3 py-1.5 rounded-md text-xs font-bold active:scale-95`}>{isSavingX ? '保存中...' : '保存'}</button>
                    </div>
                  ) : (
                    xUsername ? <div className="inline-flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg cursor-pointer backdrop-blur-sm transition-colors border border-white/20" onClick={()=>setEditX(true)}><i className="fab fa-twitter"></i> @{xUsername} <i className="fas fa-pen ml-1 text-[10px] opacity-70"></i></div>
                    : <button onClick={()=>setEditX(true)} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors border border-white/20"><i className="fab fa-twitter mr-1"></i> Xアカウントを紐付け</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-10">
          {stats ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center"><p className="text-[10px] text-gray-400 font-bold mb-1">思い出の日数</p><p className={`text-3xl font-bold ${textClass}`}>{stats.daysCount} <span className="text-sm text-gray-400 font-medium ml-1">日</span></p></div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col justify-center"><p className="text-[10px] text-gray-400 font-bold mb-1">はじめての記録</p><p className="text-lg font-bold text-gray-700">{stats.firstDate.replace(/-/g, '/')}</p></div>
              </div>
              {stats.topRelated.length > 0 && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider"><i className={`fas ${isPerson ? 'fa-map-marker-alt' : 'fa-users'} mr-2`}></i>よく一緒に{isPerson ? '行くお店' : 'いる人'}</h3>
                  <div className="flex flex-wrap gap-2">{stats.topRelated.map(([relName, count], idx) => (<button key={idx} onClick={() => onOpenProfile({ type: isPerson ? 'place' : 'person', name: relName })} className={`px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 flex items-center gap-1 active:scale-95 transition-transform`}><span>{relName}</span><span className="opacity-40 font-normal ml-1">{count}回</span></button>))}</div>
                </div>
              )}
              <div><h3 className="text-xs font-bold text-gray-500 mb-3 ml-1 uppercase tracking-wider"><i className="fas fa-history mr-2"></i>History</h3>
                <div className="space-y-4">{relatedEntries.map((entry, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100"><div className="flex justify-between items-center mb-2"><div className="flex items-center gap-2"><span className="text-sm font-bold text-blue-600">{entry.when.replace(/-/g, '/')} <span className="text-xs">({window.getDayOfWeek(entry.when)})</span></span><button onClick={() => { onSelectDate(entry.when); onClose(); }} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors active:scale-95"><i className="fas fa-pen mr-1"></i>編集</button></div></div>
                    {entry.images && entry.images.length > 0 && (<div className="flex gap-1 w-full mb-3">{entry.images.slice(0, 4).map((img, i) => (<div key={`modal-img-${idx}-${i}`} className="flex-1 aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm"><img src={window.formatImageUrl(img)} className="w-full h-full object-cover" /></div>))}</div>)}
                    {entry.what && <p className="text-gray-700 text-[13px] whitespace-pre-wrap leading-relaxed mb-3">{entry.what}</p>}<window.TagList places={window.splitTags(entry.where).filter(p => !(!isPerson && p === name))} people={window.splitTags(entry.withWhom).filter(p => !(isPerson && p === name))} onOpenProfile={onOpenProfile} peopleProfiles={peopleProfiles} />
                  </div>))}
                </div>
              </div>
            </>
          ) : <div className="text-center py-12 text-gray-400">データがありません</div>}
        </div>
      </div>
    </div>
  );
};

// --- タブ：入力画面 ---
window.HomeTab = ({ viewingDateStr, setViewingDateStr, todayStr, entries, onSave, isGasLinked, onOpenProfile, peopleProfiles }) => {
  const { useState, useEffect, useRef, useMemo } = React;
  const [what, setWhat] = useState('');
  const [where, setWhere] = useState('');
  const [withWhom, setWithWhom] = useState('');
  const [images, setImages] = useState([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [slideEffect, setSlideEffect] = useState('animate-fade-in');
  const [lastLoadedDate, setLastLoadedDate] = useState(null);

  useEffect(() => {
    const entry = entries.find(e => e.when === viewingDateStr);
    if (viewingDateStr !== lastLoadedDate || (entry && lastLoadedDate === null)) {
      if (entry) { setWhat(entry.what || ''); setWhere(entry.where || ''); setWithWhom(entry.withWhom || ''); setImages(entry.images || []); }
      else { setWhat(''); setWhere(''); setWithWhom(''); setImages([]); }
      setLastLoadedDate(viewingDateStr);
    }
  }, [viewingDateStr, entries, lastLoadedDate]);

  const forceSave = () => {
    const entry = entries.find(e => e.when === viewingDateStr);
    const hasContent = what || where || withWhom || images.length > 0;
    if (hasContent) onSave({ when: viewingDateStr, what, where, withWhom, images });
  };

  const handleNextDay = () => { forceSave(); setSlideEffect('animate-slide-left'); setViewingDateStr(window.addDays(viewingDateStr, 1)); };
  const handlePrevDay = () => { forceSave(); setSlideEffect('animate-slide-right'); setViewingDateStr(window.addDays(viewingDateStr, -1)); };
  const handleToday = () => { forceSave(); setViewingDateStr(todayStr); };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await onSave({ when: viewingDateStr, what, where, withWhom, images });
    setIsSaving(false);
    setSaveMessage(res?.error ? '保存エラー' : '保存しました');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const [year, month, day] = viewingDateStr.split('-');
  const isToday = viewingDateStr === todayStr;
  const tweetUrls = window.extractTweetUrls(what);

  const pastEntries = useMemo(() => {
    const vd = new Date(viewingDateStr);
    const m = vd.getMonth(), d = vd.getDate(), y = vd.getFullYear();
    return entries.filter(e => {
      const de = new Date(e.when);
      return de.getMonth() === m && de.getDate() === d && de.getFullYear() !== y;
    }).sort((a, b) => new Date(b.when) - new Date(a.when));
  }, [entries, viewingDateStr]);

  return (
    <div className="mx-auto h-full flex flex-col relative" {...window.useSwipe(handleNextDay, handlePrevDay)}>
      <div className="sticky top-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between bg-gray-50 rounded-2xl p-1.5 shadow-sm border border-gray-200">
          <button onClick={handlePrevDay} className="p-2 w-10 h-10 flex items-center justify-center text-gray-500 rounded-xl"><i className="fas fa-chevron-left"></i></button>
          <div className="text-center flex flex-col items-center flex-1">
            <h1 className="text-xl font-bold text-gray-800">{year}年{parseInt(month)}月{parseInt(day)}日 ({window.getDayOfWeek(viewingDateStr)})</h1>
            {!isToday && <button onClick={handleToday} className="text-[10px] text-blue-600 font-bold mt-0.5 bg-blue-50 px-2.5 py-0.5 rounded-full">今日へ戻る</button>}
          </div>
          <button onClick={handleNextDay} className="p-2 w-10 h-10 flex items-center justify-center text-gray-500 rounded-xl"><i className="fas fa-chevron-right"></i></button>
        </div>
      </div>
      <div className="max-w-lg mx-auto w-full px-4 pt-4 pb-4">
        <div key={viewingDateStr} className={`${slideEffect} flex flex-col gap-4`}>
          <div className="space-y-3 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={where} onChange={e=>setWhere(e.target.value)} className="w-full p-2 border border-gray-200 rounded-xl text-sm bg-gray-50" placeholder="場所" />
              <input type="text" value={withWhom} onChange={e=>setWithWhom(e.target.value)} className="w-full p-2 border border-gray-200 rounded-xl text-sm bg-gray-50" placeholder="誰と" />
            </div>
            <div className="w-full aspect-square grid grid-cols-2 grid-rows-2 gap-1 bg-gray-50 p-1 rounded-2xl border border-gray-200">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-full h-full bg-white rounded-xl overflow-hidden shadow-sm">
                  <img src={window.formatImageUrl(img)} className="w-full h-full object-cover" />
                  <button onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6"><i className="fas fa-times text-xs"></i></button>
                </div>
              ))}
              {images.length < 4 && (
                <label className="w-full h-full flex flex-col items-center justify-center bg-white border-2 border-dashed border-gray-300 rounded-xl cursor-pointer">
                  <i className="fas fa-camera text-gray-400 text-xl mb-1"></i>
                  <input type="file" accept="image/*" multiple onChange={async (e) => {
                    const files = Array.from(e.target.files).slice(0, 4 - images.length);
                    const processed = await Promise.all(files.map(window.compressImage));
                    setImages([...images, ...processed]);
                  }} className="hidden" />
                </label>
              )}
            </div>
            <textarea value={what} onChange={e=>setWhat(e.target.value)} className="w-full p-3 border border-gray-200 rounded-2xl outline-none resize-none text-base bg-gray-50" rows="4" placeholder="できごと" />
            {tweetUrls.map((url, i) => <window.TweetEmbed key={i} url={url} />)}
            <div className="pt-2 flex items-center justify-between border-t border-gray-50">
              <span className="text-xs font-bold text-green-600">{saveMessage}</span>
              <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold">{isSaving ? '保存中...' : '保存'}</button>
            </div>
          </div>
          <div className="mt-4"><h2 className="text-lg font-bold text-gray-800 mb-4"><i className="fas fa-clock mr-2 text-gray-500"></i>同日の日記</h2>
            {pastEntries.map((e, idx) => (
              <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
                <div className="text-lg font-bold text-blue-600 mb-3 border-b border-gray-50 pb-2">{e.when.split('-')[0]}年 ({window.getDayOfWeek(e.when)})</div>
                {e.images?.length > 0 && <div className="grid grid-cols-2 gap-1 mb-4">{e.images.map((img, i) => <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-100"><img src={window.formatImageUrl(img)} className="w-full h-full object-cover" /></div>)}</div>}
                <p className="text-gray-800 whitespace-pre-wrap text-[15px] mb-4">{e.what}</p>
                <window.TagList places={window.splitTags(e.where)} people={window.splitTags(e.withWhom)} onOpenProfile={onOpenProfile} peopleProfiles={peopleProfiles} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- タブ：カレンダー画面 ---
window.CalendarTab = ({ entries, todayStr, onSelectDate, onOpenProfile, peopleProfiles, resetKey }) => {
  const { useState, useMemo, useEffect, useRef } = React;
  const currentYear = new Date(todayStr).getFullYear();
  const [years, setYears] = useState(() => Array.from({ length: 11 }, (_, i) => currentYear - 10 + i));
  const [selectedDate, setSelectedDate] = useState(null);
  const entryDatesMap = useMemo(() => {
    const map = {}; entries.forEach(e => { if(e.when) map[e.when] = e; }); return map;
  }, [entries]);
  const selectedEntry = entries.find(e => e.when === selectedDate);
  const currentYearRef = useRef(null);
  useEffect(() => { currentYearRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' }); }, []);
  useEffect(() => { if (resetKey > 0) document.getElementById('today-calendar-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [resetKey]);

  return (
    <div className="pb-10 bg-white animate-fade-in relative">
      {years.map(year => (
        <div key={year} ref={year === currentYear ? currentYearRef : null} className="relative">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 p-3 shadow-sm border-b border-gray-100">
            <h1 className="text-2xl font-bold text-red-500 text-center">{year}年</h1>
          </div>
          <div className="grid grid-cols-3 gap-x-2 gap-y-6 p-4 pt-6 pb-12">
            {[...Array(12).keys()].map(m => (
              <window.MonthCalendar key={m} year={year} month={m} todayStr={todayStr} entryDatesMap={entryDatesMap} onDayClick={setSelectedDate} />
            ))}
          </div>
        </div>
      ))}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDate(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden p-6 shadow-xl" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">{selectedDate.replace(/-/g, '/')} ({window.getDayOfWeek(selectedDate)})</h3>
            {selectedEntry ? (
              <div className="max-h-[60vh] overflow-y-auto">
                {selectedEntry.images?.length > 0 && <div className="grid grid-cols-2 gap-1 mb-4">{selectedEntry.images.map((img, i) => <img key={i} src={window.formatImageUrl(img)} className="rounded-xl aspect-square object-cover" />)}</div>}
                <p className="text-sm mb-4">{selectedEntry.what}</p>
                <window.TagList places={window.splitTags(selectedEntry.where)} people={window.splitTags(selectedEntry.withWhom)} onOpenProfile={onOpenProfile} peopleProfiles={peopleProfiles} />
              </div>
            ) : <p className="text-center text-gray-400 py-6">日記なし</p>}
            <button onClick={() => { onSelectDate(selectedDate); setSelectedDate(null); }} className="w-full mt-4 bg-blue-50 text-blue-600 font-bold py-3 rounded-2xl">編集する</button>
          </div>
        </div>
      )}
    </div>
  );
};

window.MonthCalendar = ({ year, month, todayStr, entryDatesMap, onDayClick }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = Array(firstDay).fill(null).concat(Array.from({length: daysInMonth}, (_, i) => i + 1));
  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-bold mb-2 ml-1 text-gray-800">{month + 1}月</h2>
      <div className="grid grid-cols-7 text-center">
        {['日','月','火','水','木','金','土'].map((d, i) => <div key={d} className={`text-[8px] ${i === 0 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>)}
        {days.map((day, index) => {
          if (!day) return <div key={index} />;
          const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isT = ds === todayStr; const hasE = !!entryDatesMap[ds];
          return (
            <button key={ds} id={isT ? 'today-calendar-btn' : undefined} onClick={() => onDayClick(ds)} className="relative flex flex-col items-center justify-center w-full aspect-square text-xs">
              <span className={`w-6 h-6 flex items-center justify-center rounded-full ${isT ? 'bg-red-500 text-white' : 'text-gray-800'}`}>{day}</span>
              {hasE && <div className={`w-1 h-1 rounded-full mt-0.5 ${isT ? 'bg-white' : 'bg-gray-400'}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- タブ：検索画面 ---
window.SearchTab = ({ entries, onOpenProfile, onSelectDate, peopleProfiles, query, setQuery, filterTag, setFilterTag }) => {
  const { useMemo } = React;
  const filtered = useMemo(() => {
    if (filterTag) {
      return entries.filter(e => {
        if (filterTag.type === 'person') return window.splitTags(e.withWhom).includes(filterTag.value);
        return window.splitTags(e.where).includes(filterTag.value);
      });
    }
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return entries.filter(e => (e.what + e.where + e.withWhom).toLowerCase().includes(q));
  }, [query, filterTag, entries]);

  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <div className="sticky top-0 bg-white/95 z-10 pt-4 pb-4 border-b">
        <input type="text" className="w-full p-3 border rounded-2xl bg-gray-50 outline-none" placeholder="検索..." value={query} onChange={e=>{setQuery(e.target.value); setFilterTag(null);}} />
        {filterTag && <div className="mt-2 text-xs font-bold text-blue-600 bg-blue-50 p-2 rounded-xl inline-block">{filterTag.value} <button onClick={()=>setFilterTag(null)}>×</button></div>}
      </div>
      <div className="mt-6 space-y-6">
        {filtered.map((e, idx) => (
          <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <div className="text-sm font-bold text-blue-600 mb-2">{e.when.replace(/-/g, '/')} <button onClick={()=>onSelectDate(e.when)} className="text-[10px] ml-2">編集</button></div>
            <p className="text-sm mb-3">{e.what}</p>
            <window.TagList places={window.splitTags(e.where)} people={window.splitTags(e.withWhom)} onOpenProfile={onOpenProfile} peopleProfiles={peopleProfiles} />
          </div>
        ))}
      </div>
    </div>
  );
};

// --- タブ：インサイト画面 ---
window.InsightsTab = ({ entries, onOpenProfile, peopleProfiles, resetKey }) => {
  const { useState, useMemo, useEffect } = React;
  const [viewMode, setViewMode] = useState('monthly');
  return (
    <div className="p-4 max-w-lg mx-auto animate-fade-in">
      <div className="flex bg-gray-200 p-1 rounded-xl mb-6">
        <button onClick={()=>setViewMode('monthly')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${viewMode==='monthly' ? 'bg-white text-blue-600' : 'text-gray-500'}`}>月間</button>
        <button onClick={()=>setViewMode('all')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${viewMode==='all' ? 'bg-white text-blue-600' : 'text-gray-500'}`}>全期間</button>
      </div>
      {viewMode === 'monthly' ? (
        <window.MonthlyInsights entries={entries} onOpenProfile={onOpenProfile} peopleProfiles={peopleProfiles} />
      ) : (
        <window.AllTimeInsights entries={entries} onOpenProfile={onOpenProfile} peopleProfiles={peopleProfiles} />
      )}
    </div>
  );
};

window.MonthlyInsights = ({ entries, onOpenProfile, peopleProfiles }) => {
  const { useState, useMemo } = React;
  const [date, setDate] = useState(new Date());
  const prefix = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  const items = entries.filter(e => e.when?.startsWith(prefix));
  const stats = useMemo(() => {
    const people = {}; items.forEach(e => window.splitTags(e.withWhom).forEach(p => people[p] = (people[p]||0)+1));
    return Object.entries(people).sort((a,b)=>b[1]-a[1]);
  }, [items]);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-2 rounded-2xl border">
        <button onClick={()=>setDate(new Date(date.setMonth(date.getMonth()-1)))}><i className="fas fa-chevron-left"></i></button>
        <span className="font-bold">{date.getFullYear()}年 {date.getMonth()+1}月</span>
        <button onClick={()=>setDate(new Date(date.setMonth(date.getMonth()+1)))}><i className="fas fa-chevron-right"></i></button>
      </div>
      <div className="bg-white p-5 rounded-3xl border">
        <h3 className="font-bold mb-4">遊んだ人</h3>
        <div className="flex flex-wrap gap-2">
          {stats.map(([n, c]) => <button key={n} onClick={()=>onOpenProfile({type:'person', name:n})} className="bg-orange-50 text-orange-700 px-3 py-1 text-xs font-bold rounded-xl border">{n} ({c})</button>)}
        </div>
      </div>
    </div>
  );
};

window.AllTimeInsights = ({ entries, onOpenProfile, peopleProfiles }) => {
  const stats = useMemo(() => {
    const people = {}; entries.forEach(e => window.splitTags(e.withWhom).forEach(p => people[p] = (people[p]||0)+1));
    return Object.entries(people).sort((a,b)=>b[1]-a[1]).slice(0, 10);
  }, [entries]);
  return (
    <div className="bg-white p-5 rounded-3xl border">
      <h3 className="font-bold mb-4">よく会う人 TOP 10</h3>
      <div className="space-y-2">
        {stats.map(([n, c], i) => <div key={n} onClick={()=>onOpenProfile({type:'person', name:n})} className="flex justify-between p-2 bg-gray-50 rounded-xl"><span>{i+1}. {n}</span> <span>{c}回</span></div>)}
      </div>
    </div>
  );
};
