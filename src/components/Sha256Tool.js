import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

function Sha256Tool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [encoding, setEncoding] = useState('hex');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      return;
    }

    const hash = CryptoJS.SHA256(input);
    
    if (encoding === 'hex') {
      setOutput(hash.toString(CryptoJS.enc.Hex));
    } else if (encoding === 'base64') {
      setOutput(hash.toString(CryptoJS.enc.Base64));
    }
  }, [input, encoding]);

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
  };

  return (
    <div className="tool-container" style={{ maxWidth: '100%' }}>
      <div className="tool-header">
        <h2>SHA256 암호화</h2>
        <p>텍스트를 실시간으로 SHA256 해시로 변환합니다.</p>
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
            placeholder="암호화할 텍스트를 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ minHeight: '300px', resize: 'vertical' }}
          />
        </div>

        <div className="tool-card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-header-left">
              <h3>결과</h3>
              <div className="tabs">
                <button 
                  className={`tab ${encoding === 'hex' ? 'active' : ''}`}
                  onClick={() => setEncoding('hex')}
                >
                  Hex
                </button>
                <button 
                  className={`tab ${encoding === 'base64' ? 'active' : ''}`}
                  onClick={() => setEncoding('base64')}
                >
                  Base64
                </button>
              </div>
            </div>
            {output && (
              <button className="btn btn-secondary" onClick={copyToClipboard} style={{ padding: '6px 12px', fontSize: '13px' }}>
                {copied ? '✓' : '복사'}
              </button>
            )}
          </div>
          {output ? (
            <div className="output-area success" style={{ minHeight: '300px', wordBreak: 'break-all' }}>
              {output}
            </div>
          ) : (
            <div className="output-area" style={{ minHeight: '300px', color: 'var(--text-muted)' }}>
              텍스트를 입력하면 해시 결과가 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {output && (
        <div className="tool-card" style={{ marginTop: '16px' }}>
          <h3>정보</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{input.length}</div>
              <div className="stat-label">입력 길이</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{output.length}</div>
              <div className="stat-label">결과 길이</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">256</div>
              <div className="stat-label">비트</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">32</div>
              <div className="stat-label">바이트</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sha256Tool;
