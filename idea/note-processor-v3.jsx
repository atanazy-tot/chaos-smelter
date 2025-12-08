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
  audio: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" fill="url(#audioGrad)" stroke="#000" strokeWidth="3"/>
      <rect x="14" y="18" width="4" height="12" fill="#000"/>
      <rect x="22" y="14" width="4" height="20" fill="#000"/>
      <rect x="30" y="20" width="4" height="8" fill="#000"/>
      <defs>
        <linearGradient id="audioGrad" x1="4" y1="4" x2="44" y2="44">
          <stop stopColor="#FF6B6B"/>
          <stop offset="0.5" stopColor="#FF8E53"/>
          <stop offset="1" stopColor="#FFDE59"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  clean: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M12 36L24 8L36 36" fill="url(#cleanGrad)" stroke="#000" strokeWidth="3"/>
      <path d="M8 40H40" stroke="#000" strokeWidth="4" strokeLinecap="square"/>
      <circle cx="24" cy="24" r="4" fill="#000"/>
      <defs>
        <linearGradient id="cleanGrad" x1="12" y1="8" x2="36" y2="36">
          <stop stopColor="#E8FF8D"/>
          <stop offset="1" stopColor="#7BF1A8"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  exportIcon: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="8" width="32" height="32" fill="url(#exportGrad)" stroke="#000" strokeWidth="3"/>
      <path d="M16 24H32M32 24L26 18M32 24L26 30" stroke="#000" strokeWidth="3" strokeLinecap="square"/>
      <defs>
        <linearGradient id="exportGrad" x1="8" y1="8" x2="40" y2="40">
          <stop stopColor="#A8E6FF"/>
          <stop offset="0.5" stopColor="#C8B6FF"/>
          <stop offset="1" stopColor="#FFB6D9"/>
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
};

export default function NoteProcessor() {
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [activeMode, setActiveMode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setActiveMode('file');
      setTextInput('');
      setResult(null);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setActiveMode('file');
      setTextInput('');
      setResult(null);
    }
  }, []);

  const handleTextChange = (e) => {
    const value = e.target.value;
    setTextInput(value);
    if (value.trim()) {
      setActiveMode('text');
      setFile(null);
    } else {
      setActiveMode(null);
    }
    setResult(null);
  };

  const processInput = useCallback(() => {
    setIsProcessing(true);
    const sourceName = activeMode === 'file' ? file?.name : 'Pasted text';
    setTimeout(() => {
      setIsProcessing(false);
      setResult(`# Synthesized Notes

## Key Points

- **Main Topic**: Your notes have been processed and structured
- **Summary**: Content extracted and organized hierarchically
- **Action Items**: Identified and categorized

## Details

The messy input has been transformed into clean, 
well-organized markdown ready for use.

## Next Steps

1. Review the structured output
2. Export or copy as needed
3. Drop another file to process more

---
*Generated from: ${sourceName}*`);
    }, 2000);
  }, [file, activeMode]);

  const resetAll = () => {
    setFile(null);
    setTextInput('');
    setActiveMode(null);
    setResult(null);
    setIsProcessing(false);
  };

  const canProcess = (activeMode === 'file' && !!file) || (activeMode === 'text' && textInput.trim().length > 0);

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
        
        {!result ? (
          <>
            {/* Dual Input Zone with OR in middle */}
            <div style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: '0',
              flexWrap: 'wrap',
            }}>
              
              {/* Drop File Zone */}
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
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                <div style={{ marginBottom: '24px' }}>
                  {isDragging ? Icons.drop : Icons.file}
                </div>
                
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  margin: '0 0 12px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '-1px',
                }}>
                  {isDragging ? 'Release!' : file ? file.name : 'Drop file'}
                </h2>
                
                {file ? (
                  <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                    {(file.size / 1024).toFixed(1)} KB • Click to change
                  </p>
                ) : (
                  <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                    .TXT / .MD / .DOC / .MP3 / .WAV
                  </p>
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

            {/* Process Button - Always visible when there's input */}
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
                  {activeMode === 'file' && file 
                    ? `📄 ${file.name}` 
                    : activeMode === 'text' && textInput.trim()
                      ? `📝 ${textInput.length} characters of text`
                      : '← Drop a file or paste text to begin'}
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
          /* Result View */
          <div>
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
                Output Ready
              </h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  style={{
                    background: '#FFFEF0',
                    color: '#000',
                    border: '4px solid #000',
                    padding: '16px 32px',
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
                  Copy MD
                </button>
                <button
                  onClick={resetAll}
                  style={{
                    background: '#FF6B6B',
                    color: '#000',
                    border: '4px solid #000',
                    padding: '16px 32px',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '4px 4px 0 #000',
                  }}
                >
                  New Input
                </button>
              </div>
            </div>
            
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
              {result}
            </div>
          </div>
        )}

        {/* Features Strip */}
        <div style={{
          marginTop: '64px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {[
            { icon: Icons.audio, title: 'Audio to Text', desc: 'Transcribes voice notes automatically' },
            { icon: Icons.clean, title: 'Auto Clean', desc: 'Removes noise, fluff & redundancy' },
            { icon: Icons.exportIcon, title: 'MD Export', desc: 'Copy-ready structured markdown' },
          ].map((feature, i) => (
            <div key={i} style={{
              background: '#FFFEF0',
              border: '4px solid #000',
              padding: '32px',
              boxShadow: '6px 6px 0 #000',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '20px',
            }}>
              <div style={{ flexShrink: 0 }}>{feature.icon}</div>
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  margin: '0 0 8px 0',
                  textTransform: 'uppercase',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  margin: '0',
                  opacity: '0.7',
                  lineHeight: '1.5',
                }}>
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
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
