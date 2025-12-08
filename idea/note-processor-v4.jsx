import { useState, useCallback } from 'react';

// Chromatic Icons as SVG components
const Icons = {
  file: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="12" y="4" width="40" height="56" fill="url(#fileGrad)" stroke="#000" strokeWidth="4"/>
      <path d="M24 24H40M24 34H40M24 44H34" stroke="#000" strokeWidth="3" strokeLinecap="square"/>
      <defs>
        <linearGradient id="fileGrad" x1="12" y1="4" x2="52" y2="60">
          <stop stopColor="#FF6B6B"/>
          <stop offset="0.5" stopColor="#FFDE59"/>
          <stop offset="1" stopColor="#E8FF8D"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  paste: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="8" y="16" width="36" height="44" fill="url(#pasteGrad)" stroke="#000" strokeWidth="4"/>
      <rect x="20" y="8" width="24" height="16" rx="2" fill="#A8E6FF" stroke="#000" strokeWidth="3"/>
      <rect x="20" y="28" width="44" height="32" fill="#C8B6FF" stroke="#000" strokeWidth="4"/>
      <path d="M28 38H56M28 46H48" stroke="#000" strokeWidth="3" strokeLinecap="square"/>
      <defs>
        <linearGradient id="pasteGrad" x1="8" y1="16" x2="44" y2="60">
          <stop stopColor="#A8E6FF"/>
          <stop offset="1" stopColor="#C8B6FF"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  files: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="16" y="8" width="36" height="48" fill="#FFDE59" stroke="#000" strokeWidth="3"/>
      <rect x="12" y="12" width="36" height="48" fill="url(#filesGrad)" stroke="#000" strokeWidth="4"/>
      <path d="M22 28H38M22 36H38M22 44H32" stroke="#000" strokeWidth="3" strokeLinecap="square"/>
      <defs>
        <linearGradient id="filesGrad" x1="12" y1="12" x2="48" y2="60">
          <stop stopColor="#FF6B6B"/>
          <stop offset="0.5" stopColor="#FFDE59"/>
          <stop offset="1" stopColor="#E8FF8D"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  drop: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="8" y="16" width="64" height="56" fill="url(#dropGrad)" stroke="#000" strokeWidth="4"/>
      <path d="M40 8V48M40 48L28 36M40 48L52 36" stroke="#000" strokeWidth="5" strokeLinecap="square"/>
      <defs>
        <linearGradient id="dropGrad" x1="8" y1="16" x2="72" y2="72">
          <stop stopColor="#FFDE59"/>
          <stop offset="1" stopColor="#E8FF8D"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  arrowLeft: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M20 8L12 16L20 24" stroke="currentColor" strokeWidth="4" strokeLinecap="square"/>
    </svg>
  ),
  arrowRight: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M12 8L20 16L12 24" stroke="currentColor" strokeWidth="4" strokeLinecap="square"/>
    </svg>
  ),
  download: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3V13M10 13L6 9M10 13L14 9" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
      <path d="M3 15V17H17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
    </svg>
  ),
  zip: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="4" y="2" width="12" height="16" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 2V18M8 5H10M8 8H10M8 11H10" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
};

