import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProject } from '../../context/ProjectContext';
import { XIcon, DownloadIcon, SearchIcon, FolderIcon, ChevronRightIcon, ChevronDownIcon } from '../common/Icons';

const DownloadModal: React.FC = () => {
    const { isDownloadModalOpen, setIsDownloadModalOpen, activeView } = useProject();
    const [fileName, setFileName] = useState(activeView?.name || 'Project Export');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['drive']));

    if (!isDownloadModalOpen) return null;

    const toggleNode = (id: string) => {
        const next = new Set(expandedNodes);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedNodes(next);
    };

    const drives = [
        { id: 'my-drive', name: 'My Drive', icon: <FolderIcon className="w-4 h-4 text-blue-500" /> },
        { id: 'project-drive', name: 'Project Drive', icon: <FolderIcon className="w-4 h-4 text-amber-500" /> },
    ];

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDownloadModalOpen(false)}
                className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
            />

            {/* Modal */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-zinc-200"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Download Options</h2>
                        <p className="text-xs text-zinc-500 font-medium mt-0.5">Export your current view and data</p>
                    </div>
                    <button 
                        onClick={() => setIsDownloadModalOpen(false)}
                        className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-all"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* File Name section */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest pl-1">File Name</label>
                        <div className="relative group">
                            <input 
                                type="text"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-md text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all group-hover:border-zinc-300"
                                placeholder="Enter file name..."
                            />
                        </div>
                    </div>

                    {/* Direct Download Button */}
                    <button className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2.5 font-bold text-sm transition-all active:scale-[0.98]">
                        <DownloadIcon className="w-4 h-4" />
                        Direct Download
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100"></div></div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="px-3 bg-white text-zinc-300">Or save to drive</span></div>
                    </div>

                    {/* Drive Selector */}
                    <div className="space-y-3">
                        <div className="relative">
                            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 bg-white border border-zinc-200 rounded-md text-[13px] font-medium text-zinc-900 focus:outline-none focus:border-blue-500 transition-all"
                                placeholder="Search folders..."
                            />
                        </div>

                        <div className="border border-zinc-100 rounded-xl bg-zinc-50/50 p-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                            {drives.map(drive => (
                                <div key={drive.id} className="space-y-1">
                                    <div 
                                        onClick={() => setSelectedPath(drive.id)}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${selectedPath === drive.id ? 'bg-white shadow-sm ring-1 ring-zinc-200' : 'hover:bg-zinc-100'}`}
                                    >
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleNode(drive.id); }}
                                            className="p-0.5 hover:bg-zinc-200 rounded transition-colors text-zinc-400"
                                        >
                                            {expandedNodes.has(drive.id) ? <ChevronDownIcon className="w-3.5 h-3.5" /> : <ChevronRightIcon className="w-3.5 h-3.5" />}
                                        </button>
                                        {drive.icon}
                                        <span className={`text-[13px] ${selectedPath === drive.id ? 'font-bold text-zinc-900' : 'font-medium text-zinc-600'}`}>
                                            {drive.name}
                                        </span>
                                    </div>
                                    
                                    {expandedNodes.has(drive.id) && (
                                        <div className="ml-9 border-l border-zinc-200 space-y-1 my-1">
                                            {['Exports', 'Quarterly Reports', 'Team Shared'].map((folder) => (
                                                <div 
                                                    key={folder}
                                                    onClick={() => setSelectedPath(`${drive.id}-${folder}`)}
                                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ml-2 ${selectedPath === `${drive.id}-${folder}` ? 'bg-white shadow-sm ring-1 ring-zinc-200' : 'hover:bg-zinc-100'}`}
                                                >
                                                    <FolderIcon className="w-3.5 h-3.5 text-zinc-400" />
                                                    <span className={`text-[12px] ${selectedPath === `${drive.id}-${folder}` ? 'font-bold text-zinc-900' : 'font-medium text-zinc-500'}`}>
                                                        {folder}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-3">
                    <button 
                        onClick={() => setIsDownloadModalOpen(false)}
                        className="h-10 px-6 text-sm font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={!selectedPath}
                        className={`h-10 px-8 text-sm font-bold rounded-md transition-all shadow-sm ${selectedPath ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20 active:scale-95' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}
                    >
                        Save to Drive
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default DownloadModal;
