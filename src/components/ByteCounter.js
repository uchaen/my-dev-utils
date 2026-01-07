import React, { useState, useMemo } from 'react';

function ByteCounter() {
  const [input, setInput] = useState('');
  const [encoding, setEncoding] = useState('utf-8');
  const [copiedKey, setCopiedKey] = useState('');

  const calculateBytes = (str, enc) => {
    if (!str) return 0;
    
    if (enc === 'utf-8') {
      return new TextEncoder().encode(str).length;
    } else if (enc === 'utf-16') {
      let bytes = 0;
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code <= 0xFFFF) {
          bytes += 2;
        } else {
          bytes += 4;
        }
      }
      return bytes;
    } else if (enc === 'euc-kr') {
      let bytes = 0;
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code <= 0x7F) {
          bytes += 1;
        } else {
          bytes += 2;
        }
      }
      return bytes;
    }
    return 0;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const bytes = useMemo(() => calculateBytes(input, encoding), [input, encoding]);
  const allEncodings = useMemo(() => ({
    'utf-8': calculateBytes(input, 'utf-8'),
    'utf-16': calculateBytes(input, 'utf-16'),
    'euc-kr': calculateBytes(input, 'euc-kr'),
  }), [input]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1500);
  };

  return (
    <div className="tool-container" style={{ maxWidth: '100%' }}>
      <div className="tool-header">
        <h2>Byte 계산기</h2>
        <p>텍스트의 바이트 크기를 실시간으로 계산합니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="tool-card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3>입력</h3>
            <button className="btn btn-secondary" onClick={() => setInput('')} style={{ padding: '6px 12px', fontSize: '13px' }}>
              초기화
            </button>
          </div>
          <textarea
            className="input-field"
            placeholder="바이트를 계산할 텍스트를 입력하세요..."
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
                {[
                  { value: 'utf-8', label: 'UTF-8' },
                  { value: 'utf-16', label: 'UTF-16' },
                  { value: 'euc-kr', label: 'EUC-KR' },
                ].map((enc) => (
                  <button
                    key={enc.value}
                    className={`tab ${encoding === enc.value ? 'active' : ''}`}
                    onClick={() => setEncoding(enc.value)}
                  >
                    {enc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="stats-grid" style={{ marginBottom: '16px' }}>
            <div className="stat-card">
              <div className="stat-value">{bytes.toLocaleString()}</div>
              <div className="stat-label">Bytes</div>
              <button 
                className="btn btn-ghost" 
                style={{ marginTop: '8px', padding: '4px 8px', fontSize: '12px' }}
                onClick={() => copyToClipboard(bytes, 'bytes')}
              >
                {copiedKey === 'bytes' ? '✓' : '복사'}
              </button>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatBytes(bytes)}</div>
              <div className="stat-label">용량</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{(bytes * 8).toLocaleString()}</div>
              <div className="stat-label">Bits</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{input.length.toLocaleString()}</div>
              <div className="stat-label">문자 수</div>
            </div>
          </div>

          <h3 style={{ marginTop: '16px' }}>인코딩별 비교</h3>
          <table className="claims-table">
            <thead>
              <tr>
                <th>인코딩</th>
                <th>Bytes</th>
                <th>용량</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(allEncodings).map(([enc, b]) => (
                <tr key={enc} style={{ background: encoding === enc ? 'var(--bg-muted)' : 'transparent' }}>
                  <td>{enc.toUpperCase()}</td>
                  <td>{b.toLocaleString()}</td>
                  <td>{formatBytes(b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="tool-card" style={{ marginTop: '16px' }}>
        <h3>정보</h3>
        <div className="info-text">
          <p><strong>UTF-8:</strong> ASCII 1바이트, 한글 3바이트</p>
          <p><strong>UTF-16:</strong> 대부분 2바이트, 이모지 4바이트</p>
          <p><strong>EUC-KR:</strong> ASCII 1바이트, 한글 2바이트</p>
        </div>
      </div>
    </div>
  );
}

export default ByteCounter;
