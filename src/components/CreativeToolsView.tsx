import React, { useState } from 'react';
import { 
  Wrench, 
  Sparkles, 
  Copy, 
  Check, 
  Zap, 
  MessageSquare, 
  Camera, 
  Mic, 
  Share2, 
  Flame,
  ArrowRight
} from 'lucide-react';
import { UserMode } from '../types';

interface CreativeToolsViewProps {
  userMode: UserMode;
  showToast: (msg: string) => void;
  onSendDraftToChat: (draft: string) => void;
}

export const CreativeToolsView: React.FC<CreativeToolsViewProps> = ({
  userMode,
  showToast,
  onSendDraftToChat,
}) => {
  const [activeTool, setActiveTool] = useState<'hook' | 'caption' | 'polish' | 'style'>('hook');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Hook tool states
  const [hookTopic, setHookTopic] = useState('Kopi gula aren lokal');
  const [hookResults, setHookResults] = useState<{ type: string; hook: string }[]>([
    { type: 'Keresahan / Rasa Capek', hook: 'Capek mikir di siang hari? Ini rahasia barista favoritmu biar pikiran langsung plong.' },
    { type: 'Rasa Penasaran', hook: 'Banyak orang ngira kopi ini manis biasa, sampai mereka nyobain tegukan pertama...' },
    { type: 'Mitos vs Fakta', hook: 'Kata siapa minum kopi susu pasti bikin maag? Ini bedanya kalau pakai biji kopi sangrai tepat.' },
    { type: 'Tantangan 3 Detik', hook: 'Jangan skip dulu kalau kamu belum pernah nemu racikan kopi yang senyaman ini.' },
    { type: 'Cerita Pengalaman', hook: 'Dari modal 20 ribu, ini minuman yang nemenin aku lembur tiap malam.' }
  ]);

  // Caption tool states
  const [captionTopic, setCaptionTopic] = useState('Peluncuran menu kopi baru');
  const [captionResult, setCaptionResult] = useState(
    `Kadang yang kita butuhin di tengah hari yang sibuk bukan sekadar kafein, tapi satu momen tenang untuk diri sendiri. 🌿☕\n\nKenalin racikan terbaru kami, dibuat dari 100% biji kopi lokal dan manisnya gula aren murni. Lembut di lidah, nyaman di lambung.\n\nKalian biasanya tim ngopi pagi atau ngopi sore nih? Cerita di bawah ya!\n\n#KopiLokal #CeritaKopi #TemanKreator #NgopiSantai`
  );

  // Script polisher state
  const [rawText, setRawText] = useState('Produk ini memiliki kandungan herbal yang sangat bermanfaat untuk kesehatan kulit anda.');
  const [polishedText, setPolishedText] = useState('Kulit kamu sering kusam sehabis panas-panasan? Coba deh bahan alami ini, hasilnya kerasa segar banget dari hari pertama!');

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Teks disalin!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateHooks = () => {
    if (!hookTopic.trim()) return;
    setHookResults([
      { type: 'Keresahan Nyata', hook: `Sering ngerasa stuck pas mau ${hookTopic}? Simpan rahasia ini dulu!` },
      { type: 'Rasa Penasaran', hook: `Kenapa banyak orang gagal di ${hookTopic}? Jawabannya ada di 1 kesalahan kecil ini.` },
      { type: 'Sudut Pandang Unik', hook: `Kalau kamu masih pakai cara lama buat ${hookTopic}, kamu buang waktu 2 jam tiap hari.` },
      { type: 'Hasil Nyata', hook: `Cuma modal 5 menit, ini cara tercepat buat ${hookTopic} tanpa ribet.` },
      { type: 'Sentuhan Emosi', hook: `Hal yang paling saya syukuri saat pertama kali nyoba ${hookTopic} adalah...` }
    ]);
    showToast('Variasi hook baru berhasil diracik!');
  };

  const handlePolishText = () => {
    if (!rawText.trim()) return;
    setPolishedText(
      `Pernah ngerasa gini nggak? ${rawText.replace(/anda/gi, 'kamu')}. Nah, solusinya ternyata sesimpel ini lho!`
    );
    showToast('Naskah diubah menjadi bahasa tutur alami!');
  };

  const stylePresets = [
    {
      title: 'Taman Asri & Estetik (Hejo Signature)',
      mood: 'Warm sunlight, natural oak wood, green leaves, cozy organic aesthetic, soft depth of field.',
      audioTone: 'Tenang, santai, musik akustik lo-fi petikan gitar lembut.',
    },
    {
      title: 'Studio Bersih & Minimalis',
      mood: 'Clean off-white background, soft shadow, bright diffused lighting, modern product showcase.',
      audioTone: 'Jelas, percaya diri, ketukan beat modern tempo sedang.',
    },
    {
      title: 'Cerita Sinematik & Hangat',
      mood: 'Golden hour backlight, rich earth tones, subtle cinematic film grain, handheld camera motion.',
      audioTone: 'Hangat, penuh rasa syukur, suara piano lembut mengalir.',
    },
    {
      title: 'Ceria & Penuh Energi (Viral Pop)',
      mood: 'Vibrant pop colors, high key contrast, dynamic framing, fast punchy cuts.',
      audioTone: 'Antusias, suara tawa ringan, ketukan up-beat ceria.',
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Wrench className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Kotak Alat Kreatif (Tools)
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Alat-alat praktis untuk mempertajam hook, meracik caption, dan memoles bahasa naskah.
          </p>
        </div>
      </div>

      {/* Tool Selector Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto p-1 bg-stone-100 rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setActiveTool('hook')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTool === 'hook'
              ? 'bg-white text-emerald-800 shadow-sm font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Hook Magnet (3 Detik Pertama)</span>
        </button>

        <button
          onClick={() => setActiveTool('caption')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTool === 'caption'
              ? 'bg-white text-emerald-800 shadow-sm font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>Caption & Call to Action</span>
        </button>

        <button
          onClick={() => setActiveTool('polish')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTool === 'polish'
              ? 'bg-white text-emerald-800 shadow-sm font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Mic className="w-4 h-4 text-teal-600" />
          <span>Pemoles Bahasa Tutur</span>
        </button>

        <button
          onClick={() => setActiveTool('style')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTool === 'style'
              ? 'bg-white text-emerald-800 shadow-sm font-bold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Camera className="w-4 h-4 text-indigo-600" />
          <span>Style DNA & Suasana Visual</span>
        </button>
      </div>

      {/* 1. Hook Magnet Tool */}
      {activeTool === 'hook' && (
        <div className="space-y-5">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-stone-900 text-sm">
              Generator 5 Pola Hook Pembuka Video
            </h3>
            <p className="text-xs text-stone-500">
              3 detik pertama menentukan apakah penonton akan berhenti scroll atau melewatinya.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={hookTopic}
                onChange={(e) => setHookTopic(e.target.value)}
                placeholder="Masukkan topik atau produkmu (misal: 'Kopi gula aren', 'Tips hemat waktu')..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-emerald-600"
              />
              <button
                onClick={handleGenerateHooks}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl whitespace-nowrap transition-colors"
              >
                Buatkan 5 Hook
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {hookResults.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-stone-200/90 hover:border-emerald-400 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded">
                    {item.type}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-stone-900 italic pt-1">
                    "{item.hook}"
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(`hook-${idx}`, item.hook)}
                    className="p-1.5 text-stone-400 hover:text-emerald-700 rounded transition-colors"
                    title="Salin Hook"
                  >
                    {copiedKey === `hook-${idx}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => onSendDraftToChat(`Hejo, tolong kembangkan video dari hook ini: "${item.hook}"`)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 bg-emerald-50 rounded-lg"
                  >
                    Lanjut Buat Video
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Caption Tool */}
      {activeTool === 'caption' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">
              Generator Caption & Call to Action (CTA) Ramah
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Caption yang enak dibaca, mengundang komentar alami, dan tidak terasa memaksa.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={captionTopic}
              onChange={(e) => setCaptionTopic(e.target.value)}
              placeholder="Topik postingan..."
              className="w-full text-xs sm:text-sm px-3.5 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
            <button
              onClick={() => {
                setCaptionResult(
                  `Kadang karya terbaik lahir bukan dari rencana yang sempurna, tapi dari keberanian untuk mulai melangkah hari ini. 🌿✨\n\nTentang ${captionTopic}, apa kendala terbesar yang sedang kamu hadapi sekarang? Cerita di kolom komentar ya, kita cari solusinya bareng-bareng!\n\n#KaryaKreator #TamanKreator #HEJOAI #InspirasiHariIni`
                );
                showToast('Caption baru siap digunakan!');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg whitespace-nowrap"
            >
              Buatkan Caption
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={8}
              value={captionResult}
              onChange={(e) => setCaptionResult(e.target.value)}
              className="w-full text-xs sm:text-sm p-3.5 bg-stone-50 border border-stone-200 rounded-xl leading-relaxed focus:outline-none focus:border-emerald-600 font-sans"
            />
            <button
              onClick={() => handleCopy('caption-full', captionResult)}
              className="absolute top-3 right-3 flex items-center gap-1 text-xs bg-white border border-stone-200 px-2.5 py-1 rounded-lg text-stone-600 hover:text-emerald-700 shadow-sm"
            >
              {copiedKey === 'caption-full' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'caption-full' ? 'Tersalin' : 'Salin Caption'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Script Polisher Tool */}
      {activeTool === 'polish' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">
              Pemoles Bahasa Tutur (Script Polisher)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Ubah tulisan kaku atau formal menjadi bahasa bicara santai yang enak diucapkan di depan kamera.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Teks Asli (Terasa kaku / buku):
              </label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Tuliskan naskah atau penjelasan yang terasa kaku..."
                className="w-full text-xs sm:text-sm p-3 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 leading-relaxed resize-none"
              />
              <button
                onClick={handlePolishText}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Poles Menjadi Bahasa Bicara
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-emerald-800">
                  Hasil Bahasa Tutur Santai:
                </label>
                <button
                  onClick={() => handleCopy('polished', polishedText)}
                  className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
                >
                  {copiedKey === 'polished' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Salin</span>
                </button>
              </div>
              <textarea
                rows={5}
                value={polishedText}
                onChange={(e) => setPolishedText(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-600 leading-relaxed font-medium text-stone-800 resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Style DNA */}
      {activeTool === 'style' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-stone-900 text-sm">
              Katalog Style DNA (Preset Suasana & Visual)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Gunakan preset ini sebagai panduan prompt visual atau arahan artistik video.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stylePresets.map((preset, idx) => (
              <div
                key={idx}
                className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 text-sm text-emerald-900">
                    {preset.title}
                  </h4>
                  <button
                    onClick={() => handleCopy(`style-${idx}`, `${preset.mood}\nAudio Tone: ${preset.audioTone}`)}
                    className="p-1 text-stone-400 hover:text-emerald-700"
                    title="Salin Arahan Gaya"
                  >
                    {copiedKey === `style-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="text-xs space-y-2">
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                    <span className="font-semibold text-stone-700 block mb-0.5">Mood Visual:</span>
                    <span className="text-stone-600 font-mono text-[11px]">{preset.mood}</span>
                  </div>

                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                    <span className="font-semibold text-stone-700 block mb-0.5">Karakter Audio:</span>
                    <span className="text-stone-600">{preset.audioTone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
