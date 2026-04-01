import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProject } from '../../context/ProjectContext';
import { XIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from '../common/Icons';

// Local PDF Icon since Icons.tsx is being stubborn
export const PDFIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>
        <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
        <path d="M10 9H8"/>
        <path d="M16 13H8"/>
        <path d="M16 17H8"/>
    </svg>
);

const PDFExportModal: React.FC = () => {
    const { isPDFModalOpen, setIsPDFModalOpen, activeView } = useProject();
    const [sheetSize, setSheetSize] = useState('A4');
    const [margin, setMargin] = useState('16px');
    const [scaling, setScaling] = useState('50%');
    const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>('Landscape');
    const [fitToPage, setFitToPage] = useState(true);
    const [filename, setFilename] = useState(`${activeView.name} - Export`);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 2;

    if (!isPDFModalOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isPDFModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsPDFModalOpen(false)}
                        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
                    />

                    {/* Modal */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative bg-white rounded-2xl shadow-2xl w-[1000px] max-w-[95vw] h-[810px] max-h-[95vh] flex flex-col overflow-hidden border border-zinc-200"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-white">
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Save as PDF</h2>
                                <p className="text-xs text-zinc-500 font-medium mt-0.5">Adjust page layout settings and download as a PDF.</p>
                            </div>
                            <button 
                                onClick={() => setIsPDFModalOpen(false)}
                                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-all"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Left Side: Preview */}
                            <div className="flex-1 bg-gray-100 p-8 flex flex-col items-center justify-center gap-6 overflow-hidden relative">
                                <div className={`bg-white shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${orientation === 'Landscape' ? 'w-full h-auto aspect-[1.414]' : 'h-full w-auto aspect-[0.707]'}`}>
                                    {/* Mock PDF Content */}
                                    <div className="p-8 h-full flex flex-col">
                                        <div className="flex justify-between mb-8 border-b border-gray-900/10 pb-4">
                                            <div className="text-[12px] font-bold text-gray-900 uppercase">{activeView.name}</div>
                                            <div className="text-[10px] text-gray-500">{new Date().toLocaleDateString()}</div>
                                        </div>
                                        
                                        <div className="flex-1 border border-gray-900/10 rounded overflow-hidden">
                                            <table className="w-full text-[8px] border-collapse border-spacing-0">
                                                <thead>
                                                    <tr className="bg-gray-100 border-b border-gray-900/10">
                                                        <th className="p-1 text-left border-r border-gray-900/10">Line</th>
                                                        <th className="p-1 text-left border-r border-gray-900/10">Task Name</th>
                                                        <th className="p-1 text-left border-r border-gray-900/10">Planned Start</th>
                                                        <th className="p-1 text-left border-r border-gray-900/10">Planned End</th>
                                                        <th className="p-1 text-left border-r border-gray-900/10">Progress</th>
                                                        <th className="p-1 text-left">Contractor</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                                                        <tr key={i} className="border-b border-gray-900/5">
                                                            <td className="p-1 border-r border-gray-900/5">{i}</td>
                                                            <td className="p-1 border-r border-gray-900/5">Preconstruction Activity {i}</td>
                                                            <td className="p-1 border-r border-gray-900/5">2026-03-01</td>
                                                            <td className="p-1 border-r border-gray-900/5">2026-03-15</td>
                                                            <td className="p-1 border-r border-gray-900/5">100%</td>
                                                            <td className="p-1">Martinez Developments</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-gray-50/50">
                                                        <td colSpan={6} className="p-4 text-center text-gray-400 italic">... results truncated for preview ...</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-4 flex justify-between items-center text-[8px] text-gray-400 font-medium uppercase tracking-widest">
                                            <span>Linarc Project Export</span>
                                            <span>Page {currentPage} of {totalPages}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pagination */}
                                <div className="absolute bottom-6 flex items-center gap-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1 text-gray-600 hover:text-blue-600 disabled:text-gray-300 transition-colors"
                                    >
                                        <ChevronLeftIcon className="w-5 h-5" />
                                    </button>
                                    <span className="text-xs font-bold text-gray-800 tabular-nums">{currentPage} / {totalPages}</span>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1 text-gray-600 hover:text-blue-600 disabled:text-gray-300 transition-colors"
                                    >
                                        <ChevronRightIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Right Side: Settings */}
                            <div className="w-[320px] border-l border-gray-100 p-6 flex flex-col gap-6 bg-white overflow-y-auto custom-scrollbar">
                                <section className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Sheet Size</label>
                                        <select 
                                            value={sheetSize}
                                            onChange={(e) => setSheetSize(e.target.value)}
                                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                                        >
                                            <option>A4</option>
                                            <option>A3</option>
                                            <option>Letter</option>
                                            <option>Legal</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Margin</label>
                                        <select 
                                            value={margin}
                                            onChange={(e) => setMargin(e.target.value)}
                                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                                        >
                                            <option>0px</option>
                                            <option>8px</option>
                                            <option>16px</option>
                                            <option>24px</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Scaling</label>
                                        <select 
                                            value={scaling}
                                            onChange={(e) => setScaling(e.target.value)}
                                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                                            disabled={fitToPage}
                                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                                        >
                                            <option>50%</option>
                                            <option>75%</option>
                                            <option>100%</option>
                                            <option>Auto</option>
                                        </select>
                                        <p className="mt-2 text-[11px] text-gray-500 italic">Scale is auto-calculated when fit columns to page is enabled</p>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Orientation</label>
                                        <div className="flex bg-gray-100 p-1 rounded-xl">
                                            {(['Portrait', 'Landscape'] as const).map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setOrientation(opt)}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${orientation === opt ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    <div className={`w-3 h-3 rounded-full border-2 border-current flex items-center justify-center transition-all ${orientation === opt ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                                                        {orientation === opt && <div className="w-1 h-1 bg-white rounded-full"></div>}
                                                    </div>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between py-3 bg-zinc-50 px-4 rounded-xl border border-zinc-100 mt-2">
                                        <span className="text-xs font-bold text-gray-700">Fit columns to page</span>
                                        <button 
                                            onClick={() => setFitToPage(!fitToPage)}
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${fitToPage ? 'bg-zinc-900 border-zinc-900 text-white' : 'border-gray-300 bg-white'}`}
                                        >
                                            {fitToPage && (
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                                            )}
                                        </button>
                                    </div>
                                </section>

                                <section className="space-y-4 pt-4 border-t border-gray-100">
                                     <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Filename</label>
                                        <input 
                                            type="text"
                                            value={filename}
                                            onChange={(e) => setFilename(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </section>

                                <div className="mt-auto pt-6">
                                    <button 
                                        onClick={() => setIsPDFModalOpen(false)}
                                        className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2.5 font-bold text-sm transition-all active:scale-[0.98]"
                                    >
                                        <DownloadIcon className="w-4 h-4" />
                                        Download PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default PDFExportModal;
