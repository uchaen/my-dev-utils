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
    <div className="tool-container tool-container-full">
      <div className="tool-header">
        <h2>SHA256 암호화</h2>
        <p>텍스트를 실시간으로 SHA256 해시로 변환합니다.</p>
      </div>

      <div className="tool-grid">
        <div className="tool-card tool-card-no-margin">
          <div className="card-header">
            <h3>입력</h3>
            <button className="btn btn-secondary btn-small" onClick={clearAll}>
              초기화
            </button>
          </div>
          <textarea
            className="input-field textarea-large"
            placeholder="암호화할 텍스트를 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <div className="tool-card tool-card-no-margin">
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
              <button className="btn btn-secondary btn-small" onClick={copyToClipboard}>
                {copied ? '✓' : '복사'}
              </button>
            )}
          </div>
          {output ? (
            <div className="output-area success output-large">
              {output}
            </div>
          ) : (
            <div className="output-area output-large output-placeholder">
              텍스트를 입력하면 해시 결과가 표시됩니다.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default Sha256Tool;
