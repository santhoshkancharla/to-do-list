import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Pin, 
  FileText, 
  Tag, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  Heading1, 
  Heading2, 
  Download, 
  Sparkles,
  Check,
  Calendar,
  Layers,
  RefreshCw,
  Link
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';

const CATEGORIES = ['General', 'Study Notes', 'Quick Draft', 'Ideas', 'Meetings', 'Personal'];

export default function Notes({ user }) {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeNote, setActiveNote] = useState(null);
  
  // Note Form Editor State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCategory, setNoteCategory] = useState('General');
  const [noteContent, setNoteContent] = useState(''); // Holds HTML string
  const [editorInitialContent, setEditorInitialContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync editor initial content when the selected note changes
  useEffect(() => {
    if (activeNote) {
      setEditorInitialContent(activeNote.content || '');
    } else {
      setEditorInitialContent('');
    }
  }, [activeNote?._id]);

  useEffect(() => {
    fetchNotes();
  }, [searchQuery]);

  const fetchNotes = async () => {
    try {
      const data = await api.notes.getAll(searchQuery);
      setNotes(data);
      if (data.length > 0 && !activeNote) {
        selectNote(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectNote = (note) => {
    setActiveNote(note);
    setNoteTitle(note.title);
    setNoteCategory(note.category || 'General');
    setNoteContent(note.content || '');
    setEditorInitialContent(note.content || '');
  };

  const handleCreateNewNote = async () => {
    try {
      const newNote = await api.notes.create({
        title: 'Untitled Note',
        content: '<div>Start writing...</div>',
        category: 'General',
        isPinned: false
      });
      setNotes([newNote, ...notes]);
      selectNote(newNote);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNote = async () => {
    if (!activeNote) return;
    setIsSaving(true);
    
    // Read content from contentEditable
    const editor = document.getElementById('note-rich-editor');
    const contentHtml = editor ? editor.innerHTML : noteContent;

    try {
      const updated = await api.notes.update(activeNote._id, {
        title: noteTitle.trim() || 'Untitled Note',
        category: noteCategory,
        content: contentHtml
      });
      setNotes(notes.map(n => n._id === activeNote._id ? updated : n));
      setActiveNote(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await api.notes.delete(id);
      const nextNotes = notes.filter(n => n._id !== id);
      setNotes(nextNotes);
      if (activeNote?._id === id) {
        setActiveNote(nextNotes.length > 0 ? nextNotes[0] : null);
        if (nextNotes.length > 0) {
          selectNote(nextNotes[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePin = async (note, e) => {
    e.stopPropagation();
    try {
      const updated = await api.notes.update(note._id, {
        isPinned: !note.isPinned
      });
      
      // Refresh sorted note order
      const fetched = await api.notes.getAll(searchQuery);
      setNotes(fetched);
      if (activeNote?._id === note._id) {
        setActiveNote(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ContentEditable Command Wrapper
  const handleEditorCommand = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const handleLink = (e) => {
    e.preventDefault();
    const url = prompt("Enter link URL (e.g., https://example.com):");
    if (url) {
      let formattedUrl = url;
      if (!/^https?:\/\//i.test(url)) {
        formattedUrl = 'https://' + url;
      }
      document.execCommand('createLink', false, formattedUrl);
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const parentNode = selection.anchorNode.parentNode;
        if (parentNode && parentNode.tagName === 'A') {
          parentNode.setAttribute('target', '_blank');
          parentNode.setAttribute('rel', 'noopener noreferrer');
          parentNode.className = 'text-violet-600 dark:text-violet-400 hover:underline cursor-pointer';
        }
      }
      handleSaveNote();
    }
  };

  const handleExportText = () => {
    if (!activeNote) return;
    const tempEl = document.createElement('div');
    tempEl.innerHTML = activeNote.content || '';
    const cleanText = tempEl.innerText || tempEl.textContent || '';
    
    const blob = new Blob([`# ${activeNote.title}\n\n${cleanText}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter notes by category
  const filteredNotes = notes.filter(n => {
    return selectedCategory === 'all' || n.category === selectedCategory;
  });

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 overflow-hidden pb-4">
      
      {/* LEFT PANEL: Notes List Sidebar */}
      <div className="w-80 flex-shrink-0 glass border border-slate-800 rounded-3xl p-4 flex flex-col justify-between overflow-hidden">
        
        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-extrabold text-base text-slate-100 flex items-center gap-1.5">
              Notepad Space <Sparkles className="h-4.5 w-4.5 text-violet-400" />
            </h3>
            
            <button
              onClick={handleCreateNewNote}
              className="p-1.5 rounded-xl bg-violet-600/20 text-violet-400 hover:bg-violet-600 hover:text-white transition-all cursor-pointer"
              title="Create New Note"
            >
              <Plus className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Search Notes */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search notebook..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:shadow-neon-violet transition-all text-xs"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2 border-b border-slate-850">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex-shrink-0 transition-colors cursor-pointer ${
                selectedCategory === 'all' 
                  ? 'bg-violet-600/10 border-violet-500/30 text-violet-400' 
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex-shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-violet-600/10 border-violet-500/30 text-violet-400' 
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Notes Scroll list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-slate-650 text-xs italic">
                No notes found.
              </div>
            ) : (
              <AnimatePresence>
                {filteredNotes.map(note => {
                  const isActive = activeNote?._id === note._id;
                  // Strip HTML tags for preview text
                  const tempEl = document.createElement('div');
                  tempEl.innerHTML = note.content || '';
                  const rawPreview = tempEl.innerText || tempEl.textContent || '';
                  
                  return (
                    <motion.div
                      key={note._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={() => selectNote(note)}
                      className={`p-3.5 border rounded-2xl cursor-pointer text-left transition-all relative group flex flex-col gap-2 ${
                        isActive 
                          ? 'border-violet-600 bg-violet-600/10' 
                          : 'border-slate-850 bg-slate-900/30 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-xs font-bold text-slate-200 line-clamp-1 flex-1 ${isActive ? 'text-violet-400' : ''}`}>
                          {note.title || 'Untitled Note'}
                        </h4>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => handleTogglePin(note, e)}
                            className={`p-0.5 rounded text-slate-500 hover:text-white transition-colors ${
                              note.isPinned ? 'text-violet-400 opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <Pin className="h-3 w-3 fill-current" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteNote(note._id, e)}
                            className="p-0.5 rounded text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-450 line-clamp-2 leading-relaxed">
                        {rawPreview || 'Empty note content...'}
                      </p>

                      <div className="flex items-center justify-between text-[8px] font-extrabold text-slate-500 uppercase mt-1">
                        <span className="flex items-center gap-0.5">
                          <Tag className="h-2 w-2" />
                          {note.category || 'General'}
                        </span>
                        <span>
                          {new Date(note.updatedAt || note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT PANEL: Rich Text Editor Workspace */}
      <div className="flex-1 glass border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between h-full bg-slate-900/10">
        {activeNote ? (
          <>
            {/* Editor Top Bar Controls */}
            <div className="p-4 border-b border-slate-850 bg-slate-900/40 flex flex-wrap items-center justify-between gap-4 z-10">
              
              {/* Note Details Form Inputs */}
              <div className="flex items-center gap-3 flex-1 max-w-lg">
                <input
                  type="text"
                  placeholder="Enter Title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  onBlur={handleSaveNote}
                  className="bg-transparent text-slate-100 font-display font-extrabold text-base focus:outline-none placeholder-slate-650 flex-1 min-w-0"
                />
                
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  onBlur={handleSaveNote}
                  className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-400 focus:outline-none cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Rich text formatting controls */}
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 border border-slate-850 rounded-xl">
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleEditorCommand('bold'); }}
                  className="note-editor-btn"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleEditorCommand('italic'); }}
                  className="note-editor-btn"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleEditorCommand('underline'); }}
                  className="note-editor-btn"
                  title="Underline (Ctrl+U)"
                >
                  <Underline className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={handleLink}
                  className="note-editor-btn"
                  title="Insert Hyperlink"
                >
                  <Link className="h-4 w-4" />
                </button>
                <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleEditorCommand('formatBlock', '<h1>'); }}
                  className="note-editor-btn"
                  title="Heading 1"
                >
                  <Heading1 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleEditorCommand('formatBlock', '<h2>'); }}
                  className="note-editor-btn"
                  title="Heading 2"
                >
                  <Heading2 className="h-4 w-4" />
                </button>
                <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleEditorCommand('insertUnorderedList'); }}
                  className="note-editor-btn"
                  title="Bulleted List"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Saving and export actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportText}
                  className="p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Export Note to Text"
                >
                  <Download className="h-4 w-4" />
                </button>

                <button
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                    isSaving 
                      ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-400' 
                      : 'bg-violet-600 hover:bg-violet-500 text-white shadow-neon-violet'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <span>Save Note</span>
                  )}
                </button>
              </div>

            </div>

            {/* Rich contentEditable Container */}
            <div 
              className="flex-1 p-6 overflow-y-auto text-sm text-slate-200 leading-relaxed outline-none cursor-text"
              onClick={() => {
                const editor = document.getElementById('note-rich-editor');
                if (editor) editor.focus();
              }}
            >
              <div
                id="note-rich-editor"
                key={activeNote?._id}
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: editorInitialContent }}
                className="w-full h-full min-h-[300px] outline-none space-y-4 focus:ring-0 select-text"
                onBlur={handleSaveNote}
                onClick={(e) => {
                  const link = e.target.closest('a');
                  if (link) {
                    window.open(link.href, '_blank', 'noopener,noreferrer');
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-550 space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-500">
              <FileText className="h-7 w-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-400">No Note Selected</p>
              <p className="text-xs text-slate-500 mt-1">Select an existing note or initialize a new one above.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
