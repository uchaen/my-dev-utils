import React, { useState, useEffect } from 'react';

function JsonBeautifier() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [mode, setMode] = useState('beautify');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      if (mode === 'beautify') {
        setOutput(JSON.stringify(parsed, null, indentSize));
      } else {
        setOutput(JSON.stringify(parsed));
      }
      setError('');
    } catch (err) {
      setError('JSON 파싱 오류: ' + err.message);
      setOutput('');
    }
  }, [input, indentSize, mode]);

  const copyToClipboard = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <div className="tool-container" style={{ maxWidth: '100%' }}>
      <div className="tool-header">
        <h2>JSON Beautifier</h2>
        <p>JSON을 실시간으로 포맷팅하거나 압축합니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="tool-card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3>입력</h3>
            <button className="btn btn-secondary" onClick={clearAll} style={{ padding: '6px 12px', fontSize: '13px' }}>
              초기화
            </button>
          </div>
          <textarea
            className="input-field"
            placeholder='{"name":"홍길동","age":30}'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ minHeight: '400px', resize: 'vertical' }}
          />
        </div>

        <div className="tool-card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-header-left">
              <h3>결과</h3>
              <div className="tabs">
                <button
                  className={`tab ${mode === 'beautify' ? 'active' : ''}`}
                  onClick={() => setMode('beautify')}
                >
                  포맷팅
                </button>
                <button
                  className={`tab ${mode === 'minify' ? 'active' : ''}`}
                  onClick={() => setMode('minify')}
                >
                  압축
                </button>
              </div>
              {mode === 'beautify' && (
                <div className="tabs">
                  {[2, 4, 8].map((size) => (
                    <button
                      key={size}
                      className={`tab ${indentSize === size ? 'active' : ''}`}
                      onClick={() => setIndentSize(size)}
                    >
                      {size}칸
                    </button>
                  ))}
                </div>
              )}
            </div>
            {output && (
              <button className="btn btn-secondary" onClick={copyToClipboard} style={{ padding: '6px 12px', fontSize: '13px' }}>
                {copied ? '✓' : '복사'}
              </button>
            )}
          </div>
          {error ? (
            <div className="output-area error" style={{ minHeight: '400px' }}>
              {error}
            </div>
          ) : (
            <textarea
              className="input-field"
              value={output}
              readOnly
              placeholder="유효한 JSON을 입력하면 여기에 결과가 표시됩니다."
              style={{ minHeight: '400px', resize: 'vertical' }}
            />
          )}
        </div>
      </div>

      {input && output && (
        <div className="tool-card" style={{ marginTop: '16px' }}>
          <h3>통계</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{input.length.toLocaleString()}</div>
              <div className="stat-label">원본 (문자)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{output.length.toLocaleString()}</div>
              <div className="stat-label">결과 (문자)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {input.length > output.length ? '-' : '+'}
                {Math.abs(((output.length - input.length) / input.length * 100)).toFixed(1)}%
              </div>
              <div className="stat-label">변화율</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {(() => {
                  try {
                    return Object.keys(JSON.parse(input)).length;
                  } catch {
                    return 0;
                  }
                })()}
              </div>
              <div className="stat-label">최상위 키 수</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JsonBeautifier;