export default function NoteProcessor() {
  const [files, setFiles] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [activeMode, setActiveMode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
      setActiveMode('file');
      setTextInput('');
      setResults([]);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);
      setActiveMode('file');
      setTextInput('');
      setResults([]);
    }
  }, []);

  const removeFile = (index) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (newFiles.length === 0) setActiveMode(null);
      return newFiles;
    });
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setTextInput(value);
    if (value.trim()) {
      setActiveMode('text');
      setFiles([]);
    } else {
      setActiveMode(null);
    }
    setResults([]);
  };

  const processInput = useCallback(() => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      
      if (activeMode === 'file') {
        const newResults = files.map((file, index) => ({
          name: file.name.replace(/\.[^/.]+$/, '') + '_synthesized.md',
          sourceName: file.name,
          content: `# Synthesized: ${file.name}

## Summary

This document contains the processed and structured content from your original file.

## Key Points

- **Primary Theme**: Content has been analyzed and organized
- **Structure**: Information grouped by relevance
- **Clarity**: Redundant content removed

## Extracted Content

The messy input from "${file.name}" has been transformed into clean, well-organized markdown.

## Action Items

- Review the structured output
- Make any manual adjustments needed
- Export when ready

---
*Source: ${file.name} • Processed: ${new Date().toLocaleString()}*`
        }));
        setResults(newResults);
      } else {
        setResults([{
          name: 'notes_synthesized.md',
          sourceName: 'Pasted text',
          content: `# Synthesized Notes

## Summary

Your pasted content has been processed and structured.

## Key Points

- **Input**: ${textInput.length} characters processed
- **Structure**: Content organized hierarchically
- **Output**: Clean markdown format

## Processed Content

${textInput.substring(0, 200)}${textInput.length > 200 ? '...' : ''}

## Next Steps

- Review the output
- Copy or download as needed

---
*Source: Pasted text • Processed: ${new Date().toLocaleString()}*`
        }]);
      }
      setCurrentResultIndex(0);
    }, 2000);
  }, [files, textInput, activeMode]);

  const resetAll = () => {
    setFiles([]);
    setTextInput('');
    setActiveMode(null);
    setResults([]);
    setCurrentResultIndex(0);
    setIsProcessing(false);
  };

  const downloadFile = (result) => {
    const blob = new Blob([result.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllAsZip = async () => {
    // Simple implementation - creates a combined file since we can't use JSZip without import
    // In production, you'd use a proper zip library
    const combined = results.map(r => `${'='.repeat(60)}\n${r.name}\n${'='.repeat(60)}\n\n${r.content}\n\n`).join('\n');
    const blob = new Blob([combined], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_notes_synthesized.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const canProcess = (activeMode === 'file' && files.length > 0) || (activeMode === 'text' && textInput.trim().length > 0);
  const currentResult = results[currentResultIndex];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFEF0',
      fontFamily: "'Space Mono', 'Courier New', monospace",
      padding: '0',
      margin: '0',
    }}>
      {/* Header */}
      <header style={{
        background: '#000',
        color: '#FFFEF0',
        padding: '24px 48px',
        borderBottom: '6px solid #000',
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '700',
          margin: '0',
          letterSpacing: '-2px',
          textTransform: 'uppercase',
        }}>
          NOTE.SYNTH
        </h1>
        <p style={{
          fontSize: '14px',
          margin: '8px 0 0 0',
          opacity: '0.7',
          textTransform: 'uppercase',
          letterSpacing: '4px',
        }}>
          Drop chaos → Get structure
        </p>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '48px',
      }}>
        
        {results.length === 0 ? (
          <>
            {/* Dual Input Zone */}
            <div style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: '0',
              flexWrap: 'wrap',
            }}>
              
              {/* Drop Files Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
                style={{
                  flex: '1 1 400px',
                  background: isDragging ? '#FFDE59' : activeMode === 'file' ? '#E8FF8D' : '#FFFEF0',
                  border: '6px solid #000',
                  padding: '48px 32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isDragging || activeMode === 'file' ? '12px 12px 0 #000' : '8px 8px 0 #000',
                  transform: isDragging ? 'translate(-4px, -4px)' : 'translate(0, 0)',
                  minHeight: '320px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <input
                  id="fileInput"
                  type="file"
                  accept=".txt,.md,.doc,.docx,.mp3,.wav,.m4a,.ogg"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                <div style={{ marginBottom: '24px' }}>
                  {isDragging ? Icons.drop : (files.length > 1 ? Icons.files : Icons.file)}
                </div>
                
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  margin: '0 0 12px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '-1px',
                }}>
                  {isDragging ? 'Release!' : files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Drop files'}
                </h2>
                
                <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                  {files.length > 0 ? 'Click to add more' : '.TXT / .MD / .DOC / .MP3 / .WAV'}
                </p>

                {/* File list */}
                {files.length > 0 && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      maxHeight: '120px',
                      overflowY: 'auto',
                    }}
                  >
                    {files.map((file, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#FFFEF0',
                        border: '3px solid #000',
                        padding: '8px 12px',
                        marginBottom: '6px',
                        fontSize: '12px',
                      }}>
                        <span style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          maxWidth: '200px',
                        }}>
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(i)}
                          style={{
                            background: '#FF6B6B',
                            border: '2px solid #000',
                            padding: '2px 8px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontWeight: '700',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* OR Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 24px',
                zIndex: 10,
              }}>
                <span style={{
                  background: '#000',
                  color: '#FFFEF0',
                  padding: '16px 20px',
                  fontSize: '18px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                }}>
                  OR
                </span>
              </div>

              {/* Paste Text Zone */}
              <div style={{
                flex: '1 1 400px',
                background: activeMode === 'text' ? '#C8B6FF' : '#FFFEF0',
                border: '6px solid #000',
                padding: '32px',
                boxShadow: activeMode === 'text' ? '12px 12px 0 #000' : '8px 8px 0 #000',
                transition: 'all 0.15s ease',
                minHeight: '320px',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '16px',
                }}>
                  {Icons.paste}
                  <div>
                    <h2 style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      margin: '0',
                      textTransform: 'uppercase',
                      letterSpacing: '-1px',
                    }}>
                      Paste text
                    </h2>
                    <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0 0' }}>
                      From Miro, Notion, anywhere
                    </p>
                  </div>
                </div>
                
                <textarea
                  value={textInput}
                  onChange={handleTextChange}
                  placeholder="Paste your messy notes here..."
                  style={{
                    flex: 1,
                    width: '100%',
                    background: activeMode === 'text' ? '#FFFEF0' : '#F5F5F0',
                    border: '4px solid #000',
                    padding: '16px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    minHeight: '150px',
                  }}
                />
                
                {textInput && (
                  <p style={{
                    fontSize: '12px',
                    color: '#666',
                    margin: '12px 0 0 0',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}>
                    {textInput.length} characters
                  </p>
                )}
              </div>
            </div>

            {/* Process Button */}
            <div style={{
              marginTop: '32px',
              background: canProcess 
                ? (activeMode === 'file' ? '#E8FF8D' : '#C8B6FF')
                : '#E5E5E0',
              border: '6px solid #000',
              padding: '32px',
              boxShadow: '8px 8px 0 #000',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '24px',
            }}>
              <div>
                <p style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  margin: '0 0 8px 0',
                  opacity: '0.7',
                }}>
                  {canProcess ? 'Ready to process' : 'Waiting for input'}
                </p>
                <p style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  margin: '0',
                }}>
                  {activeMode === 'file' && files.length > 0
                    ? `📄 ${files.length} file${files.length > 1 ? 's' : ''} selected` 
                    : activeMode === 'text' && textInput.trim()
                      ? `📝 ${textInput.length} characters of text`
                      : '← Drop files or paste text to begin'}
                </p>
              </div>
              
              <button
                onClick={processInput}
                disabled={isProcessing || !canProcess}
                style={{
                  background: isProcessing ? '#666' : canProcess ? '#000' : '#999',
                  color: '#FFFEF0',
                  border: 'none',
                  padding: '24px 64px',
                  fontSize: '20px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  cursor: isProcessing || !canProcess ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: canProcess ? '6px 6px 0 #666' : '4px 4px 0 #666',
                  transition: 'all 0.1s ease',
                  opacity: canProcess ? 1 : 0.6,
                }}
                onMouseDown={(e) => {
                  if (!isProcessing && canProcess) {
                    e.currentTarget.style.transform = 'translate(3px, 3px)';
                    e.currentTarget.style.boxShadow = '3px 3px 0 #666';
                  }
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)';
                  e.currentTarget.style.boxShadow = '6px 6px 0 #666';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)';
                  e.currentTarget.style.boxShadow = '6px 6px 0 #666';
                }}
              >
                {isProcessing ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      display: 'inline-block',
                      animation: 'spin 1s linear infinite',
                    }}>◐</span>
                    Processing...
                  </span>
                ) : (
                  'Synthesize →'
                )}
              </button>
            </div>
          </>
        ) : (
          /* Results View */
          <div>
            {/* Header with navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                margin: '0',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                <span style={{
                  background: '#7BF1A8',
                  padding: '8px 16px',
                  border: '4px solid #000',
                }}>✓</span>
                {results.length} Output{results.length > 1 ? 's' : ''} Ready
              </h2>
              
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => copyToClipboard(currentResult.content)}
                  style={{
                    background: '#FFFEF0',
                    color: '#000',
                    border: '4px solid #000',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '4px 4px 0 #000',
                  }}
                >
                  Copy
                </button>
                <button
                  onClick={() => downloadFile(currentResult)}
                  style={{
                    background: '#A8E6FF',
                    color: '#000',
                    border: '4px solid #000',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '4px 4px 0 #000',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {Icons.download} Download
                </button>
                {results.length > 1 && (
                  <button
                    onClick={downloadAllAsZip}
                    style={{
                      background: '#C8B6FF',
                      color: '#000',
                      border: '4px solid #000',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      boxShadow: '4px 4px 0 #000',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {Icons.zip} All Files
                  </button>
                )}
                <button
                  onClick={resetAll}
                  style={{
                    background: '#FF6B6B',
                    color: '#000',
                    border: '4px solid #000',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '4px 4px 0 #000',
                  }}
                >
                  New
                </button>
              </div>
            </div>

            {/* Navigation for multiple results */}
            {results.length > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                marginBottom: '24px',
                background: '#E8FF8D',
                border: '4px solid #000',
                padding: '16px',
                boxShadow: '4px 4px 0 #000',
              }}>
                <button
                  onClick={() => setCurrentResultIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentResultIndex === 0}
                  style={{
                    background: currentResultIndex === 0 ? '#ccc' : '#000',
                    color: '#FFFEF0',
                    border: 'none',
                    padding: '12px 16px',
                    cursor: currentResultIndex === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {Icons.arrowLeft}
                </button>
                
                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    margin: '0',
                    textTransform: 'uppercase',
                  }}>
                    {currentResultIndex + 1} / {results.length}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    margin: '4px 0 0 0',
                    opacity: '0.7',
                    maxWidth: '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {currentResult.sourceName}
                  </p>
                </div>
                
                <button
                  onClick={() => setCurrentResultIndex(prev => Math.min(results.length - 1, prev + 1))}
                  disabled={currentResultIndex === results.length - 1}
                  style={{
                    background: currentResultIndex === results.length - 1 ? '#ccc' : '#000',
                    color: '#FFFEF0',
                    border: 'none',
                    padding: '12px 16px',
                    cursor: currentResultIndex === results.length - 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {Icons.arrowRight}
                </button>
              </div>
            )}
            
            {/* Result content */}
            <div style={{
              background: '#1a1a1a',
              color: '#E8FF8D',
              border: '6px solid #000',
              padding: '48px',
              boxShadow: '12px 12px 0 #000',
              fontFamily: "'Space Mono', monospace",
              fontSize: '16px',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
              maxHeight: '600px',
            }}>
              {currentResult.content}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: '#000',
        color: '#FFFEF0',
        padding: '24px 48px',
        marginTop: '64px',
        borderTop: '6px solid #000',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '12px',
          margin: '0',
          textTransform: 'uppercase',
          letterSpacing: '4px',
          opacity: '0.7',
        }}>
          Built for clarity • No BS • Just results
        </p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
        }
        
        textarea::placeholder {
          color: #999;
        }
      `}</style>
    </div>
  );
}
