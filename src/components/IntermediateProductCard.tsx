import { Trash2, Edit2, Beaker } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import type { IntermediateProduct } from '../types';

interface IntermediateProductCardProps {
    product: IntermediateProduct;
    onEdit: (product: IntermediateProduct) => void;
    onDelete: (id: string) => void;
}

export function IntermediateProductCard({ product, onEdit, onDelete }: IntermediateProductCardProps) {
    return (
        <div className="group relative bg-zinc-800/50 border border-zinc-700/50 rounded-2xl overflow-hidden hover:border-orange-500/50 hover:bg-zinc-800/80 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 flex flex-col">
            {/* Icon Section (Compact) */}
            <div className="h-20 bg-gradient-to-br from-orange-900/20 to-zinc-900 relative overflow-hidden flex items-center justify-center border-b border-zinc-700/30">
                <Beaker size={32} className="text-orange-500/40 group-hover:text-orange-400/60 transition-colors" />

                {/* Actions Overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-1 backdrop-blur-sm">
                    <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 hover:bg-orange-500 rounded-md text-zinc-300 hover:text-white transition-colors"
                        title="Düzenle"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(product.id)}
                        className="p-1.5 hover:bg-red-500 rounded-md text-zinc-300 hover:text-white transition-colors"
                        title="Sil"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {/* Badge */}
                <div className="absolute bottom-2 left-2 bg-orange-500/20 text-orange-400 text-[10px] font-medium px-2 py-0.5 rounded-full border border-orange-500/30">
                    Ara Ürün
                </div>
            </div>

            <div className="p-3 flex flex-col flex-1">
                <div className="mb-2">
                    <h3 className="font-bold text-base text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                        {product.name}
                    </h3>
                    <div className="text-xs text-zinc-500">
                        {product.ingredients.length} Malzeme
                    </div>
                </div>

                <div className="space-y-2 mt-auto">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Üretim Miktarı</span>
                        <span className="font-mono text-zinc-300">
                            {product.productionQuantity} {product.productionUnit}
                        </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Toplam Maliyet</span>
                        <span className="font-mono text-zinc-400">{formatCurrency(product.totalCost)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-zinc-700/50 pt-2">
                        {product.portionWeight && product.productionUnit !== 'adet' ? (
                            <>
                                <span className="text-zinc-500">
                                    Adet Maliyeti
                                    <span className="text-[10px] ml-1">({product.portionWeight}{product.portionUnit})</span>
                                </span>
                                <span className="font-mono text-orange-400 font-bold">
                                    {formatCurrency((product.costPerUnit / (product.portionUnit === 'cl' ? 100 : 1000)) * product.portionWeight)}/adet
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="text-zinc-500">Birim Maliyet</span>
                                <span className="font-mono text-orange-400 font-bold">
                                    {formatCurrency(product.costPerUnit)}/{product.productionUnit}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
