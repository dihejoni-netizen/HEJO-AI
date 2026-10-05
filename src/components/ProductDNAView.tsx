import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Sparkles, 
  Edit3, 
  ArrowRight, 
  Layers, 
  Tag, 
  CheckCircle2, 
  Clapperboard,
  Camera
} from 'lucide-react';
import { ProductDNA, ActiveNavTab, UserMode } from '../types';

interface ProductDNAViewProps {
  products: ProductDNA[];
  saveProduct: (prod: Partial<ProductDNA> & { name: string }) => void;
  deleteProduct: (id: string) => void;
  setActiveTab: (tab: ActiveNavTab) => void;
  showToast: (msg: string) => void;
  onPromoteProductInStudio: (prod: ProductDNA) => void;
}

export const ProductDNAView: React.FC<ProductDNAViewProps> = ({
  products,
  saveProduct,
  deleteProduct,
  setActiveTab,
  showToast,
  onPromoteProductInStudio,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [usp, setUsp] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('Ramah, jujur, dan menggugah selera');
  const [pricePoint, setPricePoint] = useState('');
  const [benefitsInput, setBenefitsInput] = useState('');
  const [visualMood, setVisualMood] = useState('Warm sunlight, organic earthy tones, aesthetic clean framing');
  const [photoNotes, setPhotoNotes] = useState('');

  const handleOpenNew = () => {
    setEditingId(null);
    setName('');
    setCategory('Kuliner & Minuman');
    setUsp('');
    setTargetAudience('Anak muda & pekerja kantor');
    setTone('Segar, bersahabat, dan meyakinkan');
    setPricePoint('Rp 25.000');
    setBenefitsInput('Bahan alami tanpa pengawet, Rasa lezat tidak eneg, Kemasan ramah lingkungan');
    setVisualMood('Pencahayaan terang lembut, latar kayu alami, fokus pada detail produk');
    setPhotoNotes('Sudut 45 derajat close-up saat produk digunakan');
    setIsEditing(true);
  };

  const handleEdit = (prod: ProductDNA) => {
    setEditingId(prod.id);
    setName(prod.name);
    setCategory(prod.category);
    setUsp(prod.usp);
    setTargetAudience(prod.targetAudience);
    setTone(prod.tone);
    setPricePoint(prod.pricePoint || '');
    setBenefitsInput(prod.keyBenefits.join(', '));
    setVisualMood(prod.visualMood);
    setPhotoNotes(prod.photoNotes || '');
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama produk tidak boleh kosong');
      return;
    }

    const keyBenefits = benefitsInput.split(',').map((b) => b.trim()).filter(Boolean);

    saveProduct({
      id: editingId || undefined,
      name,
      category,
      usp,
      targetAudience,
      tone,
      pricePoint,
      keyBenefits,
      visualMood,
      photoNotes,
    });

    setIsEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Produk DNA (Showcase & Promosi)
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Simpan DNA keunggulan produkmu agar AI selalu menyusun naskah promosi yang tepat sasaran.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Produk Baru</span>
        </button>
      </div>

      {/* Editing Form */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="bg-white border-2 border-emerald-500/50 rounded-2xl p-5 sm:p-6 shadow-md space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{editingId ? 'Edit Produk DNA' : 'Daftarkan Produk DNA Baru'}</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-stone-500 hover:text-stone-800"
            >
              Batal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nama Produk
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kopi Susu Gula Aren Lestari"
                className="w-full text-xs sm:text-sm px-3.5 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Kategori Produk
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Contoh: Kuliner & Minuman / Skincare / Fashion"
                className="w-full text-xs sm:text-sm px-3.5 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                USP (Keunggulan Utama yang Membedakan dari Kompetitor)
              </label>
              <textarea
                rows={2}
                value={usp}
                onChange={(e) => setUsp(e.target.value)}
                placeholder="Contoh: 100% biji kopi Arabika lokal dari petani Garut berpadu gula aren murni organik, aman untuk lambung."
                className="w-full text-xs sm:text-sm p-3 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-600 leading-relaxed resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Target Audiens
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Contoh: Pekerja kantoran, mahasiswa, pecinta kopi harian"
                className="w-full text-xs sm:text-sm px-3.5 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Kisaran Harga
              </label>
              <input
                type="text"
                value={pricePoint}
                onChange={(e) => setPricePoint(e.target.value)}
                placeholder="Contoh: Rp 22.000 / cup"
                className="w-full text-xs sm:text-sm px-3.5 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Manfaat Kunci (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={benefitsInput}
                onChange={(e) => setBenefitsInput(e.target.value)}
                placeholder="Contoh: Tidak bikin maag, Rasa lembut seimbang, Gula aren rendah kalori"
                className="w-full text-xs sm:text-sm px-3.5 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Suasana Visual & Arahan Foto/Video
              </label>
              <input
                type="text"
                value={visualMood}
                onChange={(e) => setVisualMood(e.target.value)}
                placeholder="Contoh: Cahaya matahari pagi hangat, meja kayu cokelat, embun segar di gelas"
                className="w-full text-xs sm:text-sm px-3.5 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Simpan Produk DNA
            </button>
          </div>
        </form>
      )}

      {/* Product List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {products.filter((prod) => Boolean(prod && prod.id)).map((prod) => (
          <div
            key={prod.id}
            className="bg-white border border-stone-200/90 hover:border-emerald-400 rounded-2xl p-5 shadow-sm hover:shadow transition-all flex flex-col justify-between"
          >
            <div>
              {/* Category and Actions */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 font-medium mb-1">
                    <span className="text-emerald-700 font-bold">{prod.category}</span>
                    {prod.pricePoint && (
                      <>
                        <span>·</span>
                        <span className="text-stone-700 font-semibold">{prod.pricePoint}</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-extrabold text-stone-900 text-lg">
                    {prod.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(prod)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded transition-colors"
                    title="Edit Produk"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteProduct(prod.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded transition-colors"
                    title="Hapus Produk"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* USP box */}
              <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wide block mb-1">
                  Keunggulan Unik (USP)
                </span>
                <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-medium">
                  {prod.usp}
                </p>
              </div>

              {/* Details */}
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="font-semibold text-stone-700">Target Audiens:</span>
                  <span>{prod.targetAudience}</span>
                </div>

                <div className="flex items-center justify-between text-stone-600">
                  <span className="font-semibold text-stone-700">Nada Bicara:</span>
                  <span>{prod.tone}</span>
                </div>

                {prod.keyBenefits && prod.keyBenefits.length > 0 && (
                  <div className="pt-2">
                    <span className="font-semibold text-stone-700 block mb-1.5">Manfaat Utama:</span>
                    <div className="space-y-1">
                      {prod.keyBenefits.map((benefit, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-1.5 text-stone-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {prod.visualMood && (
                  <div className="mt-2.5 p-2 bg-emerald-50/60 rounded-lg border border-emerald-100/80 flex items-start gap-2">
                    <Camera className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Mood Visual</span>
                      <p className="text-stone-700 text-[11px] leading-relaxed">{prod.visualMood}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-400">Terdaftar di HEJO</span>
              <button
                onClick={() => onPromoteProductInStudio(prod)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <Clapperboard className="w-3.5 h-3.5" />
                <span>Buatkan Video Promosi</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
